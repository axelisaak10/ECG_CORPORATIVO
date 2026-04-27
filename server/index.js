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
  const telefono = req.body.telefono?.trim() || null;
  const rfcCurp  = req.body.rfc_curp?.trim().toUpperCase() || null;
  const empresa  = req.body.empresa?.trim() || null;

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
    'Telefono': telefono,
    'RFC_CURP': rfcCurp,
    'Empresa': empresa,
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

// ── GET /api/tareas ───────────────────────────────────────────────────────────
app.get('/api/tareas', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Error al obtener tareas.' });
  return res.json({ tareas: data || [] });
});

// ── POST /api/tareas ──────────────────────────────────────────────────────────
app.post('/api/tareas', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para crear tareas.' });

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

  if (error) { console.error('Supabase tareas insert error:', error); return res.status(500).json({ error: error.message || 'Error al crear tarea.' }); }
  return res.status(201).json({ tarea: data });
});

// ── PATCH /api/tareas/:id ─────────────────────────────────────────────────────
app.patch('/api/tareas/:id', async (req, res) => {
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
        return res.status(403).json({ error: 'Admin solo puede cambiar el estado de la tarea.' });
      updateData.estado = fields.estado;
    }
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('tickets').update(updateData).eq('id', id).select().single();
    if (error) { console.error('Supabase PATCH error:', error); return res.status(500).json({ error: error.message || 'Error al actualizar tarea.' }); }
    return res.json({ tarea: data });
  } catch (err) {
    console.error('PATCH /api/tareas/:id error:', err);
    return res.status(500).json({ error: err.message || 'Error interno.' });
  }
});

// ── DELETE /api/tareas/:id ────────────────────────────────────────────────────
app.delete('/api/tareas/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para eliminar tareas.' });

  const { id } = req.params;
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) return res.status(500).json({ error: 'Error al eliminar tarea.' });
  return res.json({ message: 'Tarea eliminada.' });
});

// ── POST /api/contacto ────────────────────────────────────────────────────────
app.post('/api/contacto', async (req, res) => {
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
});

// ── GET /api/contacto ─────────────────────────────────────────────────────────
app.get('/api/contacto', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  const { data, error } = await supabase
    .from('mensajes_contacto').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Error al obtener mensajes.' });
  return res.json({ mensajes: data || [] });
});

// ── PATCH /api/contacto/:id ───────────────────────────────────────────────────
app.patch('/api/contacto/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  const { id } = req.params;
  const { error } = await supabase.from('mensajes_contacto').update({ leido: true }).eq('id', id);
  if (error) return res.status(500).json({ error: 'Error al marcar como leído.' });
  return res.json({ message: 'Marcado como leído.' });
});

// ── DELETE /api/contacto/:id ──────────────────────────────────────────────────
app.delete('/api/contacto/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

  const { id } = req.params;
  const { error } = await supabase.from('mensajes_contacto').delete().eq('id', id);
  if (error) return res.status(500).json({ error: 'Error al eliminar mensaje.' });
  return res.json({ message: 'Mensaje eliminado.' });
});

