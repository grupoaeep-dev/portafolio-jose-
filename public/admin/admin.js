/**
 * LÓGICA DEL PANEL DE ADMINISTRACIÓN Y CRM
 * Archivo: public/admin/admin.js
 */

const API_BASE = '/api';
let authToken = localStorage.getItem('jh_admin_token') || '';

// Elementos del DOM
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// ==========================================================================
// 1. INICIALIZACIÓN Y AUTENTICACIÓN
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

// Comprobar si ya existe una sesión activa válida
async function checkAuth() {
  if (!authToken) {
    showLogin();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.ok) {
      const data = await res.json();
      showDashboard(data.user);
    } else {
      logout();
    }
  } catch (err) {
    console.error('Error verificando sesión:', err);
    showLogin();
  }
}

function showLogin() {
  loginView.style.display = 'flex';
  dashboardView.style.display = 'none';
}

function showDashboard(user) {
  loginView.style.display = 'none';
  dashboardView.style.display = 'flex';

  if (user && user.full_name) {
    document.getElementById('userDisplayName').textContent = user.full_name;
  }

  loadStats();
  loadLeads();
  loadServices();
  loadCases();
  loadSettings();
}

function logout() {
  authToken = '';
  localStorage.removeItem('jh_admin_token');
  showLogin();
}

// Configurar eventos generales
function setupEventListeners() {
  // Login submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.style.display = 'none';

      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok && data.token) {
          authToken = data.token;
          localStorage.setItem('jh_admin_token', authToken);
          showDashboard(data.user);
        } else {
          loginError.textContent = data.error || 'Credenciales inválidas.';
          loginError.style.display = 'block';
        }
      } catch (err) {
        loginError.textContent = 'Error de conexión con el servidor.';
        loginError.style.display = 'block';
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Navegación de pestañas (Tabs)
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Filtro de leads
  const statusFilter = document.getElementById('leadsStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => loadLeads(statusFilter.value));
  }

  const refreshBtn = document.getElementById('refreshLeadsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadLeads(statusFilter.value));
  }

  // Guardar Ajustes
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', saveSettings);
  }

  // Cambiar Contraseña
  const pwdForm = document.getElementById('changePasswordForm');
  if (pwdForm) {
    pwdForm.addEventListener('submit', changePassword);
  }
}

// Cambiar de pestaña en el dashboard
window.switchTab = function(tabId) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.getAttribute('id') === tabId);
  });

  const titles = {
    'tab-overview': ['Resumen General', 'Métricas y actividad reciente'],
    'tab-leads': ['CRM de Prospectos & Mensajes', 'Historial y atención personalizada de contactos'],
    'tab-services': ['Catálogo de Servicios', 'Servicios publicados en tu portafolio'],
    'tab-cases': ['Casos de Éxito', 'Campañas publicitarias y proyectos destacados'],
    'tab-settings': ['Ajustes y Contacto', 'Número de WhatsApp, correo y datos mostrados']
  };

  if (titles[tabId]) {
    document.getElementById('topbarHeading').textContent = titles[tabId][0];
    document.getElementById('topbarSub').textContent = titles[tabId][1];
  }
};

// ==========================================================================
// 2. MÉTRICAS GENERALES
// ==========================================================================
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) return;

    const stats = await res.json();
    document.getElementById('kpiTotalLeads').textContent = stats.totalLeads || 0;
    document.getElementById('kpiNewLeads').textContent = stats.newLeads || 0;
    document.getElementById('kpiWhatsappClicks').textContent = stats.whatsappClicks || 0;
    document.getElementById('kpiPageViews').textContent = stats.pageViews || 0;

    const badge = document.getElementById('sidebarNewLeadsBadge');
    if (badge) {
      badge.textContent = stats.newLeads || 0;
      badge.style.display = stats.newLeads > 0 ? 'inline-block' : 'none';
    }
  } catch (err) {
    console.error('Error cargando estadísticas:', err);
  }
}

