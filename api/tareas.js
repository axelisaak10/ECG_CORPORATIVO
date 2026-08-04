const { createClient } = require('@supabase/supabase-js');
const { randomUUID }   = require('crypto');
const { verifyToken }  = require('./lib/jwt');
const { sendTareaAsignadaEmail } = require('./lib/mailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  const { sub: userId, nivel } = payload;

  // ── GET /api/tareas — listar (nivel >= 1) ──────────────────────────────────
  if (req.method === 'GET') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Error al obtener tareas.' });
    return res.json({ tareas: data || [] });
  }

  // ── POST /api/tareas — crear (nivel >= 2) ──────────────────────────────────
  if (req.method === 'POST') {
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para crear tareas.' });

    const { titulo, descripcion, prioridad, estado, grupo, asignado_a, fecha_limite } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido.' });

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
      .select()
      .single();

    if (error) { console.error('Supabase error:', error); return res.status(500).json({ error: error.message || 'Error al crear tarea.' }); }

    // ── Notificar por correo al usuario asignado ──────────────────────────────
    if (data.asignado_a) {
      try {
        // Obtener datos del usuario asignado (asignado_a guarda el email)
        const { data: usuarioAsignado } = await supabase
          .from('Usuarios')
          .select('"Correo", "Nombre Completo"')
          .eq('Correo', data.asignado_a)
          .is('deleted_at', null)
          .maybeSingle();

        // Obtener nombre de quien creó la tarea
        const { data: creador } = await supabase
          .from('Usuarios')
          .select('"Nombre Completo"')
          .eq('id', userId)
          .maybeSingle();

        if (usuarioAsignado?.['Correo']) {
          const nombre = Array.isArray(usuarioAsignado['Nombre Completo'])
            ? usuarioAsignado['Nombre Completo'][0]
            : (usuarioAsignado['Nombre Completo'] || 'Usuario');
          const nombreCreador = Array.isArray(creador?.['Nombre Completo'])
            ? creador['Nombre Completo'][0]
            : (creador?.['Nombre Completo'] || null);

          await sendTareaAsignadaEmail({
            toEmail:     usuarioAsignado['Correo'],
            toName:      nombre,
            tareaTitle:  data.titulo,
            tareaDesc:   data.descripcion || '',
            prioridad:   data.prioridad,
            fechaLimite: data.fecha_limite,
            asignadoPor: nombreCreador,
          });
        }
      } catch (mailErr) {
        console.error('Error al enviar correo de tarea:', mailErr);
        // No bloqueamos la respuesta si falla el correo
      }
    }

    return res.status(201).json({ tarea: data });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
