-- ─────────────────────────────────────────────────────────────────────────────
-- ECG Corporativo — Script Supabase: Nuevas Tablas de Materiales
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla para TUBOS / TUBERÍA
CREATE TABLE IF NOT EXISTS tubos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20) DEFAULT 'pza',
  medidas_pulgadas VARCHAR(50),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Tubos',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla para CONECTORES Y COPLES
CREATE TABLE IF NOT EXISTS conectores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20) DEFAULT 'pza',
  medidas_pulgadas VARCHAR(50),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Conectores',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla para ABRAZADERAS
CREATE TABLE IF NOT EXISTS abrazaderas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20) DEFAULT 'pza',
  medidas_pulgadas VARCHAR(50),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Abrazaderas',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla para CABLES
CREATE TABLE IF NOT EXISTS cables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20) DEFAULT 'm',
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Cables',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabla para INTERRUPTORES Y CENTROS DE CARGA
CREATE TABLE IF NOT EXISTS interruptores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20) DEFAULT 'pza',
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Interruptores',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabla para ILUMINACIÓN
CREATE TABLE IF NOT EXISTS iluminacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20) DEFAULT 'pza',
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Iluminación',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabla para ACCESORIOS VARIOS
CREATE TABLE IF NOT EXISTS accesorios_varios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20) DEFAULT 'pza',
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Accesorios',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- VISTA UNIFICADA PARA BUSCADOR
-- Esta vista permite buscar en todos los materiales como si fuera una sola tabla
CREATE OR REPLACE VIEW vista_articulos_completo AS
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, medidas_pulgadas, 'tubos' as tabla_origen FROM tubos
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, medidas_pulgadas, 'conectores' as tabla_origen FROM conectores
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, medidas_pulgadas, 'abrazaderas' as tabla_origen FROM abrazaderas
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas_pulgadas, 'cables' as tabla_origen FROM cables
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas_pulgadas, 'interruptores' as tabla_origen FROM interruptores
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas_pulgadas, 'iluminacion' as tabla_origen FROM iluminacion
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas_pulgadas, 'accesorios_varios' as tabla_origen FROM accesorios_varios
  UNION ALL
  SELECT id, NULL as codigo, nombre, unidad, precio, 'Otros' as categoria, NULL as medidas_pulgadas, 'articulos_catalogo' as tabla_origen FROM articulos_catalogo;

-- Habilitar RLS en las nuevas tablas (opcional, dependiendo de tu configuración)
-- ALTER TABLE tubos ENABLE ROW LEVEL SECURITY;
-- ... repetir para las demás ...
