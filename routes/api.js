/**
 * RUTAS PÚBLICAS DE LA API (FRONTEND DINÁMICO)
 * Archivo: routes/api.js
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/content (Obtiene todo el contenido dinámico para el portafolio público)
router.get('/content', (req, res) => {
  try {
    // 1. Obtener configuraciones del sitio
    const settingsRows = db.prepare('SELECT key, value FROM site_settings').all();
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });

    // 2. Obtener servicios activos
    const servicesRows = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY order_num ASC, id ASC').all();
    const services = servicesRows.map(s => ({
      ...s,
      features: JSON.parse(s.features_json || '[]')
    }));

    // 3. Obtener casos de éxito activos
    const cases = db.prepare('SELECT * FROM case_studies WHERE is_active = 1 ORDER BY order_num ASC, id ASC').all();

    // 4. Obtener testimonios activos
    const testimonials = db.prepare('SELECT * FROM testimonials WHERE is_active = 1 ORDER BY id ASC').all();

    res.json({
      success: true,
      settings,
      services,
      cases,
      testimonials
    });
  } catch (err) {
    console.error('Error al obtener contenido público:', err);
    res.status(500).json({ error: 'Error al cargar el contenido dinámico.' });
  }
});

// POST /api/contact (Recibe un nuevo lead o mensaje desde el formulario)
router.post('/contact', (req, res) => {
  const { name, email, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Por favor completa todos los campos requeridos.' });
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'El formato de correo electrónico es inválido.' });
  }

  try {
    const insertLead = db.prepare(`
      INSERT INTO leads (name, email, service_interested, message, status)
      VALUES (?, ?, ?, ?, 'nuevo')
    `);

    const result = insertLead.run(
      name.trim(),
      email.trim(),
      service ? service.trim() : 'General',
      message.trim()
    );

    // Registrar evento en analítica
    try {
      db.prepare(`
        INSERT INTO analytics_events (event_type, user_agent)
        VALUES ('form_submit', ?)
      `).run(req.headers['user-agent'] || '');
    } catch (e) {
      // Ignorar error no crítico de analítica
    }

    res.status(201).json({
      success: true,
      message: '¡Tu mensaje ha sido recibido con éxito!',
      leadId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error al guardar lead en base de datos:', err);
    res.status(500).json({ error: 'Error en el servidor al registrar tu mensaje.' });
  }
});

// POST /api/analytics (Registra visitas o clics en WhatsApp)
router.post('/analytics', (req, res) => {
  const { event_type } = req.body;
  const validEvents = ['page_view', 'whatsapp_click', 'form_submit'];

  if (!event_type || !validEvents.includes(event_type)) {
    return res.status(400).json({ error: 'Tipo de evento inválido.' });
  }

  try {
    db.prepare(`
      INSERT INTO analytics_events (event_type, user_agent)
      VALUES (?, ?)
    `).run(event_type, req.headers['user-agent'] || '');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar evento.' });
  }
});

module.exports = router;
