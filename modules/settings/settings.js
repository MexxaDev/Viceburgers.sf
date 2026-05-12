'use strict';

import { settingRepo } from '../../db/repositories.js';
import { exportDatabase } from '../../utils/export.js';
import Modal from '../../components/modal.js';
import Toast from '../../components/toast.js';
import state from '../../js/state.js';
import { escapeHtml } from '../../utils/sanitizer.js';
import backupManager from '../../services/backupManager.js';
import { logger } from '../../utils/logger.js';

class Settings {
  constructor() {
    this.settings = {};
    this.logoDataUrl = '';
  }

  async load() {
    const settings = await settingRepo.findAll();
    this.settings = {};
    settings.forEach(s => {
      this.settings[s.key] = s.value;
    });

    this.logoDataUrl = this.settings.logo || '';
    this.render();
  }

  render() {
    const container = document.getElementById('settings');
    if (!container) {
      return;
    }

    const currency = escapeHtml(this.settings.currency || 'ARS');
    const currencySymbol = escapeHtml(this.settings.currencySymbol || '$');
    const businessName = escapeHtml(this.settings.businessName || '');
    const ticketFooter = escapeHtml(this.settings.ticketFooter || '');

    const shopEnabled = this.settings.shop_enabled === 'true' || false;
    const shopWhatsapp = escapeHtml(this.settings.shop_whatsapp || '');
    const shopHoursOpen = escapeHtml(this.settings.shop_hours_open || '09:00');
    const shopHoursClose = escapeHtml(this.settings.shop_hours_close || '23:00');
    const shopTakeaway = this.settings.shop_takeaway_enabled !== 'false';
    const shopDelivery = this.settings.shop_delivery_enabled !== 'false';
    const shopMinDelivery = escapeHtml(this.settings.shop_min_delivery || '0');
    const shopDeliveryCost = escapeHtml(this.settings.shop_delivery_cost || '0');

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">Configuración</h1>
        <p class="page-header__subtitle">Ajustes del sistema</p>
      </div>

      <div class="settings-section">
        <h3 class="settings-section__title">Datos del Negocio</h3>
        <div class="settings-section__desc">Información que aparecerá en los tickets</div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Nombre del Negocio</label>
            <input type="text" class="form-input" id="setting-businessName" value="${businessName}">
          </div>
          <div class="form-group">
            <label class="form-label">Moneda</label>
            <select class="form-input form-select" id="setting-currency">
              <option value="ARS" ${currency === 'ARS' ? 'selected' : ''}>Peso Argentino (ARS)</option>
              <option value="USD" ${currency === 'USD' ? 'selected' : ''}>Dólar (USD)</option>
              <option value="EUR" ${currency === 'EUR' ? 'selected' : ''}>Euro (EUR)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Símbolo de Moneda</label>
            <input type="text" class="form-input" id="setting-currencySymbol" value="${currencySymbol}" maxlength="5" style="width:80px;">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Pie de Ticket</label>
          <textarea class="form-input" id="setting-ticketFooter" rows="3">${ticketFooter}</textarea>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section__title">Shop - Catálogo Online</h3>
        <div class="settings-section__desc">Configuración del catálogo público para clientes</div>

        <div class="form-group">
          <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;">
            <input type="checkbox" id="setting-shop-enabled" ${shopEnabled ? 'checked' : ''}>
            <span class="form-label" style="margin:0;">Activar Shop</span>
          </label>
          <p style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-top:var(--space-1);">
            Al activar, tu catálogo estará disponible en ${window.location.origin}#shop
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">WhatsApp (con código país)</label>
            <input type="text" class="form-input" id="setting-shop-whatsapp" value="${shopWhatsapp}" placeholder="5491123456789">
            <p style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-top:var(--space-1);">
              Número donde llegarán los pedidos
            </p>
          </div>
          <div class="form-group">
            <label class="form-label">Color Primario</label>
            <input type="color" class="form-input" id="setting-shop-color" value="${this.settings.shop_primary_color || '#7C3AED'}">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Horario Apertura</label>
            <input type="time" class="form-input" id="setting-shop-open" value="${shopHoursOpen}">
          </div>
          <div class="form-group">
            <label class="form-label">Horario Cierre</label>
            <input type="time" class="form-input" id="setting-shop-close" value="${shopHoursClose}">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;">
              <input type="checkbox" id="setting-shop-takeaway" ${shopTakeaway ? 'checked' : ''}>
              <span class="form-label" style="margin:0;">Take Away</span>
            </label>
          </div>
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;">
              <input type="checkbox" id="setting-shop-delivery" ${shopDelivery ? 'checked' : ''}>
              <span class="form-label" style="margin:0;">Delivery</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Monto Mínimo Delivery</label>
            <input type="number" class="form-input" id="setting-shop-min-delivery" value="${shopMinDelivery}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Costo Envío</label>
            <input type="number" class="form-input" id="setting-shop-delivery-cost" value="${shopDeliveryCost}" min="0">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Banner Principal (URL)</label>
          <input type="text" class="form-input" id="setting-shop-banner" value="${this.settings.shop_banner || ''}" placeholder="https://...">
        </div>

        <div class="form-group">
          <label class="form-label">Link Público del Shop</label>
          <div style="display:flex;gap:var(--space-2);align-items:center;">
            <input type="text" class="form-input" value="${window.location.origin}#shop" readonly
                   style="background:var(--color-gray-50);cursor:copy;">
            <button class="btn btn-sm btn-secondary" id="copy-shop-url" title="Copiar link">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
          <p style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-top:var(--space-1);">
            Compartí este link con tus clientes
          </p>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section__title">Logo del Negocio</h3>
        <div class="settings-section__desc">Tamaño máximo: 200x200px. Se guardará en formato Base64.</div>

        <div style="display:flex;gap:var(--space-4);align-items:flex-start;">
          <div>
            <input type="file" accept="image/*" id="setting-logo" style="display:none;">
            <button class="btn btn-secondary" id="upload-logo-btn">
              <i class="fa-solid fa-upload"></i> Subir Logo
            </button>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-top:var(--space-2);">
              Formatos: JPG, PNG, SVG, WebP
            </div>
          </div>
          <div id="logo-preview" style="display:${this.logoDataUrl ? 'block' : 'none'};">
            <img src="${this.logoDataUrl}" style="max-width:200px;max-height:200px;border-radius:var(--radius-lg);border:1px solid var(--color-border);">
            <button class="btn btn-sm btn-danger" id="remove-logo-btn" style="margin-top:var(--space-2);">Eliminar</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section__title">Copias de Seguridad</h3>
        <div class="settings-section__desc">Snapshots automáticos, exportación y restauración del sistema.</div>

        <div style="display:flex;flex-wrap:wrap;gap:var(--space-3);margin-bottom:var(--space-4);">
          <button class="btn btn-primary" id="create-snapshot-btn">
            <i class="fa-solid fa-camera"></i> Crear Snapshot
          </button>
          <button class="btn btn-secondary" id="export-backup">
            <i class="fa-solid fa-file-export"></i> Exportar JSON
          </button>
          <button class="btn btn-secondary" id="import-backup">
            <i class="fa-solid fa-file-import"></i> Importar JSON
          </button>
          <input type="file" accept=".json" id="import-file" style="display:none;">
        </div>

        <div class="form-group" style="margin-bottom:var(--space-4);">
          <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;">
            <input type="checkbox" id="auto-backup-toggle">
            <span class="form-label" style="margin:0;">Backup Automático (cada 5 min si hay cambios)</span>
          </label>
        </div>

        <div id="quota-display" style="margin-bottom:var(--space-4);font-size:var(--text-sm);color:var(--color-text-secondary);">
          Verificando almacenamiento...
        </div>

        <div id="snapshot-list">
          <p style="color:var(--color-text-secondary);font-size:var(--text-sm);">Cargando snapshots...</p>
        </div>
      </div>

      <div class="settings-section" id="logs-section">
        <h3 class="settings-section__title">Registros del Sistema</h3>
        <div class="settings-section__desc">Errores y advertencias recientes para depuraci\u00f3n.</div>
        <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-3);">
          <button class="btn btn-sm btn-secondary" id="refresh-logs-btn">
            <i class="fa-solid fa-rotate"></i> Actualizar
          </button>
          <button class="btn btn-sm btn-danger" id="clear-logs-btn">
            <i class="fa-solid fa-trash"></i> Limpiar
          </button>
        </div>
        <div id="log-entries">
          <p style="color:var(--color-text-secondary);font-size:var(--text-sm);">Sin registros.</p>
        </div>
      </div>

