-- ─────────────────────────────────────────────────────────────────────────────
-- ECG CORPORATIVO: CREACIÓN DE LA TABLA ASISTENCIAS EN SUPABASE
-- Instrucciones:
-- 1. Ve a tu panel de Supabase: https://supabase.com/dashboard
-- 2. Selecciona tu proyecto ECG
-- 3. En el menú de la izquierda entra a: "SQL Editor"
-- 4. Haz clic en "New query" (Nueva consulta)
-- 5. Pega todo este código y haz clic en el botón verde "Run"
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. ASIGNAR LAS FOTOS OFICIALES A LOS USUARIOS ACTIVOS DE ECG
UPDATE "Usuarios"
SET "AvatarURL" = CASE
  WHEN array_to_string("Nombre Completo", ' ') ILIKE '%erasmo%'    THEN '/assets/miembros/erasmo_cuaya.jpeg'
  WHEN array_to_string("Nombre Completo", ' ') ILIKE '%adelfo%'    THEN '/assets/miembros/adelfo.jpeg'
  WHEN array_to_string("Nombre Completo", ' ') ILIKE '%axel%'      THEN '/assets/miembros/axel.jpeg'
  WHEN array_to_string("Nombre Completo", ' ') ILIKE '%rayo%' OR array_to_string("Nombre Completo", ' ') ILIKE '%maria%' THEN '/assets/miembros/maria_rayo.jpeg'
  WHEN array_to_string("Nombre Completo", ' ') ILIKE '%francisco%' THEN '/assets/miembros/francisco.jpeg'
  WHEN array_to_string("Nombre Completo", ' ') ILIKE '%roberto%'   THEN '/assets/miembros/roberto.jpeg'
  ELSE "AvatarURL"
END
WHERE ("AvatarURL" IS NULL OR "AvatarURL" = '')
  AND nivel >= 1;

-- 2. CREAR LA TABLA asistencias (compatible con almacenamiento offline y sincronización PWA)
CREATE TABLE IF NOT EXISTS asistencias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      NUMERIC NOT NULL,
  usuario_nombre  TEXT NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'entrada' CHECK (tipo IN ('entrada', 'salida')),
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  hora            TEXT NOT NULL,
  dispositivo     TEXT DEFAULT 'kiosk-pwa',
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- REGLA ESTRICTA: Solo 1 entrada y 1 salida al día por usuario
  CONSTRAINT uq_asistencia_diaria UNIQUE (usuario_id, fecha, tipo)
);

-- Si la tabla ya existía previamente con hora tipo TIME, la convertimos a TEXT
DO $$
BEGIN
  ALTER TABLE asistencias ALTER COLUMN hora TYPE TEXT;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. ÍNDICES DE VELOCIDAD
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_usuario ON asistencias(usuario_id);

-- 4. PERMISOS Y SEGURIDAD RLS (Permitir registrar desde el kiosco/tablet)
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir registrar asistencias desde kiosco" ON asistencias;
CREATE POLICY "Permitir registrar asistencias desde kiosco"
  ON asistencias FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de asistencias" ON asistencias;
CREATE POLICY "Permitir lectura de asistencias"
  ON asistencias FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir todo a service role en asistencias" ON asistencias;
CREATE POLICY "Permitir todo a service role en asistencias"
  ON asistencias FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. VERIFICACIÓN: Ver la lista de personal activo en el checador
SELECT 
  id,
  array_to_string("Nombre Completo", ' ') AS nombre_completo,
  "Correo" AS correo,
  nivel,
  "AvatarURL" AS foto
FROM "Usuarios"
WHERE nivel >= 1
  AND deleted_at IS NULL
ORDER BY id ASC;
