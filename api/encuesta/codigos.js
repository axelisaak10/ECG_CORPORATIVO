const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('../lib/jwt');

const ENC_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCodigoEncuesta() {
  let c = 'ENC-';
  for (let i = 0; i < 6; i++) c += ENC_CHARS[Math.floor(Math.random() * ENC_CHARS.length)];
  return c;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const payload  = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  // GET /api/encuesta/codigos — listar
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('encuesta_codigos').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Error al obtener códigos.' });
    return res.json({ codigos: data || [] });
  }

  // POST /api/encuesta/codigos — generar nuevo
  if (req.method === 'POST') {
    const { cliente, descripcion } = req.body || {};
    if (!cliente?.trim()) return res.status(400).json({ error: 'El nombre del cliente es requerido.' });

    const { data: userRow } = await supabase.from('Usuarios').select('"Nombre Completo"').eq('id', payload.sub).single();
    const rawName = userRow?.['Nombre Completo'];
    const generadoPor = Array.isArray(rawName) ? rawName[0] : rawName || 'Staff';

    let codigo, attempts = 0;
    do {
      codigo = genCodigoEncuesta();
      const { data: conflict } = await supabase.from('encuesta_codigos').select('id').eq('codigo', codigo).maybeSingle();
      if (!conflict) break;
    } while (++attempts < 10);

    const { data, error } = await supabase.from('encuesta_codigos')
      .insert([{ codigo, cliente: cliente.trim(), descripcion: descripcion?.trim() || null, generado_por: generadoPor, generado_por_id: payload.sub, usado: false }])
      .select().single();
    if (error) return res.status(500).json({ error: 'Error al generar código.' });
    return res.status(201).json({ codigo: data });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
