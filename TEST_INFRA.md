# Help'Em Platform — E2E Test Infrastructure Guide

## 1. Overview
The Help'Em community disaster resilience platform uses a multi-tier, opaque-box, requirement-driven End-to-End (E2E) testing infrastructure designed for high fidelity, deterministic execution, and Apple HIG / NSTP CWTS compliance verification.

The suite runs on **Node.js v24.19.0 native test runner (`node:test`)** with **Happy-DOM** for browser emulation, synthetic event dispatching, and full React 19 act-environment lifecycles without requiring heavyweight browser binaries.

---

## 2. Test Architecture & Layout

```
tests/
└── e2e/
    ├── harness.mjs                # Happy-DOM simulation, React 19 mounting, event dispatch, and UI helpers
    ├── runner.mjs                 # Master test runner with tier filtering and executive reporting
    ├── tier1_features.test.mjs    # Tier 1: Core Feature Coverage (55 tests)
    ├── tier2_boundaries.test.mjs  # Tier 2: Boundary & Corner Cases (30 tests)
    ├── tier3_combinations.test.mjs# Tier 3: Cross-Feature Combinations & State Persistence (10 tests)
    └── tier4_scenarios.test.mjs   # Tier 4: Real-World Civic Immersion Scenarios (5 tests)
```

### Component Breakdown
1. **`harness.mjs`**:
   - Manages Happy-DOM `Window` lifecycle with isolated DOM containers per test.
   - Provides on-the-fly TypeScript / TSX compilation using `typescript.transpileModule` with `@/*` path alias resolution.
   - Sets up synthetic DOM event dispatching and React 19 controlled form input value setters (`setControlValue`).
   - Exports typed query helpers (`getDynamicIsland`, `getMascotHero`, `getPurokPins`, `getInspectorHUD`, `getSafetySwitch`, `getLayerSwitcher`, `openModalVia`, etc.).
2. **`runner.mjs`**:
   - Master orchestrator with CLI flags (`--tier=1`, `--tier=2`, `--tier=3`, `--tier=4`).
   - Streams `node:test` results through `spec` reporter with ANSI summary table.
   - Returns exit code 0 on complete pass, 1 on failure.

---

## 3. How to Execute Tests

### Environment Requirement (Windows PowerShell)
Node v24.19.0 and npm 11.17.0 must be on the `$env:PATH`:
```powershell
$env:PATH = "C:\Users\Jim\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64;" + $env:PATH
```

### Run Commands

#### Master Execution (All 4 Tiers, 100 Tests)
```bash
npm test
```
or directly via node:
```bash
node tests/e2e/runner.mjs
```

#### Individual Tier Execution
```bash
# Tier 1 only (Core Feature Coverage)
npm test -- --tier=1
node tests/e2e/runner.mjs --tier=1

# Tier 2 only (Boundary & Corner Cases)
npm test -- --tier=2
node tests/e2e/runner.mjs --tier=2

# Tier 3 only (Cross-Feature Combinations)
npm test -- --tier=3
node tests/e2e/runner.mjs --tier=3

# Tier 4 only (Real-World Civic Scenarios)
npm test -- --tier=4
node tests/e2e/runner.mjs --tier=4
```

#### Native Node Test Runner Direct Invocation
```bash
node --test tests/e2e/tier1_features.test.mjs
node --test tests/e2e/tier2_boundaries.test.mjs
node --test tests/e2e/tier3_combinations.test.mjs
node --test tests/e2e/tier4_scenarios.test.mjs
```

---

## 4. Test Design Methodology: 4 Tiers

| Tier | Focus | Test Count | Scope |
|------|-------|------------|-------|
| **Tier 1** | Feature Coverage | **55 tests** | >=5 test cases per feature across all 11 core features (Dynamic Island, Mascot, Puroks, HUD, Switcher, Safety Toggle, Counter Accounting, Modal, Debunker, Aid Network, Hotlines). |
| **Tier 2** | Boundary & Corner Cases | **30 tests** | >=5 test cases across 6 boundary areas (rapid toggle stress, layer flip stability, pin cycling bounds, 44pt touch targets, modal reset lifecycle, form validation & regex). |
| **Tier 3** | Cross-Feature Combinations | **10 tests** | Pairwise state persistence, multi-tab layer transitions, modal mode polymorphism, and community accounting preservation. |
| **Tier 4** | Real-World Application Scenarios | **5 tests** | Complete end-to-end civic immersion scenarios: Barangay Quiling flood drill, typhoon landfall timeline, student volunteer registration cycle, relief logistics triage, anti-panic information verification. |
| **Total** | **Full Suite** | **100 tests** | **100% Passing** across all 21 test suites. |

---

## 5. Verification & Assertions Contract

1. **Safety Check-in**:
   - Baseline: 214 of 240 Families Safe (`aria-checked="false"`, badge: "Unchecked")
   - Safe State: 215 of 240 Families Safe (`aria-checked="true"`, badge: "Safe")
2. **Community Map & Geo-Nodes**:
   - 5 nodes positioned at calibrated topological percentages within 0–100% viewport.
   - Touch targets meet Apple HIG 44×44pt target minimum.
   - Bottom HUD binds dynamically to active pin (Riverside, Barangay Hall, Covered Court, Lowland, Highland).
3. **PAGASA Doppler Radar**:
   - Displays PAGASA Doppler Signal 2 (85 km/h) telemetry.
   - Renders concentric range rings, rotating storm arm, and compass instrument overlay.
4. **Action Modal**:
   - Modes: `join` (Household Enrollment), `sos` (Distress Broadcast), `aid` (Mutual Aid Station).
   - Validates Philippine 11-digit mobile format (`/^09\d{9}$/`).
   - Generates verifiable dispatch receipt with ticket ID on submission.
5. **Debunker & Mutual Aid**:
   - 3 alarmist rumors paired with 3 PST-stamped verified fact-checks.
   - 5 mutual aid stations (Power, Shelter, Water, Medical, Transport) with designated capacities and coordinators.
