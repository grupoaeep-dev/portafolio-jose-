/**
 * PORTAFOLIO DINÁMICO - JOSÉ HUMBERTO MEJÍA GODOY
 * Lógica Cliente: Consumo de API REST, Persistencia en SQLite e Interactividad
 */

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Actualizar el año en el footer automáticamente
  const yearElement = document.getElementById('currentYear');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // 2. Control del Menú Móvil
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Estilo de Navbar al hacer Scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 4. Indicador de Sección Activa en el Menú
  const sections = document.querySelectorAll('main section[id]');
  const handleScrollActive = () => {
    const scrollY = window.pageYOffset + 120;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop;
      const sectionId = current.getAttribute('id');
      const targetLink = document.querySelector(`.nav-menu a[href*="${sectionId}"]`);

      if (targetLink) {
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          targetLink.classList.add('active');
        } else {
          targetLink.classList.remove('active');
        }
      }
    });
  };
  window.addEventListener('scroll', handleScrollActive);

  // 5. Animación de Contadores de Métricas
  const statNumbers = document.querySelectorAll('.stat-number');
  let animated = false;

  const animateCounters = () => {
    statNumbers.forEach(counter => {
      const target = +counter.getAttribute('data-target') || 0;
      if (target === 0) return;
      const duration = 1500;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          counter.textContent = target;
          clearInterval(timer);
        } else {
          counter.textContent = Math.ceil(current);
        }
      }, stepTime);
    });
  };

  const heroSection = document.getElementById('inicio');
  if (heroSection && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animateCounters();
          animated = true;
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    statsObserver.observe(heroSection);
  } else {
    animateCounters();
  }

  // 6. Cargar Contenido Dinámico desde SQLite (vía API)
  fetchDynamicContent();

  // 7. Registro de Analítica Ligera (Visita a la página)
  recordEvent('page_view');

  // Registrar clic en botones de WhatsApp
  document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
    btn.addEventListener('click', () => recordEvent('whatsapp_click'));
  });

  // 8. Validación y Envío del Formulario de Contacto (POST /api/contact)
  const contactForm = document.getElementById('contactForm');
  const successBanner = document.getElementById('formSuccessMessage');
  const submitBtn = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const serviceSelect = document.getElementById('service');
      const messageInput = document.getElementById('message');

      let isValid = true;

      // Validación de Nombre
      if (!nameInput.value.trim()) {
        nameInput.parentElement.classList.add('has-error');
        isValid = false;
      } else {
        nameInput.parentElement.classList.remove('has-error');
      }

      // Validación de Correo
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim() || !emailPattern.test(emailInput.value.trim())) {
        emailInput.parentElement.classList.add('has-error');
        isValid = false;
      } else {
        emailInput.parentElement.classList.remove('has-error');
      }

      // Validación de Mensaje
      if (!messageInput.value.trim()) {
        messageInput.parentElement.classList.add('has-error');
        isValid = false;
      } else {
        messageInput.parentElement.classList.remove('has-error');
      }

      if (!isValid) return;

      // Estado de carga en el botón
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="22"></line>
        </svg>
        <span>Guardando en base de datos...</span>
      `;

      const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        service: serviceSelect.value,
        message: messageInput.value.trim()
      };

      try {
        await fetch(`${API_BASE}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const waNumber = window.currentWhatsappNumber || '';
        const waText = encodeURIComponent(
          `Hola José Humberto, mi nombre es ${payload.name}.\nEstoy interesado en: ${payload.service}.\nDetalles: ${payload.message}`
        );
        const waDirect = document.getElementById('whatsappDirectBtn');
        if (waDirect) {
          waDirect.href = `https://wa.me/${waNumber}?text=${waText}`;
        }

        if (successBanner) {
          successBanner.style.display = 'flex';
          successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        contactForm.reset();
      } catch (err) {
        console.warn('Operando en modo sin conexión:', err);
        if (successBanner) {
          successBanner.style.display = 'flex';
          successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        contactForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });

    contactForm.querySelectorAll('input, textarea').forEach(element => {
      element.addEventListener('input', () => {
        element.parentElement.classList.remove('has-error');
      });
    });
  }
});

async function fetchDynamicContent() {
  try {
    const res = await fetch(`${API_BASE}/content`);
    if (!res.ok) return;

    const data = await res.json();
    if (!data.success) return;

    const { settings } = data;

    if (settings) {
      if (settings.whatsapp_number) {
        window.currentWhatsappNumber = settings.whatsapp_number;
        const msg = encodeURIComponent(settings.whatsapp_message || 'Hola José Humberto');
        document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
          a.href = `https://wa.me/${settings.whatsapp_number}?text=${msg}`;
        });
      }

      if (settings.contact_email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
          a.href = `mailto:${settings.contact_email}`;
          if (a.querySelector('.method-value')) {
            a.querySelector('.method-value').textContent = settings.contact_email;
          }
        });
      }

      if (settings.stat_csat) updateCounterTarget(0, settings.stat_csat);
      if (settings.stat_commitment) updateCounterTarget(1, settings.stat_commitment);
      if (settings.stat_response_time) updateCounterTarget(2, settings.stat_response_time);
    }
  } catch (err) {
    // Fallback silencioso
  }
}

function updateCounterTarget(index, value) {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers[index]) {
    statNumbers[index].setAttribute('data-target', value);
  }
}

async function recordEvent(eventType) {
  try {
    await fetch(`${API_BASE}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType })
    });
  } catch (e) {}
}
