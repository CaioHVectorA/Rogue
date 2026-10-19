import { test, expect } from "@playwright/test";

test("Kaplay owns real entities, WebGL rendering and projectile collisions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__kaplay.get("pilot").length))
    .toBe(1);
  const initial = await page.evaluate(() => {
    const g = window.__rogue,
      k = window.__kaplay;
    g.spawnQueue = [];
    g.enemies = [];
    g.bullets = [];
    g.intro = 0;
    g.roomTime = 3;
    g.player.invulnerable = 1000;
    (g as any).spawn("chaser", g.player.x + 100, g.player.y);
    g.enemies[0].speed = 0;
    g.player.charge = g.player.reload;
    return {
      collisions: g.engineCollisions,
      canvas: k.canvas instanceof HTMLCanvasElement,
    };
  });
  expect(initial).toEqual({ collisions: true, canvas: true });
  // No manual damage call: only Kaplay's area event can kill this target.
  await expect
    .poll(() => page.evaluate(() => window.__rogue.run.kills))
    .toBe(1);
  await expect(page.locator("#interface")).toHaveAttribute(
    "data-phase",
    "reward",
  );
  expect(errors).toEqual([]);
});

test("hordes, combo feedback and effect budgets stay bounded across restarts", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__kaplay.get("pilot").length))
    .toBe(1);
  await page.evaluate(() => {
    const g = window.__rogue;
    g.run.room = 11;
    g.run.act = 3;
    g.beginRoom();
    g.player.invulnerable = 1000;
    g.player.reload = 100;
    g.player.charge = 0;
    for (let i = 0; i < 1200; i++) g.update(1 / 120);
  });
  await expect
    .poll(() => page.evaluate(() => window.__kaplay.get("foe").length))
    .toBeGreaterThan(50);
  await page.evaluate(() => {
    const g = window.__rogue;
    for (const e of g.enemies.slice(0, 25)) (g as any).hitEnemy(e, 100000);
    g.update(1 / 120);
  });
  await expect(page.locator(".combo-display")).toBeVisible();
  await expect(page.locator("#combo-value")).toContainText("25");
  const effects = await page.evaluate(
    () => window.__kaplay.get("effects")[0].children.length,
  );
  expect(effects).toBeGreaterThan(30);
  expect(effects).toBeLessThanOrEqual(680);
  await page.evaluate(() => window.__rogue.start("ranger", "RESET-KAPLAY"));
  await expect
    .poll(() => page.evaluate(() => window.__kaplay.get("pilot").length))
    .toBe(1);
  await expect
    .poll(() => page.evaluate(() => window.__kaplay.get("foe").length))
    .toBeLessThan(20);
});

test("equipment descriptions and reduced effects remain available without filling the game UI", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.locator('[data-action="effects"]').click();
  expect(await page.evaluate(() => window.__rogue.reducedMotion)).toBe(true);
  await page.getByRole("button", { name: "Fechar configurações" }).click();
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await page.evaluate(() => {
    const g = window.__rogue;
    g.spawnQueue = [];
    g.enemies = [];
    g.roomTime = 3;
    g.update(1 / 120);
  });
  await expect(page.locator(".loot-object")).toHaveCount(3);
  await expect(page.locator(".item-description").first()).toBeHidden();
  await page
    .getByRole("button", { name: "Mostrar descrições das melhorias" })
    .click();
  await expect(page.locator(".item-description").first()).toBeVisible();
});