// ==========================================================================
// 3. GESTIÓN DE PROSPECTOS / LEADS (CRM)
// ==========================================================================
async function loadLeads(status = 'todos') {
  const container = document.getElementById('leadsListContainer');
  const recentTbody = document.getElementById('recentLeadsTbody');

  try {
    const url = status && status !== 'todos' 
      ? `${API_BASE}/admin/leads?status=${status}`
      : `${API_BASE}/admin/leads`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!res.ok) throw new Error('Error al cargar leads');
    const leads = await res.json();

    // 1. Renderizar tabla de últimos en el overview
    if (recentTbody) {
      if (leads.length === 0) {
        recentTbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay mensajes registrados aún.</td></tr>';
      } else {
        recentTbody.innerHTML = leads.slice(0, 5).map(l => `
          <tr>
            <td>${formatDate(l.created_at)}</td>
            <td><strong>${escapeHtml(l.name)}</strong></td>
            <td>${escapeHtml(l.service_interested)}</td>
            <td><span class="status-badge status-${l.status}">${l.status}</span></td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="switchTab('tab-leads')">Ver detalle</button>
            </td>
          </tr>
        `).join('');
      }
    }

    // 2. Renderizar lista completa en pestaña Leads
    if (!container) return;

    if (leads.length === 0) {
      container.innerHTML = '<div class="text-center p-4">No se encontraron prospectos con este filtro.</div>';
      return;
    }

    container.innerHTML = leads.map(l => `
      <div class="lead-card" id="leadCard-${l.id}">
        <div class="lead-card-header">
          <div class="lead-title-row">
            <span class="lead-name">${escapeHtml(l.name)}</span>
            <span class="status-badge status-${l.status}">${l.status}</span>
          </div>
          <span class="lead-date">${formatDate(l.created_at)}</span>
        </div>

        <div class="lead-info-meta">
          <span>✉️ <strong>${escapeHtml(l.email)}</strong></span> &bull; 
          <span>🎯 Interés: <strong>${escapeHtml(l.service_interested)}</strong></span>
        </div>

        <div class="lead-body">
          "${escapeHtml(l.message)}"
        </div>

        <div class="lead-footer">
          <!-- Selector de Estado -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-size: 0.8rem; color: var(--text-muted);">Estado:</label>
            <select class="filter-select" style="width: auto; padding: 6px 10px;" onchange="updateLeadStatus(${l.id}, this.value)">
              <option value="nuevo" ${l.status === 'nuevo' ? 'selected' : ''}>Nuevo</option>
              <option value="contactado" ${l.status === 'contactado' ? 'selected' : ''}>Contactado</option>
              <option value="en_negociacion" ${l.status === 'en_negociacion' ? 'selected' : ''}>En Negociación</option>
              <option value="cerrado" ${l.status === 'cerrado' ? 'selected' : ''}>Cerrado / Ganado</option>
              <option value="descartado" ${l.status === 'descartado' ? 'selected' : ''}>Descartado</option>
            </select>
          </div>

          <!-- Acciones de contacto directo -->
          <div class="lead-actions">
            <a href="mailto:${encodeURIComponent(l.email)}?subject=Contacto%20de%20José%20Humberto%20Mejía%20Godoy" class="btn btn-sm btn-secondary">
              Responder por Correo
            </a>
            <button class="btn btn-sm btn-danger" onclick="deleteLead(${l.id})">Eliminar</button>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    if (container) container.innerHTML = '<div class="alert-error">Error al cargar los prospectos.</div>';
  }
}

// Actualizar estado de un lead
window.updateLeadStatus = async function(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/admin/leads/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      loadStats();
      loadLeads(document.getElementById('leadsStatusFilter').value);
    }
  } catch (err) {
    alert('Error al actualizar estado.');
  }
};

// Eliminar lead
window.deleteLead = async function(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este prospecto?')) return;

  try {
    const res = await fetch(`${API_BASE}/admin/leads/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.ok) {
      loadStats();
      loadLeads(document.getElementById('leadsStatusFilter').value);
    }
  } catch (err) {
    alert('Error al eliminar.');
  }
};

