const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('../../lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const payload  = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

  const { id } = req.query;

  // PUT /api/encuesta/preguntas/:id — actualizar
  if (req.method === 'PUT') {
    const { texto, tipo, opciones, orden, activa } = req.body || {};
    if (!texto?.trim()) return res.status(400).json({ error: 'El texto es requerido.' });

    const { data, error } = await supabase.from('encuesta_preguntas')
      .update({ texto: texto.trim(), tipo, opciones: (opciones || []).map(o => o?.trim()).filter(Boolean), orden: Number(orden) || 0, activa: activa ?? true })
      .eq('id', id).select().single();
    if (error) return res.status(500).json({ error: 'Error al actualizar pregunta.' });
    return res.json({ pregunta: data });
  }

  // DELETE /api/encuesta/preguntas/:id — eliminar
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('encuesta_preguntas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al eliminar pregunta.' });
    return res.json({ message: 'Pregunta eliminada.' });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
