import { test, expect } from '@playwright/test';

test('should load page and expose initial game state on window', async ({ page }) => {
  // Go to localhost:3001
  await page.goto('/');

  // Wait for the window object's gameState to be populated
  await page.waitForFunction(() => (window as any).gameState !== undefined);

  // Retrieve the gameState value
  const gameState = await page.evaluate(() => (window as any).gameState);

  // Check initial state
  expect(gameState).toBeDefined();
  expect(gameState.wave).toBe(1);
  expect(gameState.level).toBe(1);

  // Check other exposed objects
  const hasPlayer = await page.evaluate(() => (window as any).player !== undefined);
  const hasK = await page.evaluate(() => (window as any).k !== undefined);
  const hasUi = await page.evaluate(() => (window as any).ui !== undefined);

  expect(hasPlayer).toBe(true);
  expect(hasK).toBe(true);
  expect(hasUi).toBe(true);
});
