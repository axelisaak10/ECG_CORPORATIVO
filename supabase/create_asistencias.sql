-- ─────────────────────────────────────────────────────────────────────────────
-- ECG CORPORATIVO: SISTEMA DE ASISTENCIA Y CHECADOR PWA
-- Vinculado a tu tabla existente "Usuarios" (numeric id, _text Nombre Completo)
-- Incluye a: Erasmo, Adelfo, Axel, Rayo, Francisco y Roberto
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. ASIGNAR LAS FOTOS OFICIALES A LOS USUARIOS QUE NO TENGAN AvatarURL
-- (Solo para Trabajadores nivel 1, Administradores nivel 2 y Super Admin nivel 3)
UPDATE "Usuarios"
SET "AvatarURL" = CASE
  WHEN LOWER(CAST("Nombre Completo" AS TEXT)) LIKE '%erasmo%'    THEN '/assets/miembros/erasmo_cuaya.jpeg'
  WHEN LOWER(CAST("Nombre Completo" AS TEXT)) LIKE '%adelfo%'    THEN '/assets/miembros/adelfo.jpeg'
  WHEN LOWER(CAST("Nombre Completo" AS TEXT)) LIKE '%axel%'      THEN '/assets/miembros/axel.jpeg'
  WHEN LOWER(CAST("Nombre Completo" AS TEXT)) LIKE '%rayo%' OR LOWER(CAST("Nombre Completo" AS TEXT)) LIKE '%maria%' THEN '/assets/miembros/maria_rayo.jpeg'
  WHEN LOWER(CAST("Nombre Completo" AS TEXT)) LIKE '%francisco%' THEN '/assets/miembros/francisco.jpeg'
  WHEN LOWER(CAST("Nombre Completo" AS TEXT)) LIKE '%roberto%'   THEN '/assets/miembros/roberto.jpeg'
  ELSE "AvatarURL"
END
WHERE ("AvatarURL" IS NULL OR "AvatarURL" = '')
  AND nivel >= 1
  AND LOWER(CAST("Nombre Completo" AS TEXT)) NOT LIKE '%cesar%'
  AND LOWER(CAST("Nombre Completo" AS TEXT)) NOT LIKE '%jess%';

-- 2. CREAR LA TABLA asistencias VINCULADA DIRECTAMENTE A "Usuarios"
CREATE TABLE IF NOT EXISTS asistencias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      NUMERIC NOT NULL REFERENCES "Usuarios"("id") ON DELETE CASCADE,
  usuario_nombre  TEXT NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'entrada' CHECK (tipo IN ('entrada', 'salida')),
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  hora            TIME NOT NULL DEFAULT CURRENT_TIME,
  dispositivo     TEXT DEFAULT 'kiosk-pwa',
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- REGLA ESTRICTA DE BASE DE DATOS: Solo 1 entrada y 1 salida por día por usuario
  CONSTRAINT uq_asistencia_diaria UNIQUE (usuario_id, fecha, tipo)
);

-- 3. ÍNDICES DE RENDIMIENTO PARA PRODUCCIÓN
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_usuario ON asistencias(usuario_id);

-- 4. HABILITAR SEGURIDAD A NIVEL DE FILAS (RLS)
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para la tablet checadora
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

-- 5. CONSULTA DE VERIFICACIÓN: Ver la lista de personal que usará el checador
SELECT 
  id,
  "Nombre Completo" AS nombre,
  "Correo" AS correo,
  nivel,
  CASE 
    WHEN nivel = 1 THEN 'Trabajador'
    WHEN nivel = 2 THEN 'Administrador'
    WHEN nivel >= 3 THEN 'Super Admin'
    ELSE 'Excluido (Cliente / Nivel 0)'
  END AS rol_en_checador,
  "AvatarURL" AS foto
FROM "Usuarios"
WHERE nivel >= 1
  AND deleted_at IS NULL
  AND LOWER(CAST("Nombre Completo" AS TEXT)) NOT LIKE '%cesar%'
  AND LOWER(CAST("Nombre Completo" AS TEXT)) NOT LIKE '%jess%'
ORDER BY id ASC;
