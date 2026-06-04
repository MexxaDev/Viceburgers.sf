'use strict';

import Modal from '../../components/modal.js';
import Toast from '../../components/toast.js';
import { format } from '../../utils/currency.js';
import { getPayments, getPaymentType, getPaymentMethodLabel } from '../../utils/payments.js';
import { renderTicketBody, showTicketModal } from '../../utils/ticket.js';
import { saleRepo, productRepo, customerRepo } from '../../db/repositories.js';
import cashService from '../cash/cashService.js';
import burgerStockService from '../burgerStock/burgerStockService.js';
import state from '../../js/state.js';
import { escapeHtml } from '../../utils/sanitizer.js';

export const SALES_COLUMNS = [
  { key: '_id', label: 'ID' },
  { key: '_date', label: 'Fecha' },
  { key: '_customer', label: 'Cliente' },
  { key: '_total', label: 'Total', format: val => `<strong>${val}</strong>` },
  { key: '_type', label: 'Tipo' },
  { key: '_method', label: 'Método' }
];

export const SALES_ACTIONS = [
  { name: 'view', label: 'Ver', class: 'btn-ghost', icon: 'fa-solid fa-eye', onClick: row => showSaleDetail(row) },
  { name: 'cancel', label: '', class: 'btn-danger', icon: 'fa-solid fa-ban', onClick: row => confirmCancelSale(row) }
];

export function prepareSaleRows(sales, customers) {
  const cust = customers || [];
  return (sales || []).map(sale => {
    const customer = sale.customerId ? cust.find(c => c.id === sale.customerId) : null;
    const paymentType = getPaymentType(sale);
    const methodBadge =
      paymentType === 'COMBINADO'
        ? '<span class="badge badge-warning">COMBINADO</span>'
        : `<span class="badge badge-primary">${getPaymentMethodLabel(sale.paymentMethod)}</span>`;

    const orderType = sale.orderType || 'takeaway';
    const typeBadge =
      orderType === 'delivery'
        ? '<span class="badge badge-danger">Delivery</span>'
        : '<span class="badge badge-warning">Take Away</span>';

    return {
      _id: sale.id || 'N/A',
      _date: sale.date ? new Date(sale.date).toLocaleString('es-AR') : 'N/A',
      _customer: customer ? escapeHtml(customer.name) : 'Consumidor Final',
      _total: format(sale.total),
      _type: typeBadge,
      _method: methodBadge,
      _sale: sale,
      _customers: cust
    };
  });
}

export function showSaleDetail(row) {
  const sale = row._sale;
  const customers = row._customers || [];
  const customer = sale.customerId ? customers.find(c => c.id === sale.customerId) : null;

  let itemsHtml = '';
  if (sale.items && Array.isArray(sale.items)) {
    sale.items.forEach(item => {
      itemsHtml += `
        <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border-light);font-size:var(--text-sm);">
          <span>${item.quantity}x ${escapeHtml(item.name)}</span>
          <span style="font-weight:var(--font-medium);">${format(item.subtotal || item.price * item.quantity)}</span>
        </div>
      `;
    });
  }

  const payments = getPayments(sale);
  const paymentType = getPaymentType(sale);

  const body = `
    <div style="margin-bottom:var(--space-4);">
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
        <span style="color:var(--color-text-secondary);">Ticket:</span>
        <span>${sale.id}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
        <span style="color:var(--color-text-secondary);">Fecha:</span>
        <span>${sale.date ? new Date(sale.date).toLocaleString('es-AR') : 'N/A'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
        <span style="color:var(--color-text-secondary);">Tipo:</span>
        <span class="badge ${(sale.orderType || 'takeaway') === 'delivery' ? 'badge-danger' : 'badge-warning'}">${(sale.orderType || 'takeaway') === 'delivery' ? 'Delivery' : 'Take Away'}</span>
      </div>
      ${
        sale.orderType === 'delivery'
          ? `
      <div style="border-top:1px dashed var(--color-border-light);padding-top:var(--space-2);margin-top:var(--space-2);">
        <div style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:var(--space-1);font-weight:var(--font-semibold);">DATOS DEL DELIVERY</div>
        <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);margin-bottom:var(--space-1);">
          <span style="color:var(--color-text-secondary);">Nombre:</span>
          <span>${escapeHtml(sale.deliveryName || '-')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);margin-bottom:var(--space-1);">
          <span style="color:var(--color-text-secondary);">Teléfono:</span>
          <span>${escapeHtml(sale.deliveryPhone || '-')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);">
          <span style="color:var(--color-text-secondary);">Dirección:</span>
          <span>${escapeHtml(sale.deliveryAddress || '-')}</span>
        </div>
      </div>
      `
          : ''
      }
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
        <span style="color:var(--color-text-secondary);">Cliente:</span>
        <span>${customer ? escapeHtml(customer.name) : 'Consumidor Final'}</span>
      </div>
      <div style="margin-top:var(--space-2);padding-top:var(--space-2);border-top:1px dashed var(--color-border-light);">
        <div style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:var(--space-1);font-weight:var(--font-semibold);">MÉTODOS DE PAGO</div>
        ${payments
          .map(
            p => `
          <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);">
            <span>${getPaymentMethodLabel(p.method)}</span>
            <span>${format(p.amount)}</span>
          </div>
        `
          )
          .join('')}
        ${paymentType === 'COMBINADO' ? `<div style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-top:var(--space-1);text-align:right;">Tipo: COMBINADO</div>` : ''}
      </div>
    </div>

    <div style="background:var(--color-gray-50);border-radius:var(--radius-lg);padding:var(--space-3);margin-bottom:var(--space-4);">
      ${itemsHtml || '<p style="color:var(--color-text-secondary);font-size:var(--text-sm);">No hay detalles de items.</p>'}
    </div>

    <div style="border-top:1px solid var(--color-border);padding-top:var(--space-3);">
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);font-size:var(--text-sm);">
        <span>Subtotal:</span>
        <span>${format(sale.subtotal || 0)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);font-size:var(--text-sm);">
        <span>Descuento:</span>
        <span>-${format(sale.discount || 0)}</span>
      </div>
      ${(sale.shippingAmount || 0) > 0 ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);font-size:var(--text-sm);">
        <span>Costo de envío:</span>
        <span>${format(sale.shippingAmount)}</span>
      </div>
      ` : ''}
      <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:var(--text-lg);border-top:1px solid var(--color-border);padding-top:var(--space-2);margin-top:var(--space-2);">
        <span>TOTAL:</span>
        <span>${format(sale.total || 0)}</span>
      </div>
    </div>
  `;

  Modal.show({
    title: 'Detalles de Venta',
    body,
    footer: `
      <button class="btn btn-primary" id="sale-reprint-btn">
        <i class="fa-solid fa-print"></i> Re-imprimir Ticket
      </button>
      <button class="btn btn-secondary" id="sale-details-close">Cerrar</button>
    `
  });

  document.getElementById('sale-reprint-btn')?.addEventListener('click', () => {
    Modal.close();
    reprintSaleTicket(sale);
  });
  document.getElementById('sale-details-close')?.addEventListener('click', () => Modal.close());
}

