/**
 * Core constants and rider definitions for the 2026 Tour de France Points Classification.
 */

export const DEFAULT_RIDERS = [
  {
    id: 'pedersen',
    name: 'Mads Pedersen',
    shortName: 'M. Pedersen',
    team: 'Lidl-Trek',
    country: 'DEN',
    countryCode: 'dk',
    color: '#10b981', // Emerald / Maillot Vert Accent
    accentLight: 'rgba(16, 185, 129, 0.15)',
    key: 'pedersen'
  },
  {
    id: 'philipsen',
    name: 'Jasper Philipsen',
    shortName: 'J. Philipsen',
    team: 'Alpecin-Deceuninck',
    teamAlt: 'Alpecin-Premier Tech',
    country: 'BEL',
    countryCode: 'be',
    color: '#3b82f6', // Rich Blue
    accentLight: 'rgba(59, 130, 246, 0.15)',
    key: 'philipsen'
  },
  {
    id: 'girmay',
    name: 'Biniam Girmay',
    shortName: 'B. Girmay',
    team: 'NSN Cycling Team',
    country: 'ERI',
    countryCode: 'er',
    color: '#06b6d4', // Cyan
    accentLight: 'rgba(6, 182, 212, 0.15)',
    key: 'girmay'
  },
  {
    id: 'merlier',
    name: 'Tim Merlier',
    shortName: 'T. Merlier',
    team: 'Soudal Quick-Step',
    country: 'BEL',
    countryCode: 'be',
    color: '#f59e0b', // Amber / Gold
    accentLight: 'rgba(245, 158, 11, 0.15)',
    key: 'merlier'
  }
];

export const STAGE_TYPE_LABELS = {
  'CLM/TTT': 'Contre-la-montre (Équipe)',
  'CLM ITT': 'Contre-la-montre (Individuel)',
  'ARRIVÉE HIL': 'Arrivée Accidentée',
  'ARRIVÉE OND': 'Arrivée Vallonnée',
  'ARRIVÉE PLA': 'Arrivée en Plaine',
  'SPRINT INT': 'Sprint Intermédiaire',
  'MONT. HAUT': 'Haute Montagne',
  'ARRIVÉE': 'Arrivée d\'Étape',
  'CLM': 'Contre-la-montre'
};

export const MAX_POINTS_PER_EVENT = 100;
export const MIN_POINTS_PER_EVENT = 0;
export const MAX_STAGES = 21;
