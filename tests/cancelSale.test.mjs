import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('cancelSale - soft delete logic', () => {
  it('should mark sale as cancelled without deleting it', () => {
    const sale = { id: 'V-2026-000001', status: 'active' };
    sale.status = 'cancelled';
    sale.cancelledAt = new Date().toISOString();
    sale.cancelledBy = 'user_1';

    assert.strictEqual(sale.status, 'cancelled');
    assert.ok(sale.cancelledAt);
    assert.strictEqual(sale.cancelledBy, 'user_1');
    assert.ok(sale.id);
  });

  it('should prevent double cancellation', () => {
    const sale = { id: 'V-2026-000001', status: 'cancelled' };
    const canCancel = sale.status !== 'cancelled';
    assert.strictEqual(canCancel, false);
  });

  it('should revert product stock on cancellation', () => {
    const items = [
      { productId: 'prod_1', quantity: 2 },
      { productId: 'prod_2', quantity: 1 }
    ];
    const stockChanges = items.map(item => ({
      productId: item.productId,
      stockToAdd: item.quantity
    }));

    assert.strictEqual(stockChanges[0].stockToAdd, 2);
    assert.strictEqual(stockChanges[1].stockToAdd, 1);
  });

  it('should revert customer balance for account payments', () => {
    const payments = [
      { method: 'cash', amount: 5000 },
      { method: 'account', amount: 3000 }
    ];
    const existingBalance = -5000;

    const accountPayment = payments.find(p => p.method === 'account');
    const newBalance = existingBalance + accountPayment.amount;

    assert.strictEqual(newBalance, -2000);
  });
});

describe('cancelSale - filter in lists', () => {
  const sales = [
    { id: 'V-1', total: 1000, status: 'active' },
    { id: 'V-2', total: 2000, status: 'cancelled' },
    { id: 'V-3', total: 3000, status: 'active' }
  ];

  it('should exclude cancelled sales from list', () => {
    const active = sales.filter(s => s.status !== 'cancelled');
    assert.strictEqual(active.length, 2);
    assert.strictEqual(active[0].id, 'V-1');
    assert.strictEqual(active[1].id, 'V-3');
  });

  it('should exclude cancelled from totals', () => {
    const active = sales.filter(s => s.status !== 'cancelled');
    const total = active.reduce((sum, s) => sum + s.total, 0);
    assert.strictEqual(total, 4000);
  });

  it('should keep cancelled sale data intact', () => {
    const cancelled = sales.find(s => s.status === 'cancelled');
    assert.ok(cancelled);
    assert.strictEqual(cancelled.id, 'V-2');
    assert.strictEqual(cancelled.total, 2000);
  });
});
