const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  // GET — listar todos los usuarios (nivel >= 1)
  if (req.method === 'GET') {
    if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const { data, error } = await supabase
      .from('Usuarios')
      .select('id, "Nombre Completo", "Correo", nivel')
      .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: 'Error al obtener usuarios.' });

    const users = (data || []).map(u => {
      const rawName = u['Nombre Completo'];
      return {
        id:    u.id,
        name:  Array.isArray(rawName) ? rawName[0] : rawName,
        email: u['Correo'],
        nivel: u.nivel,
        role:  u.nivel >= 3 ? 'superadmin' : u.nivel >= 2 ? 'admin' : u.nivel >= 1 ? 'trabajador' : 'user',
      };
    });

    return res.json({ users });
  }

  // PUT — cambiar nivel de un usuario (nivel >= 3)
  if (req.method === 'PUT') {
    if (payload.nivel < 3) return res.status(403).json({ error: 'Se requiere superadmin.' });

    const { id, nivel } = req.body;
    if (id == null || nivel == null) return res.status(400).json({ error: 'id y nivel requeridos.' });

    const { error } = await supabase
      .from('Usuarios')
      .update({ nivel: Number(nivel) })
      .eq('id', id);

    if (error) return res.status(500).json({ error: 'Error al actualizar usuario.' });
    return res.json({ message: 'Nivel actualizado.' });
  }

  // DELETE — eliminar un usuario (nivel >= 3)
  if (req.method === 'DELETE') {
    if (payload.nivel < 3) return res.status(403).json({ error: 'Se requiere superadmin.' });

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id requerido.' });

    const { error } = await supabase
      .from('Usuarios')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: 'Error al eliminar usuario.' });
    return res.json({ message: 'Usuario eliminado.' });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
