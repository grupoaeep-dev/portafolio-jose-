/**
 * SCRIPT DE SEMBRADO (SEED) PARA POBLAR LA BASE DE DATOS SQLITE CON DATOS INICIALES
 * Ejecutar con: npm run seed
 */

const db = require('./db');

console.log('🌱 Iniciando sembrado de datos en SQLite...');

// 1. Configuraciones iniciales del sitio
const settings = [
  { key: 'site_title', value: 'José Humberto Mejía Godoy | Servicio al Cliente & Publicidad' },
  { key: 'hero_badge', value: 'Disponible para nuevos proyectos y contratación' },
  { key: 'hero_title', value: 'Atención al cliente que fideliza, publicidad que convierte.' },
  { key: 'hero_subtitle', value: 'Hola, soy José Humberto Mejía Godoy. Ayudo a marcas y negocios a conectar con sus clientes mediante campañas de anuncios efectivas y una atención al cliente empática y resolutiva que transforma visitantes en clientes leales.' },
  { key: 'stat_csat', value: '99' },
  { key: 'stat_commitment', value: '100' },
  { key: 'stat_response_time', value: '5' },
  { key: 'whatsapp_number', value: '' },
  { key: 'whatsapp_message', value: 'Hola José Humberto, vi tu portafolio y me gustaría conversar contigo.' },
  { key: 'contact_email', value: 'josehumbertomejiagodoy@email.com' },
  { key: 'location_text', value: 'Remoto / Presencial' }
];

