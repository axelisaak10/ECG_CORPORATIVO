// api/lib/jwt.js — generación y verificación de JWT con issuer/audience
// El uso de iss + aud previene Token Confusion Attacks entre distintos servicios.
const jwt = require('jsonwebtoken');

const JWT_ISSUER   = 'ecg-api';
const JWT_AUDIENCE = 'ecg-app';
const JWT_TTL      = '24h';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no configurado.');
  return secret;
}

/**
 * Genera un JWT firmado con issuer y audience.
 * @param {{ userId: number, nivel: number, jti: string }} payload
 */
function signToken({ userId, nivel, jti }) {
  return jwt.sign(
    { sub: userId, nivel, jti },
    getSecret(),
    { expiresIn: JWT_TTL, issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
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
    return jwt.verify(auth.slice(7), getSecret(), {
      issuer:   JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    return null;
  }
}

module.exports = { signToken, verifyToken };
