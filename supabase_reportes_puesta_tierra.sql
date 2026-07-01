-- ─────────────────────────────────────────────────────────────────────────────
-- ECG Corporativo — Script Supabase: Reportes de Puesta a Tierra (REG-ELC-01)
-- Ejecutar en: Supabase → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reportes_puesta_tierra (
  id                          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id                  INTEGER       NOT NULL,
  lugar_fecha                 TEXT,
  empresa_cliente             TEXT,
  ubicacion_sitio             TEXT,
  fecha_medicion              TEXT,
  hora_ejecucion              TEXT,
  tecnico_responsable         TEXT,
  tipo_sistema                TEXT,
  uso_sistema                 TEXT,
  estado_clima                TEXT,
  humedad_suelo               TEXT,
  tipo_terreno                TEXT,
  instrumento_marca_modelo    TEXT,
  instrumento_serie           TEXT,
  instrumento_calibracion     TEXT,
  instrumento_metodo          TEXT,
  distancia_z                 TEXT,
  dist_52_y                   TEXT,
  res_52                      TEXT,
  dist_62_y                   TEXT,
  res_62                      TEXT,
  dist_72_y                   TEXT,
  res_72                      TEXT,
  resistencia_final_registrada TEXT,
  variacion_terreno           TEXT,
  terreno_estado              TEXT,
  limite_solicitado           TEXT,
  conformidad_final           TEXT,
  observaciones               TEXT,
  nombre_firma_tecnico        TEXT          DEFAULT 'ING. JUAN ERASMO CUAYA GRANADOS',
  nombre_firma_aprobador      TEXT          DEFAULT 'Representante de la Empresa / Cliente',
  created_at                  TIMESTAMPTZ   DEFAULT now(),
  updated_at                  TIMESTAMPTZ   DEFAULT now()
);

-- Índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS reportes_puesta_tierra_usuario_id_idx ON reportes_puesta_tierra(usuario_id);
CREATE INDEX IF NOT EXISTS reportes_puesta_tierra_created_at_idx ON reportes_puesta_tierra(created_at DESC);
