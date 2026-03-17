const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

async function getUserNivel(supabase, userId) {
  const { data } = await supabase
    .from('Usuarios')
    .select('nivel')
    .eq('id', userId)
    .maybeSingle();
  return data?.nivel ?? -1;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // ── GET /api/tickets — listar (nivel >= 1) ─────────────────────────────────
  if (req.method === 'GET') {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ error: 'userId requerido.' });

    const nivel = await getUserNivel(supabase, userId);
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Error al obtener tickets.' });
    return res.json({ tickets: data || [] });
  }

  // ── POST /api/tickets — crear (nivel >= 2) ─────────────────────────────────
  if (req.method === 'POST') {
    const { userId, titulo, descripcion, prioridad, estado, grupo, asignado_a, fecha_limite } = req.body;
    if (!userId) return res.status(401).json({ error: 'userId requerido.' });

    const nivel = await getUserNivel(supabase, userId);
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para crear tickets.' });

    if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido.' });

    const { data, error } = await supabase
      .from('tickets')
      .insert([{
        id:          randomUUID(),
        titulo:      titulo.trim(),
        descripcion: descripcion?.trim() || '',
        prioridad:   prioridad  || 'media',
        estado:      estado     || 'pendiente',
        grupo:       grupo      || 'IT',
        asignado_a:  asignado_a || null,
        fecha_limite: fecha_limite || null,
        usuario_id:  Number(userId),
      }])
      .select()
      .single();

    if (error) { console.error('Supabase error:', error); return res.status(500).json({ error: error.message || 'Error al crear ticket.' }); }
    return res.status(201).json({ ticket: data });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
