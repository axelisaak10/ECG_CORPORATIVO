-- Agregar campos a gantt_tareas (ejecutar en Supabase → SQL Editor)
ALTER TABLE gantt_tareas
  ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prioridad   TEXT DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS area        TEXT DEFAULT '';
