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

  // PUT /api/clientes/:id
  if (req.method === 'PUT') {
    const { nombre, empresa, correo, telefono } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
    const { data, error } = await supabase
      .from('clientes')
      .update({ nombre: nombre.trim(), empresa: empresa?.trim() || null, correo: correo?.trim() || null, telefono: telefono?.trim() || null })
      .eq('id', id).select().single();
    if (error) return res.status(500).json({ error: 'Error al actualizar cliente.' });
    return res.json({ cliente: data });
  }

  // DELETE /api/clientes/:id
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al eliminar cliente.' });
    return res.json({ message: 'Cliente eliminado.' });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
