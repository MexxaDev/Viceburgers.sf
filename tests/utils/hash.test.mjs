import { describe, it } from 'node:test';
import assert from 'node:assert';

import { hashPassword } from '../../utils/hash.js';

describe('hashPassword', () => {
  it('should return a hex string', async () => {
    const hash = await hashPassword('admin123');
    assert.strictEqual(typeof hash, 'string');
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  it('should produce consistent results for the same input', async () => {
    const hash1 = await hashPassword('admin123');
    const hash2 = await hashPassword('admin123');
    assert.strictEqual(hash1, hash2);
  });

  it('should produce different results for different inputs', async () => {
    const hash1 = await hashPassword('admin123');
    const hash2 = await hashPassword('admin456');
    assert.notStrictEqual(hash1, hash2);
  });

  it('should handle empty string', async () => {
    const hash = await hashPassword('');
    assert.strictEqual(hash.length, 64);
  });

  it('should handle special characters', async () => {
    const hash = await hashPassword('<script>&"\'');
    assert.strictEqual(hash.length, 64);
  });
});
