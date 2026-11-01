import { describe, it, expect } from 'vitest';
import { validateStageEvent, validateDataset, ValidationError } from '../../src/domain/validation.js';

describe('validation module', () => {
  const riderKeys = ['pedersen', 'philipsen', 'girmay', 'merlier'];

  describe('validateStageEvent', () => {
    it('normalizes a valid modern stage object', () => {
      const raw = {
        stage: 4,
        type: 'ARRIVÉE OND',
        pedersen: 50,
        philipsen: 45,
        girmay: 40,
        merlier: 35
      };

      const result = validateStageEvent(raw, riderKeys);
      expect(result).toEqual({
        stage: 4,
        type: 'ARRIVÉE OND',
        pedersen: 50,
        philipsen: 45,
        girmay: 40,
        merlier: 35
      });
    });

    it('uses default rider keys when riderKeys parameter is omitted', () => {
      const raw = {
        stage: 5,
        type: 'ARRIVÉE',
        pedersen: 25,
        philipsen: 20
      };
      const result = validateStageEvent(raw);
      expect(result.pedersen).toBe(25);
      expect(result.girmay).toBe(0);

      const listResult = validateDataset([raw]);
      expect(listResult.length).toBe(1);
    });

    it('maps legacy pos1, pos2, pos3 format if rider keys are absent', () => {
      const legacy = {
        stage: 2,
        type: 'SPRINT INT',
        pos1: 20,
        pos2: 15,
        pos3: 10
      };

      const result = validateStageEvent(legacy, riderKeys);
      expect(result.stage).toBe(2);
      expect(result.type).toBe('SPRINT INT');
      expect(result.pedersen).toBe(20);
      expect(result.philipsen).toBe(15);
      expect(result.girmay).toBe(10);
      expect(result.merlier).toBe(0); // 4th rider default
    });

    it('clamps out-of-boundary point values', () => {
      const raw = {
        stage: 1,
        type: 'ARRIVÉE',
        pedersen: 999, // exceeds max 100
        philipsen: -20, // below 0
        girmay: 45
      };

      const result = validateStageEvent(raw, riderKeys);
      expect(result.pedersen).toBe(100);
      expect(result.philipsen).toBe(0);
      expect(result.girmay).toBe(45);
      expect(result.merlier).toBe(0);
    });

    it('throws on null or non-object input', () => {
      expect(() => validateStageEvent(null, riderKeys)).toThrow(ValidationError);
      expect(() => validateStageEvent('invalid', riderKeys)).toThrow(ValidationError);
    });

    it('throws on invalid stage numbers (< 1 or > 21)', () => {
      expect(() => validateStageEvent({ stage: 0, type: 'CLM' }, riderKeys)).toThrow(ValidationError);
      expect(() => validateStageEvent({ stage: -5, type: 'CLM' }, riderKeys)).toThrow(ValidationError);
    });
  });

  describe('validateDataset', () => {
    it('validates a complete list of stages', () => {
      const list = [
        { stage: 1, type: 'CLM', pedersen: 20, philipsen: 15 },
        { stage: 2, type: 'ARRIVÉE', pedersen: 50, philipsen: 40 }
      ];

      const validated = validateDataset(list, riderKeys);
      expect(validated.length).toBe(2);
      expect(validated[0].stage).toBe(1);
      expect(validated[1].stage).toBe(2);
    });

    it('throws if input is not an array', () => {
      expect(() => validateDataset(null)).toThrow(ValidationError);
      expect(() => validateDataset({ not: 'an array' })).toThrow(ValidationError);
    });

    it('throws if array is empty', () => {
      expect(() => validateDataset([])).toThrow(ValidationError);
    });

    it('throws descriptive error on malformed items with row index', () => {
      const invalidList = [
        { stage: 1, type: 'CLM' },
        { stage: 'not-a-stage', type: 'CLM' }
      ];

      expect(() => validateDataset(invalidList, riderKeys)).toThrow(/ligne 2/);
    });
  });
});
