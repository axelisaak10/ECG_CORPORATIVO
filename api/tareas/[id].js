// api/tareas/[id].js — PATCH y DELETE de tarea individual
const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('../_lib/jwt');
const { applyCors }    = require('../_lib/cors');
const { sendTareaAsignadaEmail } = require('../_lib/mailer');

// Regex básico de UUID v4
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_PRIORIDAD = ['alta', 'media', 'baja'];
const VALID_ESTADO    = ['pendiente', 'en_progreso', 'completada', 'cancelada'];
const VALID_GRUPO     = ['IT', 'Operaciones', 'Comercial', 'Administración', 'Ingeniería'];

module.exports = async function handler(req, res) {
  applyCors(req, res, 'PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  const { nivel } = payload;
  const { id }    = req.query;

  if (!id || !UUID_RE.test(id))
    return res.status(400).json({ error: 'ID de tarea inválido.' });

  // ── PATCH — actualizar tarea ────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const fields     = req.body;
    let updateData   = {};

    if (nivel >= 2) {
      // Superadmin: puede cambiar cualquier campo (con whitelist)
      if (fields.titulo       !== undefined) updateData.titulo       = String(fields.titulo).trim().slice(0, 200);
      if (fields.descripcion  !== undefined) updateData.descripcion  = String(fields.descripcion || '').trim();
      if (fields.prioridad    !== undefined) {
        if (!VALID_PRIORIDAD.includes(fields.prioridad))
          return res.status(400).json({ error: 'Prioridad inválida.' });
        updateData.prioridad = fields.prioridad;
      }
      if (fields.estado !== undefined) {
        if (!VALID_ESTADO.includes(fields.estado))
          return res.status(400).json({ error: 'Estado inválido.' });
        updateData.estado = fields.estado;
      }
      if (fields.grupo !== undefined) {
        if (!VALID_GRUPO.includes(fields.grupo))
          return res.status(400).json({ error: 'Grupo inválido.' });
        updateData.grupo = fields.grupo;
      }
      if (fields.asignado_a   !== undefined) updateData.asignado_a   = fields.asignado_a   || null;
      if (fields.fecha_limite !== undefined) updateData.fecha_limite = fields.fecha_limite || null;
    } else {
      // Admin nivel 1: solo puede cambiar estado
      if (fields.estado === undefined)
        return res.status(403).json({ error: 'Admin solo puede cambiar el estado de la tarea.' });
      if (!VALID_ESTADO.includes(fields.estado))
        return res.status(400).json({ error: 'Estado inválido.' });
      updateData.estado = fields.estado;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tickets').update(updateData).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: 'Error al actualizar tarea.' });

    // Notificar si se asignó o reasignó a alguien
    const nuevoAsignado = updateData.asignado_a;
    if (nuevoAsignado) {
      sendTareaAsignadaEmail({
        toEmail:     nuevoAsignado,
        toName:      nuevoAsignado,
        tareaTitle:  data.titulo,
        tareaDesc:   data.descripcion || '',
        prioridad:   data.prioridad,
        fechaLimite: data.fecha_limite,
        asignadoPor: null,
      }).catch(() => { /* ignorar errores de email */ });
    }

    return res.json({ tarea: data });
  }

  // ── DELETE — eliminar tarea (nivel >= 2) ────────────────────────────────────
  if (req.method === 'DELETE') {
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para eliminar tareas.' });
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al eliminar tarea.' });
    return res.json({ message: 'Tarea eliminada.' });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
