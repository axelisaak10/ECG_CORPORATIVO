const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
  if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // GET /api/cotizaciones — admin ve todas, trabajador ve todas (solo lectura)
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*, clientes(nombre, empresa)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Error al obtener cotizaciones.' });
    return res.json({ cotizaciones: data || [] });
  }

  // POST /api/cotizaciones — solo admin+
  if (req.method === 'POST') {
    if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin para crear cotizaciones.' });

    const { cliente_id, descripcion, articulos, herramientas, empleados, horas, dias, semanas, meses, totales, total } = req.body;
    if (!cliente_id) return res.status(400).json({ error: 'El cliente es requerido.' });

    const { data, error } = await supabase
      .from('cotizaciones')
      .insert([{
        cliente_id,
        usuario_id:  payload.sub,
        descripcion: descripcion?.trim() || null,
        estado:      'pendiente',
        articulos:   articulos    || [],
        herramientas: herramientas || [],
        empleados:   empleados    || [],
        horas:       Number(horas)   || 0,
        dias:        Number(dias)    || 0,
        semanas:     Number(semanas) || 0,
        meses:       Number(meses)   || 0,
        totales:     totales || {},
        total:       Number(total)   || 0,
      }])
      .select('*, clientes(nombre, empresa)')
      .single();

    if (error) return res.status(500).json({ error: 'Error al crear cotización.' });
    return res.status(201).json({ cotizacion: data });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
