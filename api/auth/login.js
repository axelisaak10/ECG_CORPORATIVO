const { createClient } = require('@supabase/supabase-js');
const { randomUUID }   = require('crypto');
const bcrypt           = require('bcryptjs');
const { signToken }    = require('../lib/jwt');

const SESSION_LIMIT     = 2;
const SESSION_TTL_HOURS = 24;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.JWT_SECRET)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const email    = req.body?.email?.trim();
  const password = req.body?.password?.trim();

  if (!email || !password)
    return res.status(400).json({ error: 'Correo y contraseña requeridos.' });

  // 1. Buscar usuario por correo
  const { data, error } = await supabase
    .from('Usuarios')
    .select('*')
    .eq('Correo', email)
    .single();

  if (error || !data)
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

  // 2. Verificar contraseña con soporte de migración automática desde texto plano
  const stored = data['Contraseña'];
  let passwordValid = false;

  if (stored?.startsWith('$2b$') || stored?.startsWith('$2a$')) {
    passwordValid = await bcrypt.compare(password, stored);
  } else {
    // Texto plano — comparar y migrar al vuelo
    passwordValid = stored === password;
    if (passwordValid) {
      const hash = await bcrypt.hash(password, 12);
      await supabase.from('Usuarios').update({ 'Contraseña': hash }).eq('id', data.id);
    }
  }

  if (!passwordValid)
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

  const userId = data.id;

  // 3. Limpiar sesiones expiradas
  const expiredBefore = new Date(Date.now() - SESSION_TTL_HOURS * 3600 * 1000).toISOString();
  await supabase.from('sesiones').delete().eq('usuario_id', userId).lt('last_active', expiredBefore);

  // 4. Contar sesiones activas
  const { count } = await supabase
    .from('sesiones')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', userId);

  if (count >= SESSION_LIMIT) {
    return res.status(403).json({
      error: `Ya tienes ${count} sesión${count !== 1 ? 'es' : ''} activa${count !== 1 ? 's' : ''}. Cierra una sesión antes de iniciar otra.`,
      activeSessions: count,
    });
  }

  // 5. Crear sesión: el jti del JWT se almacena en sesiones para control de límite/revocación
  const jti = randomUUID();
  await supabase.from('sesiones').insert([{
    usuario_id: userId,
    token:      jti,
    user_agent: req.headers['user-agent'] || null,
  }]);

  // 6. Firmar JWT (contiene userId, nivel y jti para revocación)
  const token = signToken({ userId, nivel: data.nivel, jti });

  const rawName = data['Nombre Completo'];
  return res.json({
    user: {
      id:           userId,
      name:         Array.isArray(rawName) ? rawName[0] : rawName,
      email:        data['Correo'],
      role:         data.nivel >= 1 ? 'admin' : 'user',
      nivel:        data.nivel,
      sessionToken: token,
    },
  });
};
