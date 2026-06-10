const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('../../lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const payload  = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

  const { id } = req.query;

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('encuesta_codigos').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al eliminar código.' });
    return res.json({ message: 'Código eliminado.' });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
