-- ─────────────────────────────────────────────────────────────────────────────
-- Agregar soporte para soft-delete (eliminación lógica) en la tabla "Usuarios"
-- Ejecutar en: Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Usuarios"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- Índice para búsquedas rápidas de usuarios eliminados/activos
CREATE INDEX IF NOT EXISTS idx_usuarios_deleted_at ON "Usuarios" ("deleted_at");

-- Verificar que la columna se creó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Usuarios'
  AND column_name = 'deleted_at';
