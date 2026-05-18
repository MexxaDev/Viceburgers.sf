'use strict';

import db from '../db/indexeddb.js';

const ALL_STORES = [
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

export async function exportDatabase(stores) {
  const target = stores && stores.length > 0 ? ALL_STORES.filter(s => stores.includes(s)) : ALL_STORES;

  const data = { _meta: { exportedAt: new Date().toISOString(), version: 1 } };

  for (const store of target) {
    data[store] = await db.getAll(store);
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `pos-backup-${new Date().toISOString().substring(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}
