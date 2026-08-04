const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./_lib/jwt');
const { applyCors }    = require('./_lib/cors');

const ENC_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_RESPUESTAS = 50; // límite anti-DoS

function genCodigoEncuesta() {
  let c = 'ENC-';
  for (let i = 0; i < 6; i++) c += ENC_CHARS[Math.floor(Math.random() * ENC_CHARS.length)];
  return c;
}

module.exports = async function handler(req, res) {
  applyCors(req, res, 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Parse the URL manually instead of using Next.js/Vercel [...path] syntax
  const urlPath = req.url.split('?')[0]; // e.g. /api/encuesta/estadisticas
  const parts = urlPath.split('/').filter(Boolean);
  
  // parts = ['api', 'encuesta', 'estadisticas']
  // Since we rewrite to /api/encuesta, sometimes Vercel passes just /estadisticas
  // Let's find 'encuesta' in parts and take the next parts
  const encuestaIdx = parts.indexOf('encuesta');
  let route = '';
  let itemId = null;

  if (encuestaIdx !== -1) {
    route = parts[encuestaIdx + 1] || '';
    itemId = parts[encuestaIdx + 2] || null;
  } else {
    // If rewrite strips /api/encuesta
    route = parts[0] || '';
    itemId = parts[1] || null;
  }

  const method = req.method;

  // ── ESTADÍSTICAS (público) ───────────────────────────────────────────────
  if (route === 'estadisticas' && method === 'GET') {
    const [codigosRes, preguntasRes, respuestasRes] = await Promise.all([
      supabase.from('encuesta_codigos').select('id, usado, cliente, created_at'),
      supabase.from('encuesta_preguntas').select('id, texto, tipo, opciones').eq('activa', true).order('orden'),
      supabase.from('encuesta_respuestas').select('pregunta_id, respuesta_texto, respuesta_opcion'),
    ]);
    const codigos    = codigosRes.data   || [];
    const preguntas  = preguntasRes.data || [];
    const respuestas = respuestasRes.data || [];
    const total_codigos     = codigos.length;
    const total_completados = codigos.filter(c => c.usado).length;
    const stats_por_pregunta = preguntas.map(p => {
      const resps = respuestas.filter(r => r.pregunta_id === p.id);
      if (p.tipo === 'multiple') {
        const conteo = {};
        resps.forEach(r => { if (r.respuesta_opcion) conteo[r.respuesta_opcion] = (conteo[r.respuesta_opcion] || 0) + 1; });
        return { pregunta_id: p.id, texto: p.texto, tipo: p.tipo, opciones: p.opciones, total: resps.length, conteo };
      }
      return { pregunta_id: p.id, texto: p.texto, tipo: p.tipo, total: resps.length, comentarios: resps.map(r => r.respuesta_texto).filter(Boolean).slice(0, 30) };
    });
    return res.json({ total_codigos, total_completados, stats_por_pregunta });
  }

  // ── VALIDAR CÓDIGO (público) ─────────────────────────────────────────────
  if (route === 'validar' && method === 'POST') {
    const codigo = req.body?.codigo?.trim().toUpperCase();
    if (!codigo) return res.status(400).json({ error: 'Código requerido.' });
    const { data: codigoData, error } = await supabase
      .from('encuesta_codigos').select('*').eq('codigo', codigo).maybeSingle();
    if (error || !codigoData) return res.status(404).json({ error: 'Código no válido o no encontrado.' });
    if (codigoData.usado) return res.status(409).json({ error: 'Este código ya fue utilizado. Cada código es de un solo uso.' });
    const { data: preguntas } = await supabase
      .from('encuesta_preguntas').select('*').eq('activa', true).order('orden').order('created_at');
    return res.json({ valido: true, codigo: codigoData, preguntas: preguntas || [] });
  }

  // ── RESPONDER COMO PÚBLICO GENERAL (público) ─────────────────────────────────
  if (route === 'publico' && method === 'POST') {
    let codigo, attempts = 0;
    do {
      let c = 'PUB-';
      for (let i = 0; i < 6; i++) c += ENC_CHARS[Math.floor(Math.random() * ENC_CHARS.length)];
      codigo = c;
      const { data: conflict } = await supabase.from('encuesta_codigos').select('id').eq('codigo', codigo).maybeSingle();
      if (!conflict) break;
    } while (++attempts < 10);

    const { data: codigoData, error: insError } = await supabase
      .from('encuesta_codigos')
      .insert([{
        codigo,
        cliente: 'Público General',
        descripcion: 'Encuesta completada de forma pública (no cliente)',
        generado_por: 'Sistema',
        generado_por_id: null,
        usado: false
      }])
      .select().single();

    if (insError) return res.status(500).json({ error: 'Error al iniciar encuesta pública: ' + insError.message });

    const { data: preguntas, error: qError } = await supabase
      .from('encuesta_preguntas').select('*').eq('activa', true).order('orden').order('created_at');

    if (qError) return res.status(500).json({ error: 'Error al obtener preguntas: ' + qError.message });

    return res.json({ valido: true, codigo: codigoData, preguntas: preguntas || [] });
  }

  // ── RESPONDER ENCUESTA (público) ─────────────────────────────────────────
  if (route === 'responder' && method === 'POST') {
    const { codigo_id, respuestas } = req.body || {};
    if (!codigo_id || !Array.isArray(respuestas) || respuestas.length === 0)
      return res.status(400).json({ error: 'codigo_id y respuestas son requeridos.' });
    if (respuestas.length > MAX_RESPUESTAS)
      return res.status(400).json({ error: `Máximo ${MAX_RESPUESTAS} respuestas permitidas.` });
    const { data: codigoData } = await supabase
      .from('encuesta_codigos').select('id, usado').eq('id', codigo_id).maybeSingle();
    if (!codigoData) return res.status(404).json({ error: 'Código no encontrado.' });
    if (codigoData.usado) return res.status(409).json({ error: 'Este código ya fue utilizado.' });
    const rows = respuestas.map(r => ({
      codigo_id, pregunta_id: r.pregunta_id,
      respuesta_texto: r.respuesta_texto || null, respuesta_opcion: r.respuesta_opcion || null,
    }));
    const { error: insError } = await supabase.from('encuesta_respuestas').insert(rows);
    if (insError) return res.status(500).json({ error: 'Error al guardar respuestas.' });
    await supabase.from('encuesta_codigos').update({ usado: true }).eq('id', codigo_id);
    return res.json({ message: '¡Gracias por tu opinión! Respuestas guardadas correctamente.' });
  }

  // ── PREGUNTAS ────────────────────────────────────────────────────────────
  if (route === 'preguntas') {
    // PUT /preguntas/:id — admin
    if (method === 'PUT' && itemId) {
      const payload = verifyToken(req);
      if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
      if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { texto, tipo, opciones, orden, activa } = req.body || {};
      if (!texto?.trim()) return res.status(400).json({ error: 'El texto es requerido.' });
      const { data, error } = await supabase.from('encuesta_preguntas')
        .update({ texto: texto.trim(), tipo, opciones: (opciones || []).map(o => o?.trim()).filter(Boolean), orden: Number(orden) || 0, activa: activa ?? true })
        .eq('id', itemId).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar pregunta.' });
      return res.json({ pregunta: data });
    }

    // DELETE /preguntas/:id — admin
    if (method === 'DELETE' && itemId) {
      const payload = verifyToken(req);
      if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
      if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { error } = await supabase.from('encuesta_preguntas').delete().eq('id', itemId);
      if (error) return res.status(500).json({ error: 'Error al eliminar pregunta.' });
      return res.json({ message: 'Pregunta eliminada.' });
    }

    // GET /preguntas?all=1 — admin; GET /preguntas — público
    if (method === 'GET') {
      if (req.query.all === '1') {
        const payload = verifyToken(req);
        if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
        if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
        const { data, error } = await supabase
          .from('encuesta_preguntas').select('*').order('orden').order('created_at');
        if (error) return res.status(500).json({ error: 'Error al obtener preguntas.' });
        return res.json({ preguntas: data || [] });
      }
      const { data, error } = await supabase
        .from('encuesta_preguntas').select('*').eq('activa', true).order('orden').order('created_at');
      if (error) return res.status(500).json({ error: 'Error al obtener preguntas.' });
      return res.json({ preguntas: data || [] });
    }

    // POST /preguntas — admin
    if (method === 'POST') {
      const payload = verifyToken(req);
      if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
      if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { texto, tipo, opciones, orden } = req.body || {};
      if (!texto?.trim()) return res.status(400).json({ error: 'El texto es requerido.' });
      if (!['abierta', 'multiple'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido.' });
      if (tipo === 'multiple' && (!Array.isArray(opciones) || opciones.filter(o => o?.trim()).length < 2))
        return res.status(400).json({ error: 'Se requieren al menos 2 opciones.' });
      const { data, error } = await supabase.from('encuesta_preguntas')
        .insert([{ texto: texto.trim(), tipo, opciones: (opciones || []).map(o => o.trim()).filter(Boolean), orden: Number(orden) || 0, activa: true }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear pregunta.' });
      return res.status(201).json({ pregunta: data });
    }
  }

  // ── CÓDIGOS ──────────────────────────────────────────────────────────────
  if (route === 'codigos') {
    // DELETE /codigos/:id — admin
    if (method === 'DELETE' && itemId) {
      const payload = verifyToken(req);
      if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
      if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { error } = await supabase.from('encuesta_codigos').delete().eq('id', itemId);
      if (error) return res.status(500).json({ error: 'Error al eliminar código.' });
      return res.json({ message: 'Código eliminado.' });
    }

    // GET /codigos — trabajador+
    if (method === 'GET') {
      const payload = verifyToken(req);
      if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
      if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });
      const { data, error } = await supabase
        .from('encuesta_codigos').select('*').order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: 'Error al obtener códigos.' });
      return res.json({ codigos: data || [] });
    }

    // POST /codigos — trabajador+
    if (method === 'POST') {
      const payload = verifyToken(req);
      if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
      if (payload.nivel < 1) return res.status(403).json({ error: 'Se requiere nivel trabajador o superior.' });
      const { cliente, descripcion } = req.body || {};
      if (!cliente?.trim()) return res.status(400).json({ error: 'El nombre del cliente es requerido.' });
      const { data: userRow } = await supabase.from('Usuarios').select('"Nombre Completo"').eq('id', payload.sub).single();
      const rawName = userRow?.['Nombre Completo'];
      const generadoPor = Array.isArray(rawName) ? rawName[0] : rawName || 'Staff';
      let codigo, attempts = 0;
      do {
        codigo = genCodigoEncuesta();
        const { data: conflict } = await supabase.from('encuesta_codigos').select('id').eq('codigo', codigo).maybeSingle();
        if (!conflict) break;
      } while (++attempts < 10);
      const { data, error } = await supabase.from('encuesta_codigos')
        .insert([{ codigo, cliente: cliente.trim(), descripcion: descripcion?.trim() || null, generado_por: generadoPor, generado_por_id: payload.sub, usado: false }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al generar código.' });
      return res.status(201).json({ codigo: data });
    }
  }

  return res.status(404).json({ error: 'Ruta no encontrada.' });
};
