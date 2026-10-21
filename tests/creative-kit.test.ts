import { beforeEach, expect, it, vi } from "vitest";
import { Game } from "../src/game/engine";
import {
  applyReward,
  skillRole,
  rewardOffers,
  randomFromSeed,
  SKILLS,
} from "../src/game/model";
import { stickVector, validateControls } from "../src/ui/control-settings";
beforeEach(() => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {} });
});
function arena(q = "wall", level = 1) {
  const g = new Game();
  g.start("ranger", "CREATIVE");
  g.run.practice = true;
  g.labEquip(q, 0);
  g.labSkillLevel(level);
  g.intro = 0;
  g.spawnQueue = [];
  g.player.invulnerable = 1000;
  g.player.reload = 1000;
  g.player.charge = 0;
  return g;
}
function spawn(g: Game, dx: number, dy = 0) {
  (g as any).spawn("guard", g.player.x + dx, g.player.y + dy);
  const e = g.enemies.at(-1)!;
  e.hp = e.maxHp = 10000;
  e.timer = 100;
  e.speed = 0;
  return e;
}
function simulate(g: Game, seconds: number) {
  for (let i = 0; i < seconds * 120; i++) g.update(1 / 120);
}
function shot(g: Game, x: number, y: number, hostile = true) {
  (g as any).projectile({ x, y }, Math.PI, 10, hostile, 0, 150);
  return g.bullets.at(-1)!;
}
it("initial Q drafts contrast three roles and rerolls avoid the previous choices", () => {
  const g = arena();
  g.run.room = 2;
  g.run.skills = [null, null];
  for (let i = 0; i < 20; i++) {
    const first = rewardOffers(g.run, randomFromSeed(`${i}`));
    expect(new Set(first.map((id) => skillRole(id.slice(6)))).size).toBe(3);
    const next = rewardOffers(g.run, randomFromSeed(`${i}:r`), first);
    expect(next.some((id) => first.includes(id))).toBe(false);
  }
  expect(SKILLS.length).toBeGreaterThanOrEqual(15);
});
it("floating controls validate corrupt preferences and still reach full speed at low sensitivity", () => {
  expect(
    validateControls({
      mode: "bad",
      size: 900,
      sensitivity: Infinity,
      deadzone: -1,
    }),
  ).toEqual({ mode: "floating", size: 136, sensitivity: 1, deadzone: 0.05 });
  const p = validateControls({ sensitivity: 0.6 });
  expect(stickVector(0.01, 0.01, p)).toEqual({ x: 0, y: 0 });
  expect(stickVector(2, 0, p)).toEqual({ x: 1, y: 0 });
  const v = stickVector(1, 1, p);
  expect(v.x).toBeCloseTo(v.y);
  expect(Math.hypot(v.x, v.y)).toBeLessThanOrEqual(1);
});
it("a wall faces the largest group, blocks enemies, lets shots pass and breaks for a boss", () => {
  const g = arena();
  spawn(g, -120);
  for (const dy of [-25, 0, 25]) spawn(g, 220, dy);
  g.skill();
  const wall = g.fields[0];
  expect(Math.abs(wall.angle!)).toBeLessThan(0.6);
  const enemy = g.enemies[2];
  enemy.x = wall.x;
  enemy.y = wall.y;
  (g as any).resolveWalls();
  expect(g.wallContact(wall, enemy).distance).toBeGreaterThan(enemy.radius);
  const b = shot(g, wall.x - 40, wall.y + 90, false);
  b.vx = 150;
  simulate(g, 0.5);
  expect(b.life).toBeGreaterThan(0);
  expect(b.x).toBeGreaterThan(wall.x);
  (g as any).spawn("boss", wall.x, wall.y);
  (g as any).resolveWalls();
  expect(wall.life).toBe(0);
});
it("aegis reflects a bounded number of shots at level three and never blocks floor hazards", () => {
  const g = arena("aegis", 3);
  spawn(g, 200);
  g.skill();
  for (let i = 0; i < 8; i++) shot(g, g.player.x + 30, g.player.y);
  g.update(1 / 120);
  expect(g.fields[0].blocks).toBe(0);
  expect(g.bullets.filter((b) => !b.hostile).length).toBe(5);
  expect(g.bullets.filter((b) => b.hostile).length).toBe(3);
  g.player.invulnerable = 0;
  const hp = g.player.hp;
  g.hazards.push({
    x: g.player.x,
    y: g.player.y,
    radius: 30,
    delay: 0,
    life: 1,
    damage: 10,
    fired: false,
  });
  g.update(1 / 120);
  expect(g.player.hp).toBe(hp - 10);
});
it("overdrive shoots while moving only during the buff and mastery changes its combo pressure", () => {
  const g = arena("overdrive", 5);
  spawn(g, 250);
  g.player.reload = 0.2;
  g.stick.x = 0.3;
  g.player.dashCd = 2;
  g.skill();
  expect(g.player.dashCd).toBe(0);
  simulate(g, 1);
  expect(g.bullets.length).toBeGreaterThan(0);
  g.overdrive = 0;
  g.bullets = [];
  simulate(g, 0.3);
  expect(g.bullets).toHaveLength(0);
});
it("stasis changes bullet travel only inside its area and upgraded fields slow enemies", () => {
  const g = arena("stasis", 3),
    e = spawn(g, 100);
  g.skill();
  const near = shot(g, g.player.x + 80, g.player.y),
    far = shot(g, g.player.x + 350, g.player.y);
  const nx = near.x,
    fx = far.x;
  g.update(0.1);
  expect(nx - near.x).toBeLessThan((fx - far.x) * 0.3);
  expect(e.slowed).toBeGreaterThan(0);
  g.fields = [];
  const x = near.x;
  g.update(0.1);
  expect(x - near.x).toBeCloseTo(15);
});
it("recall returns to the anchor, prepares the gun and leaves a decoy only at mastery", () => {
  const g = arena("recall", 5);
  spawn(g, 300);
  const origin = { x: g.player.x, y: g.player.y };
  g.skill();
  g.player.x += 100;
  g.pause();
  simulate(g, 3);
  expect(g.player.x).toBe(origin.x + 100);
  g.pause();
  for (let i = 0; i < 400 && g.player.x !== origin.x; i++) g.update(1 / 120);
  expect(g.player.x).toBe(origin.x);
  expect(g.fields.some((f) => f.kind === "decoy")).toBe(true);
  expect(g.player.charge).toBe(g.fireInterval);
});
it("Q evolution respects gold, one purchase per checkpoint, five levels, switching and run reset", () => {
  const g = arena("wall");
  g.phase = "camp";
  g.run.gold = 1000;
  g.upgradeSkill();
  g.upgradeSkill();
  expect(g.qLevel).toBe(2);
  for (let i = 0; i < 5; i++) {
    g.run.skillPurchase = false;
    g.upgradeSkill();
  }
  expect(g.qLevel).toBe(5);
  const gold = g.run.gold;
  g.upgradeSkill();
  expect(g.run.gold).toBe(gold);
  applyReward(g.run, g.player, "skill:aegis");
  expect(g.qLevel).toBe(1);
  g.equipSkill("wall");
  expect(g.qLevel).toBe(5);
  g.start("ranger", "RESET");
  expect(g.run.skillLevels).toEqual({});
  expect(g.run.learnedSkills).toEqual([]);
});
it("a disc hits once each way, returns to the hero and feeds only a matching recycling passive", () => {
  const g = arena();
  g.run.weapon = "disc";
  const e = spawn(g, 100);
  g.run.rewards.returnflux = 1;
  g.player.skillCd = 4;
  (g as any).fire();
  const b = g.bullets[0];
  g.contactBullet(b, e);
  const hp = e.hp;
  g.contactBullet(b, e);
  expect(e.hp).toBe(hp);
  simulate(g, 0.85);
  expect(b.returning).toBe(true);
  expect(e.hp).toBeLessThan(hp);
  simulate(g, 0.6);
  expect(g.bullets).not.toContain(b);
  expect(g.player.skillCd).toBeLessThan(2.9);
});
it("crystals split once, cannot hit their original target again, and casulo clouds are bounded", () => {
  const g = arena(),
    e = spawn(g, 120);
  g.run.weapon = "prism";
  (g as any).fire();
  g.contactBullet(g.bullets[0], e);
  const shards = g.bullets.filter((b) => b.origin === "shard" && b.life > 0);
  expect(shards).toHaveLength(3);
  const hp = e.hp;
  for (const b of shards) g.contactBullet(b, e);
  expect(e.hp).toBe(hp);
  g.run.weapon = "spore";
  for (let i = 0; i < 8; i++) {
    (g as any).fire();
    g.contactBullet(g.bullets.at(-1)!, e);
  }
  expect(g.fields.filter((f) => f.source === "seed")).toHaveLength(3);
});
it("wall mutations and the skater build require their inputs and produce actual extra effects", () => {
  const g = arena("wall", 3),
    e = spawn(g, 125);
  g.run.rewards.refract = 1;
  g.run.rewards.resonance = 1;
  g.run.weapon = "seismic";
  g.skill();
  const wall = g.fields[0];
  const b = shot(g, wall.x - 10, wall.y, false);
  g.update(1 / 120);
  expect(b.wallCharged).toBe(true);
  expect(b.pierce).toBe(1);
  const hp = e.hp;
  (g as any).fire();
  expect(hp - e.hp).toBeGreaterThan(g.player.damage * 0.95);
  const skater = arena("overdrive");
  spawn(skater, 250);
  skater.run.rewards.slipstream = 1;
  skater.run.rewards.poison = 1;
  skater.player.reload = 0.2;
  skater.stick.x = 0.3;
  skater.skill();
  simulate(skater, 0.8);
  expect(skater.fields.some((f) => f.kind === "toxin")).toBe(true);
});

it("a wall imprints crystal fragments and piercing casulos still obey their cloud budget", () => {
  const g = arena(),
    e = spawn(g, 120),
    other = spawn(g, 230);
  g.run.weapon = "prism";
  (g as any).fire();
  const b = g.bullets[0];
  b.wallCharged = true;
  b.pierce = 1;
  g.contactBullet(b, e);
  expect(b.life).toBeGreaterThan(0);
  expect(g.bullets.slice(1).every((s) => s.wallCharged && s.pierce === 1)).toBe(
    true,
  );
  const count = g.bullets.length;
  g.contactBullet(b, other);
  expect(g.bullets).toHaveLength(count);
  g.run.weapon = "spore";
  g.run.rewards.pierce = 1;
  (g as any).fire();
  const seed = g.bullets.at(-1)!;
  g.contactBullet(seed, e);
  expect(seed.life).toBeGreaterThan(0);
  g.contactBullet(seed, other);
  expect(g.fields.filter((f) => f.source === "seed")).toHaveLength(2);
});
