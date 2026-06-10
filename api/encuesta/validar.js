const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Método no permitido.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const codigo   = req.body?.codigo?.trim().toUpperCase();
  if (!codigo) return res.status(400).json({ error: 'Código requerido.' });

  const { data: codigoData, error } = await supabase
    .from('encuesta_codigos').select('*').eq('codigo', codigo).maybeSingle();
  if (error || !codigoData)
    return res.status(404).json({ error: 'Código no válido o no encontrado.' });
  if (codigoData.usado)
    return res.status(409).json({ error: 'Este código ya fue utilizado. Cada código es de un solo uso.' });

  const { data: preguntas } = await supabase
    .from('encuesta_preguntas').select('*').eq('activa', true).order('orden').order('created_at');

  return res.json({ valido: true, codigo: codigoData, preguntas: preguntas || [] });
};
