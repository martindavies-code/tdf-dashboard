/**
 * Data provider for loading, saving, and synchronizing race telemetry.
 */

import { DEFAULT_STAGE_DATA } from './defaultData.js';
import { validateDataset } from '../domain/validation.js';

export const STORAGE_KEY = 'tdf_2026_top3_data';
export const REMOTE_JSON_PATH = './races.json';

/**
 * Loads race data with prioritized fallback:
 * 1. User manual override from localStorage
 * 2. Remote / local static races.json
 * 3. Default bundled verified dataset
 *
 * @param {object} [options]
 * @param {string} [options.fetchUrl] - URL to fetch JSON from.
 * @param {string} [options.storageKey] - LocalStorage key.
 * @param {Array} [options.fallbackData] - Static fallback array.
 * @param {Storage} [options.storage] - Storage implementation (defaults to window.localStorage).
 * @param {Function} [options.fetchFn] - Fetch implementation (defaults to window.fetch).
 * @returns {Promise<{source: string, lastSync: string, data: Array<object>}>}
 */
export async function loadRaceData(options = {}) {
  const fetchUrl = options.fetchUrl || REMOTE_JSON_PATH;
  const storageKey = options.storageKey || STORAGE_KEY;
  const fallbackData = options.fallbackData || DEFAULT_STAGE_DATA;
  const storage = options.storage !== undefined ? options.storage : (typeof localStorage !== 'undefined' ? localStorage : null);
  const fetchFn = options.fetchFn !== undefined ? options.fetchFn : (typeof fetch !== 'undefined' ? fetch : null);

  // 1. Check local storage override
  if (storage) {
    try {
      const stored = storage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = validateDataset(parsed);
        return {
          source: 'local',
          lastSync: new Date().toISOString(),
          data: validated
        };
      }
    } catch {
      // Storage corrupted or invalid; ignore and proceed to remote/default
    }
  }

  // 2. Attempt remote fetch
  if (fetchFn) {
    try {
      let controller = null;
      let signal = null;
      let timeoutId = null;
      if (typeof AbortController !== 'undefined') {
        controller = new AbortController();
        signal = controller.signal;
        timeoutId = setTimeout(() => controller.abort(), 3000);
      }

      try {
        const response = await fetchFn(fetchUrl, { signal });
        if (response && response.ok) {
          const json = await response.json();
          let rawEvents = [];
          let syncTime = new Date().toISOString();

          if (Array.isArray(json)) {
            rawEvents = json;
          } else if (json && typeof json === 'object') {
            if (Array.isArray(json.events)) {
              rawEvents = json.events;
            }
            if (json.last_sync) {
              syncTime = json.last_sync;
            }
          }

          if (rawEvents.length > 0) {
            const validated = validateDataset(rawEvents);
            return {
              source: 'remote',
              lastSync: syncTime,
              data: validated
            };
          }
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    } catch {
      // Network failure, timeout, or CORS issue; proceed to fallback
    }
  }

  // 3. Fallback to bundled dataset
  const validated = validateDataset(fallbackData);
  return {
    source: 'default',
    lastSync: '2026-10-31T20:46:53Z',
    data: validated
  };
}

/**
 * Saves modified telemetry dataset into storage.
 * @param {Array<object>} data - Raw stage events to save.
 * @param {string} [storageKey] - LocalStorage key.
 * @param {Storage} [storage] - Storage engine.
 * @returns {Array<object>} Validated and saved data.
 */
export function saveLocalData(data, storageKey = STORAGE_KEY, storage = null) {
  const targetStorage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!targetStorage) {
    throw new Error('Stockage local non disponible.');
  }

  const validated = validateDataset(data);
  targetStorage.setItem(storageKey, JSON.stringify(validated));
  return validated;
}

/**
 * Clears local telemetry overrides.
 * @param {string} [storageKey] - LocalStorage key.
 * @param {Storage} [storage] - Storage engine.
 */
export function resetLocalData(storageKey = STORAGE_KEY, storage = null) {
  const targetStorage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (targetStorage) {
    targetStorage.removeItem(storageKey);
  }
}
