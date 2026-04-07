const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // GET /api/clientes
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) return res.status(500).json({ error: 'Error al obtener clientes.' });
    return res.json({ clientes: data || [] });
  }

  // POST /api/clientes
  if (req.method === 'POST') {
    if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
    const { nombre, empresa, correo, telefono } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
    const { data, error } = await supabase
      .from('clientes')
      .insert([{ nombre: nombre.trim(), empresa: empresa?.trim() || null, correo: correo?.trim() || null, telefono: telefono?.trim() || null }])
      .select().single();
    if (error) return res.status(500).json({ error: 'Error al crear cliente.' });
    return res.status(201).json({ cliente: data });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
