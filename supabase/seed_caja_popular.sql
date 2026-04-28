-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Caja Popular San Jose Iturbide
-- Cronograma de Actividades — El Marques, Qro — 07 Abril 2026
-- Ejecutar en: Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 0. Asegurar columnas opcionales de gantt_tareas ──────────────────────────
ALTER TABLE gantt_tareas ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '';
ALTER TABLE gantt_tareas ADD COLUMN IF NOT EXISTS prioridad   TEXT DEFAULT 'media';
ALTER TABLE gantt_tareas ADD COLUMN IF NOT EXISTS area        TEXT DEFAULT '';

-- ── 1. Etapas de trabajo para proyectos de construcción ──────────────────────
-- Reemplaza las etapas genéricas por fases propias de obra/instalación
DELETE FROM etapas_config;
INSERT INTO etapas_config (value, label, color, bg, icon_name, orden) VALUES
  ('demolicion',      'Demolición',           '#ef4444', '#fef2f2', 'Hammer',       0),
  ('obra_civil',      'Obra Civil',            '#f97316', '#fff7ed', 'Wrench',       1),
  ('herreria',        'Herrería',              '#f59e0b', '#fffbeb', 'Settings',     2),
  ('electrico',       'Eléctrico',             '#3b82f6', '#eff6ff', 'Zap',          3),
  ('canceleria',      'Cancelería / Granito',  '#8b5cf6', '#f5f3ff', 'Package',      4),
  ('equipos',         'Equipos y A/C',         '#06b6d4', '#ecfeff', 'Shield',       5),
  ('acabados',        'Acabados',              '#ec4899', '#fdf2f8', 'Paintbrush',   6),
  ('pruebas_entrega', 'Pruebas y Entrega',     '#10b981', '#f0fdf4', 'CheckCircle2', 7);

-- ── 2. Cliente ────────────────────────────────────────────────────────────────
INSERT INTO clientes (id, nombre, empresa, correo, telefono)
VALUES (
  gen_random_uuid(),
  'Lic. Vianey Trejo Estrada',
  'Caja Popular San Jose Iturbide',
  'cajapopular@sjiturbide.com',
  '442 773 4562'
) ON CONFLICT DO NOTHING;

-- ── 3. Cotización COT-0001 ────────────────────────────────────────────────────
-- Datos aproximados basados en el cronograma (6 semanas de obra)
WITH cliente AS (
  SELECT id FROM clientes WHERE empresa = 'Caja Popular San Jose Iturbide' LIMIT 1
),
admin AS (
  SELECT id FROM "Usuarios" WHERE nivel >= 2 LIMIT 1
)
INSERT INTO cotizaciones (
  id, folio, cliente_id, usuario_id, descripcion, estado,
  articulos, herramientas, empleados,
  horas, dias, semanas, meses,
  totales, total, created_at
)
SELECT
  gen_random_uuid(),
  'COT-0001',
  (SELECT id FROM cliente),
  (SELECT id FROM admin),
  'Remodelación e instalaciones en sucursal El Marques, Qro. '
  'Incluye: demolición, muros y plafón, herrería (rejas y ménsulas), '
  'instalaciones eléctricas, cancelería, barra de granito, aires '
  'acondicionados, controles de acceso y letrero luminoso.',
  'aprobada',
  -- Artículos
  '[
    {"nombre": "Pintura vinílica (galón)",          "precio": 750,   "cantidad": 20},
    {"nombre": "Material eléctrico (tablero+cable)", "precio": 45000, "cantidad": 1},
    {"nombre": "Granito para barra (m²)",            "precio": 2800,  "cantidad": 8},
    {"nombre": "Control de acceso (equipo)",         "precio": 8500,  "cantidad": 4},
    {"nombre": "Letrero acrílico luminoso",          "precio": 20000, "cantidad": 1},
    {"nombre": "Perfil metálico para rejas (kg)",    "precio": 35,    "cantidad": 600},
    {"nombre": "Minisplit 1.5 Ton",                  "precio": 12500, "cantidad": 4}
  ]'::jsonb,
  -- Herramientas
  '[
    {"nombre": "Andamio tubular",       "precio_renta_diaria": 400, "cantidad": 2, "unidad": "pza"},
    {"nombre": "Cortadora de disco",    "precio_renta_diaria": 350, "cantidad": 1, "unidad": "pza"},
    {"nombre": "Compresor de aire",     "precio_renta_diaria": 250, "cantidad": 1, "unidad": "pza"},
    {"nombre": "Taladro percutor",      "precio_renta_diaria": 150, "cantidad": 2, "unidad": "pza"},
    {"nombre": "Soldadora MIG",         "precio_renta_diaria": 500, "cantidad": 1, "unidad": "pza"}
  ]'::jsonb,
  -- Empleados asignados
  '[
    {"id": 1, "nombre": "Responsable de Obra"},
    {"id": 2, "nombre": "Electricista"},
    {"id": 3, "nombre": "Herrero"},
    {"id": 4, "nombre": "Albañil"},
    {"id": 5, "nombre": "Ayudante General"}
  ]'::jsonb,
  0, 42, 6, 0,
  -- Totales desglosados
  '{"articulos": 171000, "herramientas": 55650, "tiempo": 261250}'::jsonb,
  487900,
  '2026-04-07 08:00:00+00'
