const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./lib/jwt');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // ══════════════════════════════════════════════════════════════════
  // RECURSO: ANUNCIOS  (?resource=anuncios)
  // ══════════════════════════════════════════════════════════════════
  if (req.query?.resource === 'anuncios') {

    // ── GET público (sin token) — anuncios activos por destino ────────
    if (req.method === 'GET' && !req.headers.authorization) {
      const { destino } = req.query;
      const today = new Date().toISOString().split('T')[0];
      let query = supabase
        .from('anuncios')
        .select('id,titulo,subtitulo,cuerpo,tipo,icono,badge,destino,cta_texto,cta_link,imagen_url,fecha_fin,activo')
        .eq('activo', true)
        .or(`fecha_fin.is.null,fecha_fin.gte.${today}`)
        .order('created_at', { ascending: false });
      if (destino) query = query.eq('destino', destino);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: 'Error al obtener anuncios.' });
      return res.json({ anuncios: data || [] });
    }

    // ── A partir de aquí requiere token ────────────────────────────
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
    const { sub: userId, nivel, name: userName } = payload;

    // ── GET autenticado — todos los anuncios (nivel >= 1) ──────────
    if (req.method === 'GET') {
      if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
      const { data, error } = await supabase
        .from('anuncios').select('*').order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: 'Error al obtener anuncios.' });
      return res.json({ anuncios: data || [] });
    }

    // ── POST — crear anuncio (nivel >= 1) ─────────────────────────
    if (req.method === 'POST') {
      if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
      const { titulo, subtitulo, cuerpo, tipo, icono, badge, destino,
              cta_texto, cta_link, imagen_url, fecha_fin, activo } = req.body;
      if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido.' });
      if (!cuerpo?.trim()) return res.status(400).json({ error: 'El cuerpo es requerido.' });
      const validTipos  = ['oferta','novedad','evento','aviso','promocion'];
      const validIconos = ['Tag','Zap','Gift','Bell','Sparkles'];
      const validDest   = ['portal','empresa_1','empresa_2','empresa_3'];
      if (tipo    && !validTipos.includes(tipo))   return res.status(400).json({ error: 'Tipo inválido.'    });
      if (icono   && !validIconos.includes(icono)) return res.status(400).json({ error: 'Icono inválido.'   });
      if (destino && !validDest.includes(destino)) return res.status(400).json({ error: 'Destino inválido.' });
      const { data, error } = await supabase.from('anuncios').insert([{
        titulo: titulo.trim(), subtitulo: subtitulo?.trim() || '',
        cuerpo: cuerpo.trim(), tipo: tipo || 'aviso', icono: icono || 'Bell',
        badge: badge?.trim() || '', destino: destino || 'portal',
        cta_texto: cta_texto?.trim() || '', cta_link: cta_link?.trim() || '',
        imagen_url: imagen_url?.trim() || '', fecha_fin: fecha_fin || null,
        activo: activo !== undefined ? activo : true,
        creado_por: userName || 'Desconocido', usuario_id: userId || null,
      }]).select().single();
      if (error) return res.status(500).json({ error: error.message || 'Error al crear anuncio.' });
      return res.status(201).json({ anuncio: data });
    }

    // ── PATCH — editar/toggle (nivel >= 1, solo propios si nivel < 2) ─
    if (req.method === 'PATCH') {
      if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID requerido.' });
      if (nivel < 2) {
        const { data: ex } = await supabase.from('anuncios').select('usuario_id').eq('id', id).single();
        if (!ex || String(ex.usuario_id) !== String(userId))
          return res.status(403).json({ error: 'Solo puedes editar tus propios anuncios.' });
      }
      const allowed = ['titulo','subtitulo','cuerpo','tipo','icono','badge',
                       'destino','cta_texto','cta_link','imagen_url','fecha_fin','activo'];
      const updates = {};
      for (const k of allowed) { if (k in req.body) updates[k] = req.body[k]; }
      const { data, error } = await supabase.from('anuncios').update(updates).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message || 'Error al actualizar.' });
      return res.json({ anuncio: data });
    }

    // ── DELETE — eliminar (nivel >= 2) ────────────────────────────
    if (req.method === 'DELETE') {
      if (nivel < 2) return res.status(403).json({ error: 'Se requiere Admin para eliminar.' });
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID requerido.' });
      const { error } = await supabase.from('anuncios').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message || 'Error al eliminar.' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Método no permitido.' });
  }

  // ══════════════════════════════════════════════════════════════════
  // RECURSO: USUARIOS  (comportamiento original)
  // ══════════════════════════════════════════════════════════════════
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  // GET — listar todos los usuarios (nivel >= 1)
  if (req.method === 'GET') {
    if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const showDeleted = req.query?.deleted === 'true';

    if (showDeleted) {
      if (payload.nivel < 3) return res.status(403).json({ error: 'Se requiere superadmin.' });

      const { data, error } = await supabase
        .from('Usuarios')
        .select('id, "Nombre Completo", "Correo", nivel, "Telefono", "RFC_CURP", "Empresa", deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) return res.status(500).json({ error: 'Error al obtener usuarios eliminados.' });

      const users = (data || []).map(u => {
        const rawName = u['Nombre Completo'];
        return {
          id:         u.id,
          name:       Array.isArray(rawName) ? rawName[0] : rawName,
          email:      u['Correo'],
          nivel:      u.nivel,
          telefono:   u['Telefono'],
          rfc_curp:   u['RFC_CURP'],
          empresa:    u['Empresa'],
          role:       u.nivel >= 3 ? 'superadmin' : u.nivel >= 2 ? 'admin' : u.nivel >= 1 ? 'trabajador' : 'user',
          deleted_at: u.deleted_at,
        };
      });

      return res.json({ users });
    }

    // Usuarios activos (no eliminados)
    const { data, error } = await supabase
      .from('Usuarios')
      .select('id, "Nombre Completo", "Correo", nivel')
      .is('deleted_at', null)
      .order('id', { ascending: true });

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
  }

  // PUT — cambiar nivel de un usuario (nivel >= 3)
  if (req.method === 'PUT') {
    if (payload.nivel < 3) return res.status(403).json({ error: 'Se requiere superadmin.' });

    const { id, nivel } = req.body;
    if (id == null || nivel == null) return res.status(400).json({ error: 'id y nivel requeridos.' });

    const { error } = await supabase
      .from('Usuarios')
      .update({ nivel: Number(nivel) })
      .eq('id', id);

    if (error) return res.status(500).json({ error: 'Error al actualizar usuario.' });
    return res.json({ message: 'Nivel actualizado.' });
  }

  // PATCH — restaurar un usuario eliminado (nivel >= 3)
  if (req.method === 'PATCH') {
    if (payload.nivel < 3) return res.status(403).json({ error: 'Se requiere superadmin.' });

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id requerido.' });

    const { data: user } = await supabase
      .from('Usuarios')
      .select('id, deleted_at')
      .eq('id', id)
      .not('deleted_at', 'is', null)
      .maybeSingle();

    if (!user) return res.status(404).json({ error: 'Usuario eliminado no encontrado.' });

    const { error } = await supabase
      .from('Usuarios')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) return res.status(500).json({ error: 'Error al restaurar usuario.' });
    return res.json({ message: 'Usuario restaurado exitosamente.' });
  }

  // DELETE — soft-delete de un usuario (nivel >= 3)
  if (req.method === 'DELETE') {
    if (payload.nivel < 3) return res.status(403).json({ error: 'Se requiere superadmin.' });

    const { id, permanent } = req.body;
    if (!id) return res.status(400).json({ error: 'id requerido.' });

    if (permanent) {
      const { error } = await supabase.from('Usuarios').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar usuario permanentemente.' });
      return res.json({ message: 'Usuario eliminado permanentemente.' });
    }

    const { error } = await supabase
      .from('Usuarios')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return res.status(500).json({ error: 'Error al eliminar usuario.' });
    return res.json({ message: 'Usuario eliminado.' });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
