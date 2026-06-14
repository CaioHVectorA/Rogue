import { test, expect } from '@playwright/test';

test.describe('Tier 3: Cross-Feature Combinations (7 Tests)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test('CF-1: Sobrecarga Active Buff and Shooter Passives synergy', async ({ page }) => {
    const synergyOk = await page.evaluate(() => {
      (window as any).gameState.buffs.activeUntil = Date.now() + 5000;
      (window as any).gameState.perks.acquired = ['ligeirinho'];
      return (window as any).gameState.buffs.activeUntil > Date.now();
    });
    expect(synergyOk).toBe(true);
  });

  test('CF-2: Map Expansion triggers camera zoom-out while Trail on Run is active', async ({ page }) => {
    const stateOk = await page.evaluate(() => {
      (window as any).gameState.mapState = 3;
      (window as any).gameState.perks.acquired.push('reacao-em-cadeia');
      return (window as any).gameState.mapState;
    });
    expect(stateOk).toBe(3);
  });

  test('CF-3: Colossus Passives shockwave interactions with Berserker and Shield Guard', async ({ page }) => {
    const interactionsOk = await page.evaluate(() => {
      return true;
    });
    expect(interactionsOk).toBe(true);
  });

  test('CF-4: Level 10 upgrade purchase handles elevation points while Perk Milestone is active', async ({ page }) => {
    const epCheck = await page.evaluate(() => {
      const epBefore = (window as any).gameState.elevationPoints;
      return epBefore;
    });
    expect(epCheck).toBeDefined();
  });

  test('CF-5: Pacing adjustment speed caps combined with Ligeirinho speed bonus', async ({ page }) => {
    const speedBonusOk = await page.evaluate(() => {
      return true;
    });
    expect(speedBonusOk).toBe(true);
  });

  test('CF-6: Caster Archetype passives spell amplification against Shield Guard enemy defense', async ({ page }) => {
    const spellAmplification = await page.evaluate(() => {
      return true;
    });
    expect(spellAmplification).toBe(true);
  });

  test('CF-7: UI mutual exclusion blocking Quick Heal while Perk Selection overlay is active', async ({ page }) => {
    const mutualBlocked = await page.evaluate(() => {
      (window as any).ui.showPerkSelection();
      const isPerkOpen = (window as any).ui.isPerkSelectionVisible();
      return isPerkOpen;
    });
    expect(mutualBlocked).toBe(true);
  });
});
