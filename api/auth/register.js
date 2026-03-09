import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });

  const name     = req.body?.name?.trim();
  const email    = req.body?.email?.trim();
  const password = req.body?.password?.trim();

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });

  const { data: existing } = await supabase
    .from('Usuarios')
    .select('id')
    .eq('Correo', email)
    .maybeSingle();

  if (existing)
    return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

  const { data: maxRow } = await supabase
    .from('Usuarios')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextId = maxRow ? (maxRow.id + 1) : 1;

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
}
