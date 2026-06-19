-- ─────────────────────────────────────────────────────────────────────────────
-- ECG Corporativo — Script Supabase: Anuncios / Pop-ups
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Tabla principal de anuncios ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anuncios (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contenido del anuncio
  titulo        TEXT          NOT NULL,
  subtitulo     TEXT          DEFAULT '',
  cuerpo        TEXT          NOT NULL,
  tipo          TEXT          NOT NULL DEFAULT 'aviso'
                              CHECK (tipo IN ('oferta','novedad','evento','aviso','promocion')),
  icono         TEXT          DEFAULT 'Bell'
                              CHECK (icono IN ('Tag','Zap','Gift','Bell','Sparkles')),
  badge         TEXT          DEFAULT '',

  -- Destino donde aparece el pop-up
  -- 'portal' = menú principal, 'empresa_1' | 'empresa_2' | 'empresa_3' = empresa específica
  destino       TEXT          NOT NULL DEFAULT 'portal'
                              CHECK (destino IN ('portal','empresa_1','empresa_2','empresa_3')),

  -- Botón de acción (opcional)
  cta_texto     TEXT          DEFAULT '',
  cta_link      TEXT          DEFAULT '',

  -- Imagen del anuncio (opcional, URL)
  imagen_url    TEXT          DEFAULT '',
  solo_imagen   BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Vigencia
  fecha_fin     DATE          DEFAULT NULL,  -- NULL = sin vencimiento

  -- Estado
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,

  -- Auditoría
  creado_por    TEXT          NOT NULL DEFAULT '',   -- nombre del usuario
  usuario_id    INTEGER,                             -- ID del usuario que lo creó
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── 2. Índices para búsquedas frecuentes ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_anuncios_activo   ON anuncios(activo);
CREATE INDEX IF NOT EXISTS idx_anuncios_destino  ON anuncios(destino);
CREATE INDEX IF NOT EXISTS idx_anuncios_fecha    ON anuncios(fecha_fin);

-- ── 3. Trigger updated_at automático ─────────────────────────────────────────
-- Reutiliza la función set_updated_at si ya existe, o la crea
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_anuncios_updated_at ON anuncios;
CREATE TRIGGER trg_anuncios_updated_at
  BEFORE UPDATE ON anuncios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 4. Row-Level Security (RLS) ───────────────────────────────────────────────
-- Los anuncios se leen desde el servidor (service key), no directamente desde el cliente.
-- Activamos RLS para mayor seguridad, pero la API usa service key que ignora RLS.
ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;

-- Política: Lectura pública de anuncios ACTIVOS y vigentes (para el pop-up del portal)
-- Solo el servidor con service key accederá, pero por si acaso definimos la política.
DROP POLICY IF EXISTS anuncios_read_active ON anuncios;
CREATE POLICY anuncios_read_active ON anuncios
  FOR SELECT
  USING (
    activo = TRUE
    AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
  );

-- ── 5. Datos de ejemplo (opcionales — borra este bloque si no quieres seed) ──
-- INSERT INTO anuncios (titulo, subtitulo, cuerpo, tipo, icono, badge, destino, cta_texto, fecha_fin, creado_por)
-- VALUES
--   ('¡Bienvenido al Portal ECG!', 'Explora nuestras empresas', 'Conoce todos los servicios de ECG Corporativo: ingeniería, gestoría y dictaminación.', 'novedad', 'Sparkles', '¡NUEVO!', 'portal', 'Explorar', NULL, 'Sistema'),
--   ('Diagnóstico Eléctrico Gratuito', 'Centro de Ingeniería ECG', 'Solicita tu diagnóstico sin costo para proyectos industriales este mes.', 'oferta', 'Zap', '¡GRATIS!', 'empresa_1', 'Solicitar', '2026-07-31', 'Admin');

-- ── 6. Verificación ───────────────────────────────────────────────────────────
SELECT
  'Tabla anuncios creada ✓' AS status,
  COUNT(*)                  AS filas
FROM anuncios;
