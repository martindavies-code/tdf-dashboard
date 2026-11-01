/**
 * Validation and schema normalization for race telemetry events.
 */

import {
  MIN_POINTS_PER_EVENT,
  MAX_POINTS_PER_EVENT,
  MAX_STAGES,
  DEFAULT_RIDERS
} from './constants.js';
import { sanitizeNumber, sanitizeText } from './security.js';

export class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Validates and normalizes a single race stage event.
 * @param {object} raw - The raw event object.
 * @param {Array<string>} [riderKeys] - Rider keys to extract.
 * @returns {object} Validated and normalized stage event.
 */
export function validateStageEvent(raw, riderKeys = DEFAULT_RIDERS.map(r => r.key)) {
  if (!raw || typeof raw !== 'object') {
    throw new ValidationError('L\'événement d\'étape doit être un objet valide.', { raw });
  }

  const stageNum = typeof raw.stage === 'string' ? parseInt(raw.stage.trim(), 10) : Number(raw.stage);
  if (!Number.isInteger(stageNum) || stageNum < 1 || stageNum > MAX_STAGES) {
    throw new ValidationError(`Numéro d'étape invalide: ${raw.stage}. Doit être un entier entre 1 et ${MAX_STAGES}.`, { raw });
  }
  const stage = stageNum;

  const type = sanitizeText(raw.type, 'ARRIVÉE', 30);

  const normalized = {
    stage,
    type
  };

  // Check for legacy pos1, pos2, pos3 mapping if direct rider keys are missing
  const hasDirectKeys = riderKeys.some(k => k in raw);
  if (!hasDirectKeys && ('pos1' in raw || 'pos2' in raw || 'pos3' in raw)) {
    // Map pos1 -> first rider, pos2 -> second rider, pos3 -> third rider
    riderKeys.forEach((key, idx) => {
      const posKey = `pos${idx + 1}`;
      normalized[key] = sanitizeNumber(raw[posKey], 0, MIN_POINTS_PER_EVENT, MAX_POINTS_PER_EVENT);
    });
  } else {
    // Extract each rider's points safely
    riderKeys.forEach(key => {
      normalized[key] = sanitizeNumber(raw[key], 0, MIN_POINTS_PER_EVENT, MAX_POINTS_PER_EVENT);
    });
  }

  return normalized;
}

/**
 * Validates an entire race dataset array.
 * @param {Array} rawList - List of raw events.
 * @param {Array<string>} [riderKeys] - Keys of riders.
 * @returns {Array<object>} Array of validated and sorted stage events.
 */
export function validateDataset(rawList, riderKeys = DEFAULT_RIDERS.map(r => r.key)) {
  if (!Array.isArray(rawList)) {
    throw new ValidationError('Le jeu de données doit être un tableau d\'étapes.');
  }

  if (rawList.length === 0) {
    throw new ValidationError('Le jeu de données ne contient aucune étape.');
  }

  const validated = rawList.map((item, index) => {
    try {
      return validateStageEvent(item, riderKeys);
    } catch (err) {
      throw new ValidationError(`Erreur à la ligne ${index + 1}: ${err.message}`, {
        index,
        originalError: err
      });
    }
  });

  return validated;
}
