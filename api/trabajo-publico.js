const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido.' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const codigo   = req.query.codigo?.trim().toUpperCase();

  if (!codigo) return res.status(400).json({ error: 'Código requerido.' });

  const { data, error } = await supabase
    .from('trabajos')
    .select('codigo, cliente, folio, etapa_actual, created_at, updated_at, trabajo_actualizaciones(etapa, descripcion, inconveniente, created_at)')
    .eq('codigo', codigo)
    .single();

  if (error || !data) return res.status(404).json({ error: 'No se encontró ningún trabajo con ese código.' });

  // Ordenar actualizaciones cronológicamente
  if (data.trabajo_actualizaciones) {
    data.trabajo_actualizaciones.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  return res.json({ trabajo: data });
};
