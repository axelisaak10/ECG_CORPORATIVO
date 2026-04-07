const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('../lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { nombre, precio_renta_diaria, unidad } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
    const { data, error } = await supabase
      .from('herramientas_catalogo')
      .update({ nombre: nombre.trim(), precio_renta_diaria: Number(precio_renta_diaria) || 0, unidad: unidad?.trim() || 'pza' })
      .eq('id', id).select().single();
    if (error) return res.status(500).json({ error: 'Error al actualizar herramienta.' });
    return res.json({ herramienta: data });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('herramientas_catalogo').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al eliminar herramienta.' });
    return res.json({ message: 'Herramienta eliminada.' });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
