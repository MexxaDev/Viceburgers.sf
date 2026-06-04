'use strict';

import { logger } from './logger.js';
import Modal from '../components/modal.js';
import Toast from '../components/toast.js';
import { format } from './currency.js';
import { getPayments, getPaymentType, getPaymentMethodLabel } from './payments.js';
import { escapeHtml } from './sanitizer.js';
import { BRAND } from '../config/brandConfig.js';

export function renderTicketItems(sale) {
  if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
    return '<p style="color:#6b7280;font-size:12px;">No hay detalles de items.</p>';
  }
  return sale.items
    .map(
      item => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:13px;">
      <span style="color:#374151;">${item.quantity}x ${item.name}</span>
      <span style="font-weight:600;color:#111827;">${format(item.subtotal || item.price * item.quantity)}</span>
    </div>
  `
    )
    .join('');
}

export function renderTicketPayments(sale) {
  const payments = getPayments(sale);
  const paymentType = getPaymentType(sale);
  let html = payments
    .map(
      p => `
    <div style="display:flex;justify-content:space-between;font-size:13px;">
      <span style="color:#374151;">${getPaymentMethodLabel(p.method)}</span>
      <span style="color:#111827;">${format(p.amount)}</span>
    </div>
  `
    )
    .join('');
  if (paymentType === 'COMBINADO') {
    html +=
      '<div style="font-size:11px;color:#6b7280;margin-top:4px;text-align:right;">Tipo: COMBINADO</div>';
  }
  return html;
}

export function renderTicketBody(sale, settings) {
  const businessName = settings?.businessName || BRAND.name;
  const ticketFooter = settings?.ticketFooter || BRAND.defaultTicketFooter;
  const itemsHtml = renderTicketItems(sale);
  const paymentsHtml = renderTicketPayments(sale);

  return `
    <div style="font-family:monospace;max-width:min(300px,calc(100vw - 40px));margin:0 auto;padding:20px;background:white;color:#111827;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="${BRAND.logo}" alt="${BRAND.name}" style="height:48px;width:auto;object-fit:contain;margin-bottom:8px;">
        <div style="font-size:18px;font-weight:bold;color:#111827;">${businessName}</div>
        <div style="font-size:12px;color:#6b7280;">Ticket ${sale.id}</div>
        <div style="font-size:12px;color:#6b7280;">${new Date(sale.date).toLocaleString('es-AR')}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">${(sale.orderType || 'takeaway') === 'delivery' ? 'DELIVERY' : 'TAKE AWAY'}</div>
        ${
          sale.orderType === 'delivery'
            ? `
        <div style="font-size:11px;color:#6b7280;margin-top:6px;border-top:1px dashed #d1d5db;padding-top:6px;">
          <div>${escapeHtml(sale.deliveryName || '')}</div>
          <div>${escapeHtml(sale.deliveryPhone || '')}</div>
          <div>${escapeHtml(sale.deliveryAddress || '')}</div>
        </div>
        `
            : ''
        }
      </div>
      <div style="border-top:1px dashed #d1d5db;padding-top:10px;margin-bottom:10px;">
        ${itemsHtml}
      </div>
      <div style="border-top:1px solid #d1d5db;padding-top:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">
          <span style="color:#374151;">Subtotal:</span>
          <span style="color:#111827;">${format(sale.subtotal || 0)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">
          <span style="color:#374151;">Descuento:</span>
          <span style="color:#dc2626;">-${format(sale.discount || 0)}</span>
        </div>
        ${(sale.shippingAmount || 0) > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">
          <span style="color:#374151;">Costo de envío:</span>
          <span style="color:#111827;">${format(sale.shippingAmount)}</span>
        </div>
        ` : ''}
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:16px;border-top:1px solid #d1d5db;padding-top:8px;margin-top:8px;">
          <span style="color:#111827;">TOTAL:</span>
          <span style="color:#e13a7a;">${format(sale.total || 0)}</span>
        </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #e5e7eb;">
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px;font-weight:600;">MÉTODOS DE PAGO</div>
          ${paymentsHtml}
          ${sale.cashReceived != null ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin-top:4px;color:#374151;"><span>Recibido:</span><span style="color:#111827;">${format(sale.cashReceived)}</span></div>` : ''}
          ${sale.change != null ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#374151;"><span>Cambio:</span><span style="color:#111827;">${format(sale.change)}</span></div>` : ''}
        </div>
      </div>
      <div style="text-align:center;margin-top:20px;font-size:12px;color:#6b7280;">
        ${ticketFooter}
      </div>
    </div>
    <div style="text-align:center;margin-top:20px;">
      <button class="btn btn-primary" id="ticket-print-btn"><i class="fa-solid fa-print"></i> Imprimir</button>
      <button class="btn btn-secondary" id="ticket-close-btn">Cerrar</button>
    </div>
  `;
}

export function showTicketModal(title, body) {
  Modal.show({ title, body, footer: '' });

  requestAnimationFrame(() => {
    const printBtn = document.getElementById('ticket-print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        try {
          printBtn.disabled = true;
          printBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Imprimiendo...';
          window.onafterprint = () => {
            window.onafterprint = null;
            Modal.close();
          };
          window.print();
        } catch (err) {
          logger.error('Ticket', 'Print error', err);
          Toast.error('Error', 'No se pudo abrir la impresión');
          printBtn.disabled = false;
          printBtn.innerHTML = '<i class="fa-solid fa-print"></i> Imprimir';
        }
      });
    }
    const closeBtn = document.getElementById('ticket-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => Modal.close());
    }
  });
}
