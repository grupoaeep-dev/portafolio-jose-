-- ============================================================================
-- ESQUEMA RELACIONAL SQLITE - PORTAFOLIO JOSÉ HUMBERTO MEJÍA GODOY
-- Base de Datos: portfolio.db
-- ============================================================================

-- 1. Usuarios Administradores del Panel
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- 2. CRM de Prospectos y Mensajes de Clientes (Leads)
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    service_interested TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT CHECK(status IN ('nuevo', 'contactado', 'en_negociacion', 'cerrado', 'descartado')) DEFAULT 'nuevo',
    admin_notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Catálogo Dinámico de Servicios
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_num INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    features_json TEXT NOT NULL, -- Almacena array JSON con las viñetas
    icon_svg TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Casos de Éxito / Campañas Publicitarias
CREATE TABLE IF NOT EXISTS case_studies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_num INTEGER NOT NULL DEFAULT 1,
    badge TEXT NOT NULL,
    title TEXT NOT NULL,
    problem TEXT NOT NULL,
    solution TEXT NOT NULL,
    result TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Testimonios de Clientes
CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    avatar_initials TEXT NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Configuraciones Generales y Métricas del Portafolio
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Métricas de Visitas y Eventos (Analítica Ligera)
CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL, -- 'page_view', 'whatsapp_click', 'form_submit'
    user_agent TEXT,
    ip_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
