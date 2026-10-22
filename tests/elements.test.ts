import { beforeEach, expect, it, vi } from "vitest";
import { Game } from "../src/game/engine";
import {
  applyReward,
  createRun,
  rewardOffers,
  randomFromSeed,
  roomComposition,
  WEAPONS,
} from "../src/game/model";

beforeEach(() => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {} });
});
function arena() {
  const g = new Game();
  g.start("ranger", "ELEMENTS");
  g.spawnQueue = [];
  g.intro = 0;
  g.roomTime = 0;
  g.player.invulnerable = 10000;
  g.player.reload = 100;
  g.player.charge = 0;
  return g;
}
function spawn(g: Game, x = 90, y = 0) {
  (g as any).spawn("guard", g.player.x + x, g.player.y + y);
  const e = g.enemies.at(-1)!;
  e.hp = e.maxHp = 10000;
  e.speed = 0;
  e.timer = 100;
  return e;
}
function strike(
  g: Game,
  e: ReturnType<typeof spawn>,
  element: "neutral" | "storm" | "toxin" = "neutral",
  poison = false,
) {
  e.markCd = 0;
  (g as any).hitEnemy(e, 1, poison, element);
}

it("first clear offers modest relics and the first weapon draft is earned after the boss", () => {
  const run = createRun("PROGRESS", "ranger");
  expect(rewardOffers(run, randomFromSeed("a")).sort()).toEqual([
    "capacitor",
    "dashload",
    "poison",
  ]);
  for (const room of [2]) {
    run.room = room;
    expect(
      rewardOffers(run, randomFromSeed("a")).every((id) =>
        id.startsWith("skill:"),
      ),
    ).toBe(true);
  }
  run.room = 4;
  expect(
    rewardOffers(run, randomFromSeed("a")).every((id) =>
      id.startsWith("weapon:"),
    ),
  ).toBe(true);
  const g = arena();
  g.run.room = 1;
  g.phase = "reward";
  g.run.offers = rewardOffers(g.run, randomFromSeed("a"));
  const rerolls = g.run.rerolls;
  g.reroll();
  expect(g.run.rerolls).toBe(rerolls);
});
it("weapon sidegrades do not multiply single-target output; waves mix pressure early", () => {
  const pulse = WEAPONS.find((w) => w.id === "pulse")!;
  for (const id of ["minigun", "shotgun", "seismic", "arc", "rail", "needle"]) {
    const w = WEAPONS.find((w) => w.id === id)!;
    const pellets = w.pattern === "cone" ? 7 : 1;
    expect((w.power * pellets) / w.interval).toBeLessThanOrEqual(
      (pulse.power / pulse.interval) * 1.03,
    );
  }
  expect(roomComposition(1)).toContain("shooter");
  expect(roomComposition(2)).toContain("guard");
  expect(roomComposition(11).length).toBeLessThan(roomComposition(10).length);
  expect(roomComposition(11)).toContain("duelist");
  expect(roomComposition(11)).toContain("weaver");
  const g = arena();
  (g as any).spawn("chaser", 100, 100);
  expect(g.enemies[0].hp).toBeGreaterThan(g.player.damage);
  g.phase = "camp";
  g.run.gold = 1000;
  const damage = g.player.damage;
  g.buy("cadence");
  g.buy("cadence");
  expect(g.player.damage).toBe(damage);
  expect(g.run.training.cadence).toBe(2);
});
it("shotgun hits cannot produce seven charges; overloads cannot recursively trigger themselves", () => {
  const g = arena(),
    e = spawn(g),
    neighbor = spawn(g, 180);
  applyReward(g.run, g.player, "capacitor");
  for (let i = 0; i < 7; i++) (g as any).hitEnemy(e, 1, false, "neutral");
  expect(e.shock).toBe(1);
  expect(g.run.reactions.overload).toBe(0);
  for (let i = 0; i < 3; i++) strike(g, e);
  expect(g.run.reactions.overload).toBe(1);
  expect(e.shock).toBe(0);
  expect(neighbor.hp).toBeLessThan(neighbor.maxHp);
  expect(neighbor.shock).toBe(0);
  (g as any).hitEnemy(e, 100);
  expect(g.run.reactions.overload).toBe(1);
});
it("poison stacks are capped; seismic catalysis consumes preparation instead of granting free damage", () => {
  const g = arena(),
    e = spawn(g);
  applyReward(g.run, g.player, "poison");
  applyReward(g.run, g.player, "catalyst");
  for (let i = 0; i < 8; i++) strike(g, e, "neutral", true);
  expect(e.venom).toBe(4);
  const before = e.hp;
  (g as any).catalyse(e);
  expect(e.hp).toBeLessThan(before);
  expect(e.venom).toBe(0);
  expect(e.poisoned).toBe(0);
  expect(g.run.reactions.catalysis).toBe(1);
  const hp = e.hp;
  (g as any).catalyse(e);
  expect(e.hp).toBe(hp);
});
it("electrolysis conserves two toxin doses while carrying them with a discharge", () => {
  const g = arena(),
    e = spawn(g),
    a = spawn(g, 170),
    b = spawn(g, 175, 50);
  applyReward(g.run, g.player, "electrolysis");
  e.venom = 4;
  e.poisoned = 3;
  e.shock = 3;
  strike(g, e, "storm");
  expect(e.venom + a.venom + b.venom).toBe(4);
  expect(e.venom).toBe(2);
  expect(a.venom).toBe(1);
  expect(b.venom).toBe(1);
  expect(g.run.reactions.overload).toBe(1);
});
it("Faraday requires a storm inside a vortex; rods consume marked targets", () => {
  const g = arena(),
    e = spawn(g),
    other = spawn(g, 170);
  applyReward(g.run, g.player, "faraday");
  (g as any).addField("storm", e);
  (g as any).updateFields(1 / 120);
  expect(g.run.reactions.conduction).toBe(0);
  (g as any).addField("vortex", e);
  g.fields[0].timer = 0;
  e.markCd = 0;
  (g as any).updateFields(1 / 120);
  expect(g.run.reactions.conduction).toBeGreaterThan(0);
  applyReward(g.run, g.player, "rod");
  e.shock = 2;
  e.markCd = 1;
  (g as any).projectile(g.player, 0, 1, false);
  const shot = g.bullets.at(-1)!;
  shot.origin = "turret";
  const hp = other.hp;
  g.contactBullet(shot, e);
  expect(e.shock).toBe(0);
  expect(other.hp).toBeLessThan(hp);
});
it("conditional perks only appear when their inputs exist and one fitting offer is preserved", () => {
  const g = arena();
  g.run.room = 6;
  for (let i = 0; i < 20; i++) {
    const offers = rewardOffers(g.run, randomFromSeed(`${i}`));
    for (const id of ["faraday", "rod", "catalyst", "electrolysis", "mycelium"])
      expect(offers).not.toContain(id);
  }
  g.run.skills = ["vortex", "tempest"];
  applyReward(g.run, g.player, "capacitor");
  applyReward(g.run, g.player, "poison");
  const offers = rewardOffers(g.run, randomFromSeed("SYNERGY"));
  expect(
    offers.some((id) =>
      [
        "faraday",
        "groundwire",
        "electrolysis",
        "explosion",
        "mycelium",
        "viscosity",
        "skill:venom",
        "weapon:arc",
        "weapon:needle",
      ].includes(id),
    ),
  ).toBe(true);
});
it("gardens require poisoned deaths, have a field budget, and boss rushes announce before moving", () => {
  const g = arena();
  applyReward(g.run, g.player, "mycelium");
  for (let i = 0; i < 10; i++) {
    const e = spawn(g, 60 + i * 10);
    e.venom = 2;
    e.poisoned = 3;
    (g as any).hitEnemy(e, 100000);
  }
  (g as any).resolveDeaths();
  expect(g.fields.filter((f) => f.kind === "toxin")).toHaveLength(3);
  (g as any).spawn("boss", g.player.x - 240, g.player.y);
  const boss = g.enemies[0];
  boss.phase = 2;
  boss.cycle = 2;
  (g as any).bossAttack(boss);
  expect(boss.windup).toBeGreaterThan(0);
  const before = boss.x;
  g.update(0.2);
  expect(boss.x).toBe(before);
  g.update(0.61);
  g.update(0.1);
  expect(boss.x).toBeGreaterThan(before);
});
