const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('./lib/jwt');
const { applyCors }    = require('./lib/cors');

module.exports = async function handler(req, res) {
  applyCors(res, 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const resource = req.query.r;

  // ── ENDPOINTS PÚBLICOS (sin auth) ──────────────────────────────────────────
  if (req.method === 'GET') {
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    if (resource === 'etapas') {
      const { data, error } = await sb.from('etapas_config').select('*').order('orden').order('created_at');
      if (error) return res.status(500).json({ error: 'Error al obtener etapas.' });
      return res.json({ etapas: data || [] });
    }

    if (resource === 'gantt_publico') {
      const clienteQ = (req.query.cliente || '').trim();
      if (!clienteQ) return res.json({ proyecto: null, tareas: [] });
      const { data: proyectos } = await sb
        .from('gantt_proyectos').select('*')
        .ilike('nombre', `%${clienteQ}%`).limit(1);
      if (!proyectos?.length) return res.json({ proyecto: null, tareas: [] });
      const proy = proyectos[0];
      const { data: tareas } = await sb
        .from('gantt_tareas').select('*')
        .eq('proyecto_id', proy.id).order('orden');
      return res.json({ proyecto: proy, tareas: tareas || [] });
    }
  }

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado.' });

  const supabase         = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { nivel, sub: userId } = payload;
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
      // Usar la vista unificada para obtener todos los materiales de todas las categorías
      const { data, error } = await supabase.from('vista_articulos_completo').select('*').order('nombre');
      if (error) {
        // Fallback a la tabla original si la vista no existe aún
        const { data: dataOrig, error: errorOrig } = await supabase.from('articulos_catalogo').select('*').order('nombre');
        if (errorOrig) return res.status(500).json({ error: 'Error al obtener artículos.' });
        return res.json({ articulos: dataOrig || [] });
      }
      return res.json({ articulos: data || [] });
    }
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    if (req.method === 'POST') {
      const { nombre, precio, unidad, categoria, codigo, tabla_origen } = req.body;
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
      
      // Decidir en qué tabla insertar
      const targetTable = tabla_origen || 'articulos_catalogo';
      const insertData = { 
        precio: Number(precio) || 0, 
        unidad: unidad?.trim() || 'pza'
      };

      if (targetTable === 'articulos_catalogo') {
        insertData.nombre = nombre.trim();
      } else {
        insertData.descripcion = nombre.trim();
        insertData.codigo = codigo?.trim() || null;
        if (categoria) insertData.categoria = categoria;
      }

      const { data, error } = await supabase.from(targetTable)
        .insert([insertData])
        .select().single();
      
      if (error) return res.status(500).json({ error: 'Error al crear artículo.' });
      return res.status(201).json({ articulo: data });
    }
    if (req.method === 'PUT' && id) {
      const { nombre, precio, unidad, tabla_origen, codigo, categoria } = req.body;
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });

      const targetTable = tabla_origen || 'articulos_catalogo';
      const updateData = { 
        precio: Number(precio) || 0, 
        unidad: unidad?.trim() || 'pza'
      };

      if (targetTable === 'articulos_catalogo') {
        updateData.nombre = nombre.trim();
      } else {
        updateData.descripcion = nombre.trim();
        updateData.codigo = codigo?.trim() || null;
        if (categoria) updateData.categoria = categoria;
      }

      const { data, error } = await supabase.from(targetTable)
        .update(updateData)
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar artículo.' });
      return res.json({ articulo: data });
    }
    if (req.method === 'DELETE' && id) {
      const tabla_origen = req.query.tabla || 'articulos_catalogo';
      const { error } = await supabase.from(tabla_origen).delete().eq('id', id);
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

  // ── REPORTES DE PUESTA A TIERRA ────────────────────────────────────────────
  if (resource === 'reportes_puesta_tierra') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('reportes_puesta_tierra')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: 'Error al obtener reportes de puesta a tierra.' });
      return res.json({ reportes: data || [] });
    }

    if (req.method === 'POST') {
      if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const fields = req.body;
      const { data, error } = await supabase.from('reportes_puesta_tierra')
        .insert([{
          usuario_id: userId,
          lugar_fecha: fields.lugar_fecha || null,
          empresa_cliente: fields.empresa_cliente || null,
          ubicacion_sitio: fields.ubicacion_sitio || null,
          fecha_medicion: fields.fecha_medicion || null,
          hora_ejecucion: fields.hora_ejecucion || null,
          tecnico_responsable: fields.tecnico_responsable || null,
          tipo_sistema: fields.tipo_sistema || null,
          uso_sistema: fields.uso_sistema || null,
          estado_clima: fields.estado_clima || null,
          humedad_suelo: fields.humedad_suelo || null,
          tipo_terreno: fields.tipo_terreno || null,
          instrumento_marca_modelo: fields.instrumento_marca_modelo || null,
          instrumento_serie: fields.instrumento_serie || null,
          instrumento_calibracion: fields.instrumento_calibracion || null,
          instrumento_metodo: fields.instrumento_metodo || null,
          distancia_z: fields.distancia_z || null,
          dist_52_y: fields.dist_52_y || null,
          res_52: fields.res_52 || null,
          dist_62_y: fields.dist_62_y || null,
          res_62: fields.res_62 || null,
          dist_72_y: fields.dist_72_y || null,
          res_72: fields.res_72 || null,
          resistencia_final_registrada: fields.resistencia_final_registrada || null,
          variacion_terreno: fields.variacion_terreno || null,
          terreno_estado: fields.terreno_estado || null,
          limite_solicitado: fields.limite_solicitado || null,
          conformidad_final: fields.conformidad_final || null,
          observaciones: fields.observaciones || null,
          nombre_firma_tecnico: fields.nombre_firma_tecnico || 'ING. JUAN ERASMO CUAYA GRANADOS',
          nombre_firma_aprobador: fields.nombre_firma_aprobador || 'Representante de la Empresa / Cliente'
        }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear reporte de puesta a tierra.' });
      return res.status(201).json({ reporte: data });
    }

    if (req.method === 'PUT' && id) {
      if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const fields = req.body;
      const update = {
        updated_at: new Date().toISOString()
      };
      [
        'lugar_fecha', 'empresa_cliente', 'ubicacion_sitio', 'fecha_medicion', 'hora_ejecucion',
        'tecnico_responsable', 'tipo_sistema', 'uso_sistema', 'estado_clima', 'humedad_suelo',
        'tipo_terreno', 'instrumento_marca_modelo', 'instrumento_serie', 'instrumento_calibracion',
        'instrumento_metodo', 'distancia_z', 'dist_52_y', 'res_52', 'dist_62_y', 'res_62',
        'dist_72_y', 'res_72', 'resistencia_final_registrada', 'variacion_terreno', 'terreno_estado',
        'limite_solicitado', 'conformidad_final', 'observaciones', 'nombre_firma_tecnico', 'nombre_firma_aprobador'
      ].forEach(k => { if (fields[k] !== undefined) update[k] = fields[k]; });

      const { data, error } = await supabase.from('reportes_puesta_tierra')
        .update(update).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar reporte de puesta a tierra.' });
      return res.json({ reporte: data });
    }

    if (req.method === 'DELETE' && id) {
      if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });
      const { error } = await supabase.from('reportes_puesta_tierra').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar reporte de puesta a tierra.' });
      return res.json({ message: 'Reporte de puesta a tierra eliminado.' });
    }
  }

  // ── GANTT PROYECTOS ────────────────────────────────────────────────────────
  if (resource === 'gantt-proyectos') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('gantt_proyectos').select('*').order('created_at');
      if (error) return res.status(500).json({ error: 'Error al obtener proyectos.' });
      return res.json({ proyectos: data || [] });
    }
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    if (req.method === 'POST') {
      const { nombre, descripcion, color } = req.body;
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
      const { data, error } = await supabase.from('gantt_proyectos')
        .insert([{ nombre: nombre.trim(), descripcion: descripcion?.trim() || '', color: color || '#3b82f6' }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear proyecto.' });
      return res.status(201).json({ proyecto: data });
    }
    if (req.method === 'PUT' && id) {
      const { nombre, descripcion, color } = req.body;
      const { data, error } = await supabase.from('gantt_proyectos')
        .update({ nombre: nombre?.trim(), descripcion: descripcion?.trim() || '', color: color || '#3b82f6' })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar proyecto.' });
      return res.json({ proyecto: data });
    }
    if (req.method === 'DELETE' && id) {
      const { error } = await supabase.from('gantt_proyectos').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar proyecto.' });
      return res.json({ message: 'Proyecto eliminado.' });
    }
  }

  // ── GANTT TAREAS ───────────────────────────────────────────────────────────
  if (resource === 'gantt-tareas') {
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    if (req.method === 'GET') {
      const proyectoId = req.query.proyecto_id;
      let q = supabase.from('gantt_tareas').select('*').order('orden').order('created_at');
      if (proyectoId) q = q.eq('proyecto_id', proyectoId);
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: 'Error al obtener tareas.' });
      return res.json({ tareas: data || [] });
    }
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    if (req.method === 'POST') {
      const { proyecto_id, nombre, responsable, fecha_inicio, fecha_fin, porcentaje, color, orden, descripcion, prioridad, area } = req.body;
      if (!nombre?.trim() || !proyecto_id || !fecha_inicio || !fecha_fin)
        return res.status(400).json({ error: 'nombre, proyecto_id, fecha_inicio y fecha_fin son requeridos.' });
      const { data, error } = await supabase.from('gantt_tareas')
        .insert([{ proyecto_id, nombre: nombre.trim(), responsable: responsable?.trim() || '', fecha_inicio, fecha_fin, porcentaje: Number(porcentaje) || 0, color: color || '#3b82f6', orden: Number(orden) || 0, descripcion: descripcion?.trim() || '', prioridad: prioridad || 'media', area: area?.trim() || '' }])
        .select().single();
      if (error) return res.status(500).json({ error: 'Error al crear tarea.' });
      return res.status(201).json({ tarea: data });
    }
    if (req.method === 'PUT' && id) {
      const { nombre, responsable, fecha_inicio, fecha_fin, porcentaje, color, orden, descripcion, prioridad, area } = req.body;
      const { data, error } = await supabase.from('gantt_tareas')
        .update({ nombre: nombre?.trim(), responsable: responsable?.trim() || '', fecha_inicio, fecha_fin, porcentaje: Number(porcentaje) || 0, color: color || '#3b82f6', orden: Number(orden) || 0, descripcion: descripcion?.trim() || '', prioridad: prioridad || 'media', area: area?.trim() || '' })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar tarea.' });
      return res.json({ tarea: data });
    }
    if (req.method === 'DELETE' && id) {
      const { error } = await supabase.from('gantt_tareas').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar tarea.' });
      return res.json({ message: 'Tarea eliminada.' });
    }
  }

  // ── ETAPAS (CRUD admin) ────────────────────────────────────────────────────
  if (resource === 'etapas') {
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere admin.' });

    if (req.method === 'POST') {
      const { value, label, color, bg, icon_name, orden } = req.body;
      if (!value?.trim() || !label?.trim()) return res.status(400).json({ error: 'value y label son requeridos.' });
      const { data, error } = await supabase.from('etapas_config')
        .insert([{ value: value.trim(), label: label.trim(), color: color || '#94a3b8', bg: bg || '#f1f5f9', icon_name: icon_name || 'Clock', orden: Number(orden) || 0 }])
        .select().single();
      if (error) return res.status(500).json({ error: error.code === '23505' ? 'Ya existe una etapa con ese identificador.' : 'Error al crear etapa.' });
      return res.status(201).json({ etapa: data });
    }

    if (req.method === 'PUT' && id) {
      const { label, color, bg, icon_name, orden } = req.body;
      if (!label?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });
      const { data, error } = await supabase.from('etapas_config')
        .update({ label: label.trim(), color: color || '#94a3b8', bg: bg || '#f1f5f9', icon_name: icon_name || 'Clock', orden: Number(orden) || 0 })
        .eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Error al actualizar etapa.' });
      return res.json({ etapa: data });
    }

    if (req.method === 'DELETE' && id) {
      const { data: etapa } = await supabase.from('etapas_config').select('value').eq('id', id).single();
      if (etapa) {
        const { count } = await supabase.from('trabajos').select('id', { count: 'exact', head: true }).eq('etapa_actual', etapa.value);
        if (count > 0) return res.status(409).json({ error: `No se puede eliminar: ${count} trabajo(s) están en esta etapa.` });
      }
      const { error } = await supabase.from('etapas_config').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al eliminar etapa.' });
      return res.json({ message: 'Etapa eliminada.' });
    }
  }

  return res.status(404).json({ error: 'Ruta no encontrada.' });
};
