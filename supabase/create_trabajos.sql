-- ─────────────────────────────────────────────────────────────────────────────
-- Sistema de seguimiento de trabajos ECG
-- Ejecutar en: Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tabla principal de trabajos
CREATE TABLE IF NOT EXISTS trabajos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        TEXT UNIQUE NOT NULL,          -- ECG-XXXXXX (código público)
  cotizacion_id TEXT,                          -- referencia a la cotización
  folio         TEXT DEFAULT '',               -- folio de la cotización
  cliente       TEXT NOT NULL,                 -- nombre del cliente
  descripcion   TEXT DEFAULT '',               -- descripción del trabajo
  etapa_actual  TEXT DEFAULT 'recibido'
                  CHECK (etapa_actual IN (
                    'recibido','armado','pintura',
                    'instalacion','detallado','completado'
                  )),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Historial de actualizaciones por etapa
CREATE TABLE IF NOT EXISTS trabajo_actualizaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajo_id      UUID NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
  etapa           TEXT NOT NULL,               -- etapa a la que se movió
  descripcion     TEXT DEFAULT '',             -- qué se hizo
  inconveniente   TEXT DEFAULT '',             -- problema o atraso (opcional)
  usuario_nombre  TEXT DEFAULT '',             -- quién actualizó
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_trabajos_codigo       ON trabajos(codigo);
CREATE INDEX IF NOT EXISTS idx_trabajos_cotizacion   ON trabajos(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_actualizaciones_trab  ON trabajo_actualizaciones(trabajo_id);

-- 4. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trabajos_updated_at ON trabajos;
CREATE TRIGGER trg_trabajos_updated_at
  BEFORE UPDATE ON trabajos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Verificación final
SELECT 'Tabla trabajos creada' AS status, COUNT(*) AS filas FROM trabajos
UNION ALL
SELECT 'Tabla trabajo_actualizaciones creada', COUNT(*) FROM trabajo_actualizaciones;
