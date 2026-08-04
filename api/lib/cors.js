// api/lib/cors.js — helper compartido de CORS y headers de seguridad HTTP
// Aplica CORS restrictivo (solo FRONTEND_URL) y cabeceras de seguridad
// a todos los serverless handlers de la API.

const ALLOWED_ORIGIN = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

/**
 * Aplica CORS y headers de seguridad HTTP a la respuesta.
 * @param {import('http').ServerResponse} res
 * @param {string} methods - Métodos HTTP permitidos (default: 'GET, POST, OPTIONS')
 */
function applyCors(res, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
  // Headers de seguridad HTTP
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

module.exports = { applyCors, ALLOWED_ORIGIN };
