const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // ── POST — enviar mensaje (público, sin auth) ──────────────────────────────
  if (req.method === 'POST') {
    const { nombre, correo, mensaje, empresa } = req.body;
    if (!nombre?.trim() || !correo?.trim() || !mensaje?.trim())
      return res.status(400).json({ error: 'nombre, correo y mensaje son requeridos.' });

    const { error } = await supabase.from('mensajes_contacto').insert([{
      nombre:  nombre.trim(),
      correo:  correo.trim(),
      mensaje: mensaje.trim(),
      empresa: empresa?.trim() || null,
    }]);
    if (error) return res.status(500).json({ error: 'Error al guardar el mensaje.' });
    return res.json({ message: 'Mensaje enviado correctamente.' });
  }

  // ── GET — listar mensajes (nivel >= 1) ─────────────────────────────────────
  if (req.method === 'GET') {
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
    if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const { data, error } = await supabase
      .from('mensajes_contacto')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Error al obtener mensajes.' });
    return res.json({ mensajes: data || [] });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
