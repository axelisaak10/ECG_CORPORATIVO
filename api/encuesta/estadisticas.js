const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Método no permitido.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const [codigosRes, preguntasRes, respuestasRes] = await Promise.all([
    supabase.from('encuesta_codigos').select('id, usado, cliente, created_at'),
    supabase.from('encuesta_preguntas').select('id, texto, tipo, opciones').eq('activa', true).order('orden'),
    supabase.from('encuesta_respuestas').select('pregunta_id, respuesta_texto, respuesta_opcion, created_at'),
  ]);

  const codigos    = codigosRes.data   || [];
  const preguntas  = preguntasRes.data || [];
  const respuestas = respuestasRes.data || [];

  const total_codigos     = codigos.length;
  const total_completados = codigos.filter(c => c.usado).length;

  const stats_por_pregunta = preguntas.map(p => {
    const resps = respuestas.filter(r => r.pregunta_id === p.id);
    if (p.tipo === 'multiple') {
      const conteo = {};
      resps.forEach(r => {
        if (r.respuesta_opcion) conteo[r.respuesta_opcion] = (conteo[r.respuesta_opcion] || 0) + 1;
      });
      return { pregunta_id: p.id, texto: p.texto, tipo: p.tipo, opciones: p.opciones, total: resps.length, conteo };
    }
    return {
      pregunta_id: p.id, texto: p.texto, tipo: p.tipo, total: resps.length,
      comentarios: resps.map(r => r.respuesta_texto).filter(Boolean).slice(0, 30),
    };
  });

  return res.json({ total_codigos, total_completados, stats_por_pregunta });
};
