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

  const email    = req.body?.email?.trim();
  const password = req.body?.password?.trim();

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

  const rawName = data['Nombre Completo'];
  return res.json({
    user: {
      id:    data.id,
      name:  Array.isArray(rawName) ? rawName[0] : rawName,
      email: data['Correo'],
      role:  data.nivel >= 1 ? 'admin' : 'user',
      nivel: data.nivel,
    },
  });
}