      <div style="margin-top:var(--space-6);">
        <button class="btn btn-secondary" id="reset-settings" style="margin-right:var(--space-3);">
          <i class="fa-solid fa-rotate-left"></i> Restablecer Defectos
        </button>
        <button class="btn btn-primary btn-lg" id="save-settings">
          <i class="fa-solid fa-floppy-disk"></i> Guardar Configuraci\u00f3n
        </button>
      </div>
    `;

    this.attachEvents();
  }

  async attachEvents() {
    const uploadBtn = document.getElementById('upload-logo-btn');
    const logoInput = document.getElementById('setting-logo');
    const removeBtn = document.getElementById('remove-logo-btn');
    const exportBtn = document.getElementById('export-backup');
    const importBtn = document.getElementById('import-backup');
    const importFile = document.getElementById('import-file');
    const saveBtn = document.getElementById('save-settings');
    const resetBtn = document.getElementById('reset-settings');
    const createSnapshotBtn = document.getElementById('create-snapshot-btn');
    const autoToggle = document.getElementById('auto-backup-toggle');

    uploadBtn?.addEventListener('click', () => logoInput?.click());

    logoInput?.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      if (!file.type.startsWith('image/')) {
        Toast.error('Error', 'Seleccioná un archivo de imagen válido');
        return;
      }

      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > 200 || height > 200) {
            const ratio = Math.min(200 / width, 200 / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          this.logoDataUrl = canvas.toDataURL('image/png');
          const preview = document.getElementById('logo-preview');
          preview.innerHTML = `
            <img src="${this.logoDataUrl}" style="max-width:200px;max-height:200px;border-radius:var(--radius-lg);border:1px solid var(--color-border);">
            <button class="btn btn-sm btn-danger" id="remove-logo-btn" style="margin-top:var(--space-2);">Eliminar</button>
          `;
          preview.style.display = 'block';
          document.getElementById('remove-logo-btn')?.addEventListener('click', () => this.removeLogo());
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    removeBtn?.addEventListener('click', () => this.removeLogo());

    exportBtn?.addEventListener('click', () => {
      exportDatabase();
    });

    importBtn?.addEventListener('click', () => importFile?.click());

    importFile?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const result = await backupManager.importFromFile(file);
        Toast.success('Importación exitosa', `Se importaron ${result.items} registros en ${result.stores} stores`);
        await this.load();
        state.set('settings', this.settings);
      } catch (error) {
        Toast.error('Error de importación', error.message || 'No se pudo importar el backup');
      }
    });

    createSnapshotBtn?.addEventListener('click', async () => {
      createSnapshotBtn.disabled = true;
      createSnapshotBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creando...';
      try {
        await backupManager.createSnapshot('Snapshot manual');
        Toast.success('Snapshot creado', 'Backup completo del sistema');
        this.loadSnapshots();
      } catch (err) {
        Toast.error('Error', err.message);
      }
      createSnapshotBtn.disabled = false;
      createSnapshotBtn.innerHTML = '<i class="fa-solid fa-camera"></i> Crear Snapshot';
    });

    autoToggle?.addEventListener('change', () => {
      if (autoToggle.checked) {
        backupManager.startAutoBackup();
        Toast.success('Auto-backup activado', 'Se creará un snapshot cada 5 minutos si hay cambios');
      } else {
        backupManager.stopAutoBackup();
      }
    });

    if (backupManager.isAutoBackupRunning()) {
      autoToggle.checked = true;
    }

    saveBtn?.addEventListener('click', () => this.save());

    resetBtn?.addEventListener('click', () => {
      Modal.show({
        title: 'Confirmar Restablecer',
        body: '<p>¿Estás seguro de restablecer todos los valores por defecto?</p>',
        footer: `
          <button class="btn btn-secondary" id="cancel-reset">Cancelar</button>
          <button class="btn btn-danger" id="confirm-reset">Restablecer</button>
        `,
        onClose: null
      });

      requestAnimationFrame(() => {
        document.getElementById('cancel-reset')?.addEventListener('click', () => Modal.close());
        document.getElementById('confirm-reset')?.addEventListener('click', () => {
          Modal.close();
          this.resetToDefaults();
        });
      });
    });

    this.loadSnapshots();
    this.updateQuota();
    this.attachLogEvents();
  }

  attachLogEvents() {
    const refreshBtn = document.getElementById('refresh-logs-btn');
    const clearBtn = document.getElementById('clear-logs-btn');

    refreshBtn?.addEventListener('click', () => this.renderLogs());
    clearBtn?.addEventListener('click', () => {
      logger.clear();
      this.renderLogs();
      Toast.success('Registros', 'Registros eliminados');
    });

    this.renderLogs();
  }

  renderLogs() {
    const container = document.getElementById('log-entries');
    if (!container) {
      return;
    }
    const entries = logger.getWarningsAndErrors();
    if (entries.length === 0) {
      container.innerHTML =
        '<p style="color:var(--color-text-secondary);font-size:var(--text-sm);">Sin registros de errores o advertencias.</p>';
      return;
    }
    const html = entries
      .slice(-50)
      .reverse()
      .map(
        e =>
          `<div class="log-entry log-entry--${e.level}" title="${escapeHtml(e.message)}">
            <span class="log-entry__time">${e.timestamp.toLocaleTimeString()}</span>
            <span class="log-entry__module">${escapeHtml(e.module)}</span>
            <span class="log-entry__message">${escapeHtml(e.message)}</span>
          </div>`
      )
      .join('');
    container.innerHTML = html;
  }

  async loadSnapshots() {
    const container = document.getElementById('snapshot-list');
    if (!container) {
      return;
    }

    try {
      const snapshots = await backupManager.listSnapshots();
      if (snapshots.length === 0) {
        container.innerHTML =
          '<div class="empty-state"><div class="empty-state__icon"><i class="fa-solid fa-camera"></i></div><h3 class="empty-state__title">Sin snapshots</h3><p class="empty-state__description">Creá tu primer snapshot para proteger tus datos.</p></div>';
        return;
      }

      container.innerHTML = `
        <p style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:var(--space-2);font-weight:var(--font-semibold);">
          SNAPSHOTS GUARDADOS (${snapshots.length})
        </p>
        <div style="display:flex;flex-direction:column;gap:var(--space-2);">
          ${snapshots
            .map(s => {
              const date = new Date(s.createdAt).toLocaleString('es-AR');
              const typeLabel = {
                manual: 'Manual',
                automatic: 'Automático',
                'pre-import': 'Pre-import',
                'post-import': 'Post-import'
              };
              return `
              <div class="settings-snapshot-item">
                <div class="settings-snapshot-item__info">
                  <strong>${escapeHtml(s.label)}</strong>
                  <span class="settings-snapshot-item__meta">
                    ${date} · ${s.summary.items} registros · 
                    <span class="badge badge-${s.type === 'automatic' ? 'warning' : 'primary'}">${typeLabel[s.type] || s.type}</span>
                  </span>
                </div>
                <div class="settings-snapshot-item__actions">
                  <button class="btn btn-sm btn-secondary" data-restore="${s.id}" title="Restaurar este snapshot">
                    <i class="fa-solid fa-rotate-left"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" data-delete="${s.id}" title="Eliminar snapshot">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      `;

      container.querySelectorAll('[data-restore]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.restore;
          Modal.show({
            title: 'Restaurar Snapshot',
            body: '<p>¿Estás seguro de restaurar este snapshot?<br><span style="color:var(--color-warning);font-size:var(--text-sm);">Todos los datos actuales serán reemplazados.</span></p>',
            footer: `
              <button class="btn btn-secondary" id="cancel-restore">Cancelar</button>
              <button class="btn btn-danger" id="confirm-restore">Restaurar</button>
            `
          });
          document.getElementById('cancel-restore')?.addEventListener('click', () => Modal.close());
          document.getElementById('confirm-restore')?.addEventListener('click', async () => {
            Modal.close();
            btn.disabled = true;
            try {
              const result = await backupManager.restoreSnapshot(id);
              Toast.success('Restaurado', `Snapshot restaurado: ${result.items} registros en ${result.stores} stores`);
              if (state.get('currentRoute') === 'settings') {
                this.load();
              } else {
                window.location.reload();
              }
            } catch (err) {
              Toast.error('Error al restaurar', err.message);
            }
          });
        });
      });

