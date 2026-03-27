const { createClient } = require('@supabase/supabase-js');
const bcrypt           = require('bcryptjs');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase    = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const email       = req.body?.email?.trim();
  const newPassword = req.body?.newPassword?.trim();

  if (!email || !newPassword)
    return res.status(400).json({ error: 'Correo y nueva contraseña requeridos.' });

  if (newPassword.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });

  const { data: user } = await supabase
    .from('Usuarios')
    .select('id')
    .eq('Correo', email)
    .maybeSingle();

  if (!user)
    return res.status(404).json({ error: 'No existe una cuenta con ese correo.' });

  const hash = await bcrypt.hash(newPassword, 12);

  const { error } = await supabase
    .from('Usuarios')
    .update({ 'Contraseña': hash })
    .eq('Correo', email);

  if (error) return res.status(500).json({ error: 'Error al actualizar la contraseña.' });

  return res.json({ message: 'Contraseña actualizada correctamente.' });
};
