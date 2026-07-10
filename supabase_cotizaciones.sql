-- ─────────────────────────────────────────────────────────────────────────────
-- ECG Corporativo — Script Supabase: Cotizaciones
-- Ejecutar en: Supabase → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT          NOT NULL,
  empresa    TEXT,
  correo     TEXT,
  telefono   TEXT,
  created_at TIMESTAMPTZ   DEFAULT now()
);

-- Catálogo de artículos
CREATE TABLE IF NOT EXISTS articulos_catalogo (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       TEXT,
  nombre       TEXT          NOT NULL,
  precio       NUMERIC(12,2) NOT NULL DEFAULT 0,
  unidad       TEXT          DEFAULT 'pza',
  tabla_origen TEXT          DEFAULT 'articulos_catalogo',
  created_at   TIMESTAMPTZ   DEFAULT now()
);

-- Agregar columnas si la tabla ya existe (migraciones seguras)
ALTER TABLE articulos_catalogo ADD COLUMN IF NOT EXISTS codigo       TEXT;
ALTER TABLE articulos_catalogo ADD COLUMN IF NOT EXISTS tabla_origen TEXT DEFAULT 'articulos_catalogo';

-- Catálogo Obra Civil
CREATE TABLE IF NOT EXISTS obra_civil (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       TEXT,
  nombre       TEXT          NOT NULL,
  precio       NUMERIC(12,2) NOT NULL DEFAULT 0,
  unidad       TEXT          DEFAULT 'pza',
  tabla_origen TEXT          DEFAULT 'obra_civil',
  created_at   TIMESTAMPTZ   DEFAULT now()
);

-- Catálogo de herramientas
CREATE TABLE IF NOT EXISTS herramientas_catalogo (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              TEXT          NOT NULL,
  precio_renta_diaria NUMERIC(12,2) NOT NULL DEFAULT 0,
  unidad              TEXT          DEFAULT 'pza',
  created_at          TIMESTAMPTZ   DEFAULT now()
);

-- Si ya existe la tabla sin la columna unidad, agrégala:
ALTER TABLE herramientas_catalogo ADD COLUMN IF NOT EXISTS unidad TEXT DEFAULT 'pza';

-- Cotizaciones (items guardados como JSONB para preservar precios históricos)
CREATE TABLE IF NOT EXISTS cotizaciones (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   UUID          REFERENCES clientes(id) ON DELETE SET NULL,
  usuario_id   INTEGER       NOT NULL,
  descripcion  TEXT,
  estado       TEXT          DEFAULT 'pendiente'
                             CHECK (estado IN ('pendiente','aprobada','rechazada')),
  articulos    JSONB         DEFAULT '[]',
  herramientas JSONB         DEFAULT '[]',
  empleados    JSONB         DEFAULT '[]',
  horas        NUMERIC       DEFAULT 0,
  dias         NUMERIC       DEFAULT 0,
  semanas      NUMERIC       DEFAULT 0,
  meses        NUMERIC       DEFAULT 0,
  totales      JSONB,
  total        NUMERIC(12,2) DEFAULT 0,
  created_at   TIMESTAMPTZ   DEFAULT now(),
  updated_at   TIMESTAMPTZ   DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS cotizaciones_cliente_id_idx ON cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS cotizaciones_usuario_id_idx ON cotizaciones(usuario_id);
CREATE INDEX IF NOT EXISTS cotizaciones_estado_idx     ON cotizaciones(estado);
