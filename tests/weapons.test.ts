import { beforeEach, expect, it, vi } from "vitest";
import { Game } from "../src/game/engine";
import { applyReward } from "../src/game/model";

beforeEach(() => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {} });
});
function arena() {
  const g = new Game();
  g.start("ranger", "WEAPONS");
  g.intro = 0;
  g.spawnQueue = [];
  g.roomTime = 0;
  g.player.invulnerable = 1000;
  return g;
}
function spawn(g: Game, dx: number, dy = 0) {
  (g as any).spawn("guard", g.player.x + dx, g.player.y + dy);
  const e = g.enemies.at(-1)!;
  e.speed = 0;
  e.hp = e.maxHp = 10000;
  return e;
}
function simulate(g: Game, seconds: number) {
  for (let i = 0; i < seconds * 120; i++) g.update(1 / 120);
}

it("starts without either skill and fires a strong, fast basic attack", () => {
  const g = arena();
  expect(g.run.skills).toEqual([null, null]);
  g.skill();
  g.skill(1);
  expect(g.player.skillCd + g.player.secondCd).toBe(0);
  expect(g.bullets).toHaveLength(0);
  const e = spawn(g, 120);
  simulate(g, 1);
  expect((e.maxHp - e.hp) / g.player.damage).toBeGreaterThanOrEqual(4);
  expect(g.player.damage).toBeGreaterThan(18);
});
it("seismic hits only the nearby footprint, never launches a distant projectile, and waits for targets", () => {
  const g = arena();
  g.run.weapon = "seismic";
  const near = spawn(g, 100),
    far = spawn(g, 250);
  simulate(g, 0.55);
  expect(near.hp).toBeLessThan(near.maxHp);
  expect(far.hp).toBe(far.maxHp);
  expect(g.bullets).toHaveLength(0);
  g.enemies = [far];
  g.player.charge = g.fireInterval;
  g.update(1 / 120);
  expect(g.player.charge).toBe(g.fireInterval);
});
it("shotgun spreads seven short-lived pellets and cannot hurt distant targets", () => {
  const g = arena();
  g.run.weapon = "shotgun";
  spawn(g, 220);
  expect((g as any).fire()).toBe(true);
  expect(g.bullets).toHaveLength(7);
  expect(new Set(g.bullets.map((b) => b.vy)).size).toBe(7);
  expect(g.bullets.every((b) => b.life < 0.4 && b.ricochets === false)).toBe(
    true,
  );
  g.enemies = [];
  const far = spawn(g, 650);
  g.player.reload = 100;
  simulate(g, 0.5);
  expect(far.hp).toBe(far.maxHp);
  expect(g.bullets).toHaveLength(0);
});
it("electric arcs chain through three neighbors but cannot jump a large gap", () => {
  const g = arena();
  g.run.weapon = "arc";
  const first = spawn(g, 120),
    second = spawn(g, 230),
    third = spawn(g, 335),
    fourth = spawn(g, 450);
  (g as any).fire();
  for (const e of [first, second, third]) expect(e.hp).toBeLessThan(e.maxHp);
  expect(fourth.hp).toBe(fourth.maxHp);
  expect(g.bullets).toHaveLength(0);
  g.enemies = [first, fourth];
  first.hp = first.maxHp;
  (g as any).fire();
  expect(fourth.hp).toBe(fourth.maxHp);
});
it("rail shots pierce a line and earned weapons swap only at camp", () => {
  const g = arena();
  g.run.weapon = "rail";
  spawn(g, 100);
  (g as any).fire();
  expect(g.bullets[0].pierce).toBe(4);
  expect(g.bullets[0].vx).toBeGreaterThan(1000);
  expect(applyReward(g.run, g.player, "weapon:shotgun")).toBe(true);
  expect(g.run.weapons).toContain("shotgun");
  g.equipWeapon("pulse");
  expect(g.run.weapon).toBe("shotgun");
  g.phase = "camp";
  g.equipWeapon("pulse");
  expect(g.run.weapon).toBe("pulse");
  g.equipWeapon("seismic");
  expect(g.run.weapon).toBe("pulse");
  g.start("ranger", "RESET");
  expect(g.run.weapons).toEqual(["pulse"]);
  expect(g.run.skills).toEqual([null, null]);
});
