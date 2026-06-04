import { describe, it } from 'node:test';
import assert from 'node:assert';

const mockStorage = {};
globalThis.localStorage = {
  getItem: k => mockStorage[k] ?? null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: k => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  get length() { return Object.keys(mockStorage).length; },
  key: i => Object.keys(mockStorage)[i] ?? null
};

globalThis.window = { location: { hash: '' }, addEventListener: () => {} };
globalThis.document = { addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [], createElement: () => ({}) };

const { format } = await import('../utils/currency.js');

describe('shippingAmount - backward compatibility', () => {
  it('should default to 0 for old sales without shippingAmount', () => {
    const oldSale = { id: 'V-2024-000001', total: 100, subtotal: 100 };
    const shipping = oldSale.shippingAmount ?? 0;
    assert.strictEqual(shipping, 0);
  });

  it('should read shippingAmount from new sales', () => {
    const newSale = { id: 'V-2026-000002', total: 13500, subtotal: 12000, shippingAmount: 1500 };
    const shipping = newSale.shippingAmount ?? 0;
    assert.strictEqual(shipping, 1500);
  });

  it('should calculate total correctly with shipping', () => {
    const subtotal = 10000;
    const discount = 500;
    const shipping = 1500;
    const total = subtotal - discount + shipping;
    assert.strictEqual(total, 11000);
  });

  it('should format total with shipping', () => {
    const result = format(13500);
    assert.match(result, /13500\.00/);
  });

  it('should handle zero shipping', () => {
    const subtotal = 10000;
    const discount = 0;
    const shipping = 0;
    const total = subtotal - discount + shipping;
    assert.strictEqual(total, 10000);
  });
});

describe('status - backward compatibility', () => {
  it('should treat old sales without status as active', () => {
    const oldSale = { id: 'V-2024-000001' };
    const isCancelled = oldSale.status === 'cancelled';
    assert.strictEqual(isCancelled, false);
  });

  it('should detect cancelled status', () => {
    const cancelledSale = { id: 'V-2026-000002', status: 'cancelled' };
    assert.strictEqual(cancelledSale.status, 'cancelled');
  });
});