// ── GET/POST/PUT/DELETE /api/catalogo ────────────────────────────────────────
// Versión local que replica api/catalogo.js de Vercel
app.all('/api/catalogo', async (req, res) => {
  const r  = req.query.r;
  const id = req.query.id;
  const method = req.method;

  const p = verifyToken(req);
  if (!p) return res.status(401).json({ error: 'Token inválido o expirado.' });

  // ── Clientes ──────────────────────────────────────────────────────────────
  if (r === 'clientes') {
    if (method === 'GET') {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre');
      if (error) return res.status(500).json({ error: 'Error al obtener clientes.' });
      return res.json({ clientes: data || [] });
    }
    if (method === 'POST') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { nombre, empresa, correo, telefono } = req.body;
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
      const { data, error } = await supabase.from('clientes')
        .insert([{ nombre: nombre.trim(), empresa: empresa?.trim() || null, correo: correo?.trim() || null, telefono: telefono?.trim() || null }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear cliente.' });
      return res.status(201).json({ cliente: data });
    }
    if (method === 'PUT') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { nombre, empresa, correo, telefono } = req.body;
      const { data, error } = await supabase.from('clientes')
        .update({ nombre: nombre?.trim(), empresa: empresa?.trim() || null, correo: correo?.trim() || null, telefono: telefono?.trim() || null })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar cliente.' });
      return res.json({ cliente: data });
    }
    if (method === 'DELETE') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar cliente.' });
      return res.json({ message: 'Cliente eliminado.' });
    }
  }

  // ── Artículos ─────────────────────────────────────────────────────────────
  if (r === 'articulos') {
    if (method === 'GET') {
      const { data, error } = await supabase.from('articulos_catalogo').select('*').order('nombre');
      if (error) return res.status(500).json({ error: 'Error al obtener artículos.' });
      return res.json({ articulos: data || [] });
    }
    if (method === 'POST') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { nombre, precio, unidad } = req.body;
      const { data, error } = await supabase.from('articulos_catalogo')
        .insert([{ nombre: nombre?.trim(), precio: Number(precio) || 0, unidad: unidad?.trim() || 'pza' }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear artículo.' });
      return res.status(201).json({ articulo: data });
    }
    if (method === 'PUT') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { nombre, precio, unidad } = req.body;
      const { data, error } = await supabase.from('articulos_catalogo')
        .update({ nombre: nombre?.trim(), precio: Number(precio) || 0, unidad: unidad?.trim() || 'pza' })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar artículo.' });
      return res.json({ articulo: data });
    }
    if (method === 'DELETE') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { error } = await supabase.from('articulos_catalogo').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar artículo.' });
      return res.json({ message: 'Artículo eliminado.' });
    }
  }

  // ── Herramientas ──────────────────────────────────────────────────────────
  if (r === 'herramientas') {
    if (method === 'GET') {
      const { data, error } = await supabase.from('herramientas_catalogo').select('*').order('nombre');
      if (error) return res.status(500).json({ error: 'Error al obtener herramientas.' });
      return res.json({ herramientas: data || [] });
    }
    if (method === 'POST') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { nombre, precio_renta_diaria, unidad } = req.body;
      const { data, error } = await supabase.from('herramientas_catalogo')
        .insert([{ nombre: nombre?.trim(), precio_renta_diaria: Number(precio_renta_diaria) || 0, unidad: unidad?.trim() || 'pza' }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear herramienta.' });
      return res.status(201).json({ herramienta: data });
    }
    if (method === 'PUT') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { nombre, precio_renta_diaria, unidad } = req.body;
      const { data, error } = await supabase.from('herramientas_catalogo')
        .update({ nombre: nombre?.trim(), precio_renta_diaria: Number(precio_renta_diaria) || 0, unidad: unidad?.trim() || 'pza' })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar herramienta.' });
      return res.json({ herramienta: data });
    }
    if (method === 'DELETE') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { error } = await supabase.from('herramientas_catalogo').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar herramienta.' });
      return res.json({ message: 'Herramienta eliminada.' });
    }
  }

  // ── Cotizaciones ──────────────────────────────────────────────────────────
  if (r === 'cotizaciones') {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('cotizaciones').select('*, clientes(nombre, empresa)').order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: 'Error al obtener cotizaciones.' });
      return res.json({ cotizaciones: data || [] });
    }
    if (method === 'POST') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { cliente_id, descripcion, articulos, herramientas, empleados, horas, dias, semanas, meses, totales, total } = req.body;
      if (!cliente_id) return res.status(400).json({ error: 'El cliente es requerido.' });
      const { data: maxRow } = await supabase.from('cotizaciones').select('folio').order('id', { ascending: false }).limit(1).maybeSingle();
      const lastNum = maxRow?.folio ? parseInt(maxRow.folio.replace('COT-', ''), 10) || 0 : 0;
      const folio = `COT-${String(lastNum + 1).padStart(4, '0')}`;
      const { data, error } = await supabase.from('cotizaciones')
        .insert([{ folio, cliente_id, usuario_id: p.sub, descripcion: descripcion?.trim() || null, estado: 'pendiente', articulos: articulos || [], herramientas: herramientas || [], empleados: empleados || [], horas: Number(horas) || 0, dias: Number(dias) || 0, semanas: Number(semanas) || 0, meses: Number(meses) || 0, totales: totales || {}, total: Number(total) || 0 }])
        .select('*, clientes(nombre, empresa)').single();
      if (error) return res.status(500).json({ error: 'Error al crear cotización.' });
      return res.status(201).json({ cotizacion: data });
    }
    if (method === 'PATCH') {
      const fields = req.body;
      let update = { updated_at: new Date().toISOString() };
      if (p.nivel >= 2) {
        ['estado','cliente_id','descripcion','articulos','herramientas','empleados','horas','dias','semanas','meses','totales','total']
          .forEach(k => { if (fields[k] !== undefined) update[k] = fields[k]; });
      } else {
        if (fields.estado === undefined) return res.status(403).json({ error: 'Solo puedes cambiar el estado.' });
        update.estado = fields.estado;
      }
      const { data, error } = await supabase.from('cotizaciones')
        .update(update).eq('id', id).select('*, clientes(nombre, empresa)').single();
      if (error) return res.status(500).json({ error: 'Error al actualizar cotización.' });
      return res.json({ cotizacion: data });
    }
    if (method === 'DELETE') {
      if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { error } = await supabase.from('cotizaciones').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar cotización.' });
      return res.json({ message: 'Cotización eliminada.' });
    }
  }

  // ── Gantt proyectos ───────────────────────────────────────────────────────
  if (r === 'gantt-proyectos') {
    if (method === 'GET') {
      const { data, error } = await supabase.from('gantt_proyectos').select('*').order('created_at');
      if (error) return res.status(500).json({ error: 'Error al obtener proyectos.' });
      return res.json({ proyectos: data || [] });
    }
    if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
    if (method === 'POST') {
      const { nombre, descripcion, color } = req.body;
      const { data, error } = await supabase.from('gantt_proyectos')
        .insert([{ nombre: nombre?.trim(), descripcion: descripcion?.trim() || '', color: color || '#3b82f6' }]).select().single();
      if (error) return res.status(500).json({ error: 'Error al crear proyecto.' });
      return res.status(201).json({ proyecto: data });
    }
    if (method === 'PUT' && id) {
      const { nombre, descripcion, color } = req.body;
      const { data, error } = await supabase.from('gantt_proyectos')
        .update({ nombre: nombre?.trim(), descripcion: descripcion?.trim() || '', color: color || '#3b82f6' })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar proyecto.' });
      return res.json({ proyecto: data });
    }
    if (method === 'DELETE' && id) {
      const { error } = await supabase.from('gantt_proyectos').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar proyecto.' });
      return res.json({ message: 'Proyecto eliminado.' });
    }
  }

  // ── Gantt tareas ──────────────────────────────────────────────────────────
  if (r === 'gantt-tareas') {
    if (method === 'GET') {
      const proyId = req.query.proyecto_id;
      let q = supabase.from('gantt_tareas').select('*').order('orden').order('created_at');
      if (proyId) q = q.eq('proyecto_id', proyId);
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: 'Error al obtener tareas.' });
      return res.json({ tareas: data || [] });
    }
    if (p.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
    if (method === 'POST') {
      const { proyecto_id, nombre, responsable, fecha_inicio, fecha_fin, porcentaje, color, orden, descripcion, prioridad, area } = req.body;
      const { data, error } = await supabase.from('gantt_tareas')
        .insert([{ proyecto_id, nombre: nombre?.trim(), responsable: responsable?.trim() || '', fecha_inicio, fecha_fin, porcentaje: Number(porcentaje) || 0, color: color || '#3b82f6', orden: Number(orden) || 0, descripcion: descripcion?.trim() || '', prioridad: prioridad || 'media', area: area?.trim() || '' }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear tarea.' });
      return res.status(201).json({ tarea: data });
    }
    if (method === 'PUT' && id) {
      const { nombre, responsable, fecha_inicio, fecha_fin, porcentaje, color, orden, descripcion, prioridad, area } = req.body;
      const { data, error } = await supabase.from('gantt_tareas')
        .update({ nombre: nombre?.trim(), responsable: responsable?.trim() || '', fecha_inicio, fecha_fin, porcentaje: Number(porcentaje) || 0, color: color || '#3b82f6', orden: Number(orden) || 0, descripcion: descripcion?.trim() || '', prioridad: prioridad || 'media', area: area?.trim() || '' })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar tarea.' });
      return res.json({ tarea: data });
    }
    if (method === 'DELETE' && id) {
      const { error } = await supabase.from('gantt_tareas').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar tarea.' });
      return res.json({ message: 'Tarea eliminada.' });
    }
  }

  return res.status(400).json({ error: 'Recurso no válido.' });
});

