-- Agregar la columna 'AvatarURL' a la tabla 'Usuarios'
-- Ejecuta este script en el SQL Editor de tu panel de Supabase

ALTER TABLE "Usuarios" 
ADD COLUMN IF NOT EXISTS "AvatarURL" text;
