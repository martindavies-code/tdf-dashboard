/**
 * UI Components and safe DOM rendering functions.
 * Follows strict XSS prevention by escaping content or using DOM construction.
 */

import { escapeHtml } from '../domain/security.js';
import { STAGE_TYPE_LABELS } from '../domain/constants.js';

/**
 * Renders the top 3 podium cards.
 * @param {HTMLElement} container
 * @param {Array<object>} standings - Ranked standings.
 */
export function renderPodiumCards(container, standings) {
  if (!container) return;
  const topThree = standings.slice(0, 3);
  const leaderTotal = topThree[0]?.total || 0;

  let html = '';
  topThree.forEach((rider, index) => {
    const isLeader = index === 0;
    const rankLabel = isLeader ? '1er // MAILLOT VERT' : `${index + 1}e au classement`;
    const gapLabel = isLeader ? 'LEADER' : `-${leaderTotal - rider.total} pts`;
    const badgeBg = isLeader ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-700/40 text-slate-300 border-slate-600/30';
    const borderAccent = isLeader ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-slate-800';

    html += `
      <div class="card p-6 flex flex-col justify-between ${borderAccent} relative overflow-hidden transition-all duration-200 hover:border-slate-700">
        ${isLeader ? '<div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400"></div>' : ''}
        
        <div>
          <div class="flex items-center justify-between gap-2 mb-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeBg}">
              ${isLeader ? '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>' : ''}
              ${escapeHtml(rankLabel)}
            </span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded ${isLeader ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-800/80'}">
              ${escapeHtml(gapLabel)}
            </span>
          </div>

          <div class="mb-4">
            <h3 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              ${escapeHtml(rider.name)}
              <span class="text-xs uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                ${escapeHtml(rider.country)}
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">${escapeHtml(rider.team)}</p>
          </div>
        </div>

        <div>
          <div class="flex items-baseline gap-2 mb-4">
            <span class="text-5xl font-extrabold tracking-tight text-white tabular-nums" style="color: ${escapeHtml(rider.color)}">
              ${rider.total}
            </span>
            <span class="text-sm font-medium text-slate-400 uppercase tracking-wider">points</span>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
            <div>
              <span class="text-slate-400 block text-[11px]">Sprints inter.</span>
              <span class="font-semibold text-slate-200 tabular-nums">${rider.intTotal} pts</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Arrivées</span>
              <span class="font-semibold text-slate-200 tabular-nums">${rider.finTotal} pts</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Moyenne / étape</span>
              <span class="font-semibold text-slate-200 tabular-nums">${rider.avgPointsPerStage} pts</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Dépendance sprint</span>
              <span class="font-semibold text-slate-200 tabular-nums">${rider.sprintDependencyPct}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Renders the high-level analytical KPI metrics bar.
 * @param {HTMLElement} container
 * @param {object} estimates
 */
export function renderKeyMetrics(container, estimates) {
  if (!container || !estimates) return;

  container.innerHTML = `
    <div class="card p-4 flex flex-col justify-between">
      <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Course disputée</span>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold text-white tabular-nums">${estimates.stagesCount}</span>
        <span class="text-xs text-slate-400">/ 21 étapes</span>
      </div>
      <div class="mt-2 text-xs text-slate-400">
        ${21 - estimates.stagesCount} étapes restantes au programme
      </div>
    </div>

    <div class="card p-4 flex flex-col justify-between">
      <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Avance du maillot vert</span>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold text-emerald-400 tabular-nums">+${estimates.leadMargin}</span>
        <span class="text-xs text-slate-400">pts d'écart</span>
      </div>
      <div class="mt-2 text-xs text-slate-400 truncate">
        ${escapeHtml(estimates.leaderName)} mène la course
      </div>
    </div>

    <div class="card p-4 flex flex-col justify-between">
      <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Record sur une étape</span>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold text-amber-400 tabular-nums">${estimates.maxSingleStage.points}</span>
        <span class="text-xs text-slate-400">pts (Étape ${estimates.maxSingleStage.stage})</span>
      </div>
      <div class="mt-2 text-xs text-slate-400 truncate">
        Par ${escapeHtml(estimates.maxSingleStage.rider)}
      </div>
    </div>

    <div class="card p-4 flex flex-col justify-between">
      <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Spécialiste sprints inter.</span>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold text-cyan-400 tabular-nums">${estimates.sprintSpecialistPct}%</span>
        <span class="text-xs text-slate-400">du total</span>
      </div>
      <div class="mt-2 text-xs text-slate-400 truncate">
        ${escapeHtml(estimates.sprintSpecialistName)}
      </div>
    </div>
  `;
}

/**
 * Renders the diagnostic breakdown table (sprint vs finish points).
 * @param {HTMLElement} tbody
 * @param {Array<object>} standings
 */
export function renderDiagnosticTable(tbody, standings) {
  if (!tbody) return;

  let html = '';
  standings.forEach(rider => {
    const isFirst = rider.rank === 1;
    const rankPill = isFirst
      ? '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">1er</span>'
      : `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400">${rider.rank}e</span>`;

    html += `
      <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
        <td class="px-4 py-3 text-center w-16 sticky left-0 bg-[#131a26] z-10">
          ${rankPill}
        </td>
        <td class="px-4 py-3 font-semibold text-white whitespace-nowrap">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${escapeHtml(rider.color)};"></span>
            <div>
              <span>${escapeHtml(rider.name)}</span>
              <span class="text-xs text-slate-400 block font-normal">${escapeHtml(rider.team)}</span>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-right font-bold text-white tabular-nums text-base">
          ${rider.total}
        </td>
        <td class="px-4 py-3 text-right text-slate-300 tabular-nums">
          ${rider.intTotal} <span class="text-xs text-slate-400">pts</span>
        </td>
        <td class="px-4 py-3 text-right text-slate-300 tabular-nums">
          ${rider.finTotal} <span class="text-xs text-slate-400">pts</span>
        </td>
        <td class="px-4 py-3 text-right text-slate-400 tabular-nums">
          ${rider.otherTotal} <span class="text-xs text-slate-400">pts</span>
        </td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center justify-end gap-2">
            <div class="w-24 bg-slate-800 rounded-full h-2 overflow-hidden flex">
              <div class="bg-cyan-400 h-full rounded-full" style="width: ${Math.min(100, rider.sprintDependencyPct)}%"></div>
            </div>
            <span class="text-xs font-semibold text-slate-200 tabular-nums w-12 text-right">
              ${rider.sprintDependencyPct}%
            </span>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Renders the stage-by-stage ledger table with optional filtering.
 * @param {HTMLElement} tbody
 * @param {Array<object>} events - Validated stage list.
 * @param {Array<object>} riders - Riders list.
 * @param {string} [filterType] - Filter by stage type or 'ALL'.
 */
export function renderStageLedger(tbody, events, riders, filterType = 'ALL') {
  if (!tbody) return;

  const filtered = filterType === 'ALL'
    ? events
    : events.filter(ev => {
        const type = (ev.type || '').toUpperCase();
        if (filterType === 'SPRINT') return type.includes('SPRINT');
        if (filterType === 'ARRIVEE') return type.includes('ARRIVÉE') || type.includes('ARRIVEE');
        if (filterType === 'MONTAGNE') return type.includes('MONT') || type.includes('HAUT');
        if (filterType === 'CLM') return type.includes('CLM') || type.includes('TTT') || type.includes('ITT');
        return true;
      });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-slate-400">
          Aucune étape ne correspond au filtre sélectionné.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  filtered.forEach(ev => {
    // Find stage top scorer among riders
    let maxPts = -1;
    let stageWinnerKey = '';
    riders.forEach(r => {
      const pts = ev[r.key] || 0;
      if (pts > maxPts) {
        maxPts = pts;
        stageWinnerKey = r.key;
      }
    });

    const friendlyType = STAGE_TYPE_LABELS[ev.type] || ev.type;

    html += `
      <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
        <td class="px-4 py-3 font-semibold text-white tabular-nums sticky left-0 bg-[#131a26] z-10">
          Étape ${ev.stage}
        </td>
        <td class="px-4 py-3 text-slate-300">
          <span class="inline-block px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-300 border border-slate-700/60">
            ${escapeHtml(friendlyType)}
          </span>
        </td>
        ${riders.map(r => {
          const pts = ev[r.key] || 0;
          const isWinner = pts === maxPts && pts > 0;
          const highlightClass = isWinner ? 'font-bold text-white bg-slate-800/50 rounded' : 'text-slate-300';
          return `
            <td class="px-4 py-3 text-right tabular-nums ${highlightClass}">
              +${pts}
            </td>
          `;
        }).join('')}
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Populates the interactive data editor modal table.
 * @param {HTMLElement} tbody
 * @param {Array<object>} events
 * @param {Array<object>} riders
 */
export function populateEditorTable(tbody, events, riders) {
  if (!tbody) return;

  let html = '';
  events.forEach((ev, idx) => {
    html += `
      <tr class="border-b border-slate-800 hover:bg-slate-800/30">
        <td class="p-3 text-white font-medium tabular-nums">Étape ${ev.stage}</td>
        <td class="p-3 text-slate-400 text-xs">${escapeHtml(ev.type)}</td>
        ${riders.map(r => `
          <td class="p-2 text-right">
            <input 
              type="number" 
              id="input-${r.key}-${idx}" 
              value="${ev[r.key] || 0}"
              min="0"
              max="100"
              class="w-16 px-2 py-1.5 text-right font-medium rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
              aria-label="Points ${escapeHtml(r.name)} étape ${ev.stage}"
            />
          </td>
        `).join('')}
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Displays an ephemeral toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type]
 */
export function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600 text-white' : (type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white border border-slate-700');
  toast.className = `px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all duration-300 pointer-events-auto transform translate-y-2 opacity-0 ${bg}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}
