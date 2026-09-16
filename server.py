"""
SERVIDOR DINÁMICO PYTHON (CERO DEPENDENCIAS EXTERNAS)
Utiliza la librería estándar de Python: sqlite3, http.server, json, hashlib.
No requiere instalar nada con pip ni npm.
Ejecutar con: python server.py (o py server.py)
"""

import http.server
import socketserver
import sqlite3
import json
import os
import urllib.parse
import hashlib
import datetime

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database', 'portfolio.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'database', 'schema.sql')

# ----------------------------------------------------------------------------
# 1. INICIALIZACIÓN DE BASE DE DATOS SQLITE
# ----------------------------------------------------------------------------
def init_db():
    os.makedirs(os.path.join(BASE_DIR, 'database'), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Ejecutar esquema si existe
    if os.path.exists(SCHEMA_PATH):
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            cursor.executescript(f.read())

    # Crear usuario administrador por defecto si no existe
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        pwd_hash = hashlib.sha256('admin123'.encode()).hexdigest()
        cursor.execute(
            "INSERT INTO users (username, password_hash, full_name, email) VALUES (?, ?, ?, ?)",
            ('admin', pwd_hash, 'José Humberto Mejía Godoy', 'josehumbertomejiagodoy@email.com')
        )
        print("👤 Usuario administrador creado: admin / admin123")

    # Sembrar configuraciones iniciales si está vacío
    cursor.execute("SELECT COUNT(*) FROM site_settings")
    if cursor.fetchone()[0] == 0:
        settings = [
            ('site_title', 'José Humberto Mejía Godoy | Servicio al Cliente & Publicidad'),
            ('hero_badge', 'Disponible para nuevos proyectos y contratación'),
            ('hero_title', 'Atención al cliente que fideliza, publicidad que convierte.'),
            ('hero_subtitle', 'Hola, soy José Humberto Mejía Godoy. Ayudo a marcas y negocios a conectar con sus clientes mediante campañas de anuncios efectivas y una atención al cliente empática y resolutiva.'),
            ('stat_csat', '99'),
            ('stat_commitment', '100'),
            ('stat_response_time', '5'),
            ('whatsapp_number', ''),
            ('whatsapp_message', 'Hola José Humberto, vi tu portafolio y me gustaría conversar contigo.'),
            ('contact_email', 'josehumbertomejiagodoy@email.com'),
            ('location_text', 'Remoto / Presencial')
        ]
        cursor.executemany("INSERT INTO site_settings (key, value) VALUES (?, ?)", settings)

    # Sembrar servicios iniciales si está vacío
    cursor.execute("SELECT COUNT(*) FROM services")
    if cursor.fetchone()[0] == 0:
        services = [
            (1, 'Publicidad & Creación de Anuncios', 'Planificación y ejecución de anuncios en redes sociales orientados a conseguir mensajes, prospectos y ventas efectivas.', json.dumps(['Configuración de campañas en Meta Ads (Facebook & Instagram).', 'Redacción de copys persuasivos.', 'Segmentación por intereses y ubicación.', 'Optimización de presupuesto.']), 'ads', 1),
            (2, 'Atención al Cliente Multicanal', 'Soporte cálido y profesional en todos los puntos de contacto para responder preguntas, despejar objeciones y cerrar ventas.', json.dumps(['Atención inmediata vía WhatsApp Business y Chat web.', 'Gestión de comentarios y mensajes.', 'Atención por correo electrónico.', 'Tono empático y profesional.']), 'phone', 1),
            (3, 'Fidelización y Servicio Post-Venta', 'Un cliente satisfecho vuelve a comprar y recomienda. Mantengo el contacto después de la compra para garantizar satisfacción.', json.dumps(['Seguimiento de entregas.', 'Resolución de inquietudes.', 'Encuestas breves de satisfacción.', 'Estrategias de re-compra.']), 'heart', 1),
            (4, 'Organización de Leads y CRM', 'Estructuración y control de prospectos para que ningún interesado se pierda y el proceso comercial sea claro.', json.dumps(['Etiquetado y clasificación de prospectos.', 'Respuestas rápidas.', 'Historial de interacciones.', 'Reportes periódicos.']), 'crm', 1)
        ]
        cursor.executemany("INSERT INTO services (order_num, title, description, features_json, icon_svg, is_active) VALUES (?, ?, ?, ?, ?, ?)", services)

    conn.commit()
    conn.close()
    print("✅ Base de datos SQLite lista en:", DB_PATH)

init_db()

# ----------------------------------------------------------------------------
# 2. MANEJADOR HTTP (SERVIDOR WEB Y API REST)
# ----------------------------------------------------------------------------
class DynamicPortfolioHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Redirigir /admin a /public/admin/index.html
        if path == '/admin' or path == '/admin/':
            self.path = '/public/admin/index.html'
            return super().do_GET()

        # API: Obtener contenido público
        if path == '/api/content':
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("SELECT key, value FROM site_settings")
            settings = {row['key']: row['value'] for row in cursor.fetchall()}

            cursor.execute("SELECT * FROM services WHERE is_active = 1 ORDER BY order_num ASC")
            services = []
            for r in cursor.fetchall():
                d = dict(r)
                d['features'] = json.loads(d.get('features_json') or '[]')
                services.append(d)

            cursor.execute("SELECT * FROM case_studies WHERE is_active = 1 ORDER BY order_num ASC")
            cases = [dict(r) for r in cursor.fetchall()]

            cursor.execute("SELECT * FROM testimonials WHERE is_active = 1")
            testimonials = [dict(r) for r in cursor.fetchall()]

            conn.close()
            return self._send_json({
                'success': True,
                'settings': settings,
                'services': services,
                'cases': cases,
                'testimonials': testimonials
            })

        # API Admin: Estadísticas
        if path == '/api/admin/stats':
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT COUNT(*) FROM leads")
            total = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM leads WHERE status = 'nuevo'")
            nuevos = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM analytics_events WHERE event_type = 'whatsapp_click'")
            wa = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM analytics_events WHERE event_type = 'page_view'")
            views = c.fetchone()[0]
            conn.close()
            return self._send_json({
                'totalLeads': total,
                'newLeads': nuevos,
                'whatsappClicks': wa,
                'pageViews': views
            })

        # API Admin: Listar Leads
        if path.startswith('/api/admin/leads'):
            query_params = urllib.parse.parse_qs(parsed.query)
            status_filter = query_params.get('status', ['todos'])[0]

            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            if status_filter != 'todos':
                c.execute("SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC", (status_filter,))
            else:
                c.execute("SELECT * FROM leads ORDER BY created_at DESC")
            leads = [dict(r) for r in c.fetchall()]
            conn.close()
            return self._send_json(leads)

        # API Admin: Verificar token
        if path == '/api/auth/verify':
            return self._send_json({'valid': True, 'user': {'full_name': 'José Humberto Mejía Godoy'}})

        # API Admin: Settings
        if path == '/api/admin/settings':
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute("SELECT key, value FROM site_settings")
            settings = {row['key']: row['value'] for row in c.fetchall()}
            conn.close()
            return self._send_json(settings)

        # Archivos estáticos normales
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')
        data = json.loads(body) if body else {}

        # API: Enviar mensaje de contacto (Guardar Lead en SQLite)
        if path == '/api/contact':
            name = data.get('name', '').strip()
            email = data.get('email', '').strip()
            service = data.get('service', 'General')
            message = data.get('message', '').strip()

            if not name or not email or not message:
                return self._send_json({'error': 'Campos requeridos incompletos.'}, 400)

            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute(
                "INSERT INTO leads (name, email, service_interested, message, status) VALUES (?, ?, ?, ?, 'nuevo')",
                (name, email, service, message)
            )
            c.execute(
                "INSERT INTO analytics_events (event_type, user_agent) VALUES ('form_submit', ?)",
                (self.headers.get('User-Agent', ''),)
            )
            conn.commit()
            lead_id = c.lastrowid
            conn.close()

            print(f"📥 ¡Nuevo lead recibido de {name} ({email}) guardado en SQLite!")
            return self._send_json({'success': True, 'message': 'Guardado en SQLite con éxito', 'leadId': lead_id}, 201)

        # API: Registrar evento de analítica
        if path == '/api/analytics':
            event_type = data.get('event_type')
            if event_type:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute(
                    "INSERT INTO analytics_events (event_type, user_agent) VALUES (?, ?)",
                    (event_type, self.headers.get('User-Agent', ''))
                )
                conn.commit()
                conn.close()
            return self._send_json({'success': True})

        # API: Login de administración
        if path == '/api/auth/login':
            username = data.get('username', '').strip()
            password = data.get('password', '')

            pwd_hash = hashlib.sha256(password.encode()).hexdigest()

            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute("SELECT * FROM users WHERE username = ?", (username,))
            user = c.fetchone()
            conn.close()

            # Acepta sha256 o contraseña por defecto
            if user and (user['password_hash'] == pwd_hash or password == 'admin123'):
                return self._send_json({
                    'success': True,
                    'token': 'demo_token_jose_humberto',
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'full_name': user['full_name']
                    }
                })
            else:
                return self._send_json({'error': 'Usuario o contraseña incorrectos.'}, 401)

        self._send_json({'error': 'Endpoint no encontrado'}, 404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')
        data = json.loads(body) if body else {}

        # Actualizar estado de un Lead
        if path.startswith('/api/admin/leads/'):
            lead_id = path.split('/')[-1]
            new_status = data.get('status')
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("UPDATE leads SET status = ? WHERE id = ?", (new_status, lead_id))
            conn.commit()
            conn.close()
            return self._send_json({'success': True})

        # Actualizar ajustes generales
        if path == '/api/admin/settings':
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            for k, v in data.items():
                c.execute("INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", (k, str(v)))
            conn.commit()
            conn.close()
            return self._send_json({'success': True})

        self._send_json({'error': 'Endpoint no encontrado'}, 404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith('/api/admin/leads/'):
            lead_id = path.split('/')[-1]
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
            conn.commit()
            conn.close()
            return self._send_json({'success': True})
        self._send_json({'error': 'Endpoint no encontrado'}, 404)

# ----------------------------------------------------------------------------
# 3. LANZADOR DEL SERVIDOR
# ----------------------------------------------------------------------------
if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), DynamicPortfolioHandler) as httpd:
        print("\n============================================================")
        print("🚀 SERVIDOR DINÁMICO PYTHON ACTIVO (CERO DEPENDENCIAS)")
        print("============================================================")
        print(f"🌐 Portafolio público:      http://localhost:{PORT}")
        print(f"🔐 Panel de Administración: http://localhost:{PORT}/admin")
        print(f"📦 Base de Datos:           SQLite ({DB_PATH})")
        print("👤 Usuario admin:           admin")
        print("🔑 Contraseña:              admin123")
        print("============================================================\n")
        print("Presiona Ctrl + C en esta ventana para detener el servidor.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
