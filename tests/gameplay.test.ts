import { beforeEach, describe, expect, it, vi } from "vitest";
import { Game } from "../src/game/engine";
import {
  applyReward,
  comboDrain,
  comboLootChance,
  rewardOffers,
  randomFromSeed,
  SKILLS,
  RECASTS,
} from "../src/game/model";

beforeEach(() => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  });
});
function arena() {
  const g = new Game();
  g.start("ranger", "MECHANICS");
  g.run.skills = ["volley", null];
  g.spawnQueue = [];
  g.roomTime = 0;
  g.intro = 0;
  g.player.invulnerable = 1000;
  g.player.reload = 100;
  g.player.charge = 0;
  (g as any).spawn("guard", g.player.x + 75, g.player.y);
  const enemy = g.enemies[0];
  enemy.hp = enemy.maxHp = 10000;
  enemy.speed = 0;
  return { g, enemy };
}
function simulate(g: Game, seconds: number) {
  for (let i = 0; i < seconds * 120; i++) g.update(1 / 120);
}

describe("playstyle mechanics", () => {
  it("drafts a relic, Q, a weapon and a late ultimate", () => {
    const { g } = arena();
    for (const room of [1, 2, 3, 4, 8, 11]) {
      g.run.room = room;
      const offers = rewardOffers(g.run, randomFromSeed(`draft:${room}`));
      expect(offers).toHaveLength(3);
      expect(
        offers.every((id) => id.startsWith("skill:") === (room === 2)),
      ).toBe(true);
      expect(offers).not.toContain(`skill:${g.run.skills[0]}`);
    }
    expect(applyReward(g.run, g.player, "skill:storm")).toBe(true);
    expect(g.run.skills).toEqual(["storm", null]);
    expect(applyReward(g.run, g.player, "skill:storm")).toBe(false);
  });
  for (const skill of SKILLS)
    it(`${skill.id} has a real combat effect and an independent short cooldown`, () => {
      const { g, enemy } = arena();
      g.run.skills = [skill.id, null];
      g.skill();
      expect(g.player.skillCd).toBe(RECASTS[skill.id] ? 0 : skill.cooldown);
      expect(g.player.secondCd).toBe(0);
      const objects = g.bullets.length + g.fields.length;
      g.skill();
      expect(g.bullets.length + g.fields.length).toBe(objects);
      if (RECASTS[skill.id]) {
        simulate(g, 0.6);
        g.skill();
      }
      simulate(g, 3.5);
      if (
        ![
          "wall",
          "aegis",
          "overdrive",
          "stasis",
          "recall",
          "soulstep",
        ].includes(skill.id)
      )
        expect(enemy.hp).toBeLessThan(enemy.maxHp);
      else
        expect(objects + Number(skill.id === "overdrive")).toBeGreaterThan(0);
      expect(g.player.skillCd).toBeLessThan(skill.cooldown);
      if (skill.id === "vortex")
        expect(enemy.x).toBeLessThan(g.player.x + 75 + 1);
    });
  it("combines ricochet, toxin and dash traps without repeating a hit", () => {
    const { g, enemy } = arena();
    for (const id of ["ricochet", "poison", "speed", "dashload"])
      applyReward(g.run, g.player, id);
    (g as any).spawn("guard", enemy.x + 100, enemy.y);
    const other = g.enemies[1];
    g.skill();
    const bullet = g.bullets[3];
    g.contactBullet(bullet, enemy);
    const hp = enemy.hp;
    g.contactBullet(bullet, enemy);
    expect(enemy.hp).toBe(hp);
    expect(bullet.life).toBeGreaterThan(0);
    expect(enemy.poisoned).toBe(3);
    expect(enemy.venom).toBe(1);
    g.contactBullet(bullet, other);
    expect(bullet.hit.size).toBe(2);
    const shots = g.bullets.length;
    g.dash();
    expect(g.bullets.length).toBe(shots + 2);
    expect(g.fields[0].kind).toBe("mine");
    expect(g.player.charge).toBe(g.player.reload);
  });
  it("makes alternating skills and nearby kills feed a build", () => {
    const { g, enemy } = arena();
    g.run.skills = ["nova", "tempest"];
    g.run.ultimateCharge = 100;
    for (const id of ["echo", "battery", "vampire"])
      applyReward(g.run, g.player, id);
    g.player.hp = 50;
    g.skill(0);
    expect(g.player.skillCd).toBeGreaterThan(0);
    g.skill(1);
    expect(g.player.skillCd).toBe(0);
    g.skill(0);
    const cd = g.player.skillCd;
    enemy.x = g.player.x + 100;
    (g as any).hitEnemy(enemy, 100000);
    (g as any).resolveDeaths();
    expect(g.player.skillCd).toBeLessThan(cd);
    expect(g.player.hp).toBe(51);
  });
  it("shield blocks once, then needs to reconstruct; damage breaks a gold gamble", () => {
    const { g, enemy } = arena();
    applyReward(g.run, g.player, "armor");
    g.player.invulnerable = 0;
    const hp = g.player.hp;
    g.contactEnemy(enemy);
    expect(g.player.hp).toBe(hp);
    expect(g.player.shieldCd).toBe(8);
    g.player.invulnerable = 0;
    g.contactEnemy(enemy);
    expect(g.player.hp).toBeLessThan(hp);
    applyReward(g.run, g.player, "gambit");
    g.combo = 40;
    g.comboTimer = 3.5;
    g.player.invulnerable = 0;
    g.contactEnemy(enemy);
    expect(g.combo).toBe(0);
  });
  it("high combo and moving drain faster, while extra gold stays capped and seeded", () => {
    expect(comboDrain(40, false)).toBeGreaterThan(comboDrain(4, false));
    expect(comboDrain(40, true)).toBeGreaterThan(comboDrain(40, false));
    expect(comboLootChance(0)).toBe(0);
    expect(comboLootChance(40)).toBeGreaterThan(comboLootChance(4));
    expect(comboLootChance(10000)).toBe(0.4);
    const drops = (combo: number) => {
      const { g } = arena();
      g.enemies = [];
      const result: number[] = [];
      for (let i = 0; i < 100; i++) {
        g.combo = combo;
        g.comboTimer = 3.5;
        (g as any).spawn("chaser", 100, 100);
        (g as any).hitEnemy(g.enemies[0], 100000);
        (g as any).resolveDeaths();
        result.push(g.pickups.pop()!.value);
      }
      return result;
    };
    const high = drops(40);
    expect(high).toEqual(drops(40));
    expect(high.reduce((a, b) => a + b, 0)).toBeGreaterThan(
      drops(0).reduce((a, b) => a + b, 0),
    );
    expect(high.every((n) => n === 1 || n === 2)).toBe(true);
  });
  it("boss gates preserve all four phases and add distinct late patterns", () => {
    const { g } = arena();
    g.enemies = [];
    g.run.act = 3;
    (g as any).spawn("boss", 600, 150);
    const boss = g.enemies[0];
    const counts: number[] = [];
    for (let phase = 1; phase <= 4; phase++) {
      expect(boss.phase).toBe(phase);
      boss.cycle = 0;
      g.bullets = [];
      g.hazards = [];
      (g as any).bossAttack(boss);
      counts.push(g.bullets.length);
      (g as any).hitEnemy(boss, 100000);
      if (phase < 4) {
        expect(boss.hp).toBe(boss.maxHp * (1 - phase * 0.25));
        const hp = boss.hp;
        (g as any).hitEnemy(boss, 100000);
        expect(boss.hp).toBe(hp);
        expect(boss.transition).toBeGreaterThan(0);
        boss.transition = 0;
      }
    }
    expect(counts[2]).toBeGreaterThan(counts[1]);
    expect(g.hazards).toHaveLength(4);
    expect(boss.hp).toBeLessThanOrEqual(0);
  });
  it("practice presets select states, bound effects, freeze on pause and never write records", () => {
    const g = new Game();
    g.practice(12, 4, "control", "arcanist");
    expect(g.enemies[0].phase).toBe(4);
    expect(g.run.skills).toEqual(["vortex", "tempest"]);
    g.labEquip("storm", 0);
    g.intro = 0;
    for (let i = 0; i < 10; i++) {
      g.player.skillCd = 0;
      g.skill();
    }
    expect(g.fields).toHaveLength(6);
    g.pause();
    const life = g.fields[0].life;
    g.update(1);
    expect(g.fields[0].life).toBe(life);
    g.pause();
    g.labClear();
    expect(g.phase).toBe("result");
    expect(g.records.runs).toBe(0);
    expect(localStorage.getItem("rogue.records.v2")).toBeNull();
    g.practice(3, 1, "gunner", "ranger", "reward");
    expect(g.phase).toBe("reward");
    expect(g.run.offers).toHaveLength(3);
    g.practice(4, 1, "gunner", "ranger", "camp");
    expect(g.phase).toBe("camp");
    g.start("ranger", "NORMAL");
    expect(g.run.practice).toBe(false);
    expect(g.run.rewards).toEqual({});
    g.labPerk("ricochet");
    expect(g.run.rewards).toEqual({});
  });
});
