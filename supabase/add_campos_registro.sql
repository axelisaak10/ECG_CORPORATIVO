-- ─────────────────────────────────────────────────────────────────────────────
-- Agregar campos de registro extendido a la tabla "Usuarios"
-- Ejecutar en: Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Usuarios"
  ADD COLUMN IF NOT EXISTS "Telefono"  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "RFC_CURP"  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "Empresa"   TEXT DEFAULT NULL;

-- Verificar que las columnas se crearon correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Usuarios'
  AND column_name IN ('Telefono', 'RFC_CURP', 'Empresa');