// ── GET/POST /api/clientes ────────────────────────────────────────────────────
app.get('/api/clientes', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
  const { data, error } = await supabase.from('clientes').select('*').order('nombre', { ascending: true });
  if (error) return res.status(500).json({ error: 'Error al obtener clientes.' });
  return res.json({ clientes: data || [] });
});

app.post('/api/clientes', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { nombre, empresa, correo, telefono } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
  const { data, error } = await supabase.from('clientes')
    .insert([{ nombre: nombre.trim(), empresa: empresa?.trim() || null, correo: correo?.trim() || null, telefono: telefono?.trim() || null }])
    .select().single();
  if (error) return res.status(500).json({ error: 'Error al crear cliente.' });
  return res.status(201).json({ cliente: data });
});

app.put('/api/clientes/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { nombre, empresa, correo, telefono } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
  const { data, error } = await supabase.from('clientes')
    .update({ nombre: nombre.trim(), empresa: empresa?.trim() || null, correo: correo?.trim() || null, telefono: telefono?.trim() || null })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: 'Error al actualizar cliente.' });
  return res.json({ cliente: data });
});

app.delete('/api/clientes/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { error } = await supabase.from('clientes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Error al eliminar cliente.' });
  return res.json({ message: 'Cliente eliminado.' });
});