      container.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.delete;
          try {
            await backupManager.deleteSnapshot(id);
            Toast.success('Snapshot eliminado');
            this.loadSnapshots();
          } catch (err) {
            Toast.error('Error', err.message);
          }
        });
      });
    } catch (err) {
      container.innerHTML = '<p style="color:var(--color-danger);">Error al cargar snapshots</p>';
    }
  }

  async updateQuota() {
    const container = document.getElementById('quota-display');
    if (!container) {
      return;
    }

    try {
      const quota = await backupManager.checkStorageQuota();
      if (quota.supported) {
        const used = (quota.used / (1024 * 1024)).toFixed(1);
        const total = (quota.quota / (1024 * 1024)).toFixed(1);
        const isWarning = quota.percentage > 80;
        container.innerHTML = `
          <span style="color:${isWarning ? 'var(--color-warning)' : 'var(--color-text-secondary)'}">
            <i class="fa-solid fa-database"></i> 
            Almacenamiento: ${used} MB / ${total} MB (${quota.percentage}%)
            ${isWarning ? '⚠️ Almacenamiento casi lleno' : ''}
          </span>
        `;
      } else {
        container.innerHTML =
          '<span style="color:var(--color-text-secondary);"><i class="fa-solid fa-database"></i> No se puede verificar el almacenamiento en este navegador.</span>';
      }
    } catch (err) {
      container.innerHTML = '';
    }
  }

  removeLogo() {
    this.logoDataUrl = '';
    const preview = document.getElementById('logo-preview');
    if (preview) {
      preview.style.display = 'none';
      preview.innerHTML = '';
    }
  }

  async save() {
    const businessName = document.getElementById('setting-businessName')?.value || '';
    const currency = document.getElementById('setting-currency')?.value || 'ARS';
    const currencySymbol = document.getElementById('setting-currencySymbol')?.value || '$';
    const ticketFooter = document.getElementById('setting-ticketFooter')?.value || '';

    const shopEnabled = document.getElementById('setting-shop-enabled')?.checked || false;
    const shopWhatsapp = document.getElementById('setting-shop-whatsapp')?.value || '';
    const shopColor = document.getElementById('setting-shop-color')?.value || '#7C3AED';
    const shopOpen = document.getElementById('setting-shop-open')?.value || '09:00';
    const shopClose = document.getElementById('setting-shop-close')?.value || '23:00';
    const shopTakeaway = document.getElementById('setting-shop-takeaway')?.checked || false;
    const shopDelivery = document.getElementById('setting-shop-delivery')?.checked || false;
    const shopMinDelivery = document.getElementById('setting-shop-min-delivery')?.value || '0';
    const shopDeliveryCost = document.getElementById('setting-shop-delivery-cost')?.value || '0';
    const shopBanner = document.getElementById('setting-shop-banner')?.value || '';

    document.getElementById('copy-shop-url')?.addEventListener('click', () => {
      const url = `${window.location.origin}#shop`;
      navigator.clipboard.writeText(url).then(() => {
        Toast.success('Enlace copiado', 'El link del shop fue copiado al portapapeles');
      });
    });

    const settings = [
      { key: 'businessName', value: businessName },
      { key: 'currency', value: currency },
      { key: 'currencySymbol', value: currencySymbol },
      { key: 'ticketFooter', value: ticketFooter },
      { key: 'logo', value: this.logoDataUrl },
      { key: 'shop_enabled', value: shopEnabled.toString() },
      { key: 'shop_whatsapp', value: shopWhatsapp },
      { key: 'shop_primary_color', value: shopColor },
      { key: 'shop_hours_open', value: shopOpen },
      { key: 'shop_hours_close', value: shopClose },
      { key: 'shop_takeaway_enabled', value: shopTakeaway.toString() },
      { key: 'shop_delivery_enabled', value: shopDelivery.toString() },
      { key: 'shop_min_delivery', value: shopMinDelivery },
      { key: 'shop_delivery_cost', value: shopDeliveryCost },
      { key: 'shop_banner', value: shopBanner }
    ];

    try {
      const existingSettings = await settingRepo.findAll();
      const existingMap = {};
      existingSettings.forEach(s => {
        existingMap[s.key] = s;
      });

      for (const setting of settings) {
        if (existingMap[setting.key]) {
          await settingRepo.update(setting);
        } else {
          await settingRepo.create(setting);
        }
      }

      this.settings = {};
      settings.forEach(s => {
        this.settings[s.key] = s.value;
      });
      state.set('settings', this.settings);

      Toast.success('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      logger.error('Settings', 'Error saving settings', error);
      Toast.error('Error', `No se pudo guardar: ${error.message}`);
    }
  }

  async resetToDefaults() {
    const defaults = [
      { key: 'businessName', value: 'Mi Negocio' },
      { key: 'currency', value: 'ARS' },
      { key: 'currencySymbol', value: '$' },
      { key: 'ticketFooter', value: 'Gracias por su compra!' },
      { key: 'logo', value: '' },
      { key: 'shop_enabled', value: 'false' },
      { key: 'shop_whatsapp', value: '' },
      { key: 'shop_primary_color', value: '#7C3AED' },
      { key: 'shop_hours_open', value: '09:00' },
      { key: 'shop_hours_close', value: '23:00' },
      { key: 'shop_takeaway_enabled', value: 'true' },
      { key: 'shop_delivery_enabled', value: 'true' },
      { key: 'shop_min_delivery', value: '0' },
      { key: 'shop_delivery_cost', value: '0' },
      { key: 'shop_banner', value: '' }
    ];

    try {
      const existingSettings = await settingRepo.findAll();
      const existingMap = {};
      existingSettings.forEach(s => {
        existingMap[s.key] = s;
      });

      for (const setting of defaults) {
        if (existingMap[setting.key]) {
          await settingRepo.update(setting);
        } else {
          await settingRepo.create(setting);
        }
      }

      this.logoDataUrl = '';
      Toast.success('Éxito', 'Configuración restablecida');
      await this.load();
      state.set('settings', this.settings);
    } catch (error) {
      logger.error('Settings', 'Error resetting settings', error);
      Toast.error('Error', `No se pudo restablecer: ${error.message}`);
    }
  }
}

export default new Settings();
