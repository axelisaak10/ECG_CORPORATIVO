-- ─────────────────────────────────────────────────────────────────────────────
-- Diagramas de Gantt para ECG Corporativo
-- Ejecutar en: Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gantt_proyectos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  color       TEXT DEFAULT '#3b82f6',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gantt_tareas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id  UUID NOT NULL REFERENCES gantt_proyectos(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  responsable  TEXT DEFAULT '',
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,
  porcentaje   SMALLINT DEFAULT 0 CHECK (porcentaje BETWEEN 0 AND 100),
  color        TEXT DEFAULT '#3b82f6',
  orden        INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gantt_tareas_proyecto ON gantt_tareas(proyecto_id);

SELECT 'gantt_proyectos OK' AS status, COUNT(*) AS filas FROM gantt_proyectos
UNION ALL
SELECT 'gantt_tareas OK', COUNT(*) FROM gantt_tareas;
