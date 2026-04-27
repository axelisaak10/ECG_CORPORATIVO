const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./lib/jwt');

const genCodigo = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return `ECG-${c}`;
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const payload  = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  // ── GET /api/trabajos — listar todos (nivel >= 1) ──────────────────────────
  if (req.method === 'GET') {
    if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
    const { data, error } = await supabase
      .from('trabajos')
      .select('*, trabajo_actualizaciones(*)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Error al obtener trabajos.' });
    return res.json({ trabajos: data || [] });
  }

  // ── POST /api/trabajos — crear trabajo (nivel >= 2) ────────────────────────
  if (req.method === 'POST') {
    if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin para crear trabajos.' });
    const { cotizacion_id, folio, cliente, descripcion } = req.body;
    if (!cliente?.trim()) return res.status(400).json({ error: 'El nombre del cliente es requerido.' });

    // Verificar si ya existe un trabajo para esta cotización
    if (cotizacion_id) {
      const { data: existing } = await supabase
        .from('trabajos').select('id, codigo').eq('cotizacion_id', cotizacion_id).maybeSingle();
      if (existing) return res.status(409).json({ error: 'Ya existe un trabajo para esta cotización.', trabajo: existing });
    }

    // Generar código único
    let codigo, attempts = 0;
    do {
      codigo = genCodigo();
      const { data: exists } = await supabase.from('trabajos').select('id').eq('codigo', codigo).maybeSingle();
      if (!exists) break;
    } while (++attempts < 10);

    const { data, error } = await supabase
      .from('trabajos')
      .insert([{ codigo, cotizacion_id: cotizacion_id || null, folio: folio || '', cliente: cliente.trim(), descripcion: descripcion?.trim() || '', etapa_actual: 'recibido' }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Error al crear el trabajo.' });

    // Primera actualización automática
    await supabase.from('trabajo_actualizaciones').insert([{
      trabajo_id: data.id, etapa: 'recibido',
      descripcion: 'Trabajo iniciado a partir de cotización aprobada.',
      usuario_nombre: 'Sistema',
    }]);

    return res.status(201).json({ trabajo: data });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
