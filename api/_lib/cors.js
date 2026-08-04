// api/_lib/cors.js — helper compartido de CORS y headers de seguridad HTTP
// Aplica CORS inteligente (soporta localhost, dominios vercel.app y FRONTEND_URL)
// y cabeceras de seguridad HTTP a todos los serverless handlers de la API.

/**
 * Aplica CORS y headers de seguridad HTTP a la respuesta.
 * @param {import('http').IncomingMessage|import('http').ServerResponse} reqOrRes
 * @param {import('http').ServerResponse|string} resOrMethods
 * @param {string} [methodsOpt]
 */
function applyCors(reqOrRes, resOrMethods, methodsOpt) {
  let req, res, methods;

  if (reqOrRes && typeof reqOrRes.setHeader === 'function') {
    // Firma heredada: applyCors(res, methods)
    res = reqOrRes;
    req = null;
    methods = typeof resOrMethods === 'string' ? resOrMethods : 'GET, POST, OPTIONS';
  } else {
    // Firma estándar: applyCors(req, res, methods)
    req = reqOrRes;
    res = resOrMethods;
    methods = methodsOpt || 'GET, POST, OPTIONS';
  }

  const origin = req?.headers?.origin;
  let allowedOrigin = process.env.FRONTEND_URL || '*';

  if (origin) {
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isVercelDomain = /^https:\/\/.*\.vercel\.app$/.test(origin);
    const isFrontendUrl = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL.replace(/\/$/, '');

    if (isLocalhost || isVercelDomain || isFrontendUrl || !process.env.FRONTEND_URL) {
      allowedOrigin = origin;
    }
  }

  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
    // Headers de seguridad HTTP
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
}

module.exports = { applyCors };
