import { beforeEach, expect, it, vi } from "vitest";
import { Game } from "../src/game/engine";
import {
  applyReward,
  rewardOffers,
  randomFromSeed,
  trainingCost,
  HERO_STATS,
} from "../src/game/model";

beforeEach(() => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn() });
});
function arena(ultimate = "tempest") {
  const g = new Game();
  g.practice(9, 1, "fresh");
  g.labEquip("vortex", 0);
  g.labEquip(ultimate, 1);
  g.intro = 0;
  g.spawnQueue = [];
  g.player.reload = 1000;
  g.player.charge = 0;
  g.player.invulnerable = 1000;
  (g as any).spawn("guard", g.player.x + 100, g.player.y);
  const enemy = g.enemies[0];
  enemy.hp = enemy.maxHp = 10000;
  enemy.speed = 0;
  enemy.timer = 100;
  return { g, enemy };
}
function simulate(g: Game, seconds: number) {
  for (let i = 0; i < seconds * 120; i++) g.update(1 / 120);
}

it("normal offers keep E empty until the second boss and always give it a distinct ultimate", () => {
  const g = new Game();
  g.start("ranger", "ROUTE");
  for (let room = 1; room < 12; room++) {
    g.run.room = room;
    const offers = rewardOffers(g.run, randomFromSeed(`${room}`));
    expect(offers).toHaveLength(3);
    expect(offers.every((id) => id.startsWith("ultimate:"))).toBe(room === 8);
    if (room < 8) expect(g.run.skills[1]).toBeNull();
    applyReward(g.run, g.player, offers[0]);
    if (room === 8) {
      expect(g.run.skills[1]).toBeTruthy();
      expect(g.run.ultimateCharge).toBe(100);
    }
  }
});
it("ultimate energy requires actual damage, excludes overkill and proc chains, and survives rooms", () => {
  const { g, enemy } = arena();
  g.run.ultimateCharge = 0;
  simulate(g, 1);
  expect(g.run.ultimateCharge).toBe(0);
  (g as any).hitEnemy(enemy, 100);
  expect(g.run.ultimateCharge).toBe(0);
  enemy.hp = 2;
  (g as any).hitEnemy(enemy, 100000, false, "neutral");
  expect(g.run.ultimateCharge).toBeCloseTo(0.07);
  g.run.ultimateCharge = 45;
  g.beginRoom();
  expect(g.run.ultimateCharge).toBe(45);
});
for (const id of ["tempest", "plague", "cataclysm"])
  it(`${id} affects combat, spends charge once and cannot charge itself`, () => {
    const { g, enemy } = arena(id);
    if (id === "plague") {
      enemy.venom = 4;
      enemy.poisoned = 3;
    }
    g.player.skillCd = 4;
    g.run.rewards.echo = 1;
    g.skill(1);
    g.skill(1);
    expect(g.run.ultimateCharge).toBe(0);
    expect(g.player.skillCd).toBe(0);
    expect(g.fields.length).toBeLessThanOrEqual(3);
    const hp = enemy.hp;
    g.pause();
    simulate(g, 1);
    expect(enemy.hp).toBe(hp);
    g.pause();
    simulate(g, 2);
    expect(enemy.hp).toBeLessThan(enemy.maxHp);
    expect(g.run.ultimateCharge).toBe(0);
    g.beginRoom();
    expect(g.fields).toHaveLength(0);
  });
it("the storm follows its hero, while cataclysm stays at the activation point and respects boss phases", () => {
  const { g } = arena();
  g.skill(1);
  g.player.x += 100;
  g.update(1 / 120);
  expect(g.fields[0].x).toBe(g.player.x);
  const { g: bossGame } = arena("cataclysm");
  bossGame.enemies = [];
  (bossGame as any).spawn("boss", bossGame.player.x + 90, bossGame.player.y);
  const boss = bossGame.enemies[0];
  bossGame.player.damage = 100000;
  bossGame.skill(1);
  simulate(bossGame, 1.15);
  expect(boss.phase).toBe(2);
  expect(boss.hp).toBe(boss.maxHp * 0.75);
});
it("hero training enforces gold, rank and checkpoint limits and resets for a new run", () => {
  const { g } = arena();
  g.phase = "camp";
  g.run.gold = 1000;
  g.player.hp = 10;
  g.buy("vitality");
  expect(g.player.hp).toBe(22);
  expect(g.player.maxHp).toBe(112);
  g.buy("agility");
  const speed = g.player.speed,
    gold = g.run.gold;
  g.buy("cadence");
  expect(g.run.gold).toBe(gold);
  expect(g.run.training.cadence).toBeUndefined();
  for (let checkpoint = 0; checkpoint < 3; checkpoint++) {
    g.run.purchases = 0;
    g.buy("agility");
  }
  expect(g.run.training.agility).toBe(3);
  expect(g.player.speed).toBe(speed + 20);
  const ranks = { ...g.run.training };
  g.run.gold = 0;
  g.buy("defense");
  expect(g.run.training).toEqual(ranks);
  expect(trainingCost(g.run, "agility")).toBeGreaterThan(
    trainingCost(g.run, "defense"),
  );
  g.start("ranger", "RESET");
  expect(g.run.training).toEqual({});
  expect(g.player.speed).toBe(235);
});
it("training changes actual cadence, protection, Q and dash timing, collection and active regeneration", () => {
  const { g, enemy } = arena();
  g.phase = "camp";
  g.run.gold = 10000;
  g.player.reload = 0.2;
  const damage = g.player.damage;
  for (const stat of HERO_STATS) {
    g.run.purchases = 0;
    g.buy(stat.id);
  }
  expect(g.fireInterval).toBeLessThan(0.2);
  expect(g.player.damage).toBe(damage);
  g.phase = "combat";
  g.player.invulnerable = 0;
  const hp = g.player.hp;
  g.contactEnemy(enemy);
  expect(g.player.hp).toBe(hp - enemy.damage + 1);
  g.labEquip("nova", 0);
  g.skill();
  expect(g.player.skillCd).toBeCloseTo(4 * 0.94);
  g.dash();
  expect(g.player.dashCd).toBeCloseTo(2.42);
  g.player.reload = 1000;
  g.player.charge = 0;
  g.player.invulnerable = 1000;
  g.player.hp = 20;
  g.pickups.push({ x: g.player.x + 170, y: g.player.y, value: 1, life: 0 });
  g.update(0.01);
  expect(g.pickups[0].x).toBeLessThan(g.player.x + 170);
  g.pause();
  simulate(g, 12);
  expect(g.player.hp).toBe(20);
  g.pause();
  simulate(g, 10);
  expect(g.player.hp).toBe(21);
});
it("instructional scenes stay isolated from run records", () => {
  const g = Game.demonstration("ultimate:plague");
  g.skill(1);
  simulate(g, 6);
  expect(localStorage.setItem).not.toHaveBeenCalled();
  expect(g.run.practice).toBe(true);
});