// ── GET/POST /api/articulos ───────────────────────────────────────────────────
app.get('/api/articulos', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
  const { data, error } = await supabase.from('articulos_catalogo').select('*').order('nombre', { ascending: true });
  if (error) return res.status(500).json({ error: 'Error al obtener artículos.' });
  return res.json({ articulos: data || [] });
});

app.post('/api/articulos', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { nombre, precio, unidad } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
  const { data, error } = await supabase.from('articulos_catalogo')
    .insert([{ nombre: nombre.trim(), precio: Number(precio) || 0, unidad: unidad?.trim() || 'pza' }])
    .select().single();
  if (error) return res.status(500).json({ error: 'Error al crear artículo.' });
  return res.status(201).json({ articulo: data });
});

app.put('/api/articulos/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { nombre, precio, unidad } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
  const { data, error } = await supabase.from('articulos_catalogo')
    .update({ nombre: nombre.trim(), precio: Number(precio) || 0, unidad: unidad?.trim() || 'pza' })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: 'Error al actualizar artículo.' });
  return res.json({ articulo: data });
});

app.delete('/api/articulos/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { error } = await supabase.from('articulos_catalogo').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Error al eliminar artículo.' });
  return res.json({ message: 'Artículo eliminado.' });
});

// ── GET/POST /api/herramientas ────────────────────────────────────────────────
app.get('/api/herramientas', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
  const { data, error } = await supabase.from('herramientas_catalogo').select('*').order('nombre', { ascending: true });
  if (error) return res.status(500).json({ error: 'Error al obtener herramientas.' });
  return res.json({ herramientas: data || [] });
});

app.post('/api/herramientas', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { nombre, precio_renta_diaria, unidad } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
  const { data, error } = await supabase.from('herramientas_catalogo')
    .insert([{ nombre: nombre.trim(), precio_renta_diaria: Number(precio_renta_diaria) || 0, unidad: unidad?.trim() || 'pza' }])
    .select().single();
  if (error) return res.status(500).json({ error: 'Error al crear herramienta.' });
  return res.status(201).json({ herramienta: data });
});

app.put('/api/herramientas/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { nombre, precio_renta_diaria, unidad } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
  const { data, error } = await supabase.from('herramientas_catalogo')
    .update({ nombre: nombre.trim(), precio_renta_diaria: Number(precio_renta_diaria) || 0, unidad: unidad?.trim() || 'pza' })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: 'Error al actualizar herramienta.' });
  return res.json({ herramienta: data });
});

app.delete('/api/herramientas/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { error } = await supabase.from('herramientas_catalogo').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Error al eliminar herramienta.' });
  return res.json({ message: 'Herramienta eliminada.' });
});

// ── GET/POST /api/cotizaciones ────────────────────────────────────────────────
app.get('/api/cotizaciones', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
  const { data, error } = await supabase
    .from('cotizaciones')
    .select('*, clientes(nombre, empresa)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Error al obtener cotizaciones.' });
  return res.json({ cotizaciones: data || [] });
});

app.post('/api/cotizaciones', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { cliente_id, descripcion, articulos, herramientas, empleados, horas, dias, semanas, meses, totales, total } = req.body;
  if (!cliente_id) return res.status(400).json({ error: 'El cliente es requerido.' });
  const { data, error } = await supabase.from('cotizaciones')
    .insert([{
      cliente_id, usuario_id: payload.sub,
      descripcion: descripcion?.trim() || null, estado: 'pendiente',
      articulos: articulos || [], herramientas: herramientas || [], empleados: empleados || [],
      horas: Number(horas) || 0, dias: Number(dias) || 0, semanas: Number(semanas) || 0, meses: Number(meses) || 0,
      totales: totales || {}, total: Number(total) || 0,
    }])
    .select('*, clientes(nombre, empresa)').single();
  if (error) return res.status(500).json({ error: 'Error al crear cotización.' });
  return res.status(201).json({ cotizacion: data });
});

