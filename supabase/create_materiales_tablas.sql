-- ─────────────────────────────────────────────────────────────────────────────
-- ECG Corporativo — Script Supabase: Schema Completo de Materiales
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper para evitar repetición de columnas comunes
-- id, codigo, descripcion, unidad, cantidad, precio, categoria, created_at

-- 1. TUBOS
CREATE TABLE IF NOT EXISTS tubos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  medidas_en_pulgadas VARCHAR(50),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Tubos',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CONECTORES
CREATE TABLE IF NOT EXISTS conectores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  medidas_en_pulgadas VARCHAR(50),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Conectores',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COPLES
CREATE TABLE IF NOT EXISTS coples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  medidas_en_pulgadas VARCHAR(50),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Coples',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ABRAZADERAS
CREATE TABLE IF NOT EXISTS abrazaderas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  medidas_en_pulgadas VARCHAR(50),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Abrazaderas',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CABLES
CREATE TABLE IF NOT EXISTS cables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Cables',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ILUMINACIÓN
CREATE TABLE IF NOT EXISTS iluminacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Iluminación',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CAJAS Y REGISTROS
CREATE TABLE IF NOT EXISTS cajas_registros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Cajas y Registros',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. FONTANERÍA Y VÁLVULAS
CREATE TABLE IF NOT EXISTS fontaneria_y_valvulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Fontanería',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CAJAS Y TABLEROS (Centros de carga, interruptores)
CREATE TABLE IF NOT EXISTS cajas_y_tableros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Cajas y Tableros',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. SISTEMAS TIERRA Y PROTECCIONES
CREATE TABLE IF NOT EXISTS sistemas_tierra_y_protecciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Sistemas Tierra',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. HERRAMIENTAS Y ESTRUCTURAS
CREATE TABLE IF NOT EXISTS herramientas_y_estructuras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  descripcion TEXT NOT NULL,
  unidad VARCHAR(20),
  cantidad NUMERIC DEFAULT 0,
  precio NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'Herramientas y Estructuras',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- VISTA UNIFICADA ACTUALIZADA
CREATE OR REPLACE VIEW vista_articulos_completo AS
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, medidas_en_pulgadas as medidas, 'tubos' as tabla_origen FROM tubos
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, medidas_en_pulgadas as medidas, 'conectores' as tabla_origen FROM conectores
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, medidas_en_pulgadas as medidas, 'coples' as tabla_origen FROM coples
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, medidas_en_pulgadas as medidas, 'abrazaderas' as tabla_origen FROM abrazaderas
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas, 'cables' as tabla_origen FROM cables
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas, 'iluminacion' as tabla_origen FROM iluminacion
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas, 'cajas_registros' as tabla_origen FROM cajas_registros
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas, 'fontaneria_y_valvulas' as tabla_origen FROM fontaneria_y_valvulas
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas, 'cajas_y_tableros' as tabla_origen FROM cajas_y_tableros
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas, 'sistemas_tierra_y_protecciones' as tabla_origen FROM sistemas_tierra_y_protecciones
  UNION ALL
  SELECT id, codigo, descripcion as nombre, unidad, precio, categoria, NULL as medidas, 'herramientas_y_estructuras' as tabla_origen FROM herramientas_y_estructuras
  UNION ALL
  SELECT id, NULL as codigo, nombre, unidad, precio, 'Otros' as categoria, NULL as medidas, 'articulos_catalogo' as tabla_origen FROM articulos_catalogo;
