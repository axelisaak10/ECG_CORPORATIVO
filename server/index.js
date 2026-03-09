require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));

// Usamos service role key para que el backend bypasse RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const email = req.body.email?.trim();
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

  // 'Nombre Completo' es tipo _text (array) en Supabase
  const rawName = data['Nombre Completo'];
  const user = {
    id: data.id,
    name: Array.isArray(rawName) ? rawName[0] : rawName,
    email: data['Correo'],
    role: data.nivel >= 1 ? 'admin' : 'user',
    nivel: data.nivel,
  };

  return res.json({ user });
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

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ECG Backend corriendo en http://localhost:${PORT}`));
