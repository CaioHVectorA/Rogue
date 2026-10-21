import { test, expect } from "@playwright/test";

test("floating movement starts anywhere on the left, follows drag and releases cleanly", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  const arena = await page.locator("#arena").boundingBox();
  const x = arena!.x + 75,
    y = arena!.y + 150;
  await page.mouse.move(x, y);
  await page.mouse.down();
  expect(await page.evaluate(() => window.__rogue.stick.x)).toBe(0);
  await page.mouse.move(x + 45, y + 10);
  await expect
    .poll(() => page.evaluate(() => window.__rogue.stick.x))
    .toBeGreaterThan(0.7);
  await expect(page.locator(".joystick")).toHaveClass(/is-dragging/);
  await page.mouse.up();
  expect(await page.evaluate(() => window.__rogue.stick)).toEqual({
    x: 0,
    y: 0,
  });
  await expect(page.locator(".joystick")).not.toHaveClass(/is-dragging/);
  await context.close();
});
test("touch preferences persist and eight-way direction buttons survive pause without stuck input", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page
    .getByLabel("Tamanho do controle")
    .evaluate((input: HTMLInputElement) => {
      input.value = "120";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  await expect(page.locator('[data-control-value="size"]')).toHaveText("120px");
  await page.getByLabel("Modo de movimento").selectOption("dpad");
  await page.getByRole("button", { name: "Fechar configurações" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-controls", "dpad");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("rogue.controls.v1")!).size,
    ),
  ).toBe(120);
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  const arrow = page.getByRole("button", {
    name: "Mover para cima e direita",
    exact: true,
  });
  const r = await arrow.boundingBox();
  expect(r!.width).toBeGreaterThanOrEqual(44);
  expect(r!.height).toBeGreaterThanOrEqual(44);
  await page.mouse.move(r!.x + 22, r!.y + 22);
  await page.mouse.down();
  await expect
    .poll(() => page.evaluate(() => window.__rogue.stick.x))
    .toBeGreaterThan(0.5);
  expect(await page.evaluate(() => window.__rogue.stick.y)).toBeLessThan(-0.5);
  await page.evaluate(() => window.__rogue.pause());
  expect(await page.evaluate(() => window.__rogue.stick)).toEqual({
    x: 0,
    y: 0,
  });
  await page.mouse.up();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});
test("Q upgrades use gold, cap a checkpoint and preserve learned abilities on switching", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const g = window.__rogue;
    g.practice(3, 1, "fresh", "ranger", "camp");
    g.labEquip("wall", 0);
  });
  await page.getByRole("button", { name: /EVOLUIR Q/ }).click();
  expect(await page.evaluate(() => window.__rogue.qLevel)).toBe(2);
  await expect(page.getByRole("button", { name: /EVOLUÍDA/ })).toBeDisabled();
  await page.evaluate(async () => {
    const g = window.__rogue;
    g.labEquip("aegis", 0);
    g.onChange();
  });
  await page.locator('[data-action="equip-skill"][data-value="wall"]').click();
  expect(await page.evaluate(() => window.__rogue.qLevel)).toBe(2);
  await page.keyboard.press("F2");
  await page.locator("#lab-skill-level").selectOption("5");
  expect(await page.evaluate(() => window.__rogue.qLevel)).toBe(5);
});
test("new Q mechanics and weapon patterns render and collide through Kaplay", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  for (const id of ["wall", "aegis", "overdrive", "stasis", "recall"]) {
    await page.evaluate((q) => {
      const g = window.__rogue;
      g.practice(9, 1, "fresh");
      g.labEquip(q, 0);
      g.labSkillLevel(5);
      g.labGod = true;
      g.intro = 0;
      g.skill();
    }, id);
    await page.waitForTimeout(150);
  }
  for (const id of ["disc", "prism", "spore"]) {
    await page.evaluate((weapon) => {
      const g = window.__rogue;
      g.practice(1, 1, "fresh");
      g.labWeapon(weapon);
      g.intro = 0;
      g.labGod = true;
      g.spawnQueue = [];
      g.enemies = [];
      (g as any).spawn("guard", g.player.x + 130, g.player.y);
      g.enemies[0].hp = g.enemies[0].maxHp = 10000;
      g.enemies[0].speed = 0;
      g.enemies[0].timer = 100;
    }, id);
    await expect
      .poll(() => page.evaluate(() => window.__rogue.enemies[0].hp))
      .toBeLessThan(10000);
  }
  expect(errors).toEqual([]);
});
