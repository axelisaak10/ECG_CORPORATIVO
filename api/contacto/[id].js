const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('../lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  const { id } = req.query;

  // ── PATCH — marcar como leído (nivel >= 1) ─────────────────────────────────
  if (req.method === 'PATCH') {
    if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const { error } = await supabase
      .from('mensajes_contacto')
      .update({ leido: true })
      .eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al marcar como leído.' });
    return res.json({ message: 'Marcado como leído.' });
  }

  // ── DELETE — eliminar mensaje (nivel >= 2) ─────────────────────────────────
  if (req.method === 'DELETE') {
    if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    const { error } = await supabase
      .from('mensajes_contacto')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al eliminar mensaje.' });
    return res.json({ message: 'Mensaje eliminado.' });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
