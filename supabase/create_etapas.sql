-- Tabla de configuración de etapas personalizables
-- Ejecutar en: Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS etapas_config (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value      TEXT UNIQUE NOT NULL,
  label      TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#94a3b8',
  bg         TEXT NOT NULL DEFAULT '#f1f5f9',
  icon_name  TEXT NOT NULL DEFAULT 'Clock',
  orden      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Etapas por defecto (mismas que el sistema anterior)
INSERT INTO etapas_config (value, label, color, bg, icon_name, orden) VALUES
  ('recibido',    'Recibido',    '#94a3b8', '#f1f5f9', 'Clock',        0),
  ('armado',      'Armado',      '#3b82f6', '#eff6ff', 'Hammer',       1),
  ('pintura',     'Pintura',     '#f59e0b', '#fffbeb', 'Paintbrush',   2),
  ('instalacion', 'Instalación', '#f97316', '#fff7ed', 'Wrench',       3),
  ('detallado',   'Detallado',   '#8b5cf6', '#f5f3ff', 'Sparkles',     4),
  ('completado',  'Completado',  '#10b981', '#f0fdf4', 'CheckCircle2', 5)
ON CONFLICT (value) DO NOTHING;

-- Eliminar CHECK constraint para permitir etapas personalizadas
ALTER TABLE trabajos DROP CONSTRAINT IF EXISTS trabajos_etapa_actual_check;

-- Verificación
SELECT label, color, icon_name, orden FROM etapas_config ORDER BY orden;
