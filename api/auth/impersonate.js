const { createClient } = require('@supabase/supabase-js');
const jwt              = require('jsonwebtoken');
const { randomUUID }   = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'JWT_SECRET no configurado.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { adminToken, targetUserId } = req.body;
  if (!adminToken || !targetUserId)
    return res.status(400).json({ error: 'adminToken y targetUserId requeridos.' });

  // Verificar JWT del admin
  let payload;
  try {
    payload = jwt.verify(adminToken, secret);
  } catch {
    return res.status(401).json({ error: 'Sesión de administrador inválida.' });
  }

  if (payload.nivel < 3)
    return res.status(403).json({ error: 'Se requiere nivel superadmin.' });

  // Obtener datos del usuario objetivo
  const { data: target } = await supabase
    .from('Usuarios')
    .select('id, "Nombre Completo", "Correo", nivel')
    .eq('id', targetUserId)
    .maybeSingle();

  if (!target) return res.status(404).json({ error: 'Usuario no encontrado.' });

  // Generar JWT para el usuario impersonado
  const jti   = randomUUID();
  const token = jwt.sign(
    { sub: target.id, nivel: target.nivel, jti },
    secret,
    { expiresIn: '24h' }
  );

  const rawName = target['Nombre Completo'];
  return res.json({
    user: {
      id:           target.id,
      name:         Array.isArray(rawName) ? rawName[0] : rawName,
      email:        target['Correo'],
      role:         target.nivel >= 1 ? 'admin' : 'user',
      nivel:        target.nivel,
      sessionToken: token,
    },
  });
};
