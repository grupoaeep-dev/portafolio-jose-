/**
 * RUTAS DEL PANEL DE ADMINISTRACIÓN (CMS & CRM)
 * Archivo: routes/admin.js
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// Todas las rutas de este router requieren autenticación
router.use(requireAuth);

// -------------------------------------------------------------
// 1. ESTADÍSTICAS GLOBALES
// -------------------------------------------------------------
router.get('/stats', (req, res) => {
  try {
    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    const newLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'nuevo'").get().count;
    const closedLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'cerrado'").get().count;

    const pageViews = db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view'").get().count;
    const whatsappClicks = db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'whatsapp_click'").get().count;

    res.json({
      totalLeads,
      newLeads,
      closedLeads,
      pageViews,
      whatsappClicks
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ error: 'Error al obtener métricas.' });
  }
});

// -------------------------------------------------------------
// 2. CRM DE PROSPECTOS (LEADS)
// -------------------------------------------------------------
router.get('/leads', (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (status && status !== 'todos') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR message LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const leads = db.prepare(query).all(...params);
    res.json(leads);
  } catch (err) {
    console.error('Error al consultar leads:', err);
    res.status(500).json({ error: 'Error al obtener lista de prospectos.' });
  }
});

router.put('/leads/:id', (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  try {
    const validStatuses = ['nuevo', 'contactado', 'en_negociacion', 'cerrado', 'descartado'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado de lead inválido.' });
    }

    db.prepare(`
      UPDATE leads
      SET status = COALESCE(?, status),
          admin_notes = COALESCE(?, admin_notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, admin_notes, id);

    res.json({ success: true, message: 'Prospecto actualizado exitosamente.' });
  } catch (err) {
    console.error('Error al actualizar lead:', err);
    res.status(500).json({ error: 'Error al actualizar el prospecto.' });
  }
});

router.delete('/leads/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    res.json({ success: true, message: 'Prospecto eliminado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar prospecto.' });
  }
});

// -------------------------------------------------------------
// 3. GESTIÓN DE SERVICIOS (CRUD)
// -------------------------------------------------------------
router.get('/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY order_num ASC, id ASC').all();
    const formatted = services.map(s => ({
      ...s,
      features: JSON.parse(s.features_json || '[]')
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener servicios.' });
  }
});

router.post('/services', (req, res) => {
  const { title, description, features, icon_svg, order_num, is_active } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Título y descripción son obligatorios.' });
  }

  try {
    const featuresJson = JSON.stringify(Array.isArray(features) ? features : []);
    const result = db.prepare(`
      INSERT INTO services (order_num, title, description, features_json, icon_svg, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(order_num || 1, title, description, featuresJson, icon_svg || 'star', is_active ? 1 : 0);

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear servicio.' });
  }
});

router.put('/services/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, features, icon_svg, order_num, is_active } = req.body;

  try {
    const featuresJson = features ? JSON.stringify(features) : undefined;
    db.prepare(`
      UPDATE services
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          features_json = COALESCE(?, features_json),
          icon_svg = COALESCE(?, icon_svg),
          order_num = COALESCE(?, order_num),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(title, description, featuresJson, icon_svg, order_num, is_active !== undefined ? (is_active ? 1 : 0) : undefined, id);

    res.json({ success: true, message: 'Servicio actualizado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar servicio.' });
  }
});

router.delete('/services/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Servicio eliminado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar servicio.' });
  }
});

// -------------------------------------------------------------
// 4. GESTIÓN DE CASOS DE ÉXITO (CRUD)
// -------------------------------------------------------------
router.get('/cases', (req, res) => {
  try {
    const cases = db.prepare('SELECT * FROM case_studies ORDER BY order_num ASC, id ASC').all();
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener casos.' });
  }
});

router.post('/cases', (req, res) => {
  const { badge, title, problem, solution, result, order_num, is_active } = req.body;
  if (!title || !problem || !solution || !result) {
    return res.status(400).json({ error: 'Todos los campos del caso son requeridos.' });
  }

  try {
    const resSql = db.prepare(`
      INSERT INTO case_studies (order_num, badge, title, problem, solution, result, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(order_num || 1, badge || 'Caso de Éxito', title, problem, solution, result, is_active ? 1 : 0);

    res.status(201).json({ success: true, id: resSql.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear caso.' });
  }
});

router.put('/cases/:id', (req, res) => {
  const { id } = req.params;
  const { badge, title, problem, solution, result, order_num, is_active } = req.body;

  try {
    db.prepare(`
      UPDATE case_studies
      SET badge = COALESCE(?, badge),
          title = COALESCE(?, title),
          problem = COALESCE(?, problem),
          solution = COALESCE(?, solution),
          result = COALESCE(?, result),
          order_num = COALESCE(?, order_num),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(badge, title, problem, solution, result, order_num, is_active !== undefined ? (is_active ? 1 : 0) : undefined, id);

    res.json({ success: true, message: 'Caso actualizado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar caso.' });
  }
});

router.delete('/cases/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM case_studies WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar caso.' });
  }
});

// -------------------------------------------------------------
// 5. GESTIÓN DE TESTIMONIOS (CRUD)
// -------------------------------------------------------------
router.get('/testimonials', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM testimonials ORDER BY id ASC').all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener testimonios.' });
  }
});

router.post('/testimonials', (req, res) => {
  const { author_name, author_role, avatar_initials, content, rating, is_active } = req.body;
  if (!author_name || !content) {
    return res.status(400).json({ error: 'Nombre y testimonio son requeridos.' });
  }

  try {
    const initials = avatar_initials || author_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const result = db.prepare(`
      INSERT INTO testimonials (author_name, author_role, avatar_initials, content, rating, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(author_name, author_role || 'Cliente', initials, content, rating || 5, is_active ? 1 : 0);

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear testimonio.' });
  }
});

router.put('/testimonials/:id', (req, res) => {
  const { id } = req.params;
  const { author_name, author_role, avatar_initials, content, rating, is_active } = req.body;

  try {
    db.prepare(`
      UPDATE testimonials
      SET author_name = COALESCE(?, author_name),
          author_role = COALESCE(?, author_role),
          avatar_initials = COALESCE(?, avatar_initials),
          content = COALESCE(?, content),
          rating = COALESCE(?, rating),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(author_name, author_role, avatar_initials, content, rating, is_active !== undefined ? (is_active ? 1 : 0) : undefined, id);

    res.json({ success: true, message: 'Testimonio actualizado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar testimonio.' });
  }
});

router.delete('/testimonials/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar testimonio.' });
  }
});

// -------------------------------------------------------------
// 6. CONFIGURACIONES GENERALES DEL SITIO
// -------------------------------------------------------------
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM site_settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener configuraciones.' });
  }
});

router.put('/settings', (req, res) => {
  const updates = req.body; // Objeto { key: value, ... }

  try {
    const updateStmt = db.prepare(`
      INSERT INTO site_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    db.exec('BEGIN TRANSACTION;');
    for (const [key, value] of Object.entries(updates)) {
      updateStmt.run(key, String(value));
    }
    db.exec('COMMIT;');
    res.json({ success: true, message: 'Configuraciones actualizadas con éxito.' });
  } catch (err) {
    console.error('Error al guardar configuraciones:', err);
    res.status(500).json({ error: 'Error al guardar configuraciones.' });
  }
});

// -------------------------------------------------------------
// 7. CAMBIO DE CONTRASEÑA
// -------------------------------------------------------------
router.put('/profile/password', (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Debes proporcionar la contraseña actual y la nueva.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    res.json({ success: true, message: '¡Contraseña actualizada con éxito!' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar contraseña.' });
  }
});

module.exports = router;
