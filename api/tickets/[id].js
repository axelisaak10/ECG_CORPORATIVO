const { createClient } = require('@supabase/supabase-js');

async function getUserNivel(supabase, userId) {
  const { data } = await supabase
    .from('Usuarios')
    .select('nivel')
    .eq('id', userId)
    .maybeSingle();
  return data?.nivel ?? -1;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { id } = req.query;

  // ── PATCH /api/tickets/:id — actualizar ────────────────────────────────────
  // Admin (nivel 1): solo puede cambiar `estado`
  // Superadmin (nivel 2): puede cambiar cualquier campo
  if (req.method === 'PATCH') {
    const { userId, ...fields } = req.body;
    if (!userId) return res.status(401).json({ error: 'userId requerido.' });

    const nivel = await getUserNivel(supabase, userId);
    if (nivel < 1) return res.status(403).json({ error: 'Sin permiso.' });

    let updateData = {};

    if (nivel >= 2) {
      // Superadmin: actualiza cualquier campo enviado
      if (fields.titulo      !== undefined) updateData.titulo      = fields.titulo;
      if (fields.descripcion !== undefined) updateData.descripcion = fields.descripcion;
      if (fields.prioridad   !== undefined) updateData.prioridad   = fields.prioridad;
      if (fields.estado      !== undefined) updateData.estado      = fields.estado;
      if (fields.grupo       !== undefined) updateData.grupo       = fields.grupo;
      if (fields.asignado_a  !== undefined) updateData.asignado_a  = fields.asignado_a || null;
      if (fields.fecha_limite !== undefined) updateData.fecha_limite = fields.fecha_limite || null;
    } else {
      // Admin: solo estado
      if (fields.estado === undefined)
        return res.status(403).json({ error: 'Admin solo puede cambiar el estado del ticket.' });
      updateData.estado = fields.estado;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Error al actualizar ticket.' });
    return res.json({ ticket: data });
  }

  // ── DELETE /api/tickets/:id — eliminar (nivel >= 2) ────────────────────────
  if (req.method === 'DELETE') {
    const userId = req.body?.userId;
    if (!userId) return res.status(401).json({ error: 'userId requerido.' });

    const nivel = await getUserNivel(supabase, userId);
    if (nivel < 2) return res.status(403).json({ error: 'Se requiere superadmin para eliminar tickets.' });

    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al eliminar ticket.' });
    return res.json({ message: 'Ticket eliminado.' });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
};
