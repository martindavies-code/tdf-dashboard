/**
 * Chart.js lifecycle and rendering manager for Tour de France telemetry.
 */

let progressionChartInstance = null;
let yieldChartInstance = null;

const EDITORIAL_GRID_COLOR = 'rgba(255, 255, 255, 0.07)';
const EDITORIAL_TEXT_COLOR = '#94a3b8';

/**
 * Renders or updates the cumulative progression line chart.
 * @param {HTMLCanvasElement} canvas
 * @param {object} progressionData - { labels, datasets }
 */
export function renderProgressionChart(canvas, progressionData) {
  if (!canvas || typeof Chart === 'undefined') return;

  if (progressionChartInstance) {
    progressionChartInstance.destroy();
    progressionChartInstance = null;
  }

  const chartDatasets = progressionData.datasets.map(ds => ({
    label: ds.name,
    data: ds.data,
    borderColor: ds.color,
    backgroundColor: ds.color,
    borderWidth: 2.5,
    stepped: 'before',
    pointRadius: 2,
    pointHoverRadius: 6,
    pointBackgroundColor: ds.color,
    pointBorderColor: '#0b0f17',
    pointBorderWidth: 2,
    tension: 0
  }));

  const ctx = canvas.getContext('2d');
  progressionChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: progressionData.labels,
      datasets: chartDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'circle',
            color: '#e2e8f0',
            font: {
              family: 'Inter, sans-serif',
              size: 12,
              weight: '500'
            },
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: '#131a26',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: 1,
          cornerRadius: 6,
          padding: 12,
          usePointStyle: true,
          callbacks: {
            label: context => {
              const label = context.dataset.label || '';
              const val = context.parsed.y ?? 0;
              return ` ${label} : ${val} pts cumulés`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: EDITORIAL_GRID_COLOR,
            tickLength: 6
          },
          ticks: {
            color: EDITORIAL_TEXT_COLOR,
            font: { family: 'Inter, sans-serif', size: 11 },
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12
          },
          title: {
            display: true,
            text: 'Étapes disputées',
            color: EDITORIAL_TEXT_COLOR,
            font: { family: 'Inter, sans-serif', size: 12, weight: '600' },
            padding: { top: 8 }
          }
        },
        y: {
          grid: {
            color: EDITORIAL_GRID_COLOR
          },
          ticks: {
            color: EDITORIAL_TEXT_COLOR,
            font: { family: 'Inter, sans-serif', size: 11 },
            stepSize: 50
          },
          title: {
            display: true,
            text: 'Points cumulés (pts)',
            color: EDITORIAL_TEXT_COLOR,
            font: { family: 'Inter, sans-serif', size: 12, weight: '600' }
          }
        }
      }
    }
  });
}

/**
 * Renders or updates the per-stage yield bar chart.
 * @param {HTMLCanvasElement} canvas
 * @param {object} yieldData - { labels, datasets }
 */
export function renderStageYieldChart(canvas, yieldData) {
  if (!canvas || typeof Chart === 'undefined') return;

  if (yieldChartInstance) {
    yieldChartInstance.destroy();
    yieldChartInstance = null;
  }

  const chartDatasets = yieldData.datasets.map(ds => ({
    label: ds.name,
    data: ds.data,
    backgroundColor: ds.color,
    borderRadius: 3,
    borderSkipped: false
  }));

  const ctx = canvas.getContext('2d');
  yieldChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: yieldData.labels,
      datasets: chartDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'circle',
            color: '#e2e8f0',
            font: {
              family: 'Inter, sans-serif',
              size: 12,
              weight: '500'
            },
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: '#131a26',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: 1,
          cornerRadius: 6,
          padding: 12,
          usePointStyle: true,
          callbacks: {
            label: context => {
              const label = context.dataset.label || '';
              const val = context.parsed.y ?? 0;
              return ` ${label} : +${val} pts`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: EDITORIAL_TEXT_COLOR,
            font: { family: 'Inter, sans-serif', size: 11 }
          },
          title: {
            display: true,
            text: 'Étape',
            color: EDITORIAL_TEXT_COLOR,
            font: { family: 'Inter, sans-serif', size: 12, weight: '600' }
          }
        },
        y: {
          grid: {
            color: EDITORIAL_GRID_COLOR
          },
          ticks: {
            color: EDITORIAL_TEXT_COLOR,
            font: { family: 'Inter, sans-serif', size: 11 }
          },
          title: {
            display: true,
            text: 'Points marqués (pts)',
            color: EDITORIAL_TEXT_COLOR,
            font: { family: 'Inter, sans-serif', size: 12, weight: '600' }
          }
        }
      }
    }
  });
}

/**
 * Cleans up chart instances to prevent canvas memory leaks.
 */
export function destroyCharts() {
  if (progressionChartInstance) {
    progressionChartInstance.destroy();
    progressionChartInstance = null;
  }
  if (yieldChartInstance) {
    yieldChartInstance.destroy();
    yieldChartInstance = null;
  }
}
