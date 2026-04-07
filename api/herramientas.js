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

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('herramientas_catalogo')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) return res.status(500).json({ error: 'Error al obtener herramientas.' });
    return res.json({ herramientas: data || [] });
  }

  if (req.method === 'POST') {
    if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
    const { nombre, precio_renta_diaria } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
    const { data, error } = await supabase
      .from('herramientas_catalogo')
      .insert([{ nombre: nombre.trim(), precio_renta_diaria: Number(precio_renta_diaria) || 0 }])
      .select().single();
    if (error) return res.status(500).json({ error: 'Error al crear herramienta.' });
    return res.status(201).json({ herramienta: data });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
