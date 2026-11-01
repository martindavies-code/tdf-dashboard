/**
 * Main application entry point and state coordinator.
 */

import { DEFAULT_RIDERS } from './domain/constants.js';
import {
  calculateRiderStandings,
  calculateCumulativeProgression,
  calculateStageYield,
  calculateKeyEstimates
} from './domain/calculations.js';
import {
  loadRaceData,
  saveLocalData,
  resetLocalData
} from './data/dataProvider.js';
import {
  renderPodiumCards,
  renderKeyMetrics,
  renderDiagnosticTable,
  renderStageLedger,
  populateEditorTable,
  showToast
} from './ui/components.js';
import {
  renderProgressionChart,
  renderStageYieldChart
} from './ui/charts.js';

class AppController {
  constructor() {
    this.events = [];
    this.standings = [];
    this.currentFilter = 'ALL';
    this.source = 'default';
    this.lastSync = '';

    // Cache DOM Elements
    this.statusBadgeEl = document.getElementById('status-badge');
    this.lastSyncEl = document.getElementById('last-sync-time');
    this.podiumContainerEl = document.getElementById('podium-cards');
    this.kpiContainerEl = document.getElementById('kpi-metrics');
    this.diagnosticTableBodyEl = document.getElementById('diagnostic-table-body');
    this.ledgerTableBodyEl = document.getElementById('ledger-table-body');
    this.editorModalEl = document.getElementById('editor-modal');
    this.editorTableBodyEl = document.getElementById('editor-table-body');
    this.progressionCanvas = document.getElementById('progressionChart');
    this.yieldCanvas = document.getElementById('yieldChart');
  }

  async init() {
    this.setupEventListeners();
    await this.refreshData();
  }

  setupEventListeners() {
    // Open editor modal button
    const openEditorBtn = document.getElementById('btn-open-editor');
    if (openEditorBtn) {
      openEditorBtn.addEventListener('click', () => this.openEditor());
    }

    // Close editor modal buttons
    const closeEditorBtns = document.querySelectorAll('.btn-close-editor');
    closeEditorBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeEditor());
    });

    // Save editor button
    const saveEditorBtn = document.getElementById('btn-save-editor');
    if (saveEditorBtn) {
      saveEditorBtn.addEventListener('click', () => this.saveEditorChanges());
    }

    // Reset default button
    const resetDataBtn = document.getElementById('btn-reset-data');
    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', () => this.resetToDefault());
    }

    // Refresh button
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData(true));
    }

    // Filter pills
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        filterPills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFilter = e.currentTarget.dataset.filter || 'ALL';
        this.renderLedger();
      });
    });

    // Escape key closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.editorModalEl && !this.editorModalEl.classList.contains('hidden')) {
        this.closeEditor();
      }
    });

    // Close modal on backdrop click
    if (this.editorModalEl) {
      this.editorModalEl.addEventListener('click', (e) => {
        if (e.target === this.editorModalEl) {
          this.closeEditor();
        }
      });
    }
  }

  async refreshData(userTriggered = false) {
    try {
      const res = await loadRaceData();
      this.events = res.data;
      this.source = res.source;
      this.lastSync = res.lastSync;

      this.processAndRender();

      if (userTriggered) {
        showToast('Données synchronisées avec succès.', 'success');
      }
    } catch (err) {
      console.error('[TDF] Erreur lors du chargement des données:', err);
      showToast('Impossible de charger les données distantes.', 'error');
    }
  }

  processAndRender() {
    // 1. Calculate standings
    this.standings = calculateRiderStandings(this.events, DEFAULT_RIDERS);

    // 2. Render Sync Status
    this.renderStatus();

    // 3. Render Podium Cards
    renderPodiumCards(this.podiumContainerEl, this.standings);

    // 4. Render KPI Metrics Bar
    const estimates = calculateKeyEstimates(this.standings, this.events);
    renderKeyMetrics(this.kpiContainerEl, estimates);

    // 5. Render Charts
    const progressionData = calculateCumulativeProgression(this.events, DEFAULT_RIDERS, 3);
    renderProgressionChart(this.progressionCanvas, progressionData);

    const yieldData = calculateStageYield(this.events, DEFAULT_RIDERS, 4);
    renderStageYieldChart(this.yieldCanvas, yieldData);

    // 6. Render Diagnostic Table
    renderDiagnosticTable(this.diagnosticTableBodyEl, this.standings);

    // 7. Render Stage Ledger Table
    this.renderLedger();
  }

  renderStatus() {
    if (!this.statusBadgeEl) return;

    if (this.source === 'local') {
      this.statusBadgeEl.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span class="text-amber-300 font-medium">Modifications locales actives</span>
      `;
    } else if (this.source === 'remote') {
      this.statusBadgeEl.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span class="text-emerald-300 font-medium">Synchronisé (races.json)</span>
      `;
    } else {
      this.statusBadgeEl.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-blue-400"></span>
        <span class="text-blue-300 font-medium">Données officielles de référence</span>
      `;
    }

    if (this.lastSyncEl) {
      const date = new Date(this.lastSync);
      const formatted = !isNaN(date.getTime())
        ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Récemment';
      this.lastSyncEl.textContent = formatted;
    }
  }

  renderLedger() {
    renderStageLedger(this.ledgerTableBodyEl, this.events, DEFAULT_RIDERS, this.currentFilter);
  }

  openEditor() {
    if (!this.editorModalEl) return;
    populateEditorTable(this.editorTableBodyEl, this.events, DEFAULT_RIDERS);
    this.editorModalEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  closeEditor() {
    if (!this.editorModalEl) return;
    this.editorModalEl.classList.add('hidden');
    document.body.style.overflow = '';
  }

  saveEditorChanges() {
    try {
      const updated = this.events.map((ev, idx) => {
        const item = { stage: ev.stage, type: ev.type };
        DEFAULT_RIDERS.forEach(r => {
          const input = document.getElementById(`input-${r.key}-${idx}`);
          item[r.key] = input ? (parseInt(input.value, 10) || 0) : 0;
        });
        return item;
      });

      saveLocalData(updated);
      this.events = updated;
      this.source = 'local';
      this.lastSync = new Date().toISOString();
      this.processAndRender();
      this.closeEditor();
      showToast('Points enregistrés et classement recalculé.', 'success');
    } catch (err) {
      console.error('[TDF] Erreur de sauvegarde:', err);
      showToast('Erreur lors de l\'enregistrement des modifications.', 'error');
    }
  }

  resetToDefault() {
    resetLocalData();
    this.refreshData();
    this.closeEditor();
    showToast('Données réinitialisées avec succès.', 'info');
  }
}

// Instantiate and start when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
