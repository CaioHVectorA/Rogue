import { test, expect } from "@playwright/test";

test("runs start without skills, draft a small relic and Q while keeping E locked", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  expect(await page.evaluate(() => window.__rogue.run.skills)).toEqual([
    null,
    null,
  ]);
  await page.keyboard.press("q");
  expect(await page.evaluate(() => window.__rogue.player.skillCd)).toBe(0);
  for (const room of [1, 2, 3]) {
    await page.evaluate(() => {
      const g = window.__rogue;
      g.enemies = [];
      g.spawnQueue = [];
      g.roomTime = 3;
      g.update(1 / 120);
    });
    const id = (await page
      .locator(".reward-card")
      .first()
      .getAttribute("data-value"))!;
    if (room === 1) expect(["capacitor", "poison", "dashload"]).toContain(id);
    else expect(id.startsWith("skill:")).toBe(room === 2);
    if (room === 2) {
      await expect(page.locator(".power-description").first()).toBeVisible();
      await expect(page.locator(".power-diagram").first()).toBeVisible();
    }
    await page.locator(".reward-card").first().click();
    const skills = await page.evaluate(() => window.__rogue.run.skills);
    if (room === 1) expect(skills).toEqual([null, null]);
    expect(await page.evaluate(() => window.__rogue.run.weapon)).toBe("pulse");
    if (room === 2) expect(skills).toEqual([id.slice(6), null]);
    if (room === 3) expect(skills[1]).toBeNull();
    await page.locator('[data-action="next"]').click();
  }
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
    "cataclysm",
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
  ).toEqual({ god: true, speed: 2, skills: ["storm", "cataclysm"] });
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
      name: "Usar ultimate",
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

test("equipped attacks explain their footprint and return to combat", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await page
    .getByRole("button", {
      name: "Entender ataque: Pistola de pulso",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Entender poder" }),
  ).toBeVisible();
  await expect(page.locator(".power-help")).toContainText(
    "AUTOMÁTICO AO PARAR",
  );
  await page.locator('[data-action="close-power"]').click();
  await expect(page.locator("#interface")).toHaveAttribute(
    "data-phase",
    "combat",
  );
  await page.evaluate(() => window.__rogue.practice(4, 1, "brawler"));
  await page.keyboard.press("F2");
  await page.locator("#lab-weapon").selectOption("shotgun");
  await page.locator('[data-action="lab-close"]').click();
  await page.getByRole("button", { name: "Continuar a run" }).click();
  await page
    .getByRole("button", { name: "Entender ataque: Escopeta", exact: true })
    .click();
  await expect(page.locator(".power-help")).toContainText("De perto");
  await expect(page.locator(".power-diagram")).toBeVisible();
});

test("Kaplay shotgun collisions hurt nearby enemies and leave distant enemies untouched", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await page.evaluate(() => {
    const g = window.__rogue;
    g.run.weapon = "shotgun";
    g.intro = 0;
    g.spawnQueue = [];
    g.enemies = [];
    g.roomTime = 0;
    g.player.invulnerable = 1000;
    for (const dx of [170, 500]) {
      (g as any).spawn("guard", g.player.x + dx, g.player.y);
      const e = g.enemies.at(-1)!;
      e.speed = 0;
      e.hp = e.maxHp = 10000;
    }
    g.player.charge = g.fireInterval;
  });
  await expect
    .poll(() => page.evaluate(() => window.__rogue.enemies[0].hp))
    .toBeLessThan(10000);
  expect(await page.evaluate(() => window.__rogue.enemies[1].hp)).toBe(10000);
  expect(errors).toEqual([]);
});

test("lightning and poison builds react through the real runtime", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await page.evaluate(() => {
    const g = window.__rogue;
    g.practice(4, 1, "lightning");
    g.labGod = true;
    g.run.weapon = "minigun";
    g.run.skills = [null, null];
    g.intro = 0;
    g.enemies = [];
    g.spawnQueue = [];
    g.roomTime = 0;
    for (const dx of [130, 220]) {
      (g as any).spawn("guard", g.player.x + dx, g.player.y);
      const e = g.enemies.at(-1)!;
      e.hp = e.maxHp = 10000;
      e.speed = 0;
      e.timer = 100;
    }
  });
  await expect
    .poll(() => page.evaluate(() => window.__rogue.run.reactions.overload))
    .toBeGreaterThan(0);
  await page.evaluate(() => {
    const g = window.__rogue;
    g.practice(4, 1, "toxin");
    g.labGod = true;
    g.intro = 0;
    g.player.y = g.enemies[0].y + 130;
    g.skill();
  });
  await expect
    .poll(() => page.evaluate(() => window.__rogue.enemies[0]?.venom ?? 0))
    .toBeGreaterThanOrEqual(3);
  await page.evaluate(() => {
    window.__rogue.player.skillCd = 0;
    window.__rogue.skill();
  });
  await expect
    .poll(() => page.evaluate(() => window.__rogue.run.reactions.catalysis))
    .toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