const insertSetting = db.prepare(`
  INSERT INTO site_settings (key, value)
  VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

db.exec('BEGIN TRANSACTION;');
for (const item of settings) {
  insertSetting.run(item.key, item.value);
}
db.exec('COMMIT;');
console.log('✅ Configuraciones globales sembradas.');

// 2. Servicios iniciales
const serviceRow = db.prepare('SELECT COUNT(*) as count FROM services').get();
const serviceCount = serviceRow ? serviceRow.count : 0;

if (serviceCount === 0) {
  const insertService = db.prepare(`
    INSERT INTO services (order_num, title, description, features_json, icon_svg, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const services = [
    {
      order_num: 1,
      title: 'Publicidad & Creación de Anuncios',
      description: 'Planificación y ejecución de anuncios en redes sociales orientados a conseguir mensajes, prospectos y ventas efectivas.',
      features: [
        'Configuración de campañas en Meta Ads (Facebook & Instagram).',
        'Redacción de copys persuasivos y llamadas a la acción.',
        'Segmentación por intereses, ubicación y comportamiento.',
        'Monitoreo y optimización para cuidar tu presupuesto publicitario.'
      ],
      icon: 'ads'
    },
    {
      order_num: 2,
      title: 'Atención al Cliente Multicanal',
      description: 'Soporte cálido y profesional en todos los puntos de contacto para responder preguntas, despejar objeciones y cerrar ventas.',
      features: [
        'Atención inmediata vía WhatsApp Business y Chat web.',
        'Gestión de mensajes directos y comentarios en redes sociales.',
        'Atención de dudas, tickets y soporte por correo electrónico.',
        'Tono de comunicación empático y alineado a la imagen de marca.'
      ],
      icon: 'phone'
    },
    {
      order_num: 3,
      title: 'Fidelización y Servicio Post-Venta',
      description: 'Un cliente satisfecho vuelve a comprar y recomienda. Mantengo el contacto después de la compra para garantizar una experiencia satisfactoria.',
      features: [
        'Seguimiento de pedidos y confirmación de entrega satisfactoria.',
        'Resolución ágil de inquietudes o inconformidades posteriores.',
        'Encuestas breves de satisfacción y solicitud de testimonios.',
        'Estrategias de re-compra para clientes actuales.'
      ],
      icon: 'heart'
    },
    {
      order_num: 4,
      title: 'Organización de Leads y CRM',
      description: 'Estructuración y control de prospectos para que ningún interesado se pierda y el proceso comercial sea claro y medible.',
      features: [
        'Etiquetado y clasificación de prospectos según nivel de interés.',
        'Creación de respuestas rápidas y plantillas comerciales.',
        'Registro de historial de interacciones y notas de clientes.',
        'Reportes de interacciones y oportunidades de mejora continua.'
      ],
      icon: 'crm'
    }
  ];

  db.exec('BEGIN TRANSACTION;');
  for (const s of services) {
    insertService.run(s.order_num, s.title, s.description, JSON.stringify(s.features), s.icon);
  }
  db.exec('COMMIT;');
  console.log('✅ Servicios iniciales sembrados.');
}

// 3. Casos de Éxito iniciales
const caseRow = db.prepare('SELECT COUNT(*) as count FROM case_studies').get();
const casesCount = caseRow ? caseRow.count : 0;

if (casesCount === 0) {
  const insertCase = db.prepare(`
    INSERT INTO case_studies (order_num, badge, title, problem, solution, result, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const cases = [
    {
      order_num: 1,
      badge: 'Publicidad + Soporte Inmediato',
      title: 'Campaña de Anuncios hacia WhatsApp',
      problem: 'El negocio recibía clics en sus anuncios pero los prospectos no compraban porque demoraban horas en contestarles.',
      solution: 'Rediseñé los copys del anuncio para filtrar usuarios de alto interés y configuré un protocolo de atención inmediata en WhatsApp con respuestas en menos de 3 minutos.',
      result: 'Aumento del 45% en la tasa de cierre de ventas por mensaje.'
    },
    {
      order_num: 2,
      badge: 'Resolución y Fidelización',
      title: 'Gestión de Clientes Críticos e Incidencias',
      problem: 'Quejas recurrentes por retrasos en entregas que ponían en riesgo la reputación de la marca.',
      solution: 'Implementé un protocolo de escucha activa, contacto proactivo anticipado antes de que el cliente reclamara y compensaciones justas.',
      result: '90% de retención de clientes con incidencias, convirtiéndolos en compradores habituales.'
    },
    {
      order_num: 3,
      badge: 'Optimización de Inversión',
      title: 'Segmentación Precisa de Anuncios',
      problem: 'Gasto publicitario elevado con baja calidad de contactos y prospectos desinteresados.',
      solution: 'Reestructuré el público objetivo en Meta Ads mediante segmentación detallada, excluyendo audiencias irrelevantes y mejorando la oferta visual.',
      result: 'Reducción del 35% en el costo por lead calificado con mayor tasa de respuesta.'
    }
  ];

  db.exec('BEGIN TRANSACTION;');
  for (const c of cases) {
    insertCase.run(c.order_num, c.badge, c.title, c.problem, c.solution, c.result);
  }
  db.exec('COMMIT;');
  console.log('✅ Casos de éxito iniciales sembrados.');
}

// 4. Testimonios iniciales
const testRow = db.prepare('SELECT COUNT(*) as count FROM testimonials').get();
const testCount = testRow ? testRow.count : 0;

if (testCount === 0) {
  const insertTestimonial = db.prepare(`
    INSERT INTO testimonials (author_name, author_role, avatar_initials, content, rating, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const testimonials = [
    {
      author_name: 'María C.',
      author_role: 'Supervisora de Operaciones',
      avatar_initials: 'MC',
      content: 'José tiene un don especial para comunicarse con las personas. Siempre mantuvo la calma con clientes difíciles y logró resolver sus dudas con amabilidad y rapidez.',
      rating: 5
    },
    {
      author_name: 'Eduardo R.',
      author_role: 'Emprendedor / Tienda Online',
      avatar_initials: 'ER',
      content: 'Desde que José tomó la atención de nuestros mensajes de Facebook e Instagram, las ventas subieron notablemente porque contestaba al instante y con un trato súper profesional.',
      rating: 5
    },
    {
      author_name: 'Laura G.',
      author_role: 'Coordinadora Comercial',
      avatar_initials: 'LG',
      content: 'Muy comprometido y puntual. Sus recomendaciones para optimizar los anuncios nos ayudaron a gastar menos y tener más prospectos verdaderamente interesados.',
      rating: 5
    }
  ];

  db.exec('BEGIN TRANSACTION;');
  for (const t of testimonials) {
    insertTestimonial.run(t.author_name, t.author_role, t.avatar_initials, t.content, t.rating);
  }
  db.exec('COMMIT;');
  console.log('✅ Testimonios iniciales sembrados.');
}

console.log('🎉 Sembrado completado exitosamente.');
