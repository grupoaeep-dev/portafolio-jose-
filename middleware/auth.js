/**
 * MIDDLEWARE DE AUTENTICACIÓN JWT PARA RUTAS DE ADMINISTRACIÓN
 * Archivo: middleware/auth.js
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura_jose_humberto_2026';

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado: Token de autenticación no proporcionado.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado. Inicia sesión nuevamente.' });
  }
}

module.exports = {
  requireAuth,
  JWT_SECRET
};
