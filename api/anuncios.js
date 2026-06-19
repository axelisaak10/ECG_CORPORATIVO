// ─────────────────────────────────────────────────────────────────────────────
// /api/anuncios.js — CRUD de anuncios/pop-ups
// Vercel Serverless Function
// Permisos: nivel >= 1 (Trabajador) para leer y crear
//           nivel >= 2 (Admin) para editar y eliminar
// ─────────────────────────────────────────────────────────────────────────────
const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // ── GET público (sin token) — anuncios activos y vigentes para el portal ────
  // Query param: ?destino=portal | empresa_1 | empresa_2 | empresa_3
  if (req.method === 'GET' && !req.headers.authorization) {
    const { destino } = req.query;
    let query = supabase
      .from('anuncios')
      .select('id,titulo,subtitulo,cuerpo,tipo,icono,badge,destino,cta_texto,cta_link,imagen_url,fecha_fin,activo')
      .eq('activo', true)
      .or('fecha_fin.is.null,fecha_fin.gte.' + new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (destino) query = query.eq('destino', destino);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: 'Error al obtener anuncios.' });
    return res.json({ anuncios: data || [] });
  }

  // ── A partir de aquí requiere token válido ────────────────────────────────
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  const { sub: userId, nivel, name: userName } = payload;

  // ── GET /api/anuncios — listar TODOS (nivel >= 1) ─────────────────────────
  if (req.method === 'GET') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const { data, error } = await supabase
      .from('anuncios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Error al obtener anuncios.' });
    return res.json({ anuncios: data || [] });
  }

  // ── POST /api/anuncios — crear anuncio (nivel >= 1) ───────────────────────
  if (req.method === 'POST') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const {
      titulo, subtitulo, cuerpo, tipo, icono, badge,
      destino, cta_texto, cta_link, imagen_url, fecha_fin, activo,
    } = req.body;

    if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido.' });
    if (!cuerpo?.trim()) return res.status(400).json({ error: 'El cuerpo es requerido.' });

    const validTipos   = ['oferta','novedad','evento','aviso','promocion'];
    const validIconos  = ['Tag','Zap','Gift','Bell','Sparkles'];
    const validDest    = ['portal','empresa_1','empresa_2','empresa_3'];

    if (tipo    && !validTipos.includes(tipo))    return res.status(400).json({ error: 'Tipo inválido.'    });
    if (icono   && !validIconos.includes(icono))  return res.status(400).json({ error: 'Icono inválido.'   });
    if (destino && !validDest.includes(destino))  return res.status(400).json({ error: 'Destino inválido.' });

    const { data, error } = await supabase
      .from('anuncios')
      .insert([{
        titulo:     titulo.trim(),
        subtitulo:  subtitulo?.trim()  || '',
        cuerpo:     cuerpo.trim(),
        tipo:       tipo               || 'aviso',
        icono:      icono              || 'Bell',
        badge:      badge?.trim()      || '',
        destino:    destino            || 'portal',
        cta_texto:  cta_texto?.trim()  || '',
        cta_link:   cta_link?.trim()   || '',
        imagen_url: imagen_url?.trim() || '',
        fecha_fin:  fecha_fin          || null,
        activo:     activo !== undefined ? activo : true,
        creado_por: userName           || 'Desconocido',
        usuario_id: userId             || null,
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message || 'Error al crear anuncio.' });
    return res.status(201).json({ anuncio: data });
  }

  // ── PATCH /api/anuncios?id=xxx — editar o toggle activo (nivel >= 1) ──────
  if (req.method === 'PATCH') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID requerido.' });

    // Si nivel < 2 (trabajador), solo puede editar sus propios anuncios
    if (nivel < 2) {
      const { data: existing } = await supabase
        .from('anuncios').select('usuario_id').eq('id', id).single();
      if (!existing || String(existing.usuario_id) !== String(userId))
        return res.status(403).json({ error: 'Solo puedes editar tus propios anuncios.' });
    }

    const allowedFields = [
      'titulo','subtitulo','cuerpo','tipo','icono','badge',
      'destino','cta_texto','cta_link','imagen_url','fecha_fin','activo',
    ];
    const updates = {};
    for (const key of allowedFields) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const { data, error } = await supabase
      .from('anuncios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message || 'Error al actualizar.' });
    return res.json({ anuncio: data });
  }

  // ── DELETE /api/anuncios?id=xxx — eliminar (nivel >= 2) ──────────────────
  if (req.method === 'DELETE') {
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere Admin para eliminar.' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID requerido.' });

    const { error } = await supabase.from('anuncios').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message || 'Error al eliminar.' });
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
