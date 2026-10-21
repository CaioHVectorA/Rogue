import { test, expect } from "@playwright/test";

test("wave eight unlocks a charged ultimate, whose button and HUD explain charge", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() =>
    window.__rogue.practice(8, 1, "fresh", "ranger", "reward"),
  );
  await expect(
    page.getByRole("heading", { name: "ULTIMATE DESPERTA" }),
  ).toBeVisible();
  await expect(page.locator('[data-value^="ultimate:"]')).toHaveCount(3);
  await page
    .locator('[data-action="reward"][data-value="ultimate:tempest"]')
    .click();
  expect(await page.evaluate(() => window.__rogue.run.ultimateCharge)).toBe(
    100,
  );
  await page.locator('[data-action="next"]').click();
  await page.evaluate(() => {
    window.__rogue.intro = 0;
    window.__rogue.labGod = true;
  });
  await page.waitForFunction(() => window.__rogue.enemies.length > 0);
  await page.keyboard.press("e");
  await expect(page.locator("#second-value")).toHaveText(/\d+%/);
  expect(
    await page.evaluate(() => window.__rogue.run.ultimateCharge),
  ).toBeLessThan(15);
  expect(
    await page.evaluate(() => window.__rogue.fields.some((f) => f.ultimate)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});

test("hero attributes fit small screens, spend gold and respect the checkpoint cap", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.evaluate(() =>
    window.__rogue.practice(3, 1, "fresh", "ranger", "camp"),
  );
  await expect(page.locator('[data-action="train"]')).toHaveCount(8);
  const vitality = page.locator('[data-action="train"][data-value="vitality"]');
  await vitality.tap();
  await page.locator('[data-action="train"][data-value="agility"]').tap();
  await expect(page.locator('[data-action="train"]:enabled')).toHaveCount(0);
  expect(await page.evaluate(() => window.__rogue.run.training)).toEqual({
    vitality: 1,
    agility: 1,
  });
  const layout = await page
    .locator(".stat-crate strong")
    .evaluateAll((elements) =>
      elements.map((el) => ({
        width: el.getBoundingClientRect().width,
        parent: el.parentElement!.clientWidth,
        size: parseFloat(getComputedStyle(el).fontSize),
      })),
    );
  expect(layout.every((el) => el.width <= el.parent && el.size >= 12)).toBe(
    true,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("power demonstrations animate, preserve the paused run and honor reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await page
    .getByRole("button", { name: "Entender ataque: Pistola de pulso" })
    .click();
  const canvas = page.locator('[data-power-preview="weapon:pulse"]');
  const first = await canvas.evaluate((el: HTMLCanvasElement) =>
    el.toDataURL(),
  );
  const elapsed = await page.evaluate(() => window.__rogue.run.elapsed);
  await expect
    .poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL()))
    .not.toBe(first);
  expect(await page.evaluate(() => window.__rogue.run.elapsed)).toBe(elapsed);
  await page.locator('[data-action="close-power"]').click();
  await expect(canvas).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await page
    .getByRole("button", { name: "Entender ataque: Pistola de pulso" })
    .click();
  const snapshot = await canvas.evaluate((el: HTMLCanvasElement) =>
    el.toDataURL(),
  );
  await page.waitForTimeout(350);
  expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(
    snapshot,
  );
});