WHERE (SELECT id FROM cliente) IS NOT NULL
  AND (SELECT id FROM admin)   IS NOT NULL
ON CONFLICT DO NOTHING;

-- ── 4. Trabajo vinculado a la cotización ──────────────────────────────────────
WITH cot AS (
  SELECT id FROM cotizaciones WHERE folio = 'COT-0001' LIMIT 1
)
INSERT INTO trabajos (id, codigo, cotizacion_id, folio, cliente, descripcion, etapa_actual, created_at)
SELECT
  gen_random_uuid(),
  'ECG-CAJAP1',
  (SELECT id::text FROM cot),
  'COT-0001',
  'Caja Popular San Jose Iturbide',
  'Remodelación e instalaciones — El Marques, Qro',
  'demolicion',
  '2026-04-07 08:00:00+00'
WHERE (SELECT id FROM cot) IS NOT NULL
ON CONFLICT (codigo) DO NOTHING;

-- ── 5. Registro inicial del trabajo ──────────────────────────────────────────
WITH t AS (
  SELECT id FROM trabajos WHERE codigo = 'ECG-CAJAP1' LIMIT 1
)
INSERT INTO trabajo_actualizaciones (trabajo_id, etapa, descripcion, usuario_nombre)
SELECT
  id,
  'demolicion',
  'Trabajo creado. Cotización COT-0001 aprobada por Lic. Vianey Trejo Estrada — Caja Popular San Jose Iturbide.',
  'Sistema'
FROM t
WHERE id IS NOT NULL;

-- ── 6. Diagrama de Gantt — Proyecto Caja Popular ──────────────────────────────
-- 20 actividades del cronograma (inicio: 07 Abr 2026 · 6 semanas)
-- Semana 1: 07-11 Abr | S2: 14-18 Abr | S3: 21-25 Abr
-- Semana 4: 28 Abr-02 May | S5: 05-09 May | S6: 12-16 May
WITH proy AS (
  INSERT INTO gantt_proyectos (nombre, descripcion, color)
  VALUES (
    'Caja Popular San Jose Iturbide',
    'Remodelación e instalaciones — El Marques, Qro — Inicio: 07 Abr 2026',
    '#3b82f6'
  )
  RETURNING id
)
INSERT INTO gantt_tareas
  (proyecto_id, nombre, fecha_inicio, fecha_fin, color, porcentaje, orden, prioridad, area, descripcion, responsable)
