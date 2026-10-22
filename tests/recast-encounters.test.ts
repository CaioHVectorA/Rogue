import { beforeEach, expect, it, vi } from "vitest";
import { Game } from "../src/game/engine";
import {
  createRun,
  encounterByRoom,
  randomFromSeed,
  rewardOffers,
  roomComposition,
  SKILLS,
} from "../src/game/model";
import type { EnemyKind } from "../src/game/model";

beforeEach(() => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn() });
});
function arena(q = "recall") {
  const g = new Game();
  g.practice(5, 1, "fresh");
  g.labEquip(q, 0);
  g.intro = 0;
  g.spawnQueue = [{ kind: "guard", at: 9999, x: 50, y: 50 }];
  g.enemies = [];
  g.player.reload = 1000;
  g.player.charge = 0;
  g.player.invulnerable = 1000;
  return g;
}
function spawn(g: Game, kind: EnemyKind, dx = 300, dy = 0) {
  (g as any).spawn(kind, g.player.x + dx, g.player.y + dy);
  return g.enemies.at(-1)!;
}
function tick(g: Game, seconds: number) {
  for (let i = 0; i < Math.ceil(seconds * 120); i++) g.update(1 / 120);
}
function target(g: Game) {
  const e = spawn(g, "guard", 400);
  e.hp = e.maxHp = 10000;
  e.speed = 0;
  e.timer = 100;
  return e;
}
it("rune can stay for 15s, ignores a double tap and starts its cooldown only on return", () => {
  const g = arena(),
    origin = { x: g.player.x, y: g.player.y };
  g.player.hp = 40;
  g.skill();
  expect(g.recast?.field.life).toBe(15);
  g.player.x += 120;
  g.skill();
  expect(g.player.x).toBe(origin.x + 120);
  tick(g, 10);
  expect(g.player.x).toBe(origin.x + 120);
  expect(g.player.skillCd).toBe(0);
  g.skill();
  expect(g.player).toMatchObject({ ...origin, hp: 40, skillCd: 6.5 });
  expect(g.recast).toBeNull();
  g.skill();
  expect(g.recast).toBeNull();
});
it("rune expires automatically, freezes on pause and survives the persistent-field budget", () => {
  const g = arena();
  g.skill();
  const rune = g.recast!.field;
  for (let i = 0; i < 10; i++) (g as any).addField("toxin", { x: 80, y: 80 });
  expect(g.fields).toHaveLength(6);
  expect(g.fields).toContain(rune);
  g.player.x += 140;
  g.pause();
  tick(g, 20);
  expect(rune.life).toBe(15);
  g.skill();
  expect(g.player.x).toBe(rune.x + 140);
  g.pause();
  tick(g, 15.02);
  expect(g.player.x).toBe(rune.x);
  expect(g.recast).toBeNull();
  expect(g.player.skillCd).toBeGreaterThan(6.4);
});
it("spectral return echoes actual direct damage only, preserves lost life and cannot feed itself", () => {
  const g = arena("soulstep"),
    e = target(g),
    origin = g.player.x;
  g.skill();
  (g as any).hitEnemy(e, 80, false, "neutral");
  (g as any).hitEnemy(e, 40);
  (g as any).ultimateDamage = true;
  (g as any).hitEnemy(e, 40, false, "neutral");
  (g as any).ultimateDamage = false;
  expect(g.recast!.damage.get(e.id)).toBe(20);
  g.player.hp = 37;
  tick(g, 0.3);
  const hp = e.hp;
  g.skill();
  expect(e.hp).toBeCloseTo(hp - 20);
  expect(g.player.x).toBe(origin);
  expect(g.player.hp).toBe(37);
  expect(g.recast).toBeNull();
});
it("spectral echoes have a total energy cap, a six-target cap and ignore overkill", () => {
  const g = arena("soulstep");
  const enemies = Array.from({ length: 8 }, () => target(g));
  g.skill();
  for (const e of enemies) (g as any).hitEnemy(e, 20, false, "neutral");
  expect(g.recast!.damage.size).toBe(6);
  (g as any).hitEnemy(enemies[0], 100000, false, "neutral");
  expect(
    [...g.recast!.damage.values()].reduce((a, b) => a + b, 0),
  ).toBeLessThanOrEqual(g.player.damage * 6);
  const other = arena("soulstep"),
    weak = target(other);
  weak.hp = 2;
  other.skill();
  (other as any).hitEnemy(weak, 99999, false, "neutral");
  expect(other.recast!.damage.get(weak.id)).toBeCloseTo(0.5);
});
it("spectral return is automatic on timeout and a new run cancels armed objects", () => {
  const g = arena("soulstep"),
    origin = g.player.x;
  g.aim = { x: 1, y: 0 };
  g.skill();
  expect(g.player.x).not.toBe(origin);
  tick(g, 6.02);
  expect(g.player.x).toBe(origin);
  expect(g.recast).toBeNull();
  g.player.skillCd = 0;
  g.skill();
  g.start("ranger", "RESET");
  expect(g.recast).toBeNull();
  expect(g.fields).toHaveLength(0);
});
it("relay cuts the travelled segment once; an unused seal expires without teleporting", () => {
  const g = arena("relay"),
    e = target(g);
  g.skill();
  const end = { x: g.recast!.field.x, y: g.recast!.field.y };
  e.x = g.player.x + 150;
  tick(g, 0.3);
  const hp = e.hp;
  g.skill();
  expect(g.player.x).toBe(end.x);
  expect(e.hp).toBeCloseTo(hp - g.player.damage * 2);
  const next = arena("relay"),
    x = next.player.x;
  target(next);
  next.skill();
  tick(next, 5.1);
  expect(next.player.x).toBe(x);
  expect(next.recast).toBeNull();
});
it("mines can be detonated remotely after arming and never explode twice", () => {
  const g = arena("mine"),
    e = target(g);
  g.skill();
  tick(g, 0.5);
  e.x = g.player.x + 110;
  const hp = e.hp;
  g.skill();
  tick(g, 0.02);
  expect(e.hp).toBeCloseTo(hp - g.player.damage * 2.5);
  const after = e.hp;
  tick(g, 0.2);
  expect(e.hp).toBe(after);
  expect(g.recast).toBeNull();
  expect(g.player.skillCd).toBeGreaterThan(3.5);
});
it("proximity mines close their recast window and vortex implosions happen only once", () => {
  const mine = arena("mine"),
    e = target(mine);
  mine.skill();
  e.x = mine.player.x + 50;
  tick(mine, 0.6);
  expect(mine.recast).toBeNull();
  expect(mine.player.skillCd).toBeGreaterThan(0);
  const g = arena("vortex"),
    foe = target(g);
  g.skill();
  tick(g, 0.3);
  const hp = foe.hp;
  g.skill();
  expect(foe.hp).toBeCloseTo(hp - g.player.damage * 1.1);
  const after = foe.hp;
  tick(g, 0.1);
  expect(foe.hp).toBe(after);
});
it("later checkpoints guarantee a Q and prefer unseen abilities without breaking seed replay", () => {
  const run = createRun("VARIETY", "ranger");
  run.room = 2;
  const first = rewardOffers(run, randomFromSeed("FIRST"));
  run.offeredSkills = first.map((id) => id.slice(6));
  run.learnedSkills = [first[0].slice(6)];
  run.skills[0] = run.learnedSkills[0];
  for (const room of [5, 7, 10]) {
    run.room = room;
    const offers = rewardOffers(run, randomFromSeed(`${room}`));
    expect(offers.filter((id) => id.startsWith("skill:"))).toHaveLength(1);
    const id = offers.find((id) => id.startsWith("skill:"))!.slice(6);
    expect(run.offeredSkills).not.toContain(id);
    expect(offers).toEqual(rewardOffers(run, randomFromSeed(`${room}`)));
    run.offeredSkills.push(id);
  }
  const seen = new Set<string>();
  for (let i = 0; i < 150; i++) {
    const fresh = createRun(`${i}`, "ranger");
    fresh.room = 2;
    rewardOffers(fresh, randomFromSeed(`${i}`)).forEach((id) =>
      seen.add(id.slice(6)),
    );
  }
  expect(seen.size).toBe(SKILLS.length);
});
it("reroll history survives checkpoints but resets on a new run", () => {
  const g = arena();
  g.run.room = 2;
  (g as any).clearRoom();
  const first = [...g.run.offers];
  expect(g.run.offeredSkills).toEqual(first.map((id) => id.slice(6)));
  g.reroll();
  expect(g.run.offeredSkills).toHaveLength(6);
  expect(g.run.offers.some((id) => first.includes(id))).toBe(false);
  g.start("ranger", "RESET");
  expect(g.run.offeredSkills).toEqual([]);
});
it("precision encounters use fewer specialists, while horde rooms preserve area-build value", () => {
  for (const [precision, horde] of [
    [2, 3],
    [5, 6],
    [7, 6],
    [9, 10],
    [11, 10],
  ]) {
    expect(encounterByRoom(precision).type).toBe("PRECISÃO");
    expect(roomComposition(precision).length).toBeLessThan(
      roomComposition(horde).length * 0.6,
    );
    expect(roomComposition(precision)).toContain("duelist");
    expect(encounterByRoom(horde).type).toBe("HORDA");
  }
});
it("duelists telegraph a locked direction, miss a sidestep and recover before attacking again", () => {
  const g = arena(),
    e = spawn(g, "duelist", -200);
  e.timer = 0;
  g.update(1 / 120);
  expect(e.windup).toBeGreaterThan(0.7);
  const vx = e.dashVX,
    vy = e.dashVY;
  g.player.y += 150;
  tick(g, 0.6);
  expect(e.dashVX).toBe(vx);
  expect(e.dashVY).toBe(vy);
  tick(g, 0.6);
  expect(Math.abs(e.y - g.player.y)).toBeGreaterThan(100);
  expect(e.recovery).toBeGreaterThan(0);
  const x = e.x,
    y = e.y;
  tick(g, 0.15);
  expect(e.x).toBe(x);
  expect(e.y).toBe(y);
});
it("heralds command at most five bodies and their death interrupts the charge", () => {
  const g = arena(),
    herald = spawn(g, "herald", -270);
  herald.timer = 0;
  const allies = Array.from({ length: 8 }, (_, i) =>
    spawn(g, "chaser", -200, (i - 4) * 30),
  );
  const boss = spawn(g, "boss", -250, 120);
  g.update(1 / 120);
  const commanded = allies.filter((e) => e.commander === herald.id);
  expect(commanded).toHaveLength(5);
  expect(commanded.every((e) => e.windup > 0 && e.dashLeft > 0)).toBe(true);
  expect(boss.commander).toBeUndefined();
  herald.hp = 0;
  g.update(1 / 120);
  expect(
    commanded.every((e) => !e.commander && e.windup === 0 && e.dashLeft === 0),
  ).toBe(true);
});
it("weavers predict movement with delayed hazards and killing the caster cancels unfinished casts", () => {
  const g = arena(),
    e = spawn(g, "weaver", -300);
  e.timer = 0;
  g.stick.x = 1;
  g.update(1 / 120);
  expect(g.hazards).toHaveLength(2);
  expect(g.hazards[0].x).toBeGreaterThan(g.player.x + 90);
  expect(
    g.hazards.every((h) => h.delay > 1 && !h.fired && h.owner === e.id),
  ).toBe(true);
  const warnings = g.hazards.map((h) => ({ x: h.x, y: h.y }));
  g.stick = { x: 0, y: 1 };
  tick(g, 0.3);
  expect(g.hazards.map((h) => ({ x: h.x, y: h.y }))).toEqual(warnings);
  e.hp = 0;
  g.update(1 / 120);
  expect(g.hazards).toHaveLength(0);
});
it("relay catalyses prepared poison before repelling and return builds recycle the gun", () => {
  const g = arena("relay"),
    e = target(g);
  g.labSkillLevel(3);
  g.run.rewards.catalyst = g.run.rewards.returnflux = 1;
  g.skill();
  e.x = g.recast!.field.x + 35;
  e.y = g.recast!.field.y;
  e.venom = 3;
  e.poisoned = 3;
  tick(g, 0.3);
  g.skill();
  expect(e.venom).toBe(0);
  expect(g.run.reactions.catalysis).toBe(1);
  expect(g.player.skillCd).toBeCloseTo(5.3);
  expect(g.player.charge).toBe(g.fireInterval);
});
it("weaver hazards hurt a stationary hero after their warning and specialist kills pay more gold", () => {
  const g = arena(),
    e = spawn(g, "weaver", -300);
  e.timer = 0;
  g.player.invulnerable = 0;
  const hp = g.player.hp;
  tick(g, 1.2);
  expect(g.player.hp).toBe(hp - e.damage);
  (g as any).hitEnemy(e, 100000);
  g.update(1 / 120);
  expect(g.pickups.some((p) => p.value >= 3)).toBe(true);
});
