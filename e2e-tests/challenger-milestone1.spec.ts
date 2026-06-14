import { test, expect } from '@playwright/test';

test.describe('Challenger 1: Milestone 1 Bug Fixes Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test('1. Clicking background buttons (Play, Shop Menu) when overlays are visible', async ({ page }) => {
    // Get Play and Shop button positions in screen space
    const btnPositions = await page.evaluate(() => {
      const playBtn = (window as any).k.get("ui-play")[0];
      const shopBtn = (window as any).k.get("ui-shop")[0];
      return {
        play: playBtn ? { x: playBtn.pos.x + 80, y: playBtn.pos.y + 22 } : null,
        shop: shopBtn ? { x: shopBtn.pos.x + 80, y: shopBtn.pos.y + 22 } : null,
      };
    });

    expect(btnPositions.play).not.toBeNull();
    expect(btnPositions.shop).not.toBeNull();

    const playPos = btnPositions.play!;
    const shopPos = btnPositions.shop!;

    // Case A: Perk selection overlay is visible
    await page.evaluate(() => {
      (window as any).ui.showPerkSelection();
    });

    const isPerkVisibleInit = await page.evaluate(() => (window as any).ui.isPerkSelectionVisible());
    expect(isPerkVisibleInit).toBe(true);

    // Click Play button
    await page.mouse.click(playPos.x, playPos.y);
    // Click Shop Menu button
    await page.mouse.click(shopPos.x, shopPos.y);

    // Verify overlays/states did not change
    const isPerkVisibleAfter = await page.evaluate(() => (window as any).ui.isPerkSelectionVisible());
    const isShopVisibleAfter = await page.evaluate(() => !(window as any).k.get("shop-bg")[0].hidden);
    const isPlayVisibleAfter = await page.evaluate(() => !(window as any).k.get("ui-play")[0].hidden);

    expect(isPerkVisibleAfter).toBe(true);
    expect(isShopVisibleAfter).toBe(false);
    expect(isPlayVisibleAfter).toBe(true);

    // Close perk selection for next test
    await page.evaluate(() => {
      (window as any).ui.showPerkSelection();
      const cancelBtn = (window as any).k.get("perk-overlay-bg")[0]; // Just manually hide it
      if (cancelBtn) {
        (window as any).k.get("perk-overlay-bg").forEach((o: any) => o.hidden = true);
        (window as any).k.setTimeScale(1);
      }
    });

    // Case B: Skill overlay is visible (force level 2, no skill equipped to trigger)
    await page.evaluate(() => {
      const state = (window as any).gameState;
      state.level = 2;
      state.skills.skill1 = "";
      (window as any).ui.setPlayVisible(true);
    });

    // Let the update loop show the skill overlay
    await page.waitForFunction(() => {
      const overlay = (window as any).k.get("ui-skill-overlay")[0];
      return overlay && !overlay.hidden;
    });

    // Click Play button
    await page.mouse.click(playPos.x, playPos.y);
    // Click Shop Menu button
    await page.mouse.click(shopPos.x, shopPos.y);

    const isSkillVisible = await page.evaluate(() => !(window as any).k.get("ui-skill-overlay")[0].hidden);
    const isShopVisibleSkill = await page.evaluate(() => !(window as any).k.get("shop-bg")[0].hidden);
    const isPlayVisibleSkill = await page.evaluate(() => !(window as any).k.get("ui-play")[0].hidden);

    expect(isSkillVisible).toBe(true);
    expect(isShopVisibleSkill).toBe(false);
    expect(isPlayVisibleSkill).toBe(true);
  });

  test('2. Pressing shortcuts (Space, Enter, E, B, I, Q) when overlays are visible', async ({ page }) => {
    // Show perk selection overlay
    await page.evaluate(() => {
      (window as any).ui.showPerkSelection();
    });

    // Press shortcuts
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');
    await page.keyboard.press('KeyE');
    await page.keyboard.press('KeyB');
    await page.keyboard.press('KeyI');
    await page.keyboard.press('KeyQ');

    // Verify perk selection is still visible, play button is visible, shop is closed
    const isPerkVisible = await page.evaluate(() => (window as any).ui.isPerkSelectionVisible());
    const isPlayVisible = await page.evaluate(() => !(window as any).k.get("ui-play")[0].hidden);
    const isShopVisible = await page.evaluate(() => !(window as any).k.get("shop-bg")[0].hidden);

    expect(isPerkVisible).toBe(true);
    expect(isPlayVisible).toBe(true);
    expect(isShopVisible).toBe(false);
  });

  test('3. Moving the player when panels are open', async ({ page }) => {
    // Get initial position
    const startPos = await page.evaluate(() => {
      const p = (window as any).player;
      return { x: p.pos.x, y: p.pos.y };
    });

    // Open shop panel
    await page.evaluate(() => {
      (window as any).ui.setShopVisible(true);
    });

    // Try to move player by pressing 'KeyD'
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyD');

    // Position should not change
    const posDuringShop = await page.evaluate(() => {
      const p = (window as any).player;
      return { x: p.pos.x, y: p.pos.y };
    });
    expect(posDuringShop.x).toBe(startPos.x);
    expect(posDuringShop.y).toBe(startPos.y);

    // Close shop panel
    await page.evaluate(() => {
      (window as any).ui.setShopVisible(false);
    });

    // Now try to move player
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyD');

    const finalPos = await page.evaluate(() => {
      const p = (window as any).player;
      return { x: p.pos.x, y: p.pos.y };
    });
    // Player should have moved to the right (x increases)
    expect(finalPos.x).toBeGreaterThan(startPos.x);
  });

  test('4. Upgrading attributes to max levels constraints', async ({ page }) => {
    const results = await page.evaluate(() => {
      const state = (window as any).gameState;
      // Provide ample resources
      state.elevationPoints = 100;
      state.gold = 100000;

      // Set stats to level 9
      state.upgrades.moveSpeed = 9;
      state.upgrades.maxHealth = 9;
      state.upgrades.reloadSpeed = 9;

      (window as any).ui.refreshShopStats();

      // Trigger upgrades through shop handlers directly
      const handlers = (window as any).ui.setUpgradeHandlers; // this is a setter, but we have them registered in shop.ts
      // We can use the global UI triggers or evaluate the click/spend logic
      // Since setUpgradeHandlers was called inside setupShop, the actual handlers are stored internally in shopPanel.
      // But we can simulate left clicks on the attribute cards in shopPanel!
      const shopPanel = (window as any).ui;
      // Let's open the shop panel first
      shopPanel.setShopVisible(true);
      return {
        moveSpeedBefore: state.upgrades.moveSpeed,
        maxHealthBefore: state.upgrades.maxHealth,
        reloadSpeedBefore: state.upgrades.reloadSpeed,
      };
    });

    // Get card positions for clicking
    const cardPositions = await page.evaluate(() => {
      const msCard = (window as any).k.get("shop-sq-moveSpeed")[0];
      const hpCard = (window as any).k.get("shop-sq-maxHealth")[0];
      const rlCard = (window as any).k.get("shop-sq-reloadSpeed")[0];
      return {
        moveSpeed: msCard ? { x: msCard.pos.x + 40, y: msCard.pos.y + 40 } : null,
        maxHealth: hpCard ? { x: hpCard.pos.x + 40, y: hpCard.pos.y + 40 } : null,
        reloadSpeed: rlCard ? { x: rlCard.pos.x + 40, y: rlCard.pos.y + 40 } : null,
      };
    });

    expect(cardPositions.moveSpeed).not.toBeNull();
    expect(cardPositions.maxHealth).not.toBeNull();
    expect(cardPositions.reloadSpeed).not.toBeNull();

    // Click moveSpeed card (should upgrade to 10)
    await page.mouse.click(cardPositions.moveSpeed!.x, cardPositions.moveSpeed!.y);
    const msLevel = await page.evaluate(() => (window as any).gameState.upgrades.moveSpeed);
    expect(msLevel).toBe(10);

    // Click maxHealth card (should upgrade to 10)
    await page.mouse.click(cardPositions.maxHealth!.x, cardPositions.maxHealth!.y);
    const hpLevel = await page.evaluate(() => (window as any).gameState.upgrades.maxHealth);
    expect(hpLevel).toBe(10);

    // Click reloadSpeed card (should NOT upgrade to 10, since 2 stats are already maxed)
    await page.mouse.click(cardPositions.reloadSpeed!.x, cardPositions.reloadSpeed!.y);
    const rlLevel = await page.evaluate(() => (window as any).gameState.upgrades.reloadSpeed);
    expect(rlLevel).toBe(9);
  });
});
