import { describe, it } from 'node:test';
import assert from 'node:assert';

import { escapeHtml } from '../../utils/sanitizer.js';

describe('escapeHtml', () => {
  it('should return empty string for null', () => {
    assert.strictEqual(escapeHtml(null), '');
  });

  it('should return empty string for undefined', () => {
    assert.strictEqual(escapeHtml(undefined), '');
  });

  it('should return empty string for empty string', () => {
    assert.strictEqual(escapeHtml(''), '');
  });

  it('should escape ampersands', () => {
    assert.strictEqual(escapeHtml('&'), '&amp;');
  });

  it('should escape less-than', () => {
    assert.strictEqual(escapeHtml('<'), '&lt;');
  });

  it('should escape greater-than', () => {
    assert.strictEqual(escapeHtml('>'), '&gt;');
  });

  it('should escape double quotes', () => {
    assert.strictEqual(escapeHtml('"'), '&quot;');
  });

  it('should escape single quotes', () => {
    assert.strictEqual(escapeHtml("'"), '&#39;');
  });

  it('should escape all special characters together', () => {
    const input = '<script>alert("xss")</script>';
    const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
    assert.strictEqual(escapeHtml(input), expected);
  });

  it('should preserve normal text', () => {
    assert.strictEqual(escapeHtml('Hello World'), 'Hello World');
  });

  it('should handle numbers', () => {
    assert.strictEqual(escapeHtml(42), '42');
  });
});
