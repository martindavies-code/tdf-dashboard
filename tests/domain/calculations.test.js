import { describe, it, expect } from 'vitest';
import {
  calculateRiderStandings,
  calculateCumulativeProgression,
  calculateStageYield,
  calculateKeyEstimates
} from '../../src/domain/calculations.js';
import { DEFAULT_RIDERS } from '../../src/domain/constants.js';

describe('calculations module', () => {
  const sampleEvents = [
    { stage: 1, type: 'CLM/TTT', pedersen: 20, philipsen: 17, girmay: 15, merlier: 13 },
    { stage: 2, type: 'ARRIVÉE HIL', pedersen: 30, philipsen: 25, girmay: 22, merlier: 19 },
    { stage: 3, type: 'SPRINT INT', pedersen: 25, philipsen: 20, girmay: 16, merlier: 14 }
  ];

  describe('calculateRiderStandings', () => {
    it('computes point sums, rankings, gaps, and sprint dependencies accurately', () => {
      const standings = calculateRiderStandings(sampleEvents, DEFAULT_RIDERS);

      expect(standings.length).toBe(4);
      // Pedersen: 20 + 30 + 25 = 75
      // Philipsen: 17 + 25 + 20 = 62
      // Girmay: 15 + 22 + 16 = 53
      // Merlier: 13 + 19 + 14 = 46
      expect(standings[0].id).toBe('pedersen');
      expect(standings[0].total).toBe(75);
      expect(standings[0].rank).toBe(1);
      expect(standings[0].gapToLeader).toBe(0);
      expect(standings[0].gapToPrev).toBe(0);

      expect(standings[1].id).toBe('philipsen');
      expect(standings[1].total).toBe(62);
      expect(standings[1].rank).toBe(2);
      expect(standings[1].gapToLeader).toBe(13); // 75 - 62
      expect(standings[1].gapToPrev).toBe(13);

      // Check sprint vs finish breakdown for Pedersen:
      // intTotal = 25, finTotal = 30, otherTotal = 20 (CLM)
      expect(standings[0].intTotal).toBe(25);
      expect(standings[0].finTotal).toBe(30);
      expect(standings[0].otherTotal).toBe(20);
      // sprintDependencyPct = (25 / 75) * 100 = 33.3%
      expect(standings[0].sprintDependencyPct).toBe(33.3);
      expect(standings[0].finishDependencyPct).toBe(40.0);
    });

    it('handles empty events array gracefully', () => {
      const standings = calculateRiderStandings([], DEFAULT_RIDERS);
      expect(standings.length).toBe(4);
      expect(standings[0].total).toBe(0);
      expect(standings[0].sprintDependencyPct).toBe(0);
      expect(standings[0].gapToLeader).toBe(0);
    });

    it('handles tie breakers using finish points then sprint points', () => {
      const tiedEvents = [
        { stage: 1, type: 'ARRIVÉE PLA', pedersen: 50, philipsen: 30 },
        { stage: 2, type: 'SPRINT INT', pedersen: 10, philipsen: 30 }
      ];
      // Both have total = 60
      // Pedersen fin = 50, Philipsen fin = 30 -> Pedersen ranks ahead
      const standings = calculateRiderStandings(tiedEvents, DEFAULT_RIDERS);
      expect(standings[0].total).toBe(60);
      expect(standings[1].total).toBe(60);
      expect(standings[0].id).toBe('pedersen');
      expect(standings[1].id).toBe('philipsen');
    });
  });

  describe('calculateCumulativeProgression', () => {
    it('produces cumulative datasets and formatted labels', () => {
      const result = calculateCumulativeProgression(sampleEvents, DEFAULT_RIDERS, 3);
      expect(result.labels).toEqual([
        'Étape 1 (TTT)',
        'Étape 2 (ARR HIL)',
        'Étape 3 (INT)'
      ]);
      expect(result.datasets.length).toBe(3);
      // Pedersen cumulative: [20, 50, 75]
      expect(result.datasets[0].data).toEqual([20, 50, 75]);
      // Philipsen cumulative: [17, 42, 62]
      expect(result.datasets[1].data).toEqual([17, 42, 62]);
    });

    it('returns empty structures if events array is empty', () => {
      const result = calculateCumulativeProgression([], DEFAULT_RIDERS);
      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });
  });

  describe('calculateStageYield', () => {
    it('produces per-stage points matrix', () => {
      const yieldData = calculateStageYield(sampleEvents, DEFAULT_RIDERS, 2);
      expect(yieldData.labels).toEqual(['É.1', 'É.2', 'É.3']);
      expect(yieldData.datasets[0].data).toEqual([20, 30, 25]);
      expect(yieldData.datasets[1].data).toEqual([17, 25, 20]);
    });

    it('handles empty events gracefully', () => {
      const result = calculateStageYield([], DEFAULT_RIDERS);
      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });
  });

  describe('calculateKeyEstimates', () => {
    it('computes margin, highest stage score, and sprint specialist', () => {
      const standings = calculateRiderStandings(sampleEvents, DEFAULT_RIDERS);
      const estimates = calculateKeyEstimates(standings, sampleEvents);

      expect(estimates.stagesCount).toBe(3);
      expect(estimates.leaderName).toBe('Mads Pedersen');
      expect(estimates.leaderPoints).toBe(75);
      expect(estimates.leadMargin).toBe(13);
      expect(estimates.maxSingleStage.points).toBe(30);
      expect(estimates.maxSingleStage.stage).toBe(2);
    });

    it('handles empty standings safely', () => {
      const estimates = calculateKeyEstimates([], []);
      expect(estimates.stagesCount).toBe(0);
      expect(estimates.leaderName).toBe('—');
      expect(estimates.leadMargin).toBe(0);

      const singleRiderStandings = [{ id: 'p', name: 'Solo', key: 'p', total: 100, sprintDependencyPct: 20 }];
      const singleEstimates = calculateKeyEstimates(singleRiderStandings, [{ stage: 1, p: 100 }]);
      expect(singleEstimates.leadMargin).toBe(0);
      expect(singleEstimates.maxSingleStage.points).toBe(100);
      expect(singleEstimates.sprintSpecialistName).toBe('Solo');

      const nonArrayEstimates = calculateKeyEstimates(singleRiderStandings, null);
      expect(nonArrayEstimates.stagesCount).toBe(0);
    });

    it('covers all stage types in cumulative progression and default rider limits', () => {
      const variousStages = [
        { stage: 1, type: 'ARRIVEE', pedersen: 20 },
        { stage: 2, type: 'SPRINT INT', pedersen: 15 },
        { stage: 3, type: 'MONT. HAUT', pedersen: 10 },
        { stage: 4, type: 'CLM ITT', pedersen: 25 },
        { stage: 5, type: 'CLM/TTT', pedersen: 30 }
      ];
      const prog = calculateCumulativeProgression(variousStages);
      expect(prog.labels).toEqual([
        'Étape 1 (ARR)',
        'Étape 2 (INT)',
        'Étape 3 (MTN)',
        'Étape 4 (ITT)',
        'Étape 5 (TTT)'
      ]);
      expect(prog.datasets.length).toBe(3); // default limit 3

      const ridersWithoutShortName = [
        { id: 'custom', key: 'pedersen', name: 'Custom Name', color: '#fff' }
      ];
      const progCustom = calculateCumulativeProgression(variousStages, ridersWithoutShortName);
      expect(progCustom.datasets[0].name).toBe('Custom Name');

      const yieldCustom = calculateStageYield(variousStages, ridersWithoutShortName);
      expect(yieldCustom.datasets[0].name).toBe('Custom Name');
    });

    it('handles stages with no sprint or arrivee types (other types)', () => {
      const otherStages = [
        { stage: 1, type: 'CONTRE LA MONTRE', pedersen: 20, philipsen: 10 }
      ];
      const standings = calculateRiderStandings(otherStages, DEFAULT_RIDERS);
      expect(standings[0].otherTotal).toBe(20);
      expect(standings[0].intTotal).toBe(0);
      expect(standings[0].finTotal).toBe(0);
      expect(standings[0].activeStagesCount).toBe(1);
    });

    it('handles standings where no rider exceeds 50 points', () => {
      const lowPointsStandings = [
        { id: 'p', name: 'Low Scorer', key: 'p', total: 30, sprintDependencyPct: 10 }
      ];
      const est = calculateKeyEstimates(lowPointsStandings, [{ stage: 1, p: 30 }]);
      expect(est.sprintSpecialistName).toBe('Low Scorer');
    });

    it('handles stages where event.type is undefined and riders without names', () => {
      const namelessStages = [
        { stage: 1, p: 40 }
      ];
      const prog = calculateCumulativeProgression(namelessStages, [{ id: 'rider_p', key: 'p', color: '#000' }]);
      expect(prog.labels).toEqual(['Étape 1 ()']);

      const estimates = calculateKeyEstimates([{ id: 'rider_p', key: 'p', total: 40, sprintDependencyPct: 0 }], namelessStages);
      expect(estimates.maxSingleStage.rider).toBe('rider_p');
      expect(estimates.maxSingleStage.points).toBe(40);
    });

    it('returns empty progression and yield when events is not an array', () => {
      expect(calculateCumulativeProgression(null)).toEqual({ labels: [], datasets: [] });
      expect(calculateStageYield(null)).toEqual({ labels: [], datasets: [] });
    });

    it('sorts tied standings with finish points tie and sprint points comparison', () => {
      const tiedStages = [
        { stage: 1, type: 'ARRIVÉE', pedersen: 30, philipsen: 30 },
        { stage: 2, type: 'SPRINT INT', pedersen: 20, philipsen: 10 }
      ];
      const standings = calculateRiderStandings(tiedStages, DEFAULT_RIDERS);
      expect(standings[0].id).toBe('pedersen');
      expect(standings[1].id).toBe('philipsen');
    });
  });
});
