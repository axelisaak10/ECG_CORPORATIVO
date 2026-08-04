// api/contacto.js — GET (listar mensajes) y POST (enviar mensaje de contacto)
const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./_lib/jwt');
const { applyCors }    = require('./_lib/cors');

// Regex básico de email
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  applyCors(req, res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // ── POST — enviar mensaje de contacto (público, sin auth) ───────────────────
  if (req.method === 'POST') {
    const nombre  = req.body?.nombre?.trim();
    const correo  = req.body?.correo?.trim()?.toLowerCase();
    const mensaje = req.body?.mensaje?.trim();
    const empresa = req.body?.empresa?.trim() || null;

    if (!nombre || !correo || !mensaje)
      return res.status(400).json({ error: 'nombre, correo y mensaje son requeridos.' });
    if (!EMAIL_RE.test(correo))
      return res.status(400).json({ error: 'El correo no tiene un formato válido.' });
    if (nombre.length > 120)
      return res.status(400).json({ error: 'El nombre es demasiado largo.' });
    if (mensaje.length > 2000)
      return res.status(400).json({ error: 'El mensaje es demasiado largo (máx. 2000 caracteres).' });

    const { error } = await supabase.from('mensajes_contacto').insert([{
      nombre,
      correo,
      mensaje,
      empresa,
    }]);
    if (error) return res.status(500).json({ error: 'Error al guardar el mensaje.' });
    return res.json({ message: 'Mensaje enviado correctamente.' });
  }

  // ── GET — listar mensajes (requiere nivel >= 1) ─────────────────────────────
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
