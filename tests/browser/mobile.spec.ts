import { test, expect } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";

async function phone(browser: Browser, width = 390, height = 844) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  return { context, page };
}
async function enter(page: Page) {
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await expect(page.locator("#interface")).toHaveAttribute(
    "data-phase",
    "combat",
  );
}

test("mobile and desktop have different menus and HUDs; manual override persists", async ({
  browser,
}) => {
  const { page, context } = await phone(browser);
  await expect(page.locator("html")).toHaveAttribute("data-ui", "mobile");
  await expect(page.locator(".mobile-menu")).toBeVisible();
  await expect(page.locator(".mobile-class")).toHaveCount(0);
  await expect(page.locator(".run-intro")).toBeVisible();
  await expect(page.locator(".class-card")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByLabel("Interface", { exact: true }).selectOption("desktop");
  await page.getByRole("button", { name: "Fechar configurações" }).click();
  await expect(page.locator(".menu-layout")).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-ui", "desktop");
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByLabel("Interface", { exact: true }).selectOption("auto");
  await page.getByRole("button", { name: "Fechar configurações" }).click();
  await enter(page);
  await expect(page.locator(".mobile-hud")).toBeVisible();
  await expect(page.locator(".route-mini")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Esquivar", exact: true }),
  ).toBeVisible();
  await context.close();
});

for (const size of [
  [390, 844],
  [844, 390],
  [320, 568],
  [1024, 768],
]) {
  test(`arena and controls never overlap at ${size.join("×")}`, async ({
    browser,
  }) => {
    const { page, context } = await phone(browser, size[0], size[1]);
    await enter(page);
    const boxes = await page.evaluate(() => {
      const box = (selector: string) => {
        const r = document.querySelector(selector)!.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          right: r.right,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        };
      };
      return {
        arena: box("#arena"),
        joystick: box(".joystick"),
        actions: box(".touch-actions"),
        world: { width: window.__rogue.width, height: window.__rogue.height },
        width: innerWidth,
        height: innerHeight,
      };
    });
    const a = boxes.arena;
    for (const controls of [boxes.joystick, boxes.actions]) {
      expect(
        a.right <= controls.x ||
          a.x >= controls.right ||
          a.bottom <= controls.y ||
          a.y >= controls.bottom,
      ).toBe(true);
      expect(controls.x).toBeGreaterThanOrEqual(0);
      expect(controls.right).toBeLessThanOrEqual(boxes.width);
      expect(controls.bottom).toBeLessThanOrEqual(boxes.height);
    }
    expect(a.width).toBeGreaterThan(200);
    expect(a.height).toBeGreaterThan(180);
    expect(boxes.world.width / boxes.world.height).toBeCloseTo(
      a.width / a.height,
      1,
    );
    await context.close();
  });
}

test("rotation pauses, preserves the run and reframes every entity", async ({
  browser,
}) => {
  const { page, context } = await phone(browser);
  await enter(page);
  const before = await page.evaluate(() => {
    const g = window.__rogue;
    g.player.invulnerable = 1000;
    g.run.gold = 57;
    return { seed: g.run.seed, room: g.run.room, hp: g.player.hp };
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("#interface")).toHaveAttribute(
    "data-phase",
    "paused",
  );
  const after = await page.evaluate(() => {
    const g = window.__rogue;
    return {
      seed: g.run.seed,
      room: g.run.room,
      hp: g.player.hp,
      gold: g.run.gold,
      valid:
        g.player.x >= 40 &&
        g.player.x <= g.width - 40 &&
        g.player.y >= 40 &&
        g.player.y <= g.height - 40,
      stopped: g.stick.x === 0 && g.stick.y === 0,
    };
  });
  expect(after).toMatchObject({
    ...before,
    gold: 57,
    valid: true,
    stopped: true,
  });
  await page.getByRole("button", { name: "Continuar a run" }).click();
  await expect(page.locator("#interface")).toHaveAttribute(
    "data-phase",
    "combat",
  );
  await context.close();
});

test("touch skill activates on press and exposes cooldown feedback", async ({
  browser,
}) => {
  const { page, context } = await phone(browser);
  await enter(page);
  await page.evaluate(() => {
    window.__rogue.intro = 0;
    window.__rogue.player.invulnerable = 1000;
  });
  // Real touchscreen input also exercises WebKit's pointer-event compatibility.
  await expect(
    page.getByRole("button", { name: "Usar habilidade", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Usar habilidade", exact: true })
    .tap();
  await expect(
    page.getByRole("button", { name: "Usar habilidade", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => window.__rogue.player.skillCd),
  ).toBeGreaterThan(0);
  await expect(page.locator('[data-touch-cooldown="skill"]')).toContainText(
    "s",
  );
  await context.close();
});

test("two simultaneous fingers move and cast; cancellation never leaves movement stuck", async ({
  browser,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "CDP provides trusted multi-touch input in Chromium.",
  );
  const { page, context } = await phone(browser);
  await enter(page);
  await page.evaluate(() => {
    window.__rogue.intro = 0;
    window.__rogue.player.invulnerable = 1000;
  });
  const stick = (await page.locator(".joystick").boundingBox())!;
  const skill = (await page
    .locator('.touch-actions [data-action="skill"]')
    .boundingBox())!;
  const dash = (await page
    .locator('.touch-actions [data-action="dash"]')
    .boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const movement = {
    id: 1,
    x: stick.x + stick.width / 2 + 28,
    y: stick.y + stick.height / 2,
  };
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [movement],
  });
  await expect
    .poll(() => page.evaluate(() => window.__rogue.stick.x))
    .toBeGreaterThan(0.5);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      movement,
      { id: 2, x: skill.x + skill.width / 2, y: skill.y + skill.height / 2 },
    ],
  });
  await expect
    .poll(() => page.evaluate(() => window.__rogue.player.skillCd))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__rogue.stick.x)).toBeGreaterThan(
    0.5,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [movement],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      movement,
      { id: 3, x: dash.x + dash.width / 2, y: dash.y + dash.height / 2 },
    ],
  });
  await expect
    .poll(() => page.evaluate(() => window.__rogue.player.dashCd))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__rogue.stick.x)).toBeGreaterThan(
    0.5,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.hypot(window.__rogue.stick.x, window.__rogue.stick.y),
      ),
    )
    .toBe(0);
  await context.close();
});
