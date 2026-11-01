import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadRaceData,
  saveLocalData,
  resetLocalData,
  STORAGE_KEY
} from '../../src/data/dataProvider.js';
import { DEFAULT_STAGE_DATA } from '../../src/data/defaultData.js';

describe('dataProvider module', () => {
  let mockStorage;

  beforeEach(() => {
    const store = new Map();
    mockStorage = {
      getItem: vi.fn(key => store.get(key) || null),
      setItem: vi.fn((key, val) => store.set(key, String(val))),
      removeItem: vi.fn(key => store.delete(key)),
      clear: vi.fn(() => store.clear())
    };
  });

  describe('loadRaceData', () => {
    it('returns local override when valid item exists in storage', async () => {
      const customStages = [
        { stage: 1, type: 'CLM', pedersen: 25, philipsen: 20, girmay: 15, merlier: 10 }
      ];
      mockStorage.setItem(STORAGE_KEY, JSON.stringify(customStages));

      const result = await loadRaceData({
        storage: mockStorage,
        fetchFn: vi.fn()
      });

      expect(result.source).toBe('local');
      expect(result.data.length).toBe(1);
      expect(result.data[0].pedersen).toBe(25);
    });

    it('falls back to remote fetch if storage is empty', async () => {
      const remotePayload = {
        last_sync: '2026-11-01T12:00:00Z',
        events: [
          { stage: 1, type: 'ARRIVÉE', pedersen: 50, philipsen: 40, girmay: 30, merlier: 20 }
        ]
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => remotePayload
      });

      const result = await loadRaceData({
        storage: mockStorage,
        fetchFn: mockFetch
      });

      expect(result.source).toBe('remote');
      expect(result.lastSync).toBe('2026-11-01T12:00:00Z');
      expect(result.data.length).toBe(1);
      expect(result.data[0].pedersen).toBe(50);
    });

    it('falls back to default data if fetch fails or throws', async () => {
      const failingFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await loadRaceData({
        storage: mockStorage,
        fetchFn: failingFetch
      });

      expect(result.source).toBe('default');
      expect(result.data.length).toBe(DEFAULT_STAGE_DATA.length);
      expect(result.data[0].stage).toBe(1);
    });

    it('handles remote raw array format', async () => {
      const rawArray = [
        { stage: 1, type: 'ARRIVÉE', pedersen: 50, philipsen: 40, girmay: 30, merlier: 20 }
      ];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => rawArray
      });

      const result = await loadRaceData({
        storage: mockStorage,
        fetchFn: mockFetch
      });

      expect(result.source).toBe('remote');
      expect(result.data.length).toBe(1);
    });

    it('falls back to default when storage contains corrupted JSON', async () => {
      mockStorage.setItem(STORAGE_KEY, '{ invalid json');
      const mockFetch = vi.fn().mockResolvedValue({ ok: false });

      const result = await loadRaceData({
        storage: mockStorage,
        fetchFn: mockFetch
      });

      expect(result.source).toBe('default');
    });

    it('falls back to default when remote JSON has empty events', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ events: [] })
      });

      const result = await loadRaceData({
        storage: mockStorage,
        fetchFn: mockFetch
      });

      expect(result.source).toBe('default');
    });

    it('falls back to default when remote JSON has last_sync but no events array', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ last_sync: '2026-11-01T10:00:00Z' })
      });

      const result = await loadRaceData({
        storage: mockStorage,
        fetchFn: mockFetch
      });

      expect(result.source).toBe('default');
    });

    it('handles remote response without last_sync timestamp', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          events: [
            { stage: 1, type: 'ARRIVÉE', pedersen: 50, philipsen: 40, girmay: 30, merlier: 20 }
          ]
        })
      });

      const result = await loadRaceData({
        storage: mockStorage,
        fetchFn: mockFetch
      });

      expect(result.source).toBe('remote');
      expect(result.lastSync).toBeDefined();
    });

    it('works when options are completely omitted', async () => {
      const result = await loadRaceData();
      expect(result.data.length).toBeGreaterThan(0);
      expect(['local', 'remote', 'default']).toContain(result.source);
    });

    it('works when fetchFn is null and storage is null', async () => {
      const result = await loadRaceData({
        storage: null,
        fetchFn: null
      });
      expect(result.source).toBe('default');
    });

    it('triggers controller timeout branch gracefully', async () => {
      const hangingFetch = vi.fn((url, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('Aborted')));
      }));

      // Speed up timer
      vi.useFakeTimers();
      const promise = loadRaceData({
        storage: mockStorage,
        fetchFn: hangingFetch
      });
      vi.advanceTimersByTime(3500);
      const result = await promise;
      vi.useRealTimers();

      expect(result.source).toBe('default');
    });

    it('handles remote JSON that is not an array or valid object', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => 'unexpected string'
      });
      const result = await loadRaceData({
        storage: mockStorage,
        fetchFn: mockFetch
      });
      expect(result.source).toBe('default');
    });

    it('handles null response from fetchFn', async () => {
      const mockFetch = vi.fn().mockResolvedValue(null);
      const result = await loadRaceData({
        storage: mockStorage,
        fetchFn: mockFetch
      });
      expect(result.source).toBe('default');
    });

    it('uses global localStorage when options.storage is omitted', () => {
      const original = globalThis.localStorage;
      globalThis.localStorage = mockStorage;
      try {
        saveLocalData([{ stage: 1, type: 'CLM', pedersen: 20 }], 'global_test');
        expect(mockStorage.setItem).toHaveBeenCalledWith('global_test', expect.any(String));

        resetLocalData('global_test');
        expect(mockStorage.removeItem).toHaveBeenCalledWith('global_test');
      } finally {
        globalThis.localStorage = original;
      }
    });
  });

  describe('saveLocalData & resetLocalData', () => {
    it('validates and saves data into storage', () => {
      const valid = [
        { stage: 1, type: 'CLM', pedersen: 20, philipsen: 15, girmay: 10, merlier: 5 }
      ];
      saveLocalData(valid, 'test_key', mockStorage);
      expect(mockStorage.setItem).toHaveBeenCalledWith('test_key', expect.any(String));
    });

    it('clears data with resetLocalData', () => {
      mockStorage.setItem('test_key', 'some data');
      resetLocalData('test_key', mockStorage);
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('handles null storage in resetLocalData gracefully', () => {
      expect(() => resetLocalData('test_key', null)).not.toThrow();
    });

    it('throws error when storage is not available in saveLocalData', () => {
      expect(() => saveLocalData([], 'k', null)).toThrow('Stockage local non disponible.');
    });
  });
});