app.patch('/api/cotizaciones/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
  const fields = req.body;
  let update = { updated_at: new Date().toISOString() };
  if (payload.nivel >= 2) {
    ['estado','cliente_id','descripcion','articulos','herramientas','empleados','horas','dias','semanas','meses','totales','total']
      .forEach(k => { if (fields[k] !== undefined) update[k] = fields[k]; });
  } else {
    if (fields.estado === undefined) return res.status(403).json({ error: 'Solo puedes cambiar el estado.' });
    update.estado = fields.estado;
  }
  const { data, error } = await supabase.from('cotizaciones')
    .update(update).eq('id', req.params.id).select('*, clientes(nombre, empresa)').single();
  if (error) return res.status(500).json({ error: 'Error al actualizar cotización.' });
  return res.json({ cotizacion: data });
});

app.delete('/api/cotizaciones/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
  const { error } = await supabase.from('cotizaciones').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Error al eliminar cotización.' });
  return res.json({ message: 'Cotización eliminada.' });
});

// ── Trabajos ──────────────────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCodigo() {
  let c = 'ECG-';
  for (let i = 0; i < 6; i++) c += CHARS[Math.floor(Math.random() * CHARS.length)];
  return c;
}

app.get('/api/trabajos', async (req, res) => {
  // Búsqueda pública por código (sin auth)
  if (req.query.codigo) {
    const codigo = req.query.codigo.toUpperCase();
    const { data, error } = await supabase
      .from('trabajos')
      .select('codigo, folio, cliente, descripcion, etapa_actual, created_at, updated_at, trabajo_actualizaciones(etapa, descripcion, inconveniente, created_at)')
      .eq('codigo', codigo)
      .single();
    if (error || !data) return res.status(404).json({ error: 'No se encontró un trabajo con ese código.' });
    return res.json({ trabajo: data });
  }
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
  const { data, error } = await supabase
    .from('trabajos')
    .select('*, trabajo_actualizaciones(*)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Error al obtener trabajos.' });
  return res.json({ trabajos: data || [] });
});

app.post('/api/trabajos', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  const { cotizacion_id, folio, cliente, descripcion } = req.body;
  if (!cotizacion_id || !cliente)
    return res.status(400).json({ error: 'cotizacion_id y cliente son requeridos.' });

  const { data: existing } = await supabase
    .from('trabajos').select('id, codigo').eq('cotizacion_id', String(cotizacion_id)).maybeSingle();
  if (existing)
    return res.status(409).json({ error: 'Ya existe un trabajo para esta cotización.', trabajo: existing });

  let codigo, attempts = 0;
  do {
    codigo = genCodigo();
    const { data: conflict } = await supabase.from('trabajos').select('id').eq('codigo', codigo).maybeSingle();
    if (!conflict) break;
  } while (++attempts < 10);

  const { data: trabajo, error } = await supabase.from('trabajos')
    .insert([{ codigo, cotizacion_id: String(cotizacion_id), folio: folio || '', cliente, descripcion: descripcion || '', etapa_actual: 'recibido' }])
    .select().single();
  if (error) return res.status(500).json({ error: 'Error al crear trabajo.' });

  await supabase.from('trabajo_actualizaciones').insert([{
    trabajo_id: trabajo.id,
    etapa: 'recibido',
    descripcion: 'Trabajo creado a partir de cotización aprobada.',
    usuario_nombre: 'Sistema',
  }]);

  return res.status(201).json({ trabajo });
});

app.get('/api/trabajos/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
  const { data, error } = await supabase
    .from('trabajos').select('*, trabajo_actualizaciones(*)').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Trabajo no encontrado.' });
  return res.json({ trabajo: data });
});

app.patch('/api/trabajos/:id', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  const { etapa, descripcion, inconveniente, usuario_nombre } = req.body;
  if (!etapa) return res.status(400).json({ error: 'La etapa es requerida.' });

  const { data: trabajo, error: e1 } = await supabase
    .from('trabajos').update({ etapa_actual: etapa, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single();
  if (e1) return res.status(500).json({ error: 'Error al actualizar trabajo.' });

  const { error: e2 } = await supabase.from('trabajo_actualizaciones').insert([{
    trabajo_id: req.params.id, etapa,
    descripcion: descripcion || null,
    inconveniente: inconveniente || null,
    usuario_nombre: usuario_nombre || 'Admin',
  }]);
  if (e2) console.warn('Error al insertar actualizacion:', e2);

  return res.json({ trabajo });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ECG Backend corriendo en http://localhost:${PORT}`));
