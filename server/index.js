require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID }   = require('crypto');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SESSION_LIMIT     = 2;
const SESSION_TTL_HOURS = 24;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no configurado.');
  return secret;
}

function signToken({ userId, nivel, jti }) {
  return jwt.sign({ sub: userId, nivel, jti }, getSecret(), { expiresIn: '24h' });
}

function verifyToken(req) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), getSecret());
  } catch {
    return null;
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const email    = req.body.email?.trim();
  const password = req.body.password?.trim();

  if (!email || !password)
    return res.status(400).json({ error: 'Correo y contraseña requeridos.' });

  const { data, error } = await supabase
    .from('Usuarios')
    .select('*')
    .eq('Correo', email)
    .single();

  if (error || !data)
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

  // Verificar contraseña con migración automática desde texto plano
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

  if (!passwordValid)
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

  const userId = data.id;

  // Limpiar sesiones expiradas
  const expiredBefore = new Date(Date.now() - SESSION_TTL_HOURS * 3600 * 1000).toISOString();
  await supabase.from('sesiones').delete().eq('usuario_id', userId).lt('last_active', expiredBefore);

  // Contar sesiones activas
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

  // Crear sesión y firmar JWT
  const jti = randomUUID();
  await supabase.from('sesiones').insert([{
    usuario_id: userId,
    token:      jti,
    user_agent: req.headers['user-agent'] || null,
  }]);

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
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
app.post('/api/auth/logout', async (req, res) => {
  const token = req.body?.token;
  if (!token) return res.status(400).json({ error: 'Token requerido.' });

  // Intentar extraer el jti del JWT para borrar la sesión correcta
  try {
    const payload = jwt.verify(token, getSecret());
    await supabase.from('sesiones').delete().eq('token', payload.jti);
  } catch {
    // Token inválido o expirado — borrar por valor igual (compatibilidad)
    await supabase.from('sesiones').delete().eq('token', token);
  }

  return res.json({ message: 'Sesión cerrada.' });
});

// ── POST /api/auth/impersonate ────────────────────────────────────────────────
app.post('/api/auth/impersonate', async (req, res) => {
  const { adminToken, targetUserId } = req.body;
  if (!adminToken || !targetUserId)
    return res.status(400).json({ error: 'adminToken y targetUserId requeridos.' });

  let payload;
  try {
    payload = jwt.verify(adminToken, getSecret());
  } catch {
    return res.status(401).json({ error: 'Sesión de administrador inválida.' });
  }

  if (payload.nivel < 3)
    return res.status(403).json({ error: 'Se requiere nivel superadmin.' });

  const { data: target } = await supabase
    .from('Usuarios').select('id, "Nombre Completo", "Correo", nivel').eq('id', targetUserId).maybeSingle();
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado.' });

  const rawName = target['Nombre Completo'];
  return res.json({
    user: {
      id:    target.id,
      name:  Array.isArray(rawName) ? rawName[0] : rawName,
      email: target['Correo'],
      role:  target.nivel >= 1 ? 'admin' : 'user',
      nivel: target.nivel,
    },
  });
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const name     = req.body.name?.trim();
  const email    = req.body.email?.trim();
  const password = req.body.password?.trim();

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });

  const { data: existing } = await supabase
    .from('Usuarios').select('id').eq('Correo', email).maybeSingle();
  if (existing)
    return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

  const { data: maxRow } = await supabase
    .from('Usuarios').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
  const nextId = maxRow ? (maxRow.id + 1) : 1;

  const hash = await bcrypt.hash(password, 12);

  const { error } = await supabase.from('Usuarios').insert([{
    id: nextId,
    'Nombre Completo': [name],
    'Correo': email,
    'Contraseña': hash,
    'nivel': 0,
  }]);

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: 'Error al crear la cuenta.' });
  }

  return res.status(201).json({ message: 'Cuenta creada exitosamente.' });
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
app.post('/api/auth/reset-password', async (req, res) => {
  const email       = req.body.email?.trim();
  const newPassword = req.body.newPassword?.trim();

  if (!email || !newPassword)
    return res.status(400).json({ error: 'Correo y nueva contraseña requeridos.' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });

  const { data: user } = await supabase
    .from('Usuarios').select('id').eq('Correo', email).maybeSingle();
  if (!user)
    return res.status(404).json({ error: 'No existe una cuenta con ese correo.' });

  const hash = await bcrypt.hash(newPassword, 12);
  const { error } = await supabase.from('Usuarios').update({ 'Contraseña': hash }).eq('Correo', email);
  if (error) return res.status(500).json({ error: 'Error al actualizar la contraseña.' });
  return res.json({ message: 'Contraseña actualizada correctamente.' });
});

