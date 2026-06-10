const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('../lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // GET /api/encuesta/preguntas        -> preguntas activas (público)
  // GET /api/encuesta/preguntas?all=1  -> todas (admin)
  if (req.method === 'GET') {
    const showAll = req.query.all === '1';
    if (showAll) {
      const payload = verifyToken(req);
      if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
      if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { data, error } = await supabase
        .from('encuesta_preguntas').select('*').order('orden').order('created_at');
      if (error) return res.status(500).json({ error: 'Error al obtener preguntas.' });
      return res.json({ preguntas: data || [] });
    }
    // Público
    const { data, error } = await supabase
      .from('encuesta_preguntas').select('*').eq('activa', true).order('orden').order('created_at');
    if (error) return res.status(500).json({ error: 'Error al obtener preguntas.' });
    return res.json({ preguntas: data || [] });
  }

  // POST /api/encuesta/preguntas — crear (admin)
  if (req.method === 'POST') {
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
    if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    const { texto, tipo, opciones, orden } = req.body || {};
    if (!texto?.trim()) return res.status(400).json({ error: 'El texto es requerido.' });
    if (!['abierta', 'multiple'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido.' });
    if (tipo === 'multiple' && (!Array.isArray(opciones) || opciones.filter(o => o?.trim()).length < 2))
      return res.status(400).json({ error: 'Se requieren al menos 2 opciones.' });

    const { data, error } = await supabase.from('encuesta_preguntas')
      .insert([{ texto: texto.trim(), tipo, opciones: (opciones || []).map(o => o.trim()).filter(Boolean), orden: Number(orden) || 0, activa: true }])
      .select().single();
    if (error) return res.status(500).json({ error: 'Error al crear pregunta.' });
    return res.status(201).json({ pregunta: data });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
