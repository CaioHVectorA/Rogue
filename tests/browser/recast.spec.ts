import { test, expect } from "@playwright/test";

test("keyboard recast shows its armed action, freezes on pause and returns with cooldown", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const origin = await page.evaluate(() => {
    const g = window.__rogue;
    g.practice(3, 1, "anchor");
    g.intro = 0;
    g.labGod = true;
    g.spawnQueue = [{ kind: "guard", at: 9999, x: 50, y: 50 }];
    g.enemies = [];
    return { x: g.player.x, y: g.player.y };
  });
  await page.keyboard.press("q");
  await expect(page.locator("#skill-value")).toContainText("VOLTAR");
  await page.keyboard.down("d");
  await page.waitForTimeout(350);
  await page.keyboard.up("d");
  expect(await page.evaluate(() => window.__rogue.player.x)).toBeGreaterThan(
    origin.x + 20,
  );
  await page.keyboard.press("Escape");
  const life = await page.evaluate(() => window.__rogue.recast!.field.life);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__rogue.recast!.field.life)).toBe(
    life,
  );
  await page.keyboard.press("Escape");
  await page.keyboard.press("q");
  expect(await page.evaluate(() => window.__rogue.recast)).toBeNull();
  expect(await page.evaluate(() => window.__rogue.player.x)).toBe(origin.x);
  expect(
    await page.evaluate(() => window.__rogue.player.skillCd),
  ).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
for (const [width, height] of [
  [390, 844],
  [844, 390],
])
  test(`touch Q changes to recast and can be used twice at ${width}x${height}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto("/");
    const origin = await page.evaluate(() => {
      const g = window.__rogue;
      g.practice(5, 1, "anchor");
      g.intro = 0;
      g.labGod = true;
      g.enemies = [];
      g.spawnQueue = [{ kind: "guard", at: 9999, x: 50, y: 50 }];
      return g.player.x;
    });
    await page
      .getByRole("button", { name: "Usar habilidade", exact: true })
      .tap();
    const recast = page.getByRole("button", {
      name: "Reconjurar: VOLTAR",
      exact: true,
    });
    await expect(recast).toBeEnabled();
    await expect(recast).toContainText("VOLTAR");
    await page.evaluate(() => {
      window.__rogue.player.x += 100;
    });
    const bounds = await recast.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    const label = await recast.locator("small").boundingBox();
    expect(label!.y).toBeGreaterThanOrEqual(bounds!.y);
    expect(label!.y + label!.height).toBeLessThanOrEqual(
      bounds!.y + bounds!.height,
    );
    await recast.tap();
    expect(await page.evaluate(() => window.__rogue.player.x)).toBe(origin);
    await expect(
      page.getByRole("button", { name: "Usar habilidade", exact: true }),
    ).toBeDisabled();
    await expect(
      page.locator('.touch-actions [data-action="skill"] small'),
    ).not.toContainText("VOLTAR");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await context.close();
  });
test("new seals and specialist silhouettes render in Kaplay without stale actors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  for (const q of ["soulstep", "relay"]) {
    await page.evaluate((id) => {
      const g = window.__rogue;
      g.practice(7, 1, "fresh");
      g.labEquip(id, 0);
      g.labSkillLevel(5);
      g.labGod = true;
      g.intro = 0;
      g.spawnQueue = [{ kind: "guard", at: 9999, x: 50, y: 50 }];
      g.enemies = [];
      for (const [i, kind] of (
        ["herald", "duelist", "weaver", "chaser"] as const
      ).entries())
        (g as any).spawn(
          kind,
          g.width / 2 + 150 + (i % 2) * 100,
          g.height / 2 - 100 + Math.floor(i / 2) * 180,
        );
      g.skill();
    }, q);
    await expect
      .poll(() => page.evaluate(() => window.__kaplay.get("foe").length))
      .toBe(4);
    await page.waitForTimeout(350);
    expect(await page.evaluate(() => window.__rogue.canRecast)).toBe(true);
    await page.keyboard.press("q");
    expect(await page.evaluate(() => window.__rogue.recast)).toBeNull();
  }
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
});
test("the primary result action starts a fresh seed while same-seed retry remains explicit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  const first = await page.evaluate(() => {
    const g = window.__rogue;
    g.abandon();
    return g.run.seed;
  });
  await expect(page.locator(".result-dialog .primary")).toHaveAttribute(
    "data-action",
    "menu",
  );
  await expect(
    page.getByRole("button", { name: "Repetir código e caminho" }),
  ).toHaveText(/MESMA SEED/);
  await page.getByRole("button", { name: "Nova expedição" }).click();
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  expect(await page.evaluate(() => window.__rogue.run.seed)).not.toBe(first);
  expect(await page.evaluate(() => window.__rogue.run.offeredSkills)).toEqual(
    [],
  );
});
