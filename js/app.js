'use strict';

import db from '../db/indexeddb.js';
import state from './state.js';
import router from './router.js';
import { userRepo, settingRepo, categoryRepo, productRepo } from '../db/repositories.js';
import Sidebar from '../components/sidebar.js';
import Header from '../components/header.js';
import Toast from '../components/toast.js';
import POS from '../modules/pos/pos.js';
import Products from '../modules/products/products.js';
import Categories from '../modules/categories/categories.js';
import Customers from '../modules/customers/customers.js';
import Sales from '../modules/sales/sales.js';
import Cash from '../modules/cash/cash.js';
import Settings from '../modules/settings/settings.js';
import Dashboard from '../modules/dashboard/dashboard.js';
import Reports from '../modules/reports/reports.js';
import BurgerStock from '../modules/burgerStock/burgerStock.js';
import Notification from '../components/notification.js';
import { hashPassword } from '../utils/hash.js';
import { logger } from '../utils/logger.js';
import { getDefaultRoute } from '../config/permissions.js';
import { BRAND, getBrandLogo } from '../config/brandConfig.js';

async function seedDatabase() {
  try {
    const response = await fetch('./data/seed.json');
    const seedData = await response.json();

    const users = await userRepo.findAll();
    if (users.length === 0) {
      for (const category of seedData.categories) {
        await categoryRepo.create(category);
      }
      for (const product of seedData.products) {
        await productRepo.create(product);
      }
      for (const user of seedData.users) {
        user.password = await hashPassword(user.password);
        await userRepo.create(user);
      }
      for (const setting of seedData.settings) {
        await settingRepo.create(setting);
      }
      logger.info('App', 'Seed data loaded');
    } else {
      const products = await productRepo.findAll();
      for (const product of seedData.products) {
        const existing = products.find(p => p.id === product.id);
        if (!existing) {
          await productRepo.create(product);
        }
      }
      logger.info('App', 'Seed products synced');

      const settings = await settingRepo.findAll();
      const settingsMap = {};
      settings.forEach(s => {
        settingsMap[s.key] = s;
      });

      for (const setting of seedData.settings) {
        if (!settingsMap[setting.key]) {
          await settingRepo.create(setting);
        }
      }
    }

    await _removeDeprecatedProducts();
  } catch (error) {
    logger.error('App', 'Error seeding database', error);
  }
}

async function _removeDeprecatedProducts() {
  const deprecatedIds = ['prod_11', 'prod_12', 'prod_13', 'prod_14', 'prod_15'];
  for (const id of deprecatedIds) {
    try {
      const existing = await productRepo.findById(id);
      if (existing) {
        await productRepo.delete(id);
        logger.info('App', 'Removed deprecated product: ' + id);
      }
    } catch (e) {
      /* product may not exist, skip */
    }
  }
}

async function _migrateWhatsAppNumber() {
  try {
    const setting = await settingRepo.findById('shop_whatsapp');
    if (setting && setting.value !== '5493496655404') {
      setting.value = '5493496655404';
      await settingRepo.update(setting);
      logger.info('App', 'WhatsApp number migrated to 5493496655404');
    }
  } catch (e) {
    /* setting may not exist or migration already done */
  }
}

