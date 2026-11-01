import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeNumber, sanitizeText } from '../../src/domain/security.js';

describe('security utilities', () => {
  describe('escapeHtml', () => {
    it('handles null and undefined gracefully', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    it('escapes &, <, >, ", and single quotes', () => {
      const dangerous = '<script>alert("XSS & attack")</script>\'test\'';
      const safe = escapeHtml(dangerous);
      expect(safe).toBe('&lt;script&gt;alert(&quot;XSS &amp; attack&quot;)&lt;/script&gt;&#39;test&#39;');
      expect(safe).not.toContain('<');
      expect(safe).not.toContain('>');
      expect(safe).not.toContain('"');
    });

    it('leaves safe strings unmodified', () => {
      expect(escapeHtml('Mads Pedersen (DEN)')).toBe('Mads Pedersen (DEN)');
      expect(escapeHtml('12345')).toBe('12345');
    });

    it('converts numbers to strings cleanly', () => {
      expect(escapeHtml(397)).toBe('397');
      expect(escapeHtml(0)).toBe('0');
    });
  });

  describe('sanitizeNumber', () => {
    it('returns numbers within boundaries', () => {
      expect(sanitizeNumber(25, 0, 0, 100)).toBe(25);
      expect(sanitizeNumber(150, 0, 0, 100)).toBe(100);
      expect(sanitizeNumber(-10, 0, 0, 100)).toBe(0);
    });

    it('parses numeric strings within boundaries', () => {
      expect(sanitizeNumber(' 42 ', 0, 0, 100)).toBe(42);
      expect(sanitizeNumber('999', 0, 0, 50)).toBe(50);
      expect(sanitizeNumber('-5', 0, 0, 50)).toBe(0);
    });

    it('handles NaN, Infinity, and non-numeric inputs using fallback', () => {
      expect(sanitizeNumber(NaN, 10, 0, 100)).toBe(10);
      expect(sanitizeNumber(Infinity, 10, 0, 100)).toBe(10);
      expect(sanitizeNumber('invalid', 15, 0, 100)).toBe(15);
      expect(sanitizeNumber(null, 7, 0, 100)).toBe(7);
      expect(sanitizeNumber(undefined, 8, 0, 100)).toBe(8);
      expect(sanitizeNumber({}, 9, 0, 100)).toBe(9);
    });

    it('rounds floating point numbers to integers', () => {
      expect(sanitizeNumber(23.7, 0, 0, 100)).toBe(24);
      expect(sanitizeNumber(23.2, 0, 0, 100)).toBe(23);
    });
  });

  describe('sanitizeText', () => {
    it('trims whitespace and enforces max length', () => {
      expect(sanitizeText('   Sprint Intermédiaire   ', 'Default', 10)).toBe('Sprint Int');
      expect(sanitizeText('Short', 'Default', 50)).toBe('Short');
    });

    it('falls back when input is invalid or whitespace-only', () => {
      expect(sanitizeText('   ', 'Fallback', 50)).toBe('Fallback');
      expect(sanitizeText(null, 'Fallback', 50)).toBe('Fallback');
      expect(sanitizeText(undefined, 'Fallback', 50)).toBe('Fallback');
      expect(sanitizeText(123, 'Fallback', 50)).toBe('Fallback');
    });
  });
});