VALUES
  -- S1 ─────────────────────────────────────────────────────────────────────
  ((SELECT id FROM proy), 'Demoliciones',                        '2026-04-07','2026-04-11','#ef4444', 0, 0,'alta',  'Obra Civil', 'Demolición de elementos a remover: tabiques, muros y elementos varios','Responsable de Obra'),
  ((SELECT id FROM proy), 'Armado de rejas',                     '2026-04-07','2026-04-18','#f59e0b', 0, 3,'media', 'Herrería',   'Corte, soldadura y armado de rejas de seguridad en taller','Herrero'),
  ((SELECT id FROM proy), 'Armado de ménsulas',                  '2026-04-07','2026-04-18','#f97316', 0, 5,'media', 'Herrería',   'Fabricación y ensamble de ménsulas metálicas en taller','Herrero'),
  ((SELECT id FROM proy), 'Compra de material eléctrico',        '2026-04-07','2026-04-25','#3b82f6', 0, 7,'alta',  'Eléctrico',  'Adquisición de tableros, cable, apagadores, contactos y accesorios',''),
  ((SELECT id FROM proy), 'Instalaciones eléctricas',            '2026-04-07','2026-05-02','#1d4ed8', 0, 8,'alta',  'Eléctrico',  'Cableado general, instalación de tableros, puntos de luz y contactos','Electricista'),
  ((SELECT id FROM proy), 'Compra de controles de acceso',       '2026-04-07','2026-04-25','#06b6d4', 0,10,'media', 'Seguridad',  'Adquisición de lectores, controladores y accesorios de control de acceso',''),
  ((SELECT id FROM proy), 'Fabricación de cancelería',           '2026-04-07','2026-04-18','#8b5cf6', 0,12,'media', 'Cancelería', 'Fabricación de piezas de cancelería en aluminio o hierro en taller','Herrero'),
  ((SELECT id FROM proy), 'Fabricación de barra de granito',     '2026-04-07','2026-04-18','#14b8a6', 0,14,'media', 'Obra Civil', 'Corte, pulido y preparación de barra de granito a medida',''),
  ((SELECT id FROM proy), 'Compra de equipos de A/C',            '2026-04-07','2026-04-18','#0891b2', 0,16,'media', 'A/C',        'Adquisición de minisplits y materiales de instalación de A/C',''),
  ((SELECT id FROM proy), 'Fabricación de letrero luminoso',     '2026-04-07','2026-04-18','#6366f1', 0,18,'baja',  'Acabados',   'Fabricación de letrero luminoso y de acrílico en taller de rotulación',''),

  -- S2-S3 ───────────────────────────────────────────────────────────────────
  ((SELECT id FROM proy), 'Remodelación de muros y plafón',      '2026-04-14','2026-05-02','#f97316', 0, 1,'alta',  'Obra Civil', 'Levantamiento de muros, acabado de plafones, resaneo y preparación de superficies','Albañil'),
  ((SELECT id FROM proy), 'Instalación de rejas',                '2026-04-14','2026-04-25','#f59e0b', 0, 4,'media', 'Herrería',   'Colocación y fijación de rejas fabricadas en los puntos designados','Herrero'),
  ((SELECT id FROM proy), 'Instalación de ménsulas',             '2026-04-14','2026-04-25','#f97316', 0, 6,'media', 'Herrería',   'Fijación de ménsulas metálicas en muros con anclas y soldadura','Herrero'),

  -- S3-S4 ───────────────────────────────────────────────────────────────────
  ((SELECT id FROM proy), 'Instalación de aires acondicionados', '2026-04-21','2026-05-02','#0891b2', 0,17,'media', 'A/C',        'Montaje de unidades evaporadoras y condensadoras, carga de refrigerante','Electricista'),
  ((SELECT id FROM proy), 'Instalación de controles de acceso',  '2026-04-28','2026-05-02','#06b6d4', 0,11,'media', 'Seguridad',  'Instalación, cableado y configuración de lectores y controladores de acceso','Electricista'),
  ((SELECT id FROM proy), 'Pruebas de funcionamiento',           '2026-04-28','2026-05-09','#10b981', 0, 9,'alta',  'Pruebas',    'Verificación de todos los sistemas: eléctrico, A/C, controles de acceso y rejas','Responsable de Obra'),

  -- S5-S6 ───────────────────────────────────────────────────────────────────
  ((SELECT id FROM proy), 'Aplicación de pintura',               '2026-05-05','2026-05-16','#ec4899', 0, 2,'media', 'Acabados',   'Aplicación de pintura vinílica en muros y plafones, dos manos','Ayudante General'),
  ((SELECT id FROM proy), 'Instalación de cancelería',           '2026-05-05','2026-05-09','#8b5cf6', 0,13,'media', 'Cancelería', 'Colocación e instalación de cancelería en vanos y espacios designados','Herrero'),
  ((SELECT id FROM proy), 'Instalación de barra de granito',     '2026-05-05','2026-05-09','#14b8a6', 0,15,'media', 'Obra Civil', 'Colocación e instalación de barra de granito con pegamento y sellador','Responsable de Obra'),
  ((SELECT id FROM proy), 'Instalación de anuncios luminosos',   '2026-05-05','2026-05-16','#6366f1', 0,19,'baja',  'Acabados',   'Instalación de barra de anuncios luminosos y letrero de acrílico','');

-- ── 7. Verificación final ─────────────────────────────────────────────────────
SELECT 'Etapas de trabajo'      AS elemento, COUNT(*)::text AS cantidad FROM etapas_config
UNION ALL
SELECT 'Clientes',               COUNT(*)::text FROM clientes      WHERE empresa = 'Caja Popular San Jose Iturbide'
UNION ALL
SELECT 'Cotizaciones',           COUNT(*)::text FROM cotizaciones  WHERE folio = 'COT-0001'
UNION ALL
SELECT 'Trabajos',               COUNT(*)::text FROM trabajos      WHERE codigo = 'ECG-CAJAP1'
UNION ALL
SELECT 'Gantt — Proyectos',      COUNT(*)::text FROM gantt_proyectos WHERE nombre LIKE 'Caja Popular%'
UNION ALL
SELECT 'Gantt — Tareas',         COUNT(*)::text FROM gantt_tareas
  WHERE proyecto_id IN (SELECT id FROM gantt_proyectos WHERE nombre LIKE 'Caja Popular%');