function initLogin() {
  const loginScreen = document.getElementById('login-screen');
  const appContainer = document.getElementById('app');
  const shopContainer = document.getElementById('shop-container');

  const hash = window.location.hash.slice(1);
  if (hash === 'shop') {
    loginScreen.style.display = 'none';
    appContainer.style.display = 'none';
    if (shopContainer) {
      shopContainer.style.display = 'block';
      shopContainer.classList.add('active');
    }
    document.body.classList.add('shop-active');
    return;
  }

  const currentUser = state.get('currentUser');
  if (currentUser) {
    loginScreen.style.display = 'none';
    appContainer.style.display = 'grid';
    initApp();
    return;
  }

      loginScreen.innerHTML = `
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">${getBrandLogo()}</div>
        <h1 class="login-title">${BRAND.name}</h1>
        <p class="login-subtitle">Ingresá tus credenciales</p>
      </div>
      <form class="login-form" id="login-form">
        <div class="form-group">
          <label class="form-label">Usuario</label>
          <input type="text" class="form-input" id="login-username" placeholder="admin o cajero" required>
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="password" class="form-input" id="login-password" placeholder="Contraseña" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-lg">Ingresar</button>
      </form>
      <div class="login-footer">
        <p>Usuarios: admin · supervisor · cajero</p>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const users = await userRepo.findAll();
    const hashedInput = await hashPassword(password);
    let user = users.find(u => u.username === username && u.password === hashedInput);

    if (!user) {
      user = users.find(u => u.username === username && u.password === password);
      if (user) {
        user.password = hashedInput;
        await userRepo.update(user);
      }
    }

    if (user) {
      state.set('currentUser', {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      });
      loginScreen.style.display = 'none';
      appContainer.style.display = 'grid';

      initApp();
      Toast.success('Bienvenido', `Hola ${user.name}`);

      const defaultRoute = getDefaultRoute(user.role);
      window.location.hash = defaultRoute;
    } else {
      Toast.error('Error', 'Credenciales incorrectas');
    }
  });
}

function initApp() {
  const sidebar = new Sidebar();
  sidebar.mount(document.getElementById('sidebar'));

  const header = new Header();
  header.mount(document.getElementById('header'));

  Toast.init(document.getElementById('toast-container'));

  Notification.init();

  state.on('state:currentRoute', route => {
    loadModule(route);
  });

  if (state.get('currentUser')) {
    loadSettings();
    const user = state.get('currentUser');
    const route = state.get('currentRoute') || getDefaultRoute(user.role);
    loadModule(route);
  }
}

let _previousSidebarMode = null;

async function loadModule(route) {
  try {
    const app = document.getElementById('app');

    if (route !== 'pos' && _previousSidebarMode !== null) {
      const prevMode = _previousSidebarMode;
      _previousSidebarMode = null;
      app?.classList.remove('sidebar-collapsed', 'sidebar-hidden');
      if (prevMode === 'collapsed' || prevMode === 'hover') {
        app?.classList.add('sidebar-collapsed');
      }
      state.set('sidebarMode', prevMode);
    }

    switch (route) {
      case 'pos':
        _previousSidebarMode = state.get('sidebarMode') || 'expanded';
        await POS.loadProducts();
        const confirmBtn = document.getElementById('confirm-sale-btn');
        if (confirmBtn) {
          confirmBtn.onclick = () => POS.confirmSale();
        }
        const discountToggle = document.getElementById('discount-toggle-btn');
        const discountCollapsible = document.getElementById('discount-collapsible');

        function updateDiscountToggle(hasDiscount) {
          if (!discountToggle) {
            return;
          }
          const isOpen = discountCollapsible?.classList.contains('open');
          if (hasDiscount) {
            discountToggle.querySelector('span').textContent = 'Editar descuento';
            if (!isOpen) {
              discountCollapsible?.classList.add('open');
              discountToggle.classList.add('active');
            }
          } else {
            discountToggle.querySelector('span').textContent = 'Agregar descuento';
            if (isOpen) {
              discountCollapsible?.classList.remove('open');
              discountToggle.classList.remove('active');
            }
          }
        }

        const discountType = document.getElementById('discount-type');
        const discountValue = document.getElementById('discount-value');
        if (discountType) {
          discountType.onchange = e => {
            POS.setDiscount(e.target.value, discountValue?.value || 0);
            updateDiscountToggle(parseFloat(discountValue?.value || 0) > 0);
          };
        }
        if (discountValue) {
          let discTimeout;
          discountValue.oninput = e => {
            clearTimeout(discTimeout);
            discTimeout = setTimeout(() => {
              const type = discountType?.value || 'percent';
              POS.setDiscount(type, e.target.value);
              updateDiscountToggle(parseFloat(e.target.value) > 0);
            }, 300);
          };
        }
        if (discountToggle && discountCollapsible) {
          if (discountValue && parseFloat(discountValue.value) > 0) {
            discountCollapsible.classList.add('open');
            discountToggle.classList.add('active');
            discountToggle.querySelector('span').textContent = 'Editar descuento';
          }
          discountToggle.addEventListener('click', () => {
            const isOpen = discountCollapsible.classList.toggle('open');
            discountToggle.classList.toggle('active', isOpen);
            discountToggle.querySelector('span').textContent = isOpen ? 'Editar descuento' : 'Agregar descuento';
          });
        }

        setTimeout(() => {
          const barcodeInput = document.getElementById('pos-barcode-input');
          if (barcodeInput) {
            barcodeInput.focus();
          }
        }, 100);

        if (app) {
          app.classList.add('sidebar-collapsed');
          app.classList.remove('sidebar-hidden');
          state.set('sidebarMode', 'hover');
        }
        break;
      case 'products':
        await Products.load();
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
          addProductBtn.onclick = () => Products.openModal();
        }
        const productSearch = document.getElementById('product-search');
        if (productSearch) {
          let timeout;
          productSearch.oninput = e => {
            clearTimeout(timeout);
            timeout = setTimeout(() => Products.search(e.target.value), 300);
          };
        }
        break;
      case 'categories':
        await Categories.load();
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
          addCategoryBtn.onclick = () => Categories.openModal();
        }
        break;
      case 'customers':
        const custContainer = document.getElementById('customers-content');
        if (custContainer) {
          await Customers.load();
        }
        break;
      case 'sales':
        const salesContainer = document.getElementById('sales-list');
        if (salesContainer) {
          await Sales.load();
          const filterBtn = document.getElementById('sales-filter-btn');
          if (filterBtn) {
            filterBtn.onclick = () => Sales.filter();
          }
        }
        break;
      case 'cash':
        const cashContainer = document.getElementById('cash-content');
        if (cashContainer) {
          await Cash.load();
        }
        break;
      case 'settings':
        const settingsContainer = document.getElementById('settings');
        if (settingsContainer) {
          await Settings.load();
        }
        break;
      case 'reports':
        const reportsContainer = document.getElementById('reports');
        if (reportsContainer) {
          await Reports.load();
        }
        break;
      case 'burger-stock':
        const burgerContainer = document.getElementById('burger-stock-container');
        if (burgerContainer) {
          await BurgerStock.load();
        }
        break;
      case 'dashboard':
      default:
        const dashboardContainer = document.getElementById('dashboard');
        if (dashboardContainer) {
          await Dashboard.load();
        }
        break;
    }
  } catch (error) {
    logger.error('App', `Error loading module ${route}`, error);
  }
}

async function loadSettings() {
  const defaultSettings = [
    { key: 'businessName', value: 'Vice Burgers' },
    { key: 'currency', value: 'ARS' },
    { key: 'currencySymbol', value: '$' },
    { key: 'ticketFooter', value: 'Gracias por su compra!' },
    { key: 'logo', value: '' }
  ];

  try {
    const existingSettings = await settingRepo.findAll();
    const existingMap = {};
    existingSettings.forEach(s => {
      existingMap[s.key] = s;
    });

    for (const def of defaultSettings) {
      if (!existingMap[def.key]) {
        await settingRepo.create(def);
      }
    }

    const settings = await settingRepo.findAll();
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    state.set('settings', settingsObj);
  } catch (error) {
    logger.error('App', 'Error loading settings', error);
    state.set('settings', { currencySymbol: '$' });
  }
}

(async () => {
  try {
    await db.init();
    await seedDatabase();
    await _migrateWhatsAppNumber();

    const hash = window.location.hash.slice(1);

    if (hash === 'shop') {
      initLogin();
    } else {
      initLogin();
    }

    router.init();
    registerSW();
  } catch (error) {
    logger.error('App', 'App initialization error', error);
  }
})();

function registerSW() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) {
      return;
    }
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) {
            return;
          }
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              Toast.info('Actualizaci\u00f3n disponible', 'Recarg\u00e1 la p\u00e1gina para aplicar los cambios');
            }
          });
        });
      })
      .catch(err => logger.error('App', 'SW registration failed', err));
  });
}
