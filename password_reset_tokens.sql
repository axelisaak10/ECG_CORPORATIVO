-- ── Tabla para tokens de recuperación de contraseña ──────────────────────────
-- Ejecutar en: Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  INTEGER      NOT NULL REFERENCES "Usuarios"(id) ON DELETE CASCADE,
  token       TEXT         NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  used_at     TIMESTAMPTZ  DEFAULT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);

-- Índice para limpiar tokens viejos
CREATE INDEX IF NOT EXISTS idx_prt_expires ON password_reset_tokens(expires_at);

-- RLS: solo el service role (backend) puede leer/escribir
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Política: acceso solo desde service role (anon no puede leer ni escribir)
CREATE POLICY "Service role only" ON password_reset_tokens
  USING (false)
  WITH CHECK (false);
