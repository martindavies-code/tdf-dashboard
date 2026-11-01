/**
 * Pure domain calculations for Tour de France Points Classification (Maillot Vert).
 */

import { DEFAULT_RIDERS } from './constants.js';

/**
 * Calculates current standings, point breakdowns, and sprint dependencies.
 * @param {Array<object>} events - Validated stage events.
 * @param {Array<object>} [riders] - Rider metadata list.
 * @returns {Array<object>} Ranked rider standings.
 */
export function calculateRiderStandings(events, riders = DEFAULT_RIDERS) {
  if (!Array.isArray(events) || events.length === 0) {
    return riders.map((r, i) => ({
      ...r,
      total: 0,
      intTotal: 0,
      finTotal: 0,
      otherTotal: 0,
      sprintDependencyPct: 0,
      finishDependencyPct: 0,
      avgPointsPerStage: 0,
      activeStagesCount: 0,
      rank: i + 1,
      gapToLeader: 0,
      gapToPrev: 0
    }));
  }

  const standings = riders.map(rider => {
    let total = 0;
    let intTotal = 0;
    let finTotal = 0;
    let otherTotal = 0;
    let activeStagesCount = 0;

    for (const ev of events) {
      const pts = ev[rider.key] || 0;
      total += pts;
      if (pts > 0) activeStagesCount++;

      const typeUpper = (ev.type || '').toUpperCase();
      if (typeUpper.includes('SPRINT')) {
        intTotal += pts;
      } else if (typeUpper.includes('ARRIVÉE') || typeUpper.includes('ARRIVEE')) {
        finTotal += pts;
      } else {
        otherTotal += pts;
      }
    }

    const sprintDependencyPct = total > 0
      ? Number(((intTotal / total) * 100).toFixed(1))
      : 0;

    const finishDependencyPct = total > 0
      ? Number(((finTotal / total) * 100).toFixed(1))
      : 0;

    const avgPointsPerStage = events.length > 0
      ? Number((total / events.length).toFixed(1))
      : 0;

    return {
      ...rider,
      total,
      intTotal,
      finTotal,
      otherTotal,
      sprintDependencyPct,
      finishDependencyPct,
      avgPointsPerStage,
      activeStagesCount
    };
  });

  // Sort: descending by total, then finish points, then sprint points
  standings.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.finTotal !== a.finTotal) return b.finTotal - a.finTotal;
    return b.intTotal - a.intTotal;
  });

  const leaderTotal = standings[0]?.total || 0;

  return standings.map((rider, index) => ({
    ...rider,
    rank: index + 1,
    gapToLeader: leaderTotal - rider.total,
    gapToPrev: index === 0 ? 0 : standings[index - 1].total - rider.total
  }));
}

/**
 * Builds cumulative points timeline for line charts.
 * @param {Array<object>} events - Validated stage events.
 * @param {Array<object>} [riders] - Riders to include.
 * @param {number} [limit] - Max riders to track (default 3 for podium).
 * @returns {object} { labels, datasets }
 */
export function calculateCumulativeProgression(events, riders = DEFAULT_RIDERS, limit = 3) {
  if (!Array.isArray(events) || events.length === 0) {
    return { labels: [], datasets: [] };
  }

  const selectedRiders = riders.slice(0, limit);

  const labels = events.map(ev => {
    let cleanType = (ev.type || '')
      .replace(/ARRIVÉE/gi, 'ARR')
      .replace(/ARRIVEE/gi, 'ARR')
      .replace(/SPRINT INT/gi, 'INT')
      .replace(/MONT\. HAUT/gi, 'MTN')
      .replace(/CLM ITT/gi, 'ITT')
      .replace(/CLM\/TTT/gi, 'TTT')
      .trim();
    return `Étape ${ev.stage} (${cleanType})`;
  });

  const datasets = selectedRiders.map(rider => {
    let cumulative = 0;
    const data = events.map(ev => {
      cumulative += (ev[rider.key] || 0);
      return cumulative;
    });

    return {
      id: rider.id,
      key: rider.key,
      name: rider.shortName || rider.name,
      team: rider.team,
      color: rider.color,
      data
    };
  });

  return { labels, datasets };
}

/**
 * Builds per-stage yield dataset for bar charts.
 * @param {Array<object>} events - Validated stage events.
 * @param {Array<object>} [riders] - Riders to include.
 * @param {number} [limit] - Max riders (default 3).
 * @returns {object} { labels, datasets }
 */
export function calculateStageYield(events, riders = DEFAULT_RIDERS, limit = 3) {
  if (!Array.isArray(events) || events.length === 0) {
    return { labels: [], datasets: [] };
  }

  const selectedRiders = riders.slice(0, limit);
  const labels = events.map(ev => `É.${ev.stage}`);

  const datasets = selectedRiders.map(rider => {
    const data = events.map(ev => ev[rider.key] || 0);
    return {
      id: rider.id,
      key: rider.key,
      name: rider.shortName || rider.name,
      color: rider.color,
      data
    };
  });

  return { labels, datasets };
}

/**
 * Calculates high-level narrative estimates for editorial summary cards.
 * @param {Array<object>} standings - Ranked standings.
 * @param {Array<object>} events - Stage events.
 * @returns {object} Analytical estimates.
 */
export function calculateKeyEstimates(standings, events) {
  const stagesCount = Array.isArray(events) ? events.length : 0;
  const leader = standings[0] || null;
  const runnerUp = standings[1] || null;

  const leadMargin = (leader && runnerUp) ? leader.total - runnerUp.total : 0;

  let maxSingleStage = { rider: '', stage: 0, points: 0 };
  if (Array.isArray(events) && standings.length > 0) {
    for (const ev of events) {
      for (const rider of standings) {
        const pts = ev[rider.key] || 0;
        if (pts > maxSingleStage.points) {
          maxSingleStage = {
            rider: rider.name || rider.id,
            stage: ev.stage,
            points: pts
          };
        }
      }
    }
  }

  // Find most sprint-reliant rider among top riders
  const sprintSpecialist = [...standings]
    .filter(r => r.total > 50)
    .sort((a, b) => b.sprintDependencyPct - a.sprintDependencyPct)[0] || standings[0] || null;

  return {
    stagesCount,
    leaderName: leader ? leader.name : '—',
    leaderPoints: leader ? leader.total : 0,
    leadMargin,
    maxSingleStage,
    sprintSpecialistName: sprintSpecialist ? sprintSpecialist.name : '—',
    sprintSpecialistPct: sprintSpecialist ? sprintSpecialist.sprintDependencyPct : 0
  };
}
