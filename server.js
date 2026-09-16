/**
 * SERVIDOR PRINCIPAL EXPRESS - PORTAFOLIO DINÁMICO JOSÉ HUMBERTO MEJÍA GODOY
 * Archivo: server.js
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

// Inicializar servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend (tanto de la raíz como de public/)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Rutas de la API
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

// Ruta directa para el panel de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Ruta fallback para SPA o página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejador de errores 404 para la API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint de API no encontrado.' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n======================================================');
  console.log('🚀 SERVIDOR DINÁMICO DEL PORTAFOLIO INICIADO');
  console.log('======================================================');
  console.log(`🌐 Portafolio público:      http://localhost:${PORT}`);
  console.log(`🔐 Panel de Administración: http://localhost:${PORT}/admin`);
  console.log('📦 Base de Datos:           SQLite (database/portfolio.db)');
  console.log('👤 Usuario inicial:         admin');
  console.log('🔑 Contraseña inicial:      admin123');
  console.log('======================================================\n');
});
