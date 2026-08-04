// api/auth/[action].js — Autenticación: login, logout, register, forgot/reset password,
// impersonate, change-password, get/update-profile, delete-account.
// Incluye: CORS restrictivo, headers de seguridad, rate limiting en login,
// validación estricta de inputs, JWT con issuer/audience.
const { createClient } = require('@supabase/supabase-js');
const { randomUUID }   = require('crypto');
const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const { signToken, verifyToken } = require('../_lib/jwt');
const { applyCors }    = require('../_lib/cors');

const SESSION_LIMIT     = 2;
const SESSION_TTL_HOURS = 24;

// Validación de email
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limiting en memoria — { ip: { count, resetAt } }
// En producción con múltiples instancias, usar Supabase/Redis.
// Para el plan free de Vercel (una instancia por región) funciona correctamente.
const loginAttempts = new Map();
const RATE_LIMIT_MAX     = 5;   // intentos fallidos máximos
const RATE_LIMIT_WINDOW  = 15 * 60 * 1000; // 15 minutos en ms

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 0, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  return entry.count < RATE_LIMIT_MAX;
}

function recordFailedAttempt(ip) {
  const now   = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  entry.count++;
  loginAttempts.set(ip, entry);
}

function clearAttempts(ip) {
  loginAttempts.delete(ip);
}

// Obtiene la IP real respetando proxies de Vercel
function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown';
}

