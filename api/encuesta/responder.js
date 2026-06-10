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
  const { codigo_id, respuestas } = req.body || {};

  if (!codigo_id || !Array.isArray(respuestas) || respuestas.length === 0)
    return res.status(400).json({ error: 'codigo_id y respuestas son requeridos.' });

  const { data: codigoData } = await supabase
    .from('encuesta_codigos').select('id, usado').eq('id', codigo_id).maybeSingle();
  if (!codigoData) return res.status(404).json({ error: 'Código no encontrado.' });
  if (codigoData.usado) return res.status(409).json({ error: 'Este código ya fue utilizado.' });

  const rows = respuestas.map(r => ({
    codigo_id,
    pregunta_id:      r.pregunta_id,
    respuesta_texto:  r.respuesta_texto  || null,
    respuesta_opcion: r.respuesta_opcion || null,
  }));

  const { error: insError } = await supabase.from('encuesta_respuestas').insert(rows);
  if (insError) return res.status(500).json({ error: 'Error al guardar respuestas.' });

  await supabase.from('encuesta_codigos').update({ usado: true }).eq('id', codigo_id);
  return res.json({ message: '¡Gracias por tu opinión! Respuestas guardadas correctamente.' });
};
