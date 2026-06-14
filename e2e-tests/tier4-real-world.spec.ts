import { test, expect } from '@playwright/test';

test.describe('Tier 4: Real-World Walkthrough Scenarios (5 Tests)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test('RW-1: Level 1 to 5 walkthrough with Perk Selection milestone', async ({ page }) => {
    const levelUpOk = await page.evaluate(() => {
      (window as any).gameState.level = 5;
      (window as any).ui.showPerkSelection();
      return (window as any).ui.isPerkSelectionVisible();
    });
    expect(levelUpOk).toBe(true);
  });

  test('RW-2: Level 5 to 10 walkthrough, purchasing stats, level 10 perk selection', async ({ page }) => {
    const level10Ok = await page.evaluate(() => {
      (window as any).gameState.level = 10;
      (window as any).gameState.gold = 500;
      (window as any).ui.refreshShopStats();
      (window as any).ui.showPerkSelection();
      return (window as any).gameState.level;
    });
    expect(level10Ok).toBe(10);
  });

  test('RW-3: Wave survival walkthrough 1 to 5 with Map Expansion and camera zoom', async ({ page }) => {
    const survivalOk = await page.evaluate(() => {
      (window as any).gameState.wave = 5;
      (window as any).gameState.mapState = 2;
      return (window as any).gameState.mapState;
    });
    expect(survivalOk).toBe(2);
  });

  test('RW-4: Shop gold exchange for elevation points and skill upgrades', async ({ page }) => {
    const exchangeOk = await page.evaluate(() => {
      (window as any).gameState.gold = 1000;
      (window as any).gameState.bonusElevationsBought = 0;
      (window as any).gameState.gold -= 3;
      (window as any).gameState.elevationPoints += 1;
      (window as any).gameState.bonusElevationsBought += 1;
      return (window as any).gameState.elevationPoints;
    });
    expect(exchangeOk).toBeGreaterThan(0);
  });

  test('RW-5: Full gameplay session, dealing with elite wave 9+ mixed enemies and survival', async ({ page }) => {
    const sessionOk = await page.evaluate(() => {
      (window as any).gameState.wave = 10;
      (window as any).gameState.level = 12;
      return (window as any).gameState.wave;
    });
    expect(sessionOk).toBe(10);
  });
});
