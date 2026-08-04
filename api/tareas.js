// api/tareas.js — CRUD de tareas (tabla: tickets)
const { createClient } = require('@supabase/supabase-js');
const { randomUUID }   = require('crypto');
const { verifyToken }  = require('./_lib/jwt');
const { applyCors }    = require('./_lib/cors');
const { sendTareaAsignadaEmail } = require('./_lib/mailer');

const VALID_PRIORIDAD = ['alta', 'media', 'baja'];
const VALID_ESTADO    = ['pendiente', 'en_progreso', 'completada', 'cancelada'];
const VALID_GRUPO     = ['IT', 'Operaciones', 'Comercial', 'Administración', 'Ingeniería'];

module.exports = async function handler(req, res) {
  applyCors(req, res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  const { sub: userId, nivel } = payload;

  // ── GET /api/tareas — listar (nivel >= 1) ───────────────────────────────────
  if (req.method === 'GET') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
    const { data, error } = await supabase
      .from('tickets').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Error al obtener tareas.' });
    return res.json({ tareas: data || [] });
  }

  // ── POST /api/tareas — crear (nivel >= 2) ───────────────────────────────────
  if (req.method === 'POST') {
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para crear tareas.' });

    const { titulo, descripcion, prioridad, estado, grupo, asignado_a, fecha_limite } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido.' });
    if (titulo.trim().length > 200) return res.status(400).json({ error: 'El título es demasiado largo.' });
    if (prioridad && !VALID_PRIORIDAD.includes(prioridad))
      return res.status(400).json({ error: 'Prioridad inválida.' });
    if (estado && !VALID_ESTADO.includes(estado))
      return res.status(400).json({ error: 'Estado inválido.' });
    if (grupo && !VALID_GRUPO.includes(grupo))
      return res.status(400).json({ error: 'Grupo inválido.' });

    const { data, error } = await supabase
      .from('tickets')
      .insert([{
        id:           randomUUID(),
        titulo:       titulo.trim(),
        descripcion:  descripcion?.trim() || '',
        prioridad:    prioridad   || 'media',
        estado:       estado      || 'pendiente',
        grupo:        grupo       || 'IT',
        asignado_a:   asignado_a  || null,
        fecha_limite: fecha_limite || null,
        usuario_id:   userId,
      }])
      .select().single();

    if (error) return res.status(500).json({ error: error.message || 'Error al crear tarea.' });

    // Notificar por correo al usuario asignado (sin bloquear la respuesta)
    if (data.asignado_a) {
      sendTareaAsignadaEmail({
        toEmail:     data.asignado_a,
        toName:      data.asignado_a,
        tareaTitle:  data.titulo,
        tareaDesc:   data.descripcion || '',
        prioridad:   data.prioridad,
        fechaLimite: data.fecha_limite,
        asignadoPor: null,
      }).catch(() => { /* ignorar errores de email */ });
    }

    return res.status(201).json({ tarea: data });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
