const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // GET — listar todos los usuarios
  if (req.method === 'GET') {
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
        role:  u.nivel >= 2 ? 'superadmin' : u.nivel >= 1 ? 'admin' : 'user',
      };
    });

    return res.json({ users });
  }

  // PUT — cambiar nivel de un usuario
  if (req.method === 'PUT') {
    const { id, nivel } = req.body;
    if (id == null || nivel == null) return res.status(400).json({ error: 'id y nivel requeridos.' });

    const { error } = await supabase
      .from('Usuarios')
      .update({ nivel: Number(nivel) })
      .eq('id', id);

    if (error) return res.status(500).json({ error: 'Error al actualizar usuario.' });
    return res.json({ message: 'Nivel actualizado.' });
  }

  // DELETE — eliminar un usuario
  if (req.method === 'DELETE') {
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
