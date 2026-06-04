import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('burgerStock - cumulative consumption logic', () => {
  const movements = [
    { ingredientId: 'bread', delta: -2, action: 'sale', productName: 'Cheeseburger Simple' },
    { ingredientId: 'patty', delta: -2, action: 'sale', productName: 'Cheeseburger Simple' },
    { ingredientId: 'bread', delta: -1, action: 'sale', productName: 'Cheeseburger Doble' },
    { ingredientId: 'patty', delta: -2, action: 'sale', productName: 'Cheeseburger Doble' },
    { ingredientId: 'bread', delta: -3, action: 'sale', productName: 'Sampler Vice' },
    { ingredientId: 'patty', delta: -3, action: 'sale', productName: 'Sampler Vice' },
    { ingredientId: 'bread', delta: 2, action: 'manual_adjustment', productName: 'Ajuste' }
  ];

  it('should calculate cumulative bread consumption', () => {
    const totalBread = movements
      .filter(m => m.ingredientId === 'bread' && m.action === 'sale')
      .reduce((sum, m) => sum + Math.abs(m.delta), 0);
    assert.strictEqual(totalBread, 6);
  });

  it('should calculate cumulative patty consumption', () => {
    const totalPatty = movements
      .filter(m => m.ingredientId === 'patty' && m.action === 'sale')
      .reduce((sum, m) => sum + Math.abs(m.delta), 0);
    assert.strictEqual(totalPatty, 7);
  });

  it('should build product ranking', () => {
    const saleMovements = movements.filter(m => m.action === 'sale');
    const ranking = {};
    for (const m of saleMovements) {
      const key = m.productName || 'Unknown';
      if (!ranking[key]) ranking[key] = { name: key, breads: 0, patties: 0, count: 0 };
      if (m.ingredientId === 'bread') ranking[key].breads += Math.abs(m.delta);
      if (m.ingredientId === 'patty') ranking[key].patties += Math.abs(m.delta);
      ranking[key].count += 1;
    }
    const sorted = Object.values(ranking).sort((a, b) => b.count - a.count);
    assert.strictEqual(sorted.length, 3);
    assert.strictEqual(sorted[0].name, 'Sampler Vice');
  });

  it('should exclude manual adjustments from ranking', () => {
    const saleMovements = movements.filter(m => m.action === 'sale');
    const hasManual = saleMovements.some(m => m.action === 'manual_adjustment');
    assert.strictEqual(hasManual, false);
  });
});

describe('burgerStock - session aggregation', () => {
  const sessions = [
    { id: 's1', date: '2026-06-01', totalBreadsConsumed: 10, totalPattiesConsumed: 12, status: 'closed' },
    { id: 's2', date: '2026-06-02', totalBreadsConsumed: 8, totalPattiesConsumed: 10, status: 'closed' },
    { id: 's3', date: '2026-06-03', totalBreadsConsumed: 5, totalPattiesConsumed: 6, status: 'open' }
  ];

  it('should sum bread across all sessions', () => {
    const total = sessions.reduce((sum, s) => sum + (s.totalBreadsConsumed || 0), 0);
    assert.strictEqual(total, 23);
  });

  it('should sum patty across all sessions', () => {
    const total = sessions.reduce((sum, s) => sum + (s.totalPattiesConsumed || 0), 0);
    assert.strictEqual(total, 28);
  });

  it('should count total sessions', () => {
    assert.strictEqual(sessions.length, 3);
  });
});
