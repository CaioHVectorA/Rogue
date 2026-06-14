# Project: Rogue UX, Passives and Pacing Improvements

## Architecture
This is a Kaplay-based 2D rogue-like game written in TypeScript. 
- **Game State**: Managed globally in `src/state/gameState.ts`.
- **UI Subsystem**: Renders overlays, buttons, top bars, and panels (`src/components/ui/`). Overlays must implement strict mutual exclusion so that they block clicks to components underneath and don't overlap.
- **Combat & Movement**: 
  - Player movement speed logic in `src/components/movimentable.ts`.
  - Player shooting logic in `src/components/shoot.ts`.
  - Buffs and skill implementations in `src/components/skills/`.
- **Enemy System**:
  - Spawning logic in `src/main.ts` (`spawnWave`).
  - Enemy presets in `src/components/enemies/index.ts`.
  - Creation and update loops in `src/components/enemy.ts` using behaviors from `src/components/behaviors.ts`.

## Code Layout
- `src/main.ts`: Game setup, main scenes, wave execution, camera scaling.
- `src/components/`: Component implementations.
  - `shoot.ts`: Projectile spawning, shooting speed, projectile speed.
  - `movimentable.ts`: Movement controls, speed calculations.
  - `shop.ts`: Shop upgrading system.
  - `player.ts`: Player entity creation and camera behavior.
  - `enemy.ts`: Enemy creation and behaviors.
- `src/components/ui/`: UI overlay components.
  - `shopPanel.ts`: Renders shop interface.
  - `skillOverlay.ts`: Skill selection overlay.
  - `perkSelectionOverlay.ts`: Perk grid overlay (needs 6x2 grid).
- `src/components/enemies/`: Enemy database.
  - `index.ts`: Presets definitions.
- `src/state/`: State definitions.
  - `gameState.ts`: Active wave, player stats, buffs.
  - `waves.ts`: Enemy spawn definitions.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Bug Fixes (R1) | Fix shopPanel crash and overlay card bleed conflicts | None | DONE |
| 2 | Pacing & Camera (R2) | Staggered spawns (Wave 9+), enemy/player speed scaling, camera zoom-out, Sobrecarga projectile speed | M1 | IN_PROGRESS (Conv: 3b0c9c17-123c-47cd-99a7-4e5dc9b02483) |
| 3 | Passives Revamp (R3) | Remove old passives, implement 12 new passives, arrange in 6x2 grid | M2 | PLANNED |
| 4 | New Enemies (R4) | Add Berserker and Shield Guard enemies, integrate into wave spawner | M3 | PLANNED |
| 5 | Dual Track Verification | Pass 100% of E2E test suite (Tiers 1-4) and perform Adversarial Coverage Hardening (Tier 5) | M1, M2, M3, M4 | E2E_READY (c77a4c3a-f596-4c59-a1b0-09c9cc69373d setup complete) |

## Interface Contracts
### UI Overlays ↔ Main Game / Top Bar
Overlays (`skillOverlay`, `perkOverlay`, `shopPanel`) must export an `isVisible()` predicate and block click-throughs to prevent actions (like opening shop or starting waves) when active.

### Sobrecarga ↔ Shoot
`gameState.buffs.activeUntil > Date.now()` scales shoot projectile velocity.

### Enemy Behavior Update Hook
`createEnemy` in `src/components/enemy.ts` executes custom behaviors from `src/components/behaviors.ts` depending on enemy type.