export function reprintSaleTicket(sale) {
  const settings = state.get('settings');
  const body = renderTicketBody(sale, settings);
  showTicketModal('Ticket de Venta', body);
}

export function confirmCancelSale(row) {
  const sale = row._sale;

  const body = `
    <div style="text-align:center;">
      <div style="font-size:48px;color:var(--color-danger);margin-bottom:var(--space-4);">
        <i class="fa-solid fa-ban"></i>
      </div>
      <h3 style="font-size:var(--text-lg);font-weight:var(--font-semibold);margin-bottom:var(--space-2);">Cancelar Venta</h3>
      <p style="color:var(--color-text-secondary);margin-bottom:var(--space-4);">
        ¿Estás seguro de cancelar la venta <strong>${escapeHtml(sale.id)}</strong>?
      </p>
      <p style="color:var(--color-danger);font-size:var(--text-sm);">
        <i class="fa-solid fa-triangle-exclamation"></i> Esta acción no se puede deshacer.
      </p>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="cancel-sale-no">No, mantener</button>
    <button class="btn btn-danger" id="cancel-sale-yes"><i class="fa-solid fa-ban"></i> Sí, cancelar venta</button>
  `;

  Modal.show({ title: '', body, footer, closable: false });

  document.getElementById('cancel-sale-no').onclick = () => Modal.close();

  document.getElementById('cancel-sale-yes').onclick = async () => {
    const btn = document.getElementById('cancel-sale-yes');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cancelando...';
    try {
      await executeCancelSale(sale);
      Modal.close();
      Toast.success('Venta cancelada', `Venta ${sale.id} cancelada correctamente`);
      const { default: Sales } = await import('./sales.js');
      await Sales.load();
    } catch (err) {
      Toast.error('Error', err.message || 'No se pudo cancelar la venta');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-ban"></i> Sí, cancelar venta';
    }
  };
}

async function executeCancelSale(sale) {
  if (sale.status === 'cancelled') {
    throw new Error('La venta ya está cancelada');
  }

  const user = state.get('currentUser');

  sale.status = 'cancelled';
  sale.cancelledAt = new Date().toISOString();
  sale.cancelledBy = user?.id || 'unknown';
  await saleRepo.update(sale);

  for (const item of sale.items || []) {
    const product = await productRepo.findById(item.productId);
    if (product) {
      product.stock = (parseFloat(product.stock) || 0) + (item.quantity || 0);
      await productRepo.update(product);
    }
  }

  const accountPayment = sale.payments?.find(p => p.method === 'account');
  if (accountPayment && accountPayment.amount > 0 && sale.customerId) {
    const customer = await customerRepo.findById(sale.customerId);
    if (customer) {
      customer.balance = (parseFloat(customer.balance) || 0) + accountPayment.amount;
      await customerRepo.update(customer);
    }
  }

  await cashService.cancelSale(sale);

  await burgerStockService.cancelSale(sale);

  state.set('sale:cancelled', { ...sale });
}