// ==========================================================================
// 4. GESTIÓN DE SERVICIOS
// ==========================================================================
async function loadServices() {
  const container = document.getElementById('servicesListContainer');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/admin/services`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) return;

    const services = await res.json();
    container.innerHTML = services.map(s => `
      <div class="item-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <h4>${escapeHtml(s.title)}</h4>
          <span class="status-badge ${s.is_active ? 'status-cerrado' : 'status-descartado'}">
            ${s.is_active ? 'Activo' : 'Pausado'}
          </span>
        </div>
        <p>${escapeHtml(s.description)}</p>
        <ul style="font-size: 0.85rem; color: var(--text-muted); padding-left: 18px;">
          ${s.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
        <div class="item-actions">
          <button class="btn btn-sm btn-secondary" onclick="toggleService(${s.id}, ${s.is_active ? 0 : 1})">
            ${s.is_active ? 'Pausar' : 'Activar'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteService(${s.id})">Eliminar</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error cargando servicios:', err);
  }
}

window.toggleService = async function(id, newActiveState) {
  try {
    await fetch(`${API_BASE}/admin/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ is_active: newActiveState })
    });
    loadServices();
  } catch (err) {
    alert('Error al actualizar servicio.');
  }
};

window.deleteService = async function(id) {
  if (!confirm('¿Deseas eliminar este servicio?')) return;
  try {
    await fetch(`${API_BASE}/admin/services/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    loadServices();
  } catch (err) {
    alert('Error al eliminar servicio.');
  }
};

// ==========================================================================
// 5. GESTIÓN DE CASOS DE ÉXITO
// ==========================================================================
async function loadCases() {
  const container = document.getElementById('casesListContainer');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/admin/cases`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) return;

    const cases = await res.json();
    container.innerHTML = cases.map(c => `
      <div class="item-card">
        <span class="status-badge status-nuevo">${escapeHtml(c.badge)}</span>
        <h4>${escapeHtml(c.title)}</h4>
        <p><strong>Reto:</strong> ${escapeHtml(c.problem)}</p>
        <p><strong>Solución:</strong> ${escapeHtml(c.solution)}</p>
        <p style="color: #34d399;"><strong>Resultado:</strong> ${escapeHtml(c.result)}</p>
        <div class="item-actions">
          <button class="btn btn-sm btn-danger" onclick="deleteCase(${c.id})">Eliminar</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error cargando casos:', err);
  }
}

window.deleteCase = async function(id) {
  if (!confirm('¿Deseas eliminar este caso?')) return;
  try {
    await fetch(`${API_BASE}/admin/cases/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    loadCases();
  } catch (err) {
    alert('Error al eliminar caso.');
  }
};

// ==========================================================================
// 6. AJUSTES DEL SITIO
// ==========================================================================
async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) return;

    const s = await res.json();
    if (s.whatsapp_number !== undefined) document.getElementById('settingWhatsapp').value = s.whatsapp_number;
    if (s.contact_email !== undefined) document.getElementById('settingEmail').value = s.contact_email;
    if (s.hero_title !== undefined) document.getElementById('settingHeroTitle').value = s.hero_title;
    if (s.hero_subtitle !== undefined) document.getElementById('settingHeroSubtitle').value = s.hero_subtitle;
    if (s.stat_csat !== undefined) document.getElementById('settingStatCsat').value = s.stat_csat;
    if (s.stat_commitment !== undefined) document.getElementById('settingStatCommitment').value = s.stat_commitment;
    if (s.stat_response_time !== undefined) document.getElementById('settingStatResponseTime').value = s.stat_response_time;
  } catch (err) {
    console.error('Error cargando configuraciones:', err);
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const msg = document.getElementById('settingsSavedMsg');

  const updates = {
    whatsapp_number: document.getElementById('settingWhatsapp').value.trim(),
    contact_email: document.getElementById('settingEmail').value.trim(),
    hero_title: document.getElementById('settingHeroTitle').value.trim(),
    hero_subtitle: document.getElementById('settingHeroSubtitle').value.trim(),
    stat_csat: document.getElementById('settingStatCsat').value,
    stat_commitment: document.getElementById('settingStatCommitment').value,
    stat_response_time: document.getElementById('settingStatResponseTime').value
  };

  try {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updates)
    });

    if (res.ok) {
      msg.style.display = 'inline';
      setTimeout(() => { msg.style.display = 'none'; }, 3000);
    }
  } catch (err) {
    alert('Error al guardar configuraciones.');
  }
}

// ==========================================================================
// 7. SEGURIDAD Y CONTRASEÑA
// ==========================================================================
async function changePassword(e) {
  e.preventDefault();
  const alertBox = document.getElementById('passwordAlert');
  alertBox.style.display = 'none';

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;

  try {
    const res = await fetch(`${API_BASE}/admin/profile/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();
    alertBox.style.display = 'block';

    if (res.ok) {
      alertBox.className = 'alert-info';
      alertBox.textContent = data.message || 'Contraseña actualizada con éxito.';
      document.getElementById('changePasswordForm').reset();
    } else {
      alertBox.className = 'alert-error';
      alertBox.textContent = data.error || 'Error al actualizar contraseña.';
    }
  } catch (err) {
    alertBox.style.display = 'block';
    alertBox.className = 'alert-error';
    alertBox.textContent = 'Error de conexión.';
  }
}

// ==========================================================================
// HELPERS
// ==========================================================================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