module.exports = async function handler(req, res) {
  applyCors(res, 'POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action   = req.query.action;

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).end();
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'JWT_SECRET no configurado.' });

    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Demasiados intentos fallidos. Espera 15 minutos antes de intentar de nuevo.' });
    }

    const email    = req.body?.email?.trim()?.toLowerCase();
    const password = req.body?.password;
    if (!email || !password)
      return res.status(400).json({ error: 'Correo y contraseña requeridos.' });
    if (!EMAIL_RE.test(email))
      return res.status(400).json({ error: 'Formato de correo inválido.' });

    const { data, error } = await supabase
      .from('Usuarios').select('*').eq('Correo', email).is('deleted_at', null).single();
    if (error || !data) {
      recordFailedAttempt(ip);
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const stored = data['Contraseña'];
    let passwordValid = false;
    if (stored?.startsWith('$2b$') || stored?.startsWith('$2a$')) {
      passwordValid = await bcrypt.compare(password, stored);
    } else {
      // Migración automática desde contraseña en texto plano (legacy)
      passwordValid = stored === password;
      if (passwordValid) {
        const hash = await bcrypt.hash(password, 12);
        await supabase.from('Usuarios').update({ 'Contraseña': hash }).eq('id', data.id);
      }
    }
    if (!passwordValid) {
      recordFailedAttempt(ip);
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    clearAttempts(ip);
    const userId = data.id;

    // Limpiar sesiones expiradas del usuario
    const expiredBefore = new Date(Date.now() - SESSION_TTL_HOURS * 3600 * 1000).toISOString();
    await supabase.from('sesiones').delete().eq('usuario_id', userId).lt('last_active', expiredBefore);

    const { count } = await supabase
      .from('sesiones').select('*', { count: 'exact', head: true }).eq('usuario_id', userId);
    if (count >= SESSION_LIMIT)
      return res.status(403).json({
        error: `Ya tienes ${count} sesión${count !== 1 ? 'es' : ''} activa${count !== 1 ? 's' : ''}. Cierra una sesión antes de iniciar otra.`,
        activeSessions: count,
      });

    const jti = randomUUID();
    await supabase.from('sesiones').insert([{
      usuario_id: userId,
      token:      jti,
      user_agent: req.headers['user-agent']?.slice(0, 255) || null,
    }]);

    const token   = signToken({ userId, nivel: data.nivel, jti });
    const rawName = data['Nombre Completo'];
    return res.json({
      user: {
        id:         userId,
        name:       Array.isArray(rawName) ? rawName[0] : rawName,
        email:      data['Correo'],
        role:       data.nivel >= 1 ? 'admin' : 'user',
        nivel:      data.nivel,
        sessionToken: token,
        telefono:   data['Telefono']  || '',
        rfc_curp:   data['RFC_CURP']  || '',
        empresa:    data['Empresa']   || '',
        avatar_url: data['AvatarURL'] || '',
      },
    });
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  if (action === 'logout') {
    if (req.method !== 'POST') return res.status(405).end();
    const token = req.body?.token;
    if (!token) return res.status(400).json({ error: 'Token requerido.' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'ecg-api', audience: 'ecg-app',
      });
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
    const email    = req.body?.email?.trim()?.toLowerCase();
    const password = req.body?.password;
    const telefono = req.body?.telefono?.trim() || null;
    const rfcCurp  = req.body?.rfc_curp?.trim()?.toUpperCase() || null;
    const empresa  = req.body?.empresa?.trim() || null;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    if (!EMAIL_RE.test(email))
      return res.status(400).json({ error: 'Formato de correo inválido.' });
    if (password.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    if (name.length > 120)
      return res.status(400).json({ error: 'El nombre es demasiado largo.' });

    const { data: existing } = await supabase
      .from('Usuarios').select('id').eq('Correo', email).maybeSingle();
    if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

    const { data: maxRow } = await supabase
      .from('Usuarios').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    const nextId = maxRow ? (maxRow.id + 1) : 1;
    const hash   = await bcrypt.hash(password, 12);

    const { error } = await supabase.from('Usuarios').insert([{
      id: nextId,
      'Nombre Completo': [name],
      'Correo':          email,
      'Contraseña':      hash,
      nivel:             0,
      'Telefono':        telefono,
      'RFC_CURP':        rfcCurp,
      'Empresa':         empresa,
    }]);
    if (error) return res.status(500).json({ error: 'Error al crear la cuenta.' });
    return res.status(201).json({ message: 'Cuenta creada exitosamente.' });
  }

  // ── FORGOT-PASSWORD ───────────────────────────────────────────────────────
  if (action === 'forgot-password') {
    if (req.method !== 'POST') return res.status(405).end();
    const email = req.body?.email?.trim()?.toLowerCase();
    if (!email) return res.status(400).json({ error: 'Correo requerido.' });

    // Respuesta genérica para no revelar si el correo existe
    const genericMsg = { message: 'Si existe una cuenta con ese correo, recibirás un enlace en breve.' };

    const { data: user } = await supabase
      .from('Usuarios').select('id, "Nombre Completo"')
      .eq('Correo', email).is('deleted_at', null).maybeSingle();
    if (!user) return res.json(genericMsg);

    const token     = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Invalidar tokens anteriores del mismo usuario
    await supabase.from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('usuario_id', user.id).is('used_at', null);

    const { error: insertErr } = await supabase.from('password_reset_tokens')
      .insert([{ usuario_id: user.id, token, expires_at: expiresAt }]);
    if (insertErr) return res.json(genericMsg);

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD)
      return res.status(500).json({ error: 'Servicio de email no configurado.' });

    const nodemailer  = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://ecgcorporativo.com').replace(/\/$/, '');
    const resetLink    = `${FRONTEND_URL}/reset-password?token=${token}`;
    const rawName      = user['Nombre Completo'];
    const userName     = Array.isArray(rawName) ? rawName[0] : (rawName || 'Usuario');

    try {
      await transporter.sendMail({
        from:    `"ECG Corporativo" <${process.env.GMAIL_USER}>`,
        to:      email,
        subject: 'Recupera tu contraseña – ECG Corporativo',
        html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1d4ed8 100%);padding:32px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.2em;color:#93c5fd;text-transform:uppercase;">Portal Empresarial</p>
          <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff;">ECG <span style="font-weight:300;color:#93c5fd;">Corporativo</span></h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">Recuperar contraseña</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">Hola <strong>${userName}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${resetLink}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;">Restablecer contraseña</a>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;line-height:1.6;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#3b82f6;word-break:break-all;">${resetLink}</p>
          <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">⏱ Este enlace expira en <strong>1 hora</strong> y solo puede usarse una vez.<br>Si no solicitaste este cambio, ignora este correo.</p>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#cbd5e1;">© ${new Date().getFullYear()} ECG Corporativo · ecgcorporativo.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      });
    } catch {
      // No revelamos errores internos de email al cliente
    }
    return res.json(genericMsg);
  }

  // ── RESET-PASSWORD ────────────────────────────────────────────────────────
  if (action === 'reset-password') {
    if (req.method !== 'POST') return res.status(405).end();
    const token       = req.body?.token?.trim();
    const newPassword = req.body?.newPassword;
    if (!token || !newPassword)
      return res.status(400).json({ error: 'Token y nueva contraseña requeridos.' });
    if (newPassword.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

    const { data: resetRecord } = await supabase
      .from('password_reset_tokens')
      .select('id, usuario_id')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (!resetRecord)
      return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.' });

    const hash = await bcrypt.hash(newPassword, 12);
    const { error: updateErr } = await supabase
      .from('Usuarios').update({ 'Contraseña': hash }).eq('id', resetRecord.usuario_id);
    if (updateErr) return res.status(500).json({ error: 'Error al actualizar la contraseña.' });

    await supabase.from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() }).eq('id', resetRecord.id);
    await supabase.from('sesiones').delete().eq('usuario_id', resetRecord.usuario_id);

    return res.json({ message: 'Contraseña actualizada correctamente.' });
  }

  // ── IMPERSONATE ───────────────────────────────────────────────────────────
  if (action === 'impersonate') {
    if (req.method !== 'POST') return res.status(405).end();

    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Sesión de administrador inválida.' });
    if (payload.nivel < 3) return res.status(403).json({ error: 'Se requiere nivel superadmin.' });

    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId requerido.' });

    const { data: target } = await supabase
      .from('Usuarios').select('id, "Nombre Completo", "Correo", nivel')
      .eq('id', targetUserId).maybeSingle();
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const jti   = randomUUID();
    const token = signToken({ userId: target.id, nivel: target.nivel, jti });
    const rawName = target['Nombre Completo'];
    return res.json({
      user: {
        id:    target.id,
        name:  Array.isArray(rawName) ? rawName[0] : rawName,
        email: target['Correo'],
        role:  target.nivel >= 1 ? 'admin' : 'user',
        nivel: target.nivel,
        sessionToken: token,
      },
    });
  }

  // ── CHANGE-PASSWORD ─────────────────────────────────────────────────────
  if (action === 'change-password') {
    if (req.method !== 'POST') return res.status(405).end();

    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

    const { currentPassword, newPassword, targetUserId } = req.body || {};
    if (!newPassword) return res.status(400).json({ error: 'Nueva contraseña requerida.' });
    if (newPassword.trim().length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

    const isSelfChange = !targetUserId || targetUserId === payload.sub;

    if (!isSelfChange) {
      // Superadmin cambia contraseña de otro usuario
      if (payload.nivel < 3)
        return res.status(403).json({ error: 'Se requiere nivel superadmin para cambiar contraseñas de otros usuarios.' });
      const { data: target } = await supabase
        .from('Usuarios').select('id').eq('id', targetUserId).maybeSingle();
      if (!target) return res.status(404).json({ error: 'Usuario no encontrado.' });
      const hash = await bcrypt.hash(newPassword.trim(), 12);
      const { error } = await supabase
        .from('Usuarios').update({ 'Contraseña': hash }).eq('id', targetUserId);
      if (error) return res.status(500).json({ error: 'Error al actualizar la contraseña.' });
      return res.json({ message: 'Contraseña actualizada correctamente.' });
    }

    // Usuario cambia su propia contraseña
    if (!currentPassword) return res.status(400).json({ error: 'Contraseña actual requerida.' });
    const { data: user } = await supabase
      .from('Usuarios').select('id, "Contraseña"').eq('id', payload.sub).maybeSingle();
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const stored = user['Contraseña'];
    let currentValid = false;
    if (stored?.startsWith('$2b$') || stored?.startsWith('$2a$')) {
      currentValid = await bcrypt.compare(currentPassword, stored);
    } else {
      currentValid = stored === currentPassword;
    }
    if (!currentValid) return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });

    const hash = await bcrypt.hash(newPassword.trim(), 12);
    const { error } = await supabase
      .from('Usuarios').update({ 'Contraseña': hash }).eq('id', payload.sub);
    if (error) return res.status(500).json({ error: 'Error al actualizar la contraseña.' });
    return res.json({ message: 'Contraseña actualizada correctamente.' });
  }

  // ── GET-PROFILE ──────────────────────────────────────────────────────────
  if (action === 'get-profile') {
    if (req.method !== 'POST') return res.status(405).end();
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

    const { data: user } = await supabase
      .from('Usuarios')
      .select('id, "Nombre Completo", "Correo", nivel, "Telefono", "RFC_CURP", "Empresa", "AvatarURL"')
      .eq('id', payload.sub).is('deleted_at', null).maybeSingle();
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const rawName = user['Nombre Completo'];
    return res.json({
      profile: {
        id:         user.id,
        name:       Array.isArray(rawName) ? rawName[0] : rawName,
        email:      user['Correo'],
        nivel:      user.nivel,
        telefono:   user['Telefono']  || '',
        rfc_curp:   user['RFC_CURP']  || '',
        empresa:    user['Empresa']   || '',
        avatar_url: user['AvatarURL'] || '',
      },
    });
  }

  // ── UPDATE-PROFILE ───────────────────────────────────────────────────────
  if (action === 'update-profile') {
    if (req.method !== 'POST') return res.status(405).end();
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

    const { name, telefono, rfc_curp, empresa, avatar_url } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
    if (name.trim().length > 120) return res.status(400).json({ error: 'El nombre es demasiado largo.' });

    const updateFields = { 'Nombre Completo': [name.trim()] };
    if (telefono !== undefined) updateFields['Telefono']  = telefono.trim() || null;
    if (rfc_curp !== undefined) updateFields['RFC_CURP']  = rfc_curp.trim().toUpperCase() || null;
    if (empresa  !== undefined) updateFields['Empresa']   = empresa.trim()  || null;
    if (avatar_url !== undefined) updateFields['AvatarURL'] = avatar_url.trim() || null;

    const { error } = await supabase
      .from('Usuarios').update(updateFields).eq('id', payload.sub);
    if (error) return res.status(500).json({ error: 'Error al actualizar el perfil.' });
    return res.json({ message: 'Perfil actualizado correctamente.' });
  }

  // ── DELETE-ACCOUNT ───────────────────────────────────────────────────────
  if (action === 'delete-account') {
    if (req.method !== 'DELETE') return res.status(405).end();
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

    const { error } = await supabase
      .from('Usuarios').update({ deleted_at: new Date().toISOString() }).eq('id', payload.sub);
    if (error) return res.status(500).json({ error: 'Error al eliminar la cuenta.' });
    await supabase.from('sesiones').delete().eq('usuario_id', payload.sub);
    return res.json({ message: 'Cuenta eliminada correctamente.' });
  }

  return res.status(404).json({ error: 'Acción no encontrada.' });
};
