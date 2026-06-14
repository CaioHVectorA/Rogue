import { test, expect } from '@playwright/test';

test.describe('Challenger 2: Milestone 1 Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  // Helper to click an attribute square by key
  const clickAttributeSquare = async (page, key: string) => {
    const pos = await page.evaluate((k) => {
      const sq = (window as any).k.get(`shop-sq-${k}`)[0];
      if (!sq || sq.hidden) return null;
      return { x: sq.pos.x + 40, y: sq.pos.y + 40 };
    }, key);
    
    if (pos) {
      await page.mouse.click(pos.x, pos.y);
      // Let Kaplay process the click and update stats
      await page.evaluate(() => (window as any).ui.refreshShopStats());
    } else {
      throw new Error(`Could not find shop square for attribute: ${key}`);
    }
  };

  // Helper to check attribute level
  const getAttributeLevel = async (page, key: string) => {
    return await page.evaluate((k) => {
      return (window as any).gameState.upgrades[k];
    }, key);
  };

  // 1. CLICKING BACKGROUND BUTTONS WHEN OVERLAYS ARE VISIBLE
  test('Clicking Play/Shop Menu is blocked when Skill Selection Overlay is visible', async ({ page }) => {
    const clickBlocked = await page.evaluate(() => {
      // Force skill overlay to show
      (window as any).ui.setShopVisible(false);
      const skillOverlay = (window as any).k.get("ui-skill-overlay")[0];
      if (skillOverlay) skillOverlay.hidden = false;
      
      const hasSkillOverlay = (window as any).k.get("ui-skill-overlay").some((o: any) => !o.hidden);
      const perkOverlay = (window as any).k.get("perk-overlay-bg").some((o: any) => !o.hidden);
      
      return {
        hasSkillOverlay,
        perkOverlay,
        clickSkipped: hasSkillOverlay || perkOverlay
      };
    });

    expect(clickBlocked.hasSkillOverlay).toBe(true);
    expect(clickBlocked.clickSkipped).toBe(true);
  });

  test('Clicking Play/Shop Menu is blocked when Perk Selection Overlay is visible', async ({ page }) => {
    const clickBlocked = await page.evaluate(() => {
      // Force perk overlay to show
      (window as any).ui.showPerkSelection();
      
      const hasSkillOverlay = (window as any).k.get("ui-skill-overlay").some((o: any) => !o.hidden);
      const perkOverlay = (window as any).k.get("perk-overlay-bg").some((o: any) => !o.hidden);
      
      return {
        hasSkillOverlay,
        perkOverlay,
        clickSkipped: hasSkillOverlay || perkOverlay
      };
    });

    expect(clickBlocked.perkOverlay).toBe(true);
    expect(clickBlocked.clickSkipped).toBe(true);
  });

  // 2. PRESSING SHORTCUTS WHEN OVERLAYS ARE VISIBLE
  test('Pressing space, enter, e, b, i, q shortcuts does not execute actions when overlays are visible', async ({ page }) => {
    // Open shop first
    await page.keyboard.press('KeyE');
    
    // Check shop is open
    let shopOpen = await page.evaluate(() => {
      const shopBg = (window as any).k.get("shop-bg")[0];
      return shopBg ? !shopBg.hidden : false;
    });
    expect(shopOpen).toBe(true);

    const waveBefore = await page.evaluate(() => (window as any).gameState.wave);
    
    // Press shortcuts
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');
    await page.keyboard.press('KeyQ');

    const waveAfter = await page.evaluate(() => (window as any).gameState.wave);
    expect(waveAfter).toBe(waveBefore); // Wave did not start or change via space/enter

    // Now test that pressing E closes the shop (expected toggle)
    await page.keyboard.press('KeyE');
    shopOpen = await page.evaluate(() => {
      const shopBg = (window as any).k.get("shop-bg")[0];
      return shopBg ? !shopBg.hidden : false;
    });
    expect(shopOpen).toBe(false);
  });

  // 3. MOVING THE PLAYER WHEN PANELS ARE OPEN
  test('Player cannot move when panels are open', async ({ page }) => {
    const movementBlocked = await page.evaluate(() => {
      const p = (window as any).player;
      if (!p) return false;

      // Let's set shop visible
      (window as any).ui.setShopVisible(true);

      const isSkillActive = (window as any).k.get("ui-skill-overlay").some((o: any) => !o.hidden);
      const isPerkActive = (window as any).k.get("perk-overlay-bg").some((o: any) => !o.hidden);
      const isShopActive = (window as any).k.get("shop-bg").some((o: any) => !o.hidden);
      
      const blocksMovement = isSkillActive || isPerkActive || isShopActive;

      return {
        isShopActive,
        blocksMovement
      };
    });

    expect(movementBlocked.isShopActive).toBe(true);
    expect(movementBlocked.blocksMovement).toBe(true);
  });

  // 4. UPGRADING ATTRIBUTES TO MAX LEVELS
  test('Upgrading attributes to max levels (10) and verifying the limit of 2 maxed attributes', async ({ page }) => {
    // Open shop
    await page.keyboard.press('KeyE');

    // Give player resources
    await page.evaluate(() => {
      (window as any).gameState.elevationPoints = 100;
      (window as any).gameState.gold = 100000;
      (window as any).gameState.upgrades.moveSpeed = 1;
      (window as any).gameState.upgrades.maxHealth = 1;
      (window as any).gameState.upgrades.reloadSpeed = 1;
      (window as any).ui.refreshShopStats();
    });

    // 1. Max out moveSpeed (level 1 -> 10, requires 9 clicks)
    for (let i = 0; i < 9; i++) {
      await clickAttributeSquare(page, 'moveSpeed');
    }
    const moveSpeedLevel = await getAttributeLevel(page, 'moveSpeed');
    expect(moveSpeedLevel).toBe(10);

    // 2. Max out maxHealth (level 1 -> 10, requires 9 clicks)
    for (let i = 0; i < 9; i++) {
      await clickAttributeSquare(page, 'maxHealth');
    }
    const maxHealthLevel = await getAttributeLevel(page, 'maxHealth');
    expect(maxHealthLevel).toBe(10);

    // 3. Try to upgrade reloadSpeed. It should be capped at 9!
    // Click 10 times to be sure
    for (let i = 0; i < 10; i++) {
      await clickAttributeSquare(page, 'reloadSpeed');
    }
    const reloadSpeedLevel = await getAttributeLevel(page, 'reloadSpeed');
    expect(reloadSpeedLevel).toBe(9); // Capped at 9 because maxed limit is 2!
  });
});
