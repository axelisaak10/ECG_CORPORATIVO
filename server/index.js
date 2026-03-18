require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const app = express();
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));

// Usamos service role key para que el backend bypasse RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SESSION_LIMIT     = 2;
const SESSION_TTL_HOURS = 24;

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
    .eq('Contraseña', password)
    .single();

  if (error || !data)
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

  // Crear nueva sesión
  const token = randomUUID();
  await supabase.from('sesiones').insert([{
    usuario_id: userId,
    token,
    user_agent: req.headers['user-agent'] || null,
  }]);

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
  await supabase.from('sesiones').delete().eq('token', token);
  return res.json({ message: 'Sesión cerrada.' });
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });

  // Verificar si el correo ya existe
  const { data: existing } = await supabase
    .from('Usuarios')
    .select('id')
    .eq('Correo', email)
    .maybeSingle();

  if (existing)
    return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

  // Generar id: obtener el máximo actual y sumar 1
  const { data: maxRow } = await supabase
    .from('Usuarios')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextId = maxRow ? (maxRow.id + 1) : 1;

  // 'Nombre Completo' es tipo _text (array) en Supabase
  const { error } = await supabase
    .from('Usuarios')
    .insert([{
      id: nextId,
      'Nombre Completo': [name],
      'Correo': email,
      'Contraseña': password,
      'nivel': 0,
    }]);

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: 'Error al crear la cuenta.' });
  }

  return res.status(201).json({ message: 'Cuenta creada exitosamente.' });
});

// ── GET /api/users ────────────────────────────────────────────────────────────
app.get('/api/users', async (_req, res) => {
  const { data, error } = await supabase
    .from('Usuarios')
    .select('id, "Nombre Completo", "Correo", nivel')
    .order('id', { ascending: true });

  if (error) return res.status(500).json({ error: 'Error al obtener usuarios.' });

  const users = (data || []).map(u => {
    const rawName = u['Nombre Completo'];
    return {
      id:    u.id,
      name:  Array.isArray(rawName) ? rawName[0] : rawName,
      email: u['Correo'],
      nivel: u.nivel,
      role:  u.nivel >= 2 ? 'superadmin' : u.nivel >= 1 ? 'admin' : 'user',
    };
  });

  return res.json({ users });
});

// ── PUT /api/users ────────────────────────────────────────────────────────────
app.put('/api/users', async (req, res) => {
  const { id, nivel } = req.body;
  if (id == null || nivel == null) return res.status(400).json({ error: 'id y nivel requeridos.' });

  const { error } = await supabase.from('Usuarios').update({ nivel: Number(nivel) }).eq('id', id);
  if (error) return res.status(500).json({ error: 'Error al actualizar usuario.' });
  return res.json({ message: 'Nivel actualizado.' });
});

// ── DELETE /api/users ─────────────────────────────────────────────────────────
app.delete('/api/users', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id requerido.' });

  const { error } = await supabase.from('Usuarios').delete().eq('id', id);
  if (error) return res.status(500).json({ error: 'Error al eliminar usuario.' });
  return res.json({ message: 'Usuario eliminado.' });
});

// ── Helpers tickets ───────────────────────────────────────────────────────────
async function getTicketUserNivel(userId) {
  const { data } = await supabase.from('Usuarios').select('nivel').eq('id', userId).maybeSingle();
  return data?.nivel ?? -1;
}

// ── GET /api/tickets — listar (nivel >= 1) ────────────────────────────────────
app.get('/api/tickets', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(401).json({ error: 'userId requerido.' });
  const nivel = await getTicketUserNivel(userId);
  if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Error al obtener tickets.' });
  return res.json({ tickets: data || [] });
});

// ── POST /api/tickets — crear (nivel >= 2) ────────────────────────────────────
app.post('/api/tickets', async (req, res) => {
  const { userId, titulo, descripcion, prioridad, estado, grupo, asignado_a, fecha_limite } = req.body;
  if (!userId) return res.status(401).json({ error: 'userId requerido.' });
  const nivel = await getTicketUserNivel(userId);
  if (nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para crear tickets.' });
  if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido.' });

  const { data, error } = await supabase
    .from('tickets')
    .insert([{ id: randomUUID(), titulo: titulo.trim(), descripcion: descripcion?.trim() || '', prioridad: prioridad || 'media', estado: estado || 'pendiente', grupo: grupo || 'IT', asignado_a: asignado_a || null, fecha_limite: fecha_limite || null, usuario_id: Number(userId) }])
    .select().single();

  if (error) { console.error('Supabase tickets insert error:', error); return res.status(500).json({ error: error.message || 'Error al crear ticket.' }); }
  return res.status(201).json({ ticket: data });
});

// ── PATCH /api/tickets/:id — actualizar ───────────────────────────────────────
app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...fields } = req.body;
    if (!userId) return res.status(401).json({ error: 'userId requerido.' });
    const nivel = await getTicketUserNivel(userId);
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    let updateData = {};
    if (nivel >= 2) {
      if (fields.titulo      !== undefined) updateData.titulo      = fields.titulo;
      if (fields.descripcion !== undefined) updateData.descripcion = fields.descripcion;
      if (fields.prioridad   !== undefined) updateData.prioridad   = fields.prioridad;
      if (fields.estado      !== undefined) updateData.estado      = fields.estado;
      if (fields.grupo       !== undefined) updateData.grupo       = fields.grupo;
      if (fields.asignado_a  !== undefined) updateData.asignado_a  = fields.asignado_a || null;
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

// ── DELETE /api/tickets/:id — eliminar (nivel >= 2) ───────────────────────────
app.delete('/api/tickets/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.body?.userId;
  if (!userId) return res.status(401).json({ error: 'userId requerido.' });
  const nivel = await getTicketUserNivel(userId);
  if (nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para eliminar tickets.' });

  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) return res.status(500).json({ error: 'Error al eliminar ticket.' });
  return res.json({ message: 'Ticket eliminado.' });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ECG Backend corriendo en http://localhost:${PORT}`));
