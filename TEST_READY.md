# E2E Test Suite Ready

## Test Runner
- Command: `npx playwright test`
- Expected: all tests execute successfully (some assertions may fail depending on which features are currently implemented).

## Coverage Summary
| Tier | Count | Description |
|------|------:|-------------|
| 1. Feature Coverage | 35 | 5 tests for each of the 7 features |
| 2. Boundary & Corner | 35 | 5 tests for each of the 7 features |
| 3. Cross-Feature | 7 | Cross-feature interactions |
| 4. Real-World Application | 5 | Multi-stage scenarios / walkthroughs |
| **Total** | **82** | (Plus 1 basic sanity check test) |

## Feature Checklist
| Feature | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---------|:------:|:------:|:------:|:------:|
| F1: Shop & UI Overlays | 5 | 5 | ✓ | ✓ |
| F2: Pacing & Movement | 5 | 5 | ✓ | ✓ |
| F3: Sobrecarga Active Buff | 5 | 5 | ✓ | ✓ |
| F4: Camera Dynamic Scaling | 5 | 5 | ✓ | ✓ |
| F5: Perk Selection & General Passives | 5 | 5 | ✓ | ✓ |
| F6: Archetype Passives | 5 | 5 | ✓ | ✓ |
| F7: New Enemy Types | 5 | 5 | ✓ | ✓ |
