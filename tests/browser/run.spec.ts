import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Game } from "../../src/game/engine";

declare global {
  interface Window {
    __rogue: Game;
    __kaplay: import("kaplay").KAPLAYCtx;
  }
}
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await expect(page.locator("#interface")).toHaveAttribute(
    "data-phase",
    "combat",
  );
}
async function clearRoom(page: Page) {
  await page.evaluate(() => {
    const game = window.__rogue;
    game.player.invulnerable = 1000;
    // Fast-forward spawn timers, then deliver lethal damage through the real death queue.
    for (let i = 0; i < 2400 && game.spawnQueue.length; i++)
      game.update(1 / 120);
    for (let phase = 0; phase < 4; phase++)
      for (const enemy of [...game.enemies]) {
        enemy.transition = 0;
        (game as any).hitEnemy(enemy, 100000);
      }
    game.update(1 / 120);
  });
}

test("menu starts directly without class selection; seed, help and safe rendering", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator('[data-action="class"]')).toHaveCount(0);
  await page.getByLabel("CÓDIGO DA RUN").fill("<img src=x onerror=alert(1)>");
  await page
    .getByRole("button", { name: "Como jogar", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Entendi" }).click();
  await expect(page.getByLabel("CÓDIGO DA RUN")).toHaveValue(
    "<img src=x onerror=alert(1)>",
  );
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Encerrar esta run", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar encerramento desta run" })
    .click();
  await expect(page.locator(".result-seed")).toContainText(
    "<img src=x onerror=alert(1)>",
  );
  expect(await page.locator("img").count()).toBe(0);
  expect(errors).toEqual([]);
});

test("movement stops basic fire; skill and dodge respect cooldowns", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    const g = window.__rogue;
    g.spawnQueue = [];
    g.enemies = [];
    g.intro = 0;
    g.roomTime = 0;
    (g as any).spawn("guard", 900, 380);
    g.enemies[0].hp = 10000;
    g.enemies[0].maxHp = 10000;
    g.enemies[0].speed = 0;
    g.player.invulnerable = 100;
    g.keys.add("a");
    for (let i = 0; i < 120; i++) g.update(1 / 120);
    if (g.bullets.some((b) => !b.hostile))
      throw new Error("Fired while moving");
    g.keys.clear();
    g.update(1 / 120);
    if (!g.bullets.some((b) => !b.hostile))
      throw new Error("Did not fire after stopping");
    g.skill();
    const cd = g.player.skillCd;
    g.skill();
    if (!cd || g.player.skillCd !== cd)
      throw new Error("Skill cooldown was bypassed");
    g.dash();
    const dash = g.player.dashCd;
    g.dash();
    if (!dash || g.player.dashCd !== dash)
      throw new Error("Dodge cooldown was bypassed");
  });
});

test("pause freezes simulation, traps focus and resumes without stuck movement", async ({
  page,
}) => {
  await start(page);
  await page.keyboard.down("d");
  await page.keyboard.press("Escape");
  await page.keyboard.up("d");
  const before = await page.evaluate(() => ({
    ...window.__rogue.player,
    time: window.__rogue.run.elapsed,
  }));
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => ({
    ...window.__rogue.player,
    time: window.__rogue.run.elapsed,
  }));
  expect(after).toEqual(before);
  await page
    .getByRole("button", { name: "Encerrar esta run", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Continuar a run" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Continuar a run" }).click();
  expect(await page.evaluate(() => window.__rogue.keys.size)).toBe(0);
});

test("complete run visits every reward and camp, kills three bosses, records one win and resets", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await start(page);
  for (let room = 1; room <= 12; room++) {
    expect(await page.evaluate(() => window.__rogue.run.room)).toBe(room);
    await clearRoom(page);
    if (room < 12) {
      await expect(page.locator("#interface")).toHaveAttribute(
        "data-phase",
        "reward",
      );
      await page.locator(".reward-card").first().click();
      await expect(page.locator("#interface")).toHaveAttribute(
        "data-phase",
        "camp",
      );
      await page.locator('[data-action="next"]').click();
    }
  }
  await expect(page.locator("#interface")).toHaveAttribute(
    "data-phase",
    "result",
  );
  expect(
    await page.evaluate(() => ({
      bosses: window.__rogue.run.bosses,
      records: window.__rogue.records,
    })),
  ).toMatchObject({ bosses: 3, records: { runs: 1, wins: 1, bestRoom: 12 } });
  await page.getByRole("button", { name: "Repetir código e caminho" }).click();
  expect(
    await page.evaluate(() => ({
      room: window.__rogue.run.room,
      gold: window.__rogue.run.gold,
      rewards: window.__rogue.run.rewards,
    })),
  ).toEqual({ room: 1, gold: 0, rewards: {} });
});

test("shop rejects overspending and duplicate rewards", async ({ page }) => {
  await start(page);
  await clearRoom(page);
  const chosen = await page
    .locator(".reward-card")
    .first()
    .getAttribute("data-value");
  await page.locator(".reward-card").first().click();
  const rewards = await page.evaluate(() => ({
    ...window.__rogue.run.rewards,
  }));
  await page.evaluate((id) => {
    const g = window.__rogue;
    g.chooseReward(id!);
    g.run.gold = 100;
    g.player.hp = 10;
    g.buy("heal");
    g.buy("heal");
    if (g.player.hp !== Math.round(g.player.maxHp * 0.4) + 10)
      throw new Error("Duplicate heal");
    g.buy("forge");
    g.buy("forge");
    const damage = g.player.damage;
    g.buy("forge");
    if (g.player.damage !== damage) throw new Error("Forge cap bypassed");
    g.run.gold = 0;
    g.run.purchases = 0;
    g.buy("forge");
    if (g.player.damage !== damage || g.run.gold < 0)
      throw new Error("Overspending");
  }, chosen);
  expect(await page.evaluate(() => window.__rogue.run.rewards)).toEqual(
    rewards,
  );
});

test("boss telegraphs are fixed and delayed; phase two accelerates", async ({
  page,
}) => {
  await start(page);
  const result = await page.evaluate(() => {
    const g = window.__rogue;
    g.run.room = 8;
    g.run.act = 2;
    g.beginRoom();
    for (let i = 0; i < 190; i++) g.update(1 / 120);
    const boss = g.enemies[0];
    (g as any).bossAttack(boss);
    (g as any).bossAttack(boss);
    const warning = { ...g.hazards[0] };
    g.player.x += 100;
    const fixed = g.hazards[0].x === warning.x;
    (g as any).hitEnemy(boss, boss.maxHp);
    (g as any).bossAttack(boss);
    return {
      delay: warning.delay,
      fixed,
      phaseTwo: boss.enraged,
      interval: boss.timer,
    };
  });
  expect(result).toEqual({
    delay: 1.1,
    fixed: true,
    phaseTwo: true,
    interval: 2.2,
  });
});

test("death is terminal, counts once and survives storage reload", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    const g = window.__rogue;
    g.player.invulnerable = 0;
    (g as any).hurt(100000);
    (g as any).hurt(100000);
  });
  await expect(page.locator("#interface")).toHaveAttribute(
    "data-phase",
    "result",
  );
  expect(await page.evaluate(() => window.__rogue.records.runs)).toBe(1);
  await page.reload();
  expect(await page.evaluate(() => window.__rogue.records.runs)).toBe(1);
});

test("mobile screens have no horizontal overflow and expose touch controls", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Iniciar expedição" }).click();
  await expect(page.locator(".joystick")).toBeVisible();
  await clearRoom(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".reward-card").first().click();
  await expect(page.locator('[data-action="next"]')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});
