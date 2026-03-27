const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no configurado.');
  return secret;
}

/**
 * Genera un JWT firmado.
 * @param {{ userId: number, nivel: number, jti: string }} payload
 */
function signToken({ userId, nivel, jti }) {
  return jwt.sign(
    { sub: userId, nivel, jti },
    getSecret(),
    { expiresIn: '24h' }
  );
}

/**
 * Verifica el JWT del header Authorization: Bearer <token>.
 * Retorna el payload decodificado o null si es inválido/expirado.
 * @param {import('http').IncomingMessage} req
 */
function verifyToken(req) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), getSecret());
  } catch {
    return null; // token inválido, expirado o JWT_SECRET no configurado
  }
}

module.exports = { signToken, verifyToken };
