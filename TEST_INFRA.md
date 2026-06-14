# E2E Test Infra: Rogue UX, Passives and Pacing Improvements

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise + Workload Testing.
- Test hooks: Uses global browser context bindings `window.gameState`, `window.player`, `window.k`, and `window.ui` to inject test setups, bypass gameplay grind, and verify rendering/state conditions via Playwright.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | F1. Shop & UI Overlays | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 2 | F2. Pacing & Movement | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 3 | F3. Sobrecarga Active Buff | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 4 | F4. Camera Dynamic Scaling | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 5 | F5. Perk Selection & General Passives | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| 6 | F6. Archetype Passives | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| 7 | F7. New Enemy Types | ORIGINAL_REQUEST R4 | 5 | 5 | ✓ |

## Test Architecture
- **Test Runner**: Playwright E2E framework running against `http://localhost:3001`.
- **Directory Layout**:
  - `e2e-tests/`
    - `sanity.spec.ts` (Sanity verification)
    - `tier1-feature-coverage.spec.ts` (Feature coverage happy paths)
    - `tier2-boundary-corner.spec.ts` (Boundary & corner cases)
    - `tier3-cross-feature.spec.ts` (Cross-feature interactions)
    - `tier4-real-world.spec.ts` (Real-world game walkthroughs)
- **Invocation**: `npx playwright test`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Level 1 to 5 Progression | F1, F5 | Medium |
| 2 | Level 5 to 10 Upgrading & Perk Choices | F1, F5, F6 | High |
| 3 | Wave 1 to 5 Survival with Camera Scale | F2, F4 | Medium |
| 4 | Shop Gold exchange & Skill upgrade cycle | F1, F3 | Medium |
| 5 | Full Elite Wave 9+ Survival | F2, F7 | High |

## Coverage Thresholds
- Tier 1: ≥5 per feature (Total: 35 tests)
- Tier 2: ≥5 per feature (Total: 35 tests)
- Tier 3: pairwise coverage of major feature interactions (Total: 7 tests)
- Tier 4: ≥5 realistic application scenarios (Total: 5 tests)
- Total tests: 82 cases
