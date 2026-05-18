'use strict';

import { saleRepo, customerRepo } from '../../db/repositories.js';
import Table from '../../components/table.js';
import { SALES_COLUMNS, SALES_ACTIONS, prepareSaleRows, showSaleDetail } from './salesTable.js';
import { getPayments } from '../../utils/payments.js';
import { format } from '../../utils/currency.js';
import { logger } from '../../utils/logger.js';

class Sales {
  constructor() {
    this.sales = [];
    this.customers = [];
  }

  async load() {
    const container = document.getElementById('sales-list');
    if (container) {
      container.innerHTML =
        '<div style="text-align:center;padding:var(--space-8);color:var(--color-text-secondary);"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;margin-bottom:var(--space-3);display:block;"></i>Cargando ventas...</div>';
    }
    try {
      this.sales = await saleRepo.findAll();
      this.customers = await customerRepo.findAll();
      this.render();
    } catch (error) {
      logger.error('Sales', 'Error loading sales', error);
      if (container) {
        container.innerHTML =
          '<div style="text-align:center;padding:var(--space-8);color:var(--color-danger);"><i class="fa-solid fa-triangle-exclamation" style="font-size:32px;margin-bottom:var(--space-3);display:block;"></i>Error al cargar las ventas</div>';
      }
    }
  }

  async filter() {
    const dateFrom = document.getElementById('sales-date-from')?.value;
    const dateTo = document.getElementById('sales-date-to')?.value;

    let filtered = [...this.sales];

    if (dateFrom) {
      const [fromY, fromM, fromD] = dateFrom.split('-').map(Number);
      const fromTime = new Date(fromY, fromM - 1, fromD).getTime();
      filtered = filtered.filter(s => {
        if (!s.date) {
          return false;
        }
        return new Date(s.date).getTime() >= fromTime;
      });
    }
    if (dateTo) {
      const [toY, toM, toD] = dateTo.split('-').map(Number);
      const toTime = new Date(toY, toM - 1, toD, 23, 59, 59, 999).getTime();
      filtered = filtered.filter(s => {
        if (!s.date) {
          return false;
        }
        return new Date(s.date).getTime() <= toTime;
      });
    }

    this.render(filtered);
  }

  _computeTotals(sales) {
    let totalVentas = 0;
    let totalEfectivo = 0;
    let totalTransferencia = 0;

    for (const sale of sales) {
      totalVentas += parseFloat(sale.total) || 0;
      const payments = getPayments(sale);
      for (const p of payments) {
        if (p.method === 'cash') {
          totalEfectivo += p.amount;
        } else if (p.method === 'transfer') {
          totalTransferencia += p.amount;
        }
      }
    }

    return { totalVentas, totalEfectivo, totalTransferencia };
  }

  render(sales = this.sales) {
    const container = document.getElementById('sales-list');
    if (!container) {
      return;
    }

    if (sales.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon"><i class="fa-solid fa-money-bill-wave"></i></div>
          <h3 class="empty-state__title">No hay ventas</h3>
          <p class="empty-state__description">No se encontraron ventas con los filtros seleccionados.</p>
        </div>
      `;
      return;
    }

    const totals = this._computeTotals(sales);

    const sorted = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
    const rows = prepareSaleRows(sorted, this.customers);

    container.innerHTML = `
      <div class="sales-kpi-grid">
        <div class="sales-kpi-card">
          <div class="sales-kpi-card__label">Total Ventas</div>
          <div class="sales-kpi-card__value">${format(totals.totalVentas)}</div>
        </div>
        <div class="sales-kpi-card sales-kpi-card--cash">
          <div class="sales-kpi-card__label">Total Efectivo</div>
          <div class="sales-kpi-card__value">${format(totals.totalEfectivo)}</div>
        </div>
        <div class="sales-kpi-card sales-kpi-card--transfer">
          <div class="sales-kpi-card__label">Total Transferencia</div>
          <div class="sales-kpi-card__value">${format(totals.totalTransferencia)}</div>
        </div>
      </div>
      <div id="sales-table-container"></div>
    `;

    const tableContainer = document.getElementById('sales-table-container');
    const table = new Table({
      columns: SALES_COLUMNS,
      data: rows,
      actions: SALES_ACTIONS,
      onRowClick: row => showSaleDetail(row)
    });
    table.mount(tableContainer);
  }
}

export default new Sales();
