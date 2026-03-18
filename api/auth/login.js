const { createClient } = require('@supabase/supabase-js');
const { randomUUID }   = require('crypto');

const SESSION_LIMIT    = 2;
const SESSION_TTL_HOURS = 24;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const email    = req.body?.email?.trim();
  const password = req.body?.password?.trim();

  if (!email || !password)
    return res.status(400).json({ error: 'Correo y contraseña requeridos.' });

  // 1. Validar credenciales
  const { data, error } = await supabase
    .from('Usuarios')
    .select('*')
    .eq('Correo', email)
    .eq('Contraseña', password)
    .single();

  if (error || !data)
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

  const userId = data.id;

  // 2. Limpiar sesiones expiradas (> SESSION_TTL_HOURS horas sin actividad)
  const expiredBefore = new Date(Date.now() - SESSION_TTL_HOURS * 3600 * 1000).toISOString();
  await supabase.from('sesiones').delete().eq('usuario_id', userId).lt('last_active', expiredBefore);

  // 3. Contar sesiones activas
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

  // 4. Crear nueva sesión
  const token = randomUUID();
  await supabase.from('sesiones').insert([{
    usuario_id: userId,
    token,
    user_agent: req.headers['user-agent'] || null,
  }]);

  // 5. Responder con usuario + token de sesión
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
