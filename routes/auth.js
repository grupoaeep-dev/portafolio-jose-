/**
 * RUTAS DE AUTENTICACIÓN ADMIN
 * Archivo: routes/auth.js
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Por favor ingresa usuario y contraseña.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Actualizar último inicio de sesión
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Generar token JWT con expiración de 7 días
    const token = jwt.sign(
      { id: user.id, username: user.username, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error del servidor al procesar el inicio de sesión.' });
  }
});

// GET /api/auth/verify (Verificar si el token es válido)
router.get('/verify', requireAuth, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

module.exports = router;
