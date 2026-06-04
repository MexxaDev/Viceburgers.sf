'use strict';

import burgerStockService from './burgerStockService.js';
import { getIngredientInfo } from './recipes.js';
import Modal from '../../components/modal.js';
import Toast from '../../components/toast.js';

class BurgerStockUI {
  constructor() {
    this.mode = 'today';
  }

  render(container) {
    if (!container) {
      return;
    }

    if (!burgerStockService.session && this.mode === 'today') {
      this._renderSessionForm(container);
    } else {
      this._renderDashboard(container);
    }
  }

  _renderSessionForm(container) {
    container.innerHTML = `
      <div class="burger-header">
        <div class="burger-header__left">
          <h1 class="burger-header__title"><i class="fa-solid fa-burger"></i> Reportes Burgers</h1>
          <p class="burger-header__subtitle">Control de stock de ingredientes</p>
        </div>
      </div>
      <div class="burger-session-form">
        <div class="burger-session-card">
          <div class="burger-session-card__icon"><i class="fa-solid fa-cash-register"></i></div>
          <h2 class="burger-session-card__title">Iniciar sesión de stock</h2>
          <p class="burger-session-card__desc">Ingresá el stock inicial disponible hoy para comenzar el control de ingredientes.</p>
          <div class="burger-session-form__fields">
            <div class="burger-session-field">
              <label class="burger-session-field__label"><i class="fa-solid fa-bread-slice"></i> Panes disponibles</label>
              <input type="number" class="burger-session-field__input" id="burger-session-bread" min="0" step="1" value="0" placeholder="0">
            </div>
            <div class="burger-session-field">
              <label class="burger-session-field__label"><i class="fa-solid fa-drumstick-bite"></i> Medallones disponibles</label>
              <input type="number" class="burger-session-field__input" id="burger-session-patty" min="0" step="1" value="0" placeholder="0">
            </div>
          </div>
          <button class="burger-session-btn" id="burger-session-start-btn">
            <i class="fa-solid fa-play"></i> Iniciar sesión
          </button>
        </div>
      </div>
    `;

    document.getElementById('burger-session-start-btn').onclick = async () => {
      const bread = parseInt(document.getElementById('burger-session-bread').value) || 0;
      const patty = parseInt(document.getElementById('burger-session-patty').value) || 0;
      if (bread <= 0 && patty <= 0) {
        Toast.error('Error', 'Ingresá al menos un valor mayor a 0');
        return;
      }
      await burgerStockService.openSession(bread, patty);
      Toast.success('Sesión iniciada', `Stock: ${bread} panes, ${patty} medallones`);
      this._renderDashboard(container);
    };
  }

