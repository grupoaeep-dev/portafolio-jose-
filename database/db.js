/**
 * CONEXIÓN E INICIALIZACIÓN DE LA BASE DE DATOS SQLITE
 * Utiliza node:sqlite integrado nativamente en Node.js (Cero compilación externa)
 * Archivo: database/db.js
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'portfolio.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let rawDb;

try {
  // En Node.js 22.5+ y Node 24+, SQLite viene integrado nativamente
  const { DatabaseSync } = require('node:sqlite');
  rawDb = new DatabaseSync(DB_PATH);
  console.log(' Conectado a SQLite nativo de Node.js:', DB_PATH);
} catch (err) {
  try {
    // Fallback a better-sqlite3 si existiera
    const Database = require('better-sqlite3');
    rawDb = new Database(DB_PATH);
    console.log(' Conectado a better-sqlite3:', DB_PATH);
  } catch (err2) {
    console.error('Error al inicializar SQLite:', err.message);
    throw new Error('No se pudo inicializar la base de datos SQLite.');
  }
}

// Wrapper unificado para que funcione exactamente igual con .run(), .get(), .all(), .exec()
const db = {
  exec(sql) {
    return rawDb.exec(sql);
  },
  prepare(sql) {
    const stmt = rawDb.prepare(sql);
    return {
      run(...params) {
        return stmt.run(...params);
      },
      get(...params) {
        return stmt.get(...params);
      },
      all(...params) {
        return stmt.all(...params);
      }
    };
  }
};

// Ejecutar script de esquema inicial
function initDatabase() {
  if (fs.existsSync(SCHEMA_PATH)) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schemaSql);
    console.log(' Tablas SQLite verificadas y listas.');
  }

  // Verificar si existe el usuario administrador por defecto
  const userRow = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const count = userRow ? userRow.count : 0;

  if (count === 0) {
    const defaultPassword = 'admin123';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(defaultPassword, salt);

    db.prepare(`
      INSERT INTO users (username, password_hash, full_name, email)
      VALUES (?, ?, ?, ?)
    `).run('admin', hash, 'José Humberto Mejía Godoy', 'josehumbertomejiagodoy@email.com');

    console.log(' Usuario administrador inicial creado:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123 (Se recomienda cambiarla en el panel de control)');
  }
}

// Inicializar al cargar
initDatabase();

module.exports = db;
