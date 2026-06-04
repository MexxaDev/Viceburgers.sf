'use strict';

import state from '../js/state.js';
import { escapeHtml } from '../utils/sanitizer.js';
import { ROLES } from '../config/permissions.js';
import { BRAND } from '../config/brandConfig.js';

const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.CAJERO]: 'Cajero'
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

class Header {
  constructor() {
    this.element = null;
  }

  render() {
    const user = state.get('currentUser');
    const isCashier = user && user.role === 'cajero';
    const sidebarMode = state.get('sidebarMode') || 'expanded';
    const isCollapsed = sidebarMode === 'collapsed' || sidebarMode === 'hover';
    return `
      <div class="header-left">
        <button class="btn btn-ghost btn-icon" id="sidebar-toggle-btn" title="${isCollapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}">
          <i class="fa-solid ${isCollapsed ? 'fa-bars' : 'fa-xmark'}"></i>
        </button>
        <button class="btn btn-ghost btn-icon" id="mobile-menu-btn" style="${isCashier ? 'display:block;' : 'display:none;'}">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="header-brand">
          <img src="${BRAND.logoSmall}" alt="${BRAND.name}" height="28">
          <span>${BRAND.name}</span>
        </div>
      </div>
      <div class="header-right">
        <button class="pos-cash-btn" id="pos-cash-btn" title="Gesti\u00f3n de Caja" aria-label="Gesti\u00f3n de Caja" style="display:none">
          <i class="fa-solid fa-cash-register"></i>
        </button>
        <div class="alerts-btn-wrapper">
          <button class="alerts-btn" id="header-alerts-btn" title="Alertas">
            <i class="fa-solid fa-bell"></i>
            <span class="alerts-badge" id="header-alerts-badge" style="display:none"></span>
          </button>
          <div class="alerts-popover" id="header-alerts-popover">
            <div class="alerts-popover__header">
              <span class="alerts-popover__title">Notificaciones</span>
              <span class="alerts-popover__count" id="header-alerts-count" style="display:none"></span>
            </div>
            <div id="header-alerts-content"></div>
          </div>
        </div>
        <div class="user-btn-wrapper">
          <button class="user-btn" id="header-user-btn" title="Usuario">
            <i class="fa-solid fa-user"></i>
          </button>
          <div class="user-popover" id="header-user-popover">
            <div class="user-popover__header">
              <div class="user-popover__avatar">
                <i class="fa-solid fa-user"></i>
              </div>
              <div>
                <div class="user-popover__name">${user ? escapeHtml(user.name) : ''}</div>
                <div class="user-popover__role">${user ? getRoleLabel(user.role) : ''}</div>
              </div>
            </div>
            <div class="user-popover__body">
              <button class="user-popover__btn user-popover__btn--logout" id="header-logout-btn">
                <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesi\u00f3n
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  mount(container) {
    this.element = container;
    container.innerHTML = this.render();

    const mobileBtn = document.getElementById('mobile-menu-btn');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');

    if (window.innerWidth <= 768) {
      mobileBtn.style.display = 'block';
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        mobileBtn.style.display = 'block';
      } else {
        mobileBtn.style.display = 'none';
      }
    });

    mobileBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('open');
    });

    toggleBtn.addEventListener('click', () => {
      const app = document.getElementById('app');
      const currentMode = state.get('sidebarMode') || 'expanded';

      if (currentMode === 'expanded') {
        state.set('sidebarMode', 'collapsed');
        app.classList.add('sidebar-collapsed');
        app.classList.remove('sidebar-hidden');
      } else if (currentMode === 'collapsed' || currentMode === 'hover') {
        state.set('sidebarMode', 'hidden');
        app.classList.add('sidebar-hidden');
        app.classList.remove('sidebar-collapsed');
      } else {
        state.set('sidebarMode', 'expanded');
        app.classList.remove('sidebar-collapsed', 'sidebar-hidden');
      }

      this.updateToggleIcon();
    });

    this._initAlertsPopover();
    this._initUserPopover();
    this.updateToggleIcon();
  }

  _initAlertsPopover() {
    const btn = document.getElementById('header-alerts-btn');
    const popover = document.getElementById('header-alerts-popover');
    if (!btn || !popover) {
      return;
    }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      popover.classList.toggle('active');
      document.getElementById('header-user-popover')?.classList.remove('active');
    });

    document.addEventListener('click', e => {
      if (popover && !popover.contains(e.target) && e.target !== btn) {
        popover.classList.remove('active');
      }
    });
  }

  _initUserPopover() {
    const btn = document.getElementById('header-user-btn');
    const popover = document.getElementById('header-user-popover');
    const logoutBtn = document.getElementById('header-logout-btn');
    if (!btn || !popover) {
      return;
    }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      popover.classList.toggle('active');
      document.getElementById('header-alerts-popover')?.classList.remove('active');
    });

    document.addEventListener('click', e => {
      if (popover && !popover.contains(e.target) && e.target !== btn) {
        popover.classList.remove('active');
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (!window.confirm('\u00bfEst\u00e1s seguro de cerrar sesi\u00f3n?')) {
          return;
        }
        state.clearSession();
        window.location.reload();
      });
    }
  }

  updateToggleIcon() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (!toggleBtn) {
      return;
    }

    const currentMode = state.get('sidebarMode') || 'expanded';
    const icon = toggleBtn.querySelector('i');
    if (currentMode === 'expanded') {
      icon.className = 'fa-solid fa-xmark';
      toggleBtn.title = 'Ocultar sidebar';
    } else {
      icon.className = 'fa-solid fa-bars';
      toggleBtn.title = 'Mostrar sidebar';
    }
  }
}

export default Header;