  _renderDashboard(container) {
    const session = burgerStockService.session;
    const mode = this.mode;

    const breadStock = session?.currentStock?.bread || 0;
    const pattyStock = session?.currentStock?.patty || 0;
    const breadOpening = session?.openingStock?.bread || 1;
    const pattyOpening = session?.openingStock?.patty || 1;
    const breadPct = mode === 'today' && session ? Math.max(0, Math.min(100, (breadStock / breadOpening) * 100)) : 0;
    const pattyPct = mode === 'today' && session ? Math.max(0, Math.min(100, (pattyStock / pattyOpening) * 100)) : 0;

    const breadState = session ? burgerStockService.getIngredientThresholdState('bread') : 'normal';
    const pattyState = session ? burgerStockService.getIngredientThresholdState('patty') : 'normal';

    container.innerHTML = `
      <div class="burger-header">
        <div class="burger-header__left">
          <h1 class="burger-header__title"><i class="fa-solid fa-burger"></i> Reportes Burgers</h1>
          <p class="burger-header__subtitle">${mode === 'today' ? (session ? `Sesión activa · ${new Date(session.openedAt).toLocaleString()}` : 'Sin sesión activa') : 'Acumulado histórico'}</p>
        </div>
        <div class="burger-header__actions">
          <div class="burger-mode-toggle" style="display:flex;background:var(--color-gray-100);border-radius:var(--radius-lg);padding:2px;margin-right:var(--space-2);">
            <button class="burger-toggle-btn ${mode === 'today' ? 'active' : ''}" data-mode="today" style="padding:6px 14px;border:none;border-radius:var(--radius-md);background:${mode === 'today' ? 'var(--color-surface)' : 'transparent'};color:${mode === 'today' ? 'var(--color-text)' : 'var(--color-text-secondary)'};font-size:var(--text-sm);font-weight:var(--font-medium);cursor:pointer;">Hoy</button>
            <button class="burger-toggle-btn ${mode === 'historical' ? 'active' : ''}" data-mode="historical" style="padding:6px 14px;border:none;border-radius:var(--radius-md);background:${mode === 'historical' ? 'var(--color-surface)' : 'transparent'};color:${mode === 'historical' ? 'var(--color-text)' : 'var(--color-text-secondary)'};font-size:var(--text-sm);font-weight:var(--font-medium);cursor:pointer;">Histórico</button>
          </div>
          ${mode === 'today' && session ? '<button class="burger-btn burger-btn--outline" id="burger-adjust-btn"><i class="fa-solid fa-sliders"></i> Ajustar stock</button>' : ''}
          <button class="burger-btn burger-btn--outline" id="burger-refresh-btn">
            <i class="fa-solid fa-rotate"></i>
          </button>
        </div>
      </div>

      ${mode === 'today' ? this._renderTodayKPIs(session, breadStock, pattyStock, breadOpening, pattyOpening, breadPct, pattyPct, breadState, pattyState) : ''}
      ${mode === 'historical' ? '<div id="burger-historical-content"><p class="burger-loading">Cargando datos históricos...</p></div>' : ''}

      <div class="burger-panel" id="burger-ranking-panel">
        <div class="burger-panel__header">
          <h3 class="burger-panel__title"><i class="fa-solid fa-trophy"></i> ${mode === 'today' ? 'Productos más vendidos hoy' : 'Productos más vendidos (histórico)'}</h3>
        </div>
        <div class="burger-panel__body" id="burger-ranking-body">
          <p class="burger-loading">Cargando ranking...</p>
        </div>
      </div>

      <div class="burger-panel">
        <div class="burger-panel__header">
          <h3 class="burger-panel__title"><i class="fa-solid fa-clock-rotate-left"></i> ${mode === 'today' ? 'Movimientos en vivo' : 'Sesiones registradas'}</h3>
        </div>
        <div class="burger-panel__body">
          <div class="burger-table-container">
            <table class="burger-table" id="burger-movements-table">
              <thead>
                <tr>
                  ${mode === 'today' ? '<th>Hora</th><th>Producto</th><th>Pan</th><th>Medallón</th><th>Acción</th>' : '<th>Fecha</th><th>Inicio</th><th>Fin</th><th>Panes</th><th>Medallones</th><th>Estado</th>'}
                </tr>
              </thead>
              <tbody id="burger-movements-body">
                <tr><td colspan="6" class="burger-loading">Cargando...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this._attachDashboardEvents(container);
    if (mode === 'today') {
      this._loadRanking(false);
      if (session) this._loadMovements();
    } else {
      this._loadHistorical();
    }
  }

  _renderTodayKPIs(session, breadStock, pattyStock, breadOpening, pattyOpening, breadPct, pattyPct, breadState, pattyState) {
    return `
      <div class="burger-kpi-grid">
        <div class="burger-kpi burger-kpi--${breadState}">
          <div class="burger-kpi__header">
            <span class="burger-kpi__icon"><i class="fa-solid fa-bread-slice"></i></span>
            <span class="burger-kpi__label">PAN</span>
          </div>
          <div class="burger-kpi__value">${breadStock}</div>
          <div class="burger-kpi__bar">
            <div class="burger-kpi__bar-fill" style="width:${breadPct}%"></div>
          </div>
          <div class="burger-kpi__footer">
            <span>${this._getStateLabel(breadState)}</span>
            <span>${breadStock}/${breadOpening}</span>
          </div>
        </div>
        <div class="burger-kpi burger-kpi--${pattyState}">
          <div class="burger-kpi__header">
            <span class="burger-kpi__icon"><i class="fa-solid fa-drumstick-bite"></i></span>
            <span class="burger-kpi__label">MEDALLÓN</span>
          </div>
          <div class="burger-kpi__value">${pattyStock}</div>
          <div class="burger-kpi__bar">
            <div class="burger-kpi__bar-fill" style="width:${pattyPct}%"></div>
          </div>
          <div class="burger-kpi__footer">
            <span>${this._getStateLabel(pattyState)}</span>
            <span>${pattyStock}/${pattyOpening}</span>
          </div>
        </div>
      </div>
      <div class="burger-stats-row">
        <div class="burger-stat-card">
          <div class="burger-stat-card__label">Pan consumido hoy</div>
          <div class="burger-stat-card__value">-${session.totalBreadsConsumed || 0}</div>
        </div>
        <div class="burger-stat-card">
          <div class="burger-stat-card__label">Medallón consumido hoy</div>
          <div class="burger-stat-card__value">-${session.totalPattiesConsumed || 0}</div>
        </div>
        <div class="burger-stat-card">
          <div class="burger-stat-card__label">Sesión</div>
          <div class="burger-stat-card__value burger-stat-card__value--sm">${new Date(session.openedAt).toLocaleDateString()}</div>
        </div>
      </div>
    `;
  }

  _attachDashboardEvents(container) {
    container.querySelectorAll('.burger-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.mode !== this.mode) {
          this.mode = btn.dataset.mode;
          const burgerContainer = document.getElementById('burger-stock-container');
          if (burgerContainer) {
            this._renderDashboard(burgerContainer);
          }
        }
      });
    });

    document.getElementById('burger-adjust-btn').onclick = () => this._showAdjustModal();
    document.getElementById('burger-refresh-btn').onclick = () => {
      if (this.mode === 'today') {
        this._loadRanking(false);
        if (burgerStockService.session) this._loadMovements();
      } else {
        this._loadHistorical();
      }
      Toast.success('Actualizado', 'Datos refrescados');
    };
  }

  async _loadRanking(isHistorical) {
    const body = document.getElementById('burger-ranking-body');
    if (!body) {
      return;
    }
    try {
      const ranking = isHistorical ? await burgerStockService.getCumulativeProductRanking() : await burgerStockService.getProductRanking();
      if (ranking.length === 0) {
        body.innerHTML = '<p class="burger-empty">Sin ventas de burgers registradas</p>';
        return;
      }
      body.innerHTML = ranking
        .slice(0, 5)
        .map(
          (item, i) => `
        <div class="burger-ranking-item">
          <span class="burger-ranking-pos">${i + 1}</span>
          <span class="burger-ranking-name">${item.name}</span>
          <span class="burger-ranking-stats">
            <span class="burger-ranking-stat"><i class="fa-solid fa-bread-slice"></i> ${item.breads}</span>
            <span class="burger-ranking-stat"><i class="fa-solid fa-drumstick-bite"></i> ${item.patties}</span>
          </span>
        </div>
      `
        )
        .join('');
    } catch (e) {
      body.innerHTML = '<p class="burger-empty">Error al cargar ranking</p>';
    }
  }

  async _loadMovements() {
    const body = document.getElementById('burger-movements-body');
    if (!body) {
      return;
    }
    try {
      const movements = await burgerStockService.getRecentMovements(50);
      if (movements.length === 0) {
        body.innerHTML = '<tr><td colspan="5" class="burger-empty">Sin movimientos hoy</td></tr>';
        return;
      }
      body.innerHTML = movements
        .map(m => {
          const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const breadDelta = m.ingredientId === 'bread' ? m.delta : 0;
          const pattyDelta = m.ingredientId === 'patty' ? m.delta : 0;
          const actionLabel = this._getActionLabel(m.action);
          return `<tr>
          <td class="burger-cell--time">${time}</td>
          <td>${m.productName || '-'}</td>
          <td class="${breadDelta < 0 ? 'burger-cell--neg' : ''}">${breadDelta < 0 ? breadDelta : '-'}</td>
          <td class="${pattyDelta < 0 ? 'burger-cell--neg' : ''}">${pattyDelta < 0 ? pattyDelta : '-'}</td>
          <td><span class="burger-badge burger-badge--${m.action}">${actionLabel}</span></td>
        </tr>`;
        })
        .join('');
    } catch (e) {
      body.innerHTML = '<tr><td colspan="5" class="burger-empty">Error al cargar movimientos</td></tr>';
    }
  }

  async _loadHistorical() {
    const contentDiv = document.getElementById('burger-historical-content');
    const rankingBody = document.getElementById('burger-ranking-body');
    const movementsBody = document.getElementById('burger-movements-body');
    const movementsHeader = document.querySelector('#burger-movements-table thead tr');
    if (!movementsBody) return;

    try {
      const [cumulBread, cumulPatty, sessions] = await Promise.all([
        burgerStockService.getCumulativeConsumed('bread'),
        burgerStockService.getCumulativeConsumed('patty'),
        burgerStockService.getAllSessions()
      ]);

      if (contentDiv) {
        contentDiv.innerHTML = `
          <div class="burger-kpi-grid">
            <div class="burger-kpi burger-kpi--normal">
              <div class="burger-kpi__header">
                <span class="burger-kpi__icon"><i class="fa-solid fa-bread-slice"></i></span>
                <span class="burger-kpi__label">PAN (total histórico)</span>
              </div>
              <div class="burger-kpi__value">${cumulBread}</div>
              <div class="burger-kpi__bar">
                <div class="burger-kpi__bar-fill" style="width:100%"></div>
              </div>
              <div class="burger-kpi__footer">
                <span>✅ Histórico</span>
                <span>${cumulBread} consumidos</span>
              </div>
            </div>
            <div class="burger-kpi burger-kpi--normal">
              <div class="burger-kpi__header">
                <span class="burger-kpi__icon"><i class="fa-solid fa-drumstick-bite"></i></span>
                <span class="burger-kpi__label">MEDALLÓN (total histórico)</span>
              </div>
              <div class="burger-kpi__value">${cumulPatty}</div>
              <div class="burger-kpi__bar">
                <div class="burger-kpi__bar-fill" style="width:100%"></div>
              </div>
              <div class="burger-kpi__footer">
                <span>✅ Histórico</span>
                <span>${cumulPatty} consumidos</span>
              </div>
            </div>
          </div>
          <div class="burger-stats-row">
            <div class="burger-stat-card">
              <div class="burger-stat-card__label">Sesiones registradas</div>
              <div class="burger-stat-card__value">${sessions.length}</div>
            </div>
          </div>
        `;
      }

      if (movementsBody && movementsHeader) {
        movementsHeader.innerHTML = '<th>Fecha</th><th>Inicio</th><th>Fin</th><th>Panes</th><th>Medallones</th><th>Estado</th>';
        if (sessions.length === 0) {
          movementsBody.innerHTML = '<tr><td colspan="6" class="burger-empty">Sin sesiones registradas</td></tr>';
        } else {
          movementsBody.innerHTML = sessions.map(s => {
            const totalBreads = (s.totalBreadsConsumed || 0) + (s.currentStock?.bread ? (s.openingStock?.bread || 0) - s.currentStock.bread : 0);
            const totalPatties = (s.totalPattiesConsumed || 0) + (s.currentStock?.patty ? (s.openingStock?.patty || 0) - s.currentStock.patty : 0);
            return `<tr>
              <td>${new Date(s.openedAt).toLocaleDateString()}</td>
              <td>${new Date(s.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td>${s.closedAt ? new Date(s.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
              <td>${totalBreads}</td>
              <td>${totalPatties}</td>
              <td><span class="burger-badge burger-badge--${s.status}">${s.status === 'open' ? 'Abierta' : 'Cerrada'}</span></td>
            </tr>`;
          }).join('');
        }
      }

      this._loadRanking(true);
    } catch (e) {
      if (contentDiv) contentDiv.innerHTML = '<p class="burger-empty">Error al cargar datos históricos</p>';
      if (movementsBody) movementsBody.innerHTML = '<tr><td colspan="6" class="burger-empty">Error al cargar sesiones</td></tr>';
    }
  }

  _showAdjustModal() {
    const session = burgerStockService.session;
    if (!session) {
      return;
    }

    const body = `
      <div class="burger-adjust-form">
        <p style="margin-bottom:var(--space-4);color:var(--color-text-secondary);font-size:var(--text-sm);">
          Stock actual: ${session.currentStock?.bread || 0} panes · ${session.currentStock?.patty || 0} medallones
        </p>
        <div class="burger-session-field">
          <label class="burger-session-field__label"><i class="fa-solid fa-bread-slice"></i> Ajustar panes</label>
          <input type="number" class="burger-session-field__input" id="burger-adjust-bread" value="0" step="1" placeholder="0">
          <p class="burger-field-hint">Usá valores positivos para agregar, negativos para descontar</p>
        </div>
        <div class="burger-session-field">
          <label class="burger-session-field__label"><i class="fa-solid fa-drumstick-bite"></i> Ajustar medallones</label>
          <input type="number" class="burger-session-field__input" id="burger-adjust-patty" value="0" step="1" placeholder="0">
          <p class="burger-field-hint">Usá valores positivos para agregar, negativos para descontar</p>
        </div>
        <div class="burger-session-field">
          <label class="burger-session-field__label">Motivo</label>
          <input type="text" class="burger-session-field__input" id="burger-adjust-reason" placeholder="Ej: reposición de panadería">
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" id="burger-adjust-close-btn">Cancelar</button>
      <button class="btn btn-primary" id="burger-adjust-save-btn">Guardar ajuste</button>
    `;

    Modal.show({
      title: 'Ajustar stock de ingredientes',
      body,
      footer
    });

    document.getElementById('burger-adjust-close-btn').onclick = () => Modal.close();
    document.getElementById('burger-adjust-save-btn').onclick = async () => {
      const breadDelta = parseInt(document.getElementById('burger-adjust-bread').value) || 0;
      const pattyDelta = parseInt(document.getElementById('burger-adjust-patty').value) || 0;
      const reason = document.getElementById('burger-adjust-reason').value || 'Ajuste manual';
      if (breadDelta === 0 && pattyDelta === 0) {
        Toast.error('Error', 'Ingresá al menos un ajuste');
        return;
      }
      try {
        if (breadDelta !== 0) {
          await burgerStockService.adjustStock('bread', breadDelta, reason);
        }
        if (pattyDelta !== 0) {
          await burgerStockService.adjustStock('patty', pattyDelta, reason);
        }
        Toast.success('Ajuste guardado', reason);
        Modal.close();
        const container = document.getElementById('burger-stock-container');
        if (container) {
          this._renderDashboard(container);
        }
      } catch (e) {
        Toast.error('Error', 'No se pudo guardar el ajuste');
      }
    };
  }

  _getStateLabel(state) {
    switch (state) {
      case 'critical':
        return '🔴 Crítico';
      case 'warning':
        return '🟡 Bajo';
      default:
        return '✅ Normal';
    }
  }

  _getActionLabel(action) {
    switch (action) {
      case 'sale':
        return 'Venta';
      case 'manual_adjustment':
        return 'Ajuste';
      case 'cancellation':
        return 'Anulación';
      default:
        return action;
    }
  }
}

export default new BurgerStockUI();
