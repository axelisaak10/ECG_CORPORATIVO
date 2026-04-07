/**
 * /api/catalogo — maneja clientes, articulos, herramientas y cotizaciones
 * El recurso e id se pasan como query params desde el frontend:
 *   GET    /api/catalogo?r=clientes
 *   POST   /api/catalogo?r=clientes
 *   PUT    /api/catalogo?r=clientes&id=UUID
 *   DELETE /api/catalogo?r=clientes&id=UUID
 *   PATCH  /api/catalogo?r=cotizaciones&id=UUID
 */
const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./lib/jwt');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  const supabase         = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { nivel, sub: userId } = payload;
  const resource         = req.query.r;
  const id               = req.query.id;

  // ── CLIENTES ───────────────────────────────────────────────────────────────
  if (resource === 'clientes') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre');
      if (error) return res.status(500).json({ error: 'Error al obtener clientes.' });
      return res.json({ clientes: data || [] });
    }
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    if (req.method === 'POST') {
      const { nombre, empresa, correo, telefono } = req.body;
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
      const { data, error } = await supabase.from('clientes')
        .insert([{ nombre: nombre.trim(), empresa: empresa?.trim() || null, correo: correo?.trim() || null, telefono: telefono?.trim() || null }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear cliente.' });
      return res.status(201).json({ cliente: data });
    }
    if (req.method === 'PUT' && id) {
      const { nombre, empresa, correo, telefono } = req.body;
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
      const { data, error } = await supabase.from('clientes')
        .update({ nombre: nombre.trim(), empresa: empresa?.trim() || null, correo: correo?.trim() || null, telefono: telefono?.trim() || null })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar cliente.' });
      return res.json({ cliente: data });
    }
    if (req.method === 'DELETE' && id) {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar cliente.' });
      return res.json({ message: 'Cliente eliminado.' });
    }
  }

  // ── ARTÍCULOS ──────────────────────────────────────────────────────────────
  if (resource === 'articulos') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('articulos_catalogo').select('*').order('nombre');
      if (error) return res.status(500).json({ error: 'Error al obtener artículos.' });
      return res.json({ articulos: data || [] });
    }
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    if (req.method === 'POST') {
      const { nombre, precio, unidad } = req.body;
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
      const { data, error } = await supabase.from('articulos_catalogo')
        .insert([{ nombre: nombre.trim(), precio: Number(precio) || 0, unidad: unidad?.trim() || 'pza' }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear artículo.' });
      return res.status(201).json({ articulo: data });
    }
    if (req.method === 'PUT' && id) {
      const { nombre, precio, unidad } = req.body;
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
      const { data, error } = await supabase.from('articulos_catalogo')
        .update({ nombre: nombre.trim(), precio: Number(precio) || 0, unidad: unidad?.trim() || 'pza' })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar artículo.' });
      return res.json({ articulo: data });
    }
    if (req.method === 'DELETE' && id) {
      const { error } = await supabase.from('articulos_catalogo').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar artículo.' });
      return res.json({ message: 'Artículo eliminado.' });
    }
  }

  // ── HERRAMIENTAS ───────────────────────────────────────────────────────────
  if (resource === 'herramientas') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('herramientas_catalogo').select('*').order('nombre');
      if (error) return res.status(500).json({ error: 'Error al obtener herramientas.' });
      return res.json({ herramientas: data || [] });
    }
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    if (req.method === 'POST') {
      const { nombre, precio_renta_diaria, unidad } = req.body;
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
      const { data, error } = await supabase.from('herramientas_catalogo')
        .insert([{ nombre: nombre.trim(), precio_renta_diaria: Number(precio_renta_diaria) || 0, unidad: unidad?.trim() || 'pza' }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear herramienta.' });
      return res.status(201).json({ herramienta: data });
    }
    if (req.method === 'PUT' && id) {
      const { nombre, precio_renta_diaria, unidad } = req.body;
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
      const { data, error } = await supabase.from('herramientas_catalogo')
        .update({ nombre: nombre.trim(), precio_renta_diaria: Number(precio_renta_diaria) || 0, unidad: unidad?.trim() || 'pza' })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar herramienta.' });
      return res.json({ herramienta: data });
    }
    if (req.method === 'DELETE' && id) {
      const { error } = await supabase.from('herramientas_catalogo').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar herramienta.' });
      return res.json({ message: 'Herramienta eliminada.' });
    }
  }

  // ── COTIZACIONES ───────────────────────────────────────────────────────────
  if (resource === 'cotizaciones') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('cotizaciones').select('*, clientes(nombre, empresa)').order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: 'Error al obtener cotizaciones.' });
      return res.json({ cotizaciones: data || [] });
    }

    if (req.method === 'POST') {
      if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { cliente_id, descripcion, articulos, herramientas, empleados, horas, dias, semanas, meses, totales, total } = req.body;
      if (!cliente_id) return res.status(400).json({ error: 'El cliente es requerido.' });
      const { data, error } = await supabase.from('cotizaciones')
        .insert([{
          cliente_id, usuario_id: userId,
          descripcion: descripcion?.trim() || null, estado: 'pendiente',
          articulos: articulos || [], herramientas: herramientas || [], empleados: empleados || [],
          horas: Number(horas) || 0, dias: Number(dias) || 0, semanas: Number(semanas) || 0, meses: Number(meses) || 0,
          totales: totales || {}, total: Number(total) || 0,
        }])
        .select('*, clientes(nombre, empresa)').single();
      if (error) return res.status(500).json({ error: 'Error al crear cotización.' });
      return res.status(201).json({ cotizacion: data });
    }

    if (req.method === 'PATCH' && id) {
      const fields = req.body;
      let update   = { updated_at: new Date().toISOString() };
      if (nivel >= 2) {
        ['estado','cliente_id','descripcion','articulos','herramientas','empleados','horas','dias','semanas','meses','totales','total']
          .forEach(k => { if (fields[k] !== undefined) update[k] = fields[k]; });
      } else {
        if (fields.estado === undefined) return res.status(403).json({ error: 'Solo puedes cambiar el estado.' });
        update.estado = fields.estado;
      }
      const { data, error } = await supabase.from('cotizaciones')
        .update(update).eq('id', id).select('*, clientes(nombre, empresa)').single();
      if (error) return res.status(500).json({ error: 'Error al actualizar cotización.' });
      return res.json({ cotizacion: data });
    }

    if (req.method === 'DELETE' && id) {
      if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { error } = await supabase.from('cotizaciones').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar cotización.' });
      return res.json({ message: 'Cotización eliminada.' });
    }
  }

  return res.status(404).json({ error: 'Ruta no encontrada.' });
};
