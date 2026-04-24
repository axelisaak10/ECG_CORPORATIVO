const { createClient } = require('@supabase/supabase-js');
const { randomUUID }   = require('crypto');
const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const { signToken, verifyToken } = require('../lib/jwt');

const SESSION_LIMIT     = 2;
const SESSION_TTL_HOURS = 24;

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action   = req.query.action;

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).end();
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'JWT_SECRET no configurado.' });

    const email    = req.body?.email?.trim();
    const password = req.body?.password?.trim();
    if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña requeridos.' });

    const { data, error } = await supabase.from('Usuarios').select('*').eq('Correo', email).single();
    if (error || !data) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const stored = data['Contraseña'];
    let passwordValid = false;
    if (stored?.startsWith('$2b$') || stored?.startsWith('$2a$')) {
      passwordValid = await bcrypt.compare(password, stored);
    } else {
      passwordValid = stored === password;
      if (passwordValid) {
        const hash = await bcrypt.hash(password, 12);
        await supabase.from('Usuarios').update({ 'Contraseña': hash }).eq('id', data.id);
      }
    }
    if (!passwordValid) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const userId = data.id;
    const expiredBefore = new Date(Date.now() - SESSION_TTL_HOURS * 3600 * 1000).toISOString();
    await supabase.from('sesiones').delete().eq('usuario_id', userId).lt('last_active', expiredBefore);

    const { count } = await supabase.from('sesiones').select('*', { count: 'exact', head: true }).eq('usuario_id', userId);
    if (count >= SESSION_LIMIT)
      return res.status(403).json({
        error: `Ya tienes ${count} sesión${count !== 1 ? 'es' : ''} activa${count !== 1 ? 's' : ''}. Cierra una sesión antes de iniciar otra.`,
        activeSessions: count,
      });

    const jti = randomUUID();
    await supabase.from('sesiones').insert([{ usuario_id: userId, token: jti, user_agent: req.headers['user-agent'] || null }]);
    const token   = signToken({ userId, nivel: data.nivel, jti });
    const rawName = data['Nombre Completo'];
    return res.json({
      user: {
        id: userId, name: Array.isArray(rawName) ? rawName[0] : rawName,
        email: data['Correo'], role: data.nivel >= 1 ? 'admin' : 'user',
        nivel: data.nivel, sessionToken: token,
      },
    });
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  if (action === 'logout') {
    if (req.method !== 'POST') return res.status(405).end();
    const token = req.body?.token;
    if (!token) return res.status(400).json({ error: 'Token requerido.' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      await supabase.from('sesiones').delete().eq('token', payload.jti);
    } catch {
      await supabase.from('sesiones').delete().eq('token', token);
    }
    return res.json({ message: 'Sesión cerrada.' });
  }

  // ── REGISTER ──────────────────────────────────────────────────────────────
  if (action === 'register') {
    if (req.method !== 'POST') return res.status(405).end();
    const name     = req.body?.name?.trim();
    const email    = req.body?.email?.trim();
    const password = req.body?.password?.trim();
    const telefono = req.body?.telefono?.trim() || null;
    const rfcCurp  = req.body?.rfc_curp?.trim().toUpperCase() || null;
    const empresa  = req.body?.empresa?.trim() || null;
    if (!name || !email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos.' });

    const { data: existing } = await supabase.from('Usuarios').select('id').eq('Correo', email).maybeSingle();
    if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

    const { data: maxRow } = await supabase.from('Usuarios').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    const nextId = maxRow ? (maxRow.id + 1) : 1;
    const hash   = await bcrypt.hash(password, 12);

    const { error } = await supabase.from('Usuarios').insert([{
      id: nextId, 'Nombre Completo': [name], 'Correo': email, 'Contraseña': hash, nivel: 0,
      'Telefono': telefono, 'RFC_CURP': rfcCurp, 'Empresa': empresa,
    }]);
    if (error) return res.status(500).json({ error: 'Error al crear la cuenta.' });
    return res.status(201).json({ message: 'Cuenta creada exitosamente.' });
  }

  // ── RESET-PASSWORD ────────────────────────────────────────────────────────
  if (action === 'reset-password') {
    if (req.method !== 'POST') return res.status(405).end();
    const email       = req.body?.email?.trim();
    const newPassword = req.body?.newPassword?.trim();
    if (!email || !newPassword) return res.status(400).json({ error: 'Correo y nueva contraseña requeridos.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });

    const { data: user } = await supabase.from('Usuarios').select('id').eq('Correo', email).maybeSingle();
    if (!user) return res.status(404).json({ error: 'No existe una cuenta con ese correo.' });

    const hash    = await bcrypt.hash(newPassword, 12);
    const { error } = await supabase.from('Usuarios').update({ 'Contraseña': hash }).eq('Correo', email);
    if (error) return res.status(500).json({ error: 'Error al actualizar la contraseña.' });
    return res.json({ message: 'Contraseña actualizada correctamente.' });
  }

  // ── IMPERSONATE ───────────────────────────────────────────────────────────
  if (action === 'impersonate') {
    if (req.method !== 'POST') return res.status(405).end();
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT_SECRET no configurado.' });

    const { adminToken, targetUserId } = req.body;
    if (!adminToken || !targetUserId) return res.status(400).json({ error: 'adminToken y targetUserId requeridos.' });

    let payload;
    try { payload = jwt.verify(adminToken, secret); }
    catch { return res.status(401).json({ error: 'Sesión de administrador inválida.' }); }

    if (payload.nivel < 3) return res.status(403).json({ error: 'Se requiere nivel superadmin.' });

    const { data: target } = await supabase.from('Usuarios')
      .select('id, "Nombre Completo", "Correo", nivel').eq('id', targetUserId).maybeSingle();
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const jti   = randomUUID();
    const token = jwt.sign({ sub: target.id, nivel: target.nivel, jti }, secret, { expiresIn: '24h' });
    const rawName = target['Nombre Completo'];
    return res.json({
      user: {
        id: target.id, name: Array.isArray(rawName) ? rawName[0] : rawName,
        email: target['Correo'], role: target.nivel >= 1 ? 'admin' : 'user',
        nivel: target.nivel, sessionToken: token,
      },
    });
  }

  return res.status(404).json({ error: 'Acción no encontrada.' });
};
