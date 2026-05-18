'use strict';

import db from '../db/indexeddb.js';

const KNOWN_STORES = [
  'products',
  'categories',
  'customers',
  'sales',
  'sale_items',
  'cash_sessions',
  'cash_movements',
  'cash_closures',
  'settings',
  'users',
  'notifications',
  'burger_ingredients',
  'burger_recipes',
  'burger_stock_sessions',
  'burger_stock_movements',
  'burger_stock_snapshots'
];

function validateImportData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('El archivo no contiene datos válidos');
  }

  const stores = Object.keys(data).filter(k => k !== '_meta');
  if (stores.length === 0) {
    throw new Error('El archivo no contiene stores para importar');
  }

  for (const store of stores) {
    if (!KNOWN_STORES.includes(store)) {
      throw new Error(`Store desconocido: "${store}". El archivo no es un backup válido.`);
    }
    if (!Array.isArray(data[store])) {
      throw new Error(`Store "${store}" no contiene un array válido.`);
    }
  }

  return true;
}

export function importDatabase(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async e => {
      let data;
      try {
        data = JSON.parse(e.target.result);
      } catch (parseError) {
        reject(new Error('El archivo no es un JSON válido'));
        return;
      }

      try {
        validateImportData(data);

        const stores = Object.keys(data).filter(k => k !== '_meta');

        for (const storeName of stores) {
          const items = data[storeName];
          if (items.length > 0) {
            await db.clear(storeName);
            for (const item of items) {
              await db.add(storeName, item);
            }
          }
        }

        resolve({ stores: stores.length, items: stores.reduce((sum, s) => sum + data[s].length, 0) });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}