// ── GET /api/users ────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  const { data, error } = await supabase
    .from('Usuarios').select('id, "Nombre Completo", "Correo", nivel').order('id', { ascending: true });
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
});

// ── PUT /api/users ────────────────────────────────────────────────────────────
app.put('/api/users', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 3) return res.status(403).json({ error: 'Se requiere superadmin.' });

  const { id, nivel } = req.body;
  if (id == null || nivel == null) return res.status(400).json({ error: 'id y nivel requeridos.' });

  const { error } = await supabase.from('Usuarios').update({ nivel: Number(nivel) }).eq('id', id);
  if (error) return res.status(500).json({ error: 'Error al actualizar usuario.' });
  return res.json({ message: 'Nivel actualizado.' });
});

// ── DELETE /api/users ─────────────────────────────────────────────────────────
app.delete('/api/users', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 3) return res.status(403).json({ error: 'Se requiere superadmin.' });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id requerido.' });

  const { error } = await supabase.from('Usuarios').delete().eq('id', id);
  if (error) return res.status(500).json({ error: 'Error al eliminar usuario.' });
  return res.json({ message: 'Usuario eliminado.' });
});

// ── GET /api/tickets ──────────────────────────────────────────────────────────
app.get('/api/tickets', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Error al obtener tickets.' });
  return res.json({ tickets: data || [] });
});

// ── POST /api/tickets ─────────────────────────────────────────────────────────
app.post('/api/tickets', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para crear tickets.' });

  const { titulo, descripcion, prioridad, estado, grupo, asignado_a, fecha_limite } = req.body;
  if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido.' });

  const { data, error } = await supabase
    .from('tickets')
    .insert([{
      id:           randomUUID(),
      titulo:       titulo.trim(),
      descripcion:  descripcion?.trim() || '',
      prioridad:    prioridad   || 'media',
      estado:       estado      || 'pendiente',
      grupo:        grupo       || 'IT',
      asignado_a:   asignado_a  || null,
      fecha_limite: fecha_limite || null,
      usuario_id:   payload.sub,
    }])
    .select().single();

  if (error) { console.error('Supabase tickets insert error:', error); return res.status(500).json({ error: error.message || 'Error al crear ticket.' }); }
  return res.status(201).json({ ticket: data });
});

// ── PATCH /api/tickets/:id ────────────────────────────────────────────────────
app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
    if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const { id } = req.params;
    const fields = req.body;
    let updateData = {};

    if (payload.nivel >= 2) {
      if (fields.titulo       !== undefined) updateData.titulo       = fields.titulo;
      if (fields.descripcion  !== undefined) updateData.descripcion  = fields.descripcion;
      if (fields.prioridad    !== undefined) updateData.prioridad    = fields.prioridad;
      if (fields.estado       !== undefined) updateData.estado       = fields.estado;
      if (fields.grupo        !== undefined) updateData.grupo        = fields.grupo;
      if (fields.asignado_a   !== undefined) updateData.asignado_a   = fields.asignado_a || null;
      if (fields.fecha_limite !== undefined) updateData.fecha_limite = fields.fecha_limite || null;
    } else {
      if (fields.estado === undefined)
        return res.status(403).json({ error: 'Admin solo puede cambiar el estado del ticket.' });
      updateData.estado = fields.estado;
    }
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('tickets').update(updateData).eq('id', id).select().single();
    if (error) { console.error('Supabase PATCH error:', error); return res.status(500).json({ error: error.message || 'Error al actualizar ticket.' }); }
    return res.json({ ticket: data });
  } catch (err) {
    console.error('PATCH /api/tickets/:id error:', err);
    return res.status(500).json({ error: err.message || 'Error interno.' });
  }
});

// ── DELETE /api/tickets/:id ───────────────────────────────────────────────────
app.delete('/api/tickets/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para eliminar tickets.' });

  const { id } = req.params;
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) return res.status(500).json({ error: 'Error al eliminar ticket.' });
  return res.json({ message: 'Ticket eliminado.' });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ECG Backend corriendo en http://localhost:${PORT}`));
