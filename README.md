# Tour de France 2026 — Maillot Vert Dashboard

[![Live Dashboard](https://img.shields.io/badge/Live_Dashboard-Visit_Site-10b981?style=for-the-badge&logo=safari&logoColor=white)](https://martindavies-code.github.io/tdf-dashboard/)
[![Test Suite](https://img.shields.io/badge/Tests-53_Passing-brightgreen?style=flat-square&logo=vitest)](https://github.com/martindavies-code/tdf-dashboard)
[![Branch Coverage](https://img.shields.io/badge/Coverage-95.2%25_Branches-10b981?style=flat-square)](https://github.com/martindavies-code/tdf-dashboard)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

> **Live Dashboard:** [https://martindavies-code.github.io/tdf-dashboard/](https://martindavies-code.github.io/tdf-dashboard/)

An editorial sports journalism dashboard providing stage-by-stage points classification (Maillot Vert) tracking and tactical analysis for the 2026 Tour de France.

---

## Live Application

Access the live interactive telemetry dashboard hosted on GitHub Pages:

### 🔗 [https://martindavies-code.github.io/tdf-dashboard/](https://martindavies-code.github.io/tdf-dashboard/)

---

## Features

- **Dynamic Podium & Standings**: Real-time ranking of the top sprinters (M. Pedersen, J. Philipsen, B. Girmay, T. Merlier) with points gap to the leader and stage finish vs. intermediate sprint breakdowns.
- **Analytical KPI Bar**: Instant metrics including stages completed, leader lead margin, single-stage record points, and sprint reliance rate.
- **Dual Visualizations**:
  - **Stepped Cumulative Points**: Interactive chronological progression tracking point accumulation across stages with direct rider legends.
  - **Stage-by-Stage Yield**: Bar chart displaying points won per stage.
- **Tactical Diagnostic Table**: Sprint vs. Finish dependency breakdown with visual percentage progress gauges.
- **Filterable Stage Ledger**: Complete stage results with filtering by stage type (*Toutes*, *Arrivées*, *Sprints intermédiaires*, *Montagne*, *Contre-la-montre*).
- **Interactive Data Editor**: Built-in modal allowing users to customize stage points in real-time, recalculate standings, and reset to official telemetry.
- **Automated Telemetry Sync**: GitHub Actions workflow automatically updates `races.json` with verified stage points.

---

## Design System & Anti-Vibe-Coding Principles

- **Typography**: Clean proportional font (`Inter`) with `font-variant-numeric: tabular-nums` for vertical numeral alignment.
- **Color Family**: Tour de France editorial palette (Deep slate canvas `#0b0f17`, Maillot Vert emerald `#10b981`, Alpecin sky blue `#38bdf8`, purple `#a78bfa`, amber gold `#fbbf24`).
- **Strict Scale**: 4-tier fluid typography scale, single container radius (`10px`), and 4-step spacing (`8px`, `16px`, `24px`, `32px`).
- **Responsive & Touch Parity**: Tested across Mobile, Tablet, Desktop, and Widescreen layouts with touch targets $\ge 44 \times 44\text{px}$.

---

## Architecture & Code Hardening

The application is structured into decoupled ES modules:

```
├── index.html                 # Semantic, accessible HTML5 dashboard
├── styles.css                 # Strict token design system
├── races.json                 # Stage-by-stage points telemetry
├── src/
│   ├── app.js                 # Application coordinator & event controller
│   ├── domain/                # Pure business logic (Calculations, Validation, Security)
│   ├── data/                  # Multi-tier data provider (LocalStorage -> Remote -> Bundled)
│   └── ui/                    # Safe DOM rendering & Chart.js lifecycle manager
└── tests/                     # 53 unit tests achieving >95% branch coverage
```

---

## Local Development & Testing

### 1. Prerequisites
- Node.js (v18+)

### 2. Run Tests
```bash
# Run unit tests
npm test

# Run tests with branch coverage report
npm run test:coverage
```

### 3. Run Locally
```bash
# Start local HTTP server
npm run serve
# Or with Python:
python -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
