# 🚀 Portafolio Dinámico Full-Stack - José Humberto Mejía Godoy

¡Bienvenido a tu nueva plataforma web **dinámica** con base de datos **SQLite**, **API RESTful** y **Panel de Control / CRM**!

---

## 🌟 ¿Qué incluye la versión dinámica?

1. **Base de Datos Relacional SQLite (`database/portfolio.db`):**
   - Sin necesidad de instalar MySQL, PostgreSQL ni servidores externos.
   - Guarda automáticamente todos los mensajes recibidos, servicios, casos de éxito, testimonios y configuraciones en un único archivo seguro.
2. **CRM de Clientes & Mensajes Recibidos:**
   - Cada persona que te escriba desde el formulario queda registrada en tu base de datos.
   - Podrás ver el estado del prospecto (*Nuevo, Contactado, En Negociación, Cerrado, Descartado*), agregar notas y abrir un chat directo de WhatsApp con un solo clic.
3. **Panel de Administración (CMS):**
   - Acceso en: `http://localhost:3000/admin`
   - Permite cambiar tu número de WhatsApp, correo, métricas (+99% CSAT, < 5 min, etc.), activar/pausar servicios y ver estadísticas de visitas y clics en WhatsApp sin tocar una sola línea de código.
4. **Seguridad Integrada:**
   - Contraseñas cifradas con `bcrypt`.
   - Autenticación mediante tokens seguros `JWT`.
   - Protección contra inyecciones SQL mediante consultas preparadas (*Prepared Statements*).
5. **Modo Híbrido Resiliente:**
   - Si el servidor backend está corriendo, consume la API dinámica y guarda en SQLite.
   - Si abres el archivo `index.html` de forma directa sin servidor, la web sigue funcionando de forma visual y accesible.

---

## ⚡ Cómo iniciar el servidor dinámico

Abre una terminal (PowerShell o Símbolo del Sistema) en esta carpeta:

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: (Opcional) Sembrar datos iniciales
Si deseas poblar la base de datos con tus servicios y testimonios por defecto:
```bash
npm run seed
```

### Paso 3: Iniciar la aplicación
```bash
npm start
```

Verás un mensaje como este en la consola:
```
======================================================
🚀 SERVIDOR DINÁMICO DEL PORTAFOLIO INICIADO
======================================================
🌐 Portafolio público:      http://localhost:3000
🔐 Panel de Administración: http://localhost:3000/admin
📦 Base de Datos:           SQLite (database/portfolio.db)
👤 Usuario inicial:         admin
🔑 Contraseña inicial:      admin123
======================================================
```

---

## 🔐 Credenciales del Panel de Administración

- **URL de acceso:** [http://localhost:3000/admin](http://localhost:3000/admin) (o haz clic en el enlace *"🔐 Acceso Admin"* en el pie de página de tu web).
- **Usuario:** `admin`
- **Contraseña inicial:** `admin123`
- *(Puedes cambiar tu contraseña en cualquier momento desde la pestaña "Ajustes & Contacto" dentro del panel)*.

---

## 📁 Estructura del Proyecto Full-Stack

```
portafolio jose/
├── package.json               # Dependencias de Node.js (express, better-sqlite3, bcryptjs, jwt, etc.)
├── server.js                  # Servidor Express y enrutamiento principal
├── database/
│   ├── schema.sql             # Esquema DDL de creación de tablas SQL
│   ├── db.js                  # Conexión a SQLite y verificación automática de tablas
│   ├── seed.js                # Sembrado de datos iniciales
│   └── portfolio.db           # Archivo físico de la base de datos SQLite
├── middleware/
│   └── auth.js                # Middleware de seguridad JWT para proteger el panel admin
├── routes/
│   ├── api.js                 # Endpoints públicos (GET /api/content, POST /api/contact, POST /api/analytics)
│   ├── auth.js                # Autenticación (login y verificación de tokens)
│   └── admin.js               # Rutas privadas (CRUD de prospectos, servicios, ajustes)
├── public/
│   └── admin/                 # Panel de Control Administrativo (CMS & CRM)
│       ├── index.html         # Interfaz del dashboard y login
│       ├── admin.css          # Estilos del panel
│       └── admin.js           # Lógica cliente del panel
├── index.html                 # Portafolio público
├── styles.css                 # Estilos visuales del portafolio
├── script.js                  # Lógica del portafolio conectada a la API
└── README.md                  # Esta documentación
```

---

## 🌐 Publicación en la Nube

Para subir tu aplicación dinámica a internet de forma permanente y gratuita:
- **Render.com / Railway.app / Fly.io:** Permiten ejecutar servidores Node.js con bases de datos SQLite persistentes de forma gratuita. Solo subes tu repositorio de GitHub y ejecutas `npm start`.
