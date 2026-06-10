const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./lib/jwt');
const { randomUUID }   = require('crypto');

const ENC_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCodigoEncuesta() {
  let c = 'ENC-';
  for (let i = 0; i < 6; i++) c += ENC_CHARS[Math.floor(Math.random() * ENC_CHARS.length)];
  return c;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Extraer sub-ruta: /api/encuesta/preguntas, /api/encuesta/codigos, etc.
  // En Vercel, req.url = '/preguntas', '/codigos', '/validar', etc.
  const url = (req.url || '').split('?')[0].replace(/^\//, '');
  const method = req.method;

  // ─────────────────────────────────────────────────────────────────────────
  // ESTADÍSTICAS — público
  // ─────────────────────────────────────────────────────────────────────────
  if (url === 'estadisticas' && method === 'GET') {
    const [codigosRes, preguntasRes, respuestasRes] = await Promise.all([
      supabase.from('encuesta_codigos').select('id, usado, cliente, created_at'),
      supabase.from('encuesta_preguntas').select('id, texto, tipo, opciones').eq('activa', true).order('orden'),
      supabase.from('encuesta_respuestas').select('pregunta_id, respuesta_texto, respuesta_opcion, created_at'),
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
      return {
        pregunta_id: p.id, texto: p.texto, tipo: p.tipo, total: resps.length,
        comentarios: resps.map(r => r.respuesta_texto).filter(Boolean).slice(0, 30),
      };
    });

    return res.json({ total_codigos, total_completados, stats_por_pregunta });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDAR CÓDIGO — público
  // ─────────────────────────────────────────────────────────────────────────
  if (url === 'validar' && method === 'POST') {
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

  // ─────────────────────────────────────────────────────────────────────────
  // RESPONDER ENCUESTA — público
  // ─────────────────────────────────────────────────────────────────────────
  if (url === 'responder' && method === 'POST') {
    const { codigo_id, respuestas } = req.body || {};
    if (!codigo_id || !Array.isArray(respuestas) || respuestas.length === 0)
      return res.status(400).json({ error: 'codigo_id y respuestas son requeridos.' });

    const { data: codigoData } = await supabase
      .from('encuesta_codigos').select('id, usado').eq('id', codigo_id).maybeSingle();
    if (!codigoData) return res.status(404).json({ error: 'Código no encontrado.' });
    if (codigoData.usado) return res.status(409).json({ error: 'Este código ya fue utilizado.' });

    const rows = respuestas.map(r => ({
      codigo_id,
      pregunta_id:      r.pregunta_id,
      respuesta_texto:  r.respuesta_texto  || null,
      respuesta_opcion: r.respuesta_opcion || null,
    }));

    const { error: insError } = await supabase.from('encuesta_respuestas').insert(rows);
    if (insError) return res.status(500).json({ error: 'Error al guardar respuestas.' });

    await supabase.from('encuesta_codigos').update({ usado: true }).eq('id', codigo_id);
    return res.json({ message: '¡Gracias por tu opinión! Respuestas guardadas correctamente.' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PREGUNTAS
  // ─────────────────────────────────────────────────────────────────────────

  // GET preguntas activas — público
  if (url === 'preguntas' && method === 'GET') {
    const { data, error } = await supabase
      .from('encuesta_preguntas').select('*').eq('activa', true).order('orden').order('created_at');
    if (error) return res.status(500).json({ error: 'Error al obtener preguntas.' });
    return res.json({ preguntas: data || [] });
  }

  // GET todas (activas + inactivas) — admin
  if (url === 'preguntas/all' && method === 'GET') {
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
    if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
    const { data, error } = await supabase
      .from('encuesta_preguntas').select('*').order('orden').order('created_at');
    if (error) return res.status(500).json({ error: 'Error al obtener preguntas.' });
    return res.json({ preguntas: data || [] });
  }

  // POST crear pregunta — admin
  if (url === 'preguntas' && method === 'POST') {
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

  // PUT actualizar pregunta — admin (url: preguntas/<id>)
  if (url.startsWith('preguntas/') && url !== 'preguntas/all' && method === 'PUT') {
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
    if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    const id = url.replace('preguntas/', '');
    const { texto, tipo, opciones, orden, activa } = req.body || {};
    if (!texto?.trim()) return res.status(400).json({ error: 'El texto es requerido.' });

    const { data, error } = await supabase.from('encuesta_preguntas')
      .update({ texto: texto.trim(), tipo, opciones: (opciones || []).map(o => o?.trim()).filter(Boolean), orden: Number(orden) || 0, activa: activa ?? true })
      .eq('id', id).select().single();
    if (error) return res.status(500).json({ error: 'Error al actualizar pregunta.' });
    return res.json({ pregunta: data });
  }

  // DELETE pregunta — admin
  if (url.startsWith('preguntas/') && method === 'DELETE') {
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
    if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    const id = url.replace('preguntas/', '');
    const { error } = await supabase.from('encuesta_preguntas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al eliminar pregunta.' });
    return res.json({ message: 'Pregunta eliminada.' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CÓDIGOS
  // ─────────────────────────────────────────────────────────────────────────

  // GET listar códigos — trabajador+
  if (url === 'codigos' && method === 'GET') {
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
    if (payload.nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    const { data, error } = await supabase
      .from('encuesta_codigos').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Error al obtener códigos.' });
    return res.json({ codigos: data || [] });
  }

  // POST generar código — trabajador+
  if (url === 'codigos' && method === 'POST') {
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

  // DELETE código — admin
  if (url.startsWith('codigos/') && method === 'DELETE') {
    const payload = verifyToken(req);
    if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });
    if (payload.nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    const id = url.replace('codigos/', '');
    const { error } = await supabase.from('encuesta_codigos').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al eliminar código.' });
    return res.json({ message: 'Código eliminado.' });
  }

  return res.status(404).json({ error: 'Ruta no encontrada.' });
};
