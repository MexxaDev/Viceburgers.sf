'use strict';

import burgerStockService from './burgerStockService.js';
import { getIngredientInfo } from './recipes.js';
import Modal from '../../components/modal.js';
import Toast from '../../components/toast.js';

class BurgerStockUI {
  render(container) {
    if (!container) {
      return;
    }

    if (!burgerStockService.session) {
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
    if (!session) {
      this._renderSessionForm(container);
      return;
    }

    const breadStock = session.currentStock?.bread || 0;
    const pattyStock = session.currentStock?.patty || 0;
    const breadOpening = session.openingStock?.bread || 1;
    const pattyOpening = session.openingStock?.patty || 1;
    const breadPct = Math.max(0, Math.min(100, (breadStock / breadOpening) * 100));
    const pattyPct = Math.max(0, Math.min(100, (pattyStock / pattyOpening) * 100));

    const breadState = burgerStockService.getIngredientThresholdState('bread');
    const pattyState = burgerStockService.getIngredientThresholdState('patty');

    container.innerHTML = `
      <div class="burger-header">
        <div class="burger-header__left">
          <h1 class="burger-header__title"><i class="fa-solid fa-burger"></i> Reportes Burgers</h1>
          <p class="burger-header__subtitle">Sesión activa · ${new Date(session.openedAt).toLocaleString()}</p>
        </div>
        <div class="burger-header__actions">
          <button class="burger-btn burger-btn--outline" id="burger-adjust-btn">
            <i class="fa-solid fa-sliders"></i> Ajustar stock
          </button>
          <button class="burger-btn burger-btn--outline" id="burger-refresh-btn">
            <i class="fa-solid fa-rotate"></i>
          </button>
        </div>
      </div>

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

      <div class="burger-panel" id="burger-ranking-panel">
        <div class="burger-panel__header">
          <h3 class="burger-panel__title"><i class="fa-solid fa-trophy"></i> Productos más vendidos</h3>
        </div>
        <div class="burger-panel__body" id="burger-ranking-body">
          <p class="burger-loading">Cargando ranking...</p>
        </div>
      </div>

      <div class="burger-panel">
        <div class="burger-panel__header">
          <h3 class="burger-panel__title"><i class="fa-solid fa-clock-rotate-left"></i> Movimientos en vivo</h3>
        </div>
        <div class="burger-panel__body">
          <div class="burger-table-container">
            <table class="burger-table" id="burger-movements-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Producto</th>
                  <th>Pan</th>
                  <th>Medallón</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody id="burger-movements-body">
                <tr><td colspan="5" class="burger-loading">Cargando movimientos...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this._attachDashboardEvents(container);
    this._loadRanking();
    this._loadMovements();
  }

  _attachDashboardEvents(container) {
    document.getElementById('burger-adjust-btn').onclick = () => this._showAdjustModal();
    document.getElementById('burger-refresh-btn').onclick = () => {
      this._loadRanking();
      this._loadMovements();
      Toast.success('Actualizado', 'Datos refrescados');
    };
  }

  async _loadRanking() {
    const body = document.getElementById('burger-ranking-body');
    if (!body) {
      return;
    }
    try {
      const ranking = await burgerStockService.getProductRanking();
      if (ranking.length === 0) {
        body.innerHTML = '<p class="burger-empty">Sin ventas de burgers hoy</p>';
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
