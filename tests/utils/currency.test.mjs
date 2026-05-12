import { describe, it } from 'node:test';
import assert from 'node:assert';

const mockStorage = {};
globalThis.localStorage = {
  getItem: k => mockStorage[k] ?? null,
  setItem: (k, v) => {
    mockStorage[k] = String(v);
  },
  removeItem: k => {
    delete mockStorage[k];
  },
  clear: () => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  },
  get length() {
    return Object.keys(mockStorage).length;
  },
  key: i => Object.keys(mockStorage)[i] ?? null
};

const { format, parse } = await import('../../utils/currency.js');

describe('format', () => {
  it('should format a number with default symbol', () => {
    const result = format(100);
    assert.match(result, /\$/);
    assert.match(result, /100\.00/);
  });

  it('should format zero', () => {
    const result = format(0);
    assert.match(result, /0\.00/);
  });

  it('should format decimal values', () => {
    const result = format(10.5);
    assert.match(result, /10\.50/);
  });

  it('should format large numbers', () => {
    const result = format(1234567.89);
    assert.match(result, /1234567\.89/);
  });
});

describe('parse', () => {
  it('should parse a simple number string', () => {
    assert.strictEqual(parse('100'), 100);
  });

  it('should parse a formatted currency string', () => {
    assert.strictEqual(parse('$ 100.50'), 100.5);
  });

  it('should parse a string with symbols', () => {
    assert.strictEqual(parse('$1,000.50'), 1000.5);
  });

  it('should return 0 for invalid input', () => {
    assert.strictEqual(parse('abc'), 0);
  });

  it('should handle negative numbers', () => {
    assert.strictEqual(parse('-50'), -50);
  });
});
