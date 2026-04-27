const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('../lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const payload  = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  const { id } = req.query;

  // ── GET /api/trabajos/:id — detalle con actualizaciones ───────────────────
  if (req.method === 'GET') {
    if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
    const { data, error } = await supabase
      .from('trabajos')
      .select('*, trabajo_actualizaciones(* )')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Trabajo no encontrado.' });
    // Ordenar actualizaciones por fecha ascendente
    if (data?.trabajo_actualizaciones) {
      data.trabajo_actualizaciones.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    return res.json({ trabajo: data });
  }

  // ── PATCH /api/trabajos/:id — actualizar etapa + agregar log ──────────────
  // nivel 1 (trabajador): puede actualizar etapa
  // nivel 2+ (admin): puede actualizar etapa y cualquier campo
  if (req.method === 'PATCH') {
    if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const { etapa, descripcion, inconveniente, usuario_nombre } = req.body;
    const ETAPAS = ['recibido','armado','pintura','instalacion','detallado','completado'];

    if (!etapa || !ETAPAS.includes(etapa))
      return res.status(400).json({ error: 'Etapa inválida.' });

    // Actualizar etapa_actual en trabajos
    const { data: updated, error: errUpdate } = await supabase
      .from('trabajos')
      .update({ etapa_actual: etapa })
      .eq('id', id)
      .select()
      .single();

    if (errUpdate) return res.status(500).json({ error: 'Error al actualizar el trabajo.' });

    // Registrar en el historial
    const { data: act, error: errAct } = await supabase
      .from('trabajo_actualizaciones')
      .insert([{
        trabajo_id:     id,
        etapa,
        descripcion:    descripcion?.trim()    || '',
        inconveniente:  inconveniente?.trim()  || '',
        usuario_nombre: usuario_nombre?.trim() || 'Usuario',
      }])
      .select()
      .single();

    if (errAct) return res.status(500).json({ error: 'Error al registrar la actualización.' });

    return res.json({ trabajo: updated, actualizacion: act });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
