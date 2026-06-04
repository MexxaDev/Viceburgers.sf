import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  required,
  minLength,
  maxLength,
  isNumber,
  isPositive,
  isInteger,
  validateProduct,
  validateCustomer,
  validateCategory
} from '../../utils/validators.js';

describe('required', () => {
  it('should return true for non-empty string', () => {
    assert.strictEqual(required('foo'), true);
  });

  it('should return false for null', () => {
    assert.strictEqual(required(null), false);
  });

  it('should return false for undefined', () => {
    assert.strictEqual(required(undefined), false);
  });

  it('should return false for empty string', () => {
    assert.strictEqual(required(''), false);
  });

  it('should return false for whitespace-only string', () => {
    assert.strictEqual(required('   '), false);
  });

  it('should return true for zero', () => {
    assert.strictEqual(required(0), true);
  });
});

describe('minLength', () => {
  it('should return true when length equals min', () => {
    assert.strictEqual(minLength('abc', 3), true);
  });

  it('should return true when length exceeds min', () => {
    assert.strictEqual(minLength('abcdef', 3), true);
  });

  it('should return false when length is less than min', () => {
    assert.strictEqual(minLength('ab', 3), false);
  });

  it('should return false for null', () => {
    assert.ok(!minLength(null, 3));
  });
});

describe('maxLength', () => {
  it('should return true when length equals max', () => {
    assert.strictEqual(maxLength('abc', 3), true);
  });

  it('should return true when length is less than max', () => {
    assert.strictEqual(maxLength('ab', 3), true);
  });

  it('should return false when length exceeds max', () => {
    assert.strictEqual(maxLength('abcd', 3), false);
  });

  it('should return true for null', () => {
    assert.strictEqual(maxLength(null, 3), true);
  });
});

describe('isNumber', () => {
  it('should return true for integer string', () => {
    assert.strictEqual(isNumber('42'), true);
  });

  it('should return true for decimal string', () => {
    assert.strictEqual(isNumber('3.14'), true);
  });

  it('should return true for actual number', () => {
    assert.strictEqual(isNumber(42), true);
  });

  it('should return false for non-numeric string', () => {
    assert.strictEqual(isNumber('abc'), false);
  });

  it('should return false for NaN', () => {
    assert.strictEqual(isNumber(NaN), false);
  });

  it('should return false for Infinity', () => {
    assert.strictEqual(isNumber(Infinity), false);
  });
});

describe('isPositive', () => {
  it('should return true for positive number', () => {
    assert.strictEqual(isPositive('10'), true);
  });

  it('should return false for zero', () => {
    assert.strictEqual(isPositive('0'), false);
  });

  it('should return false for negative number', () => {
    assert.strictEqual(isPositive('-5'), false);
  });
});

describe('isInteger', () => {
  it('should return true for integer string', () => {
    assert.strictEqual(isInteger('5'), true);
  });

  it('should return false for decimal', () => {
    assert.strictEqual(isInteger('5.5'), false);
  });

  it('should return false for non-numeric', () => {
    assert.strictEqual(isInteger('abc'), false);
  });
});

describe('validateProduct', () => {
  it('should return errors for missing name', () => {
    const errors = validateProduct({ price: '10', stock: '5' });
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.includes('nombre')));
  });

  it('should return errors for zero price', () => {
    const errors = validateProduct({ name: 'Test', price: '0', stock: '5' });
    assert.ok(errors.some(e => e.includes('precio')));
  });

  it('should return errors for non-integer stock', () => {
    const errors = validateProduct({ name: 'Test', price: '10', stock: '5.5' });
    assert.ok(errors.some(e => e.includes('stock')));
  });

  it('should return no errors for valid product', () => {
    const errors = validateProduct({ name: 'Test', price: '10', stock: '5' });
    assert.strictEqual(errors.length, 0);
  });
});

describe('validateCustomer', () => {
  it('should return error for missing name', () => {
    const errors = validateCustomer({});
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.includes('nombre')));
  });

  it('should return no errors for valid customer', () => {
    const errors = validateCustomer({ name: 'Juan' });
    assert.strictEqual(errors.length, 0);
  });
});

describe('validateCategory', () => {
  it('should return error for missing name', () => {
    const errors = validateCategory({});
    assert.ok(errors.length > 0);
  });

  it('should return no errors for valid category', () => {
    const errors = validateCategory({ name: 'Bebidas' });
    assert.strictEqual(errors.length, 0);
  });
});
