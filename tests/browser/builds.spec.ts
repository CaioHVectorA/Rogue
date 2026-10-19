import { test, expect } from "@playwright/test";

test("early skill draft equips E and preserves the starter in Q", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await page.evaluate(() => {
    const g = window.__rogue;
    g.enemies = [];
    g.spawnQueue = [];
    g.roomTime = 3;
    g.update(1 / 120);
  });
  await expect(page.locator(".skill-draft")).toBeVisible();
  await expect(
    page.locator('[data-action="reward-slot"][data-value="1"]'),
  ).toHaveAttribute("aria-pressed", "true");
  const chosen = (await page
    .locator(".reward-card")
    .first()
    .getAttribute("data-value"))!.slice(6);
  await page.locator(".reward-card").first().click();
  expect(await page.evaluate(() => window.__rogue.run.skills)).toEqual([
    "volley",
    chosen,
  ]);
  await expect(page.locator(".equipped-skills")).toContainText("E");
  await page.locator('[data-action="next"]').click();
  await page.keyboard.press("e");
  await page.evaluate(() => {
    window.__rogue.intro = 0;
  });
  await page.keyboard.press("e");
  expect(
    await page.evaluate(() => window.__rogue.player.secondCd),
  ).toBeGreaterThan(0);
});

test("laboratory jumps to boss phases, edits builds and keeps records clean", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Laboratório de gameplay" }).click();
  await page.locator("#lab-room").selectOption("12");
  await page.locator("#lab-phase").selectOption("4");
  await page.locator("#lab-build").selectOption("brawler");
  await page.locator('[data-action="lab-jump"]').click();
  await expect(page.locator("#boss-phase")).toContainText("IV / IV");
  expect(await page.evaluate(() => window.__rogue.run.skills)).toEqual([
    "quake",
    "orbit",
  ]);
  await page.keyboard.press("F2");
  await expect(
    page.getByRole("dialog", { name: "Laboratório de gameplay" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /INVENCÍVEL/ }).click();
  await page.getByLabel("Habilidade Q", { exact: true }).selectOption("storm");
  await page.locator("#lab-speed").selectOption("2");
  expect(
    await page.evaluate(() => ({
      god: window.__rogue.labGod,
      speed: window.__rogue.labSpeed,
      skills: window.__rogue.run.skills,
    })),
  ).toEqual({ god: true, speed: 2, skills: ["storm", "orbit"] });
  await page.locator('[data-action="lab-clear"]').click();
  await expect(page.locator("#interface")).toHaveAttribute(
    "data-phase",
    "result",
  );
  expect(await page.evaluate(() => window.__rogue.records.runs)).toBe(0);
  expect(
    await page.evaluate(() => localStorage.getItem("rogue.records.v2")),
  ).toBeNull();
  expect(errors).toEqual([]);
});

test("all persistent skills render through Kaplay and clear on a new run", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => {
    const g = window.__rogue;
    g.practice(8, 1, "control");
    g.intro = 0;
    g.labGod = true;
    for (const id of ["vortex", "storm", "turret", "mine", "orbit", "decoy"]) {
      g.labEquip(id, 0);
      g.skill();
    }
    // Equip clears previous fields; exercise simultaneous field rendering too.
    for (const kind of ["vortex", "storm", "turret", "mine", "orbit", "decoy"])
      (g as any).addField(kind, { x: g.width / 2, y: g.height / 2 });
  });
  await expect
    .poll(() => page.evaluate(() => window.__rogue.fields.length))
    .toBe(6);
  await page.waitForTimeout(250);
  expect(errors).toEqual([]);
  await page.evaluate(() => window.__rogue.start("ranger", "RESET-FIELDS"));
  expect(await page.evaluate(() => window.__rogue.fields.length)).toBe(0);
});

for (const [width, height] of [
  [320, 568],
  [844, 390],
])
  test(`two mobile skills remain usable outside the arena at ${width}x${height}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Laboratório de gameplay" }).tap();
    await page.locator("#lab-room").selectOption("4");
    await page.locator('[data-action="lab-jump"]').tap();
    await page.evaluate(() => {
      window.__rogue.intro = 0;
      window.__rogue.labGod = true;
    });
    const second = page.getByRole("button", {
      name: "Usar segunda habilidade",
      exact: true,
    });
    await expect(second).toBeVisible();
    await expect(second).toBeEnabled();
    await second.tap();
    expect(
      await page.evaluate(() => window.__rogue.player.secondCd),
    ).toBeGreaterThan(0);
    const geometry = await page.evaluate(() => {
      const a = document.querySelector("#arena")!.getBoundingClientRect();
      const buttons = [
        ...document.querySelectorAll(".touch-actions button"),
      ].map((el) => el.getBoundingClientRect());
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        clear: buttons.every(
          (b) =>
            (b.right <= a.left ||
              b.left >= a.right ||
              b.bottom <= a.top ||
              b.top >= a.bottom) &&
            b.left >= 0 &&
            b.right <= innerWidth &&
            b.bottom <= innerHeight,
        ),
      };
    });
    expect(geometry).toEqual({ overflow: false, clear: true });
    await context.close();
  });
