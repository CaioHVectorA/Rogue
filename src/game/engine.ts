import {
  WIDTH,
  HEIGHT,
  CLASSES,
  WEAPONS,
  weaponById,
  SKILLS,
  REWARDS,
  skillById,
  comboDrain,
  comboLootChance,
  TOTAL_ROOMS,
  createPlayer,
  createRun,
  randomFromSeed,
  roomComposition,
  rewardOffers,
  applyReward,
  advanceRoom,
  emptyRecords,
  finishRecords,
} from "./model";
import type {
  Field,
  WeaponId,
  Phase,
  ClassId,
  Player,
  Run,
  Enemy,
  EnemyKind,
  Bullet,
  Hazard,
  Pickup,
  RecordBook,
  Point,
} from "./model";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const RECORD_KEY = "rogue.records.v2";
export type Feedback = {
  toX?: number;
  toY?: number;
  type:
    | "burst"
    | "hit"
    | "kill"
    | "shot"
    | "skill"
    | "dash"
    | "clear"
    | "pickup"
    | "beam";
  x: number;
  y: number;
  color?: string;
  count?: number;
  speed?: number;
  value?: number;
  boss?: boolean;
  radius?: number;
};
export class Game {
  width = WIDTH;
  height = HEIGHT;
  phase: Phase = "menu";
  player: Player = createPlayer("ranger");
  run: Run = createRun("", "ranger");
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  hazards: Hazard[] = [];
  pickups: Pickup[] = [];
  fields: Field[] = [];
  rewardSlot: 0 | 1 = 0;
  labGod = false;
  labSpeed = 1;
  private lootRandom = randomFromSeed("loot");
  private hitClock = 0;
  private shotCount = 0;
  records: RecordBook = emptyRecords();
  keys = new Set<string>();
  stick = { x: 0, y: 0 };
  aim = { x: 0, y: -1 };
  random = randomFromSeed("rogue");
  roomTime = 0;
  intro = 0;
  spawnQueue: { kind: EnemyKind; at: number; x: number; y: number }[] = [];
  shake = 0;
  flash = 0;
  notice = "";
  noticeTime = 0;
  muted = false;
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  onChange: () => void = () => {};
  private nextId = 1;
  engineCollisions = false;
  session = 0;
  combo = 0;
  comboTimer = 0;
  peakCombo = 0;
  hitStop = 0;
  onFeedback: (event: Feedback) => void = () => {};
  onSound: (frequency: number, volume: number) => void = () => {};
  resumeSound: () => void = () => {};
  private chainQueue: Enemy[] = [];
  private offerRound = 0;
  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(RECORD_KEY) ?? "null");
      if (
        saved &&
        Number.isInteger(saved.runs) &&
        saved.runs >= 0 &&
        Number.isInteger(saved.wins) &&
        saved.wins >= 0 &&
        saved.wins <= saved.runs &&
        Number.isInteger(saved.bestRoom) &&
        saved.bestRoom >= 0 &&
        saved.bestRoom <= TOTAL_ROOMS &&
        (saved.bestTime === null ||
          (Number.isFinite(saved.bestTime) && saved.bestTime > 0))
      )
        this.records = saved;
      this.muted = localStorage.getItem("rogue.muted") === "true";
      const effects = localStorage.getItem("rogue.effects.v1");
      if (effects === "reduced") this.reducedMotion = true;
      if (effects === "full") this.reducedMotion = false;
    } catch {
      /* Storage is optional, including in private browsing. */
    }
  }
  start(classId: ClassId, seed: string) {
    this.resumeAudio();
    this.session++;
    this.combo = 0;
    this.comboTimer = 0;
    this.peakCombo = 0;
    this.labGod = false;
    this.labSpeed = 1;
    this.run = createRun(seed.slice(0, 40) || "rogue", classId);
    this.player = createPlayer(classId);
    this.random = randomFromSeed(this.run.seed);
    this.nextId = 1;
    this.keys.clear();
    this.stick = { x: 0, y: 0 };
    this.beginRoom();
  }
  private setPhase(phase: Phase) {
    this.phase = phase;
    this.keys.clear();
    this.stick = { x: 0, y: 0 };
    this.onChange();
  }
  resizeArena(width: number, height: number) {
    if (Math.abs(width - this.width) < 1 && Math.abs(height - this.height) < 1)
      return;
    // Never alter an active battlefield while the player is making a decision.
    if (this.phase === "combat") this.pause();
    const sx = width / this.width,
      sy = height / this.height;
    const points = [
      this.player,
      ...this.enemies,
      ...this.bullets,
      ...this.hazards,
      ...this.pickups,
      ...this.fields,
      ...this.spawnQueue,
    ];
    for (const point of points) {
      point.x *= sx;
      point.y *= sy;
    }
    this.width = width;
    this.height = height;
    this.player.x = clamp(this.player.x, 40, width - 40);
    this.player.y = clamp(this.player.y, 40, height - 40);
  }
  beginRoom() {
    this.enemies = [];
    this.bullets = [];
    this.hazards = [];
    this.pickups = [];
    this.chainQueue = [];
    this.fields = [];
    this.hitClock = 0;
    this.shotCount = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.roomTime = 0;
    this.intro = 1.5;
    this.offerRound = 0;
    this.lootRandom = randomFromSeed(`${this.run.seed}:loot:${this.run.room}`);
    this.random = randomFromSeed(`${this.run.seed}:encounter:${this.run.room}`);
    this.player.x = this.width / 2;
    this.player.y = this.height / 2;
    this.player.charge = this.fireInterval;
    this.player.skillCd = 0;
    this.player.secondCd = 0;
    this.player.shieldCd = 0;
    this.player.stationary = 0;
    this.player.dashCd = 0;
    this.player.invulnerable = 1.5;
    this.player.dashTime = 0;
    this.player.moving = false;
    this.spawnQueue = roomComposition(this.run.room).map((kind, i) => {
      const side = Math.floor(this.random() * 4);
      const offset =
        90 + this.random() * (side % 2 ? this.height - 180 : this.width - 180);
      return {
        kind,
        at: 1.5 + Math.floor(i / 10) * 1.1 + (i % 10) * 0.09,
        x:
          kind === "boss"
            ? this.width / 2
            : side === 1
              ? this.width - 65
              : side === 3
                ? 65
                : offset,
        y:
          kind === "boss"
            ? 150
            : side === 0
              ? 65
              : side === 2
                ? this.height - 65
                : offset,
      };
    });
    this.setPhase("combat");
  }
  pause() {
    if (this.phase === "combat") this.setPhase("paused");
    else if (this.phase === "paused") {
      this.resumeAudio();
      this.setPhase("combat");
    }
  }
  abandon() {
    if (!this.run.finished && this.phase !== "menu") this.finish(false);
  }
  menu() {
    this.setPhase("menu");
  }
  chooseReward(id: string) {
    if (this.phase !== "reward" || !this.run.offers.includes(id)) return;
    if (!applyReward(this.run, this.player, id, this.rewardSlot)) return;
    this.run.offers = [];
    this.sound(660, 0.12, "sine", 0.04);
    this.setPhase("camp");
  }
  reroll() {
    if (this.phase !== "reward" || this.run.rerolls <= 0) return;
    this.run.rerolls--;
    this.offerRound++;
    this.run.offers = rewardOffers(
      this.run,
      randomFromSeed(
        `${this.run.seed}:offers:${this.run.room}:${this.offerRound}`,
      ),
      this.run.offers,
    );
    this.onChange();
  }
  get healCost() {
    return 18 + (this.run.act - 1) * 7;
  }
  get forgeCost() {
    return 22 + this.run.purchases * 15;
  }
  buy(kind: "heal" | "forge") {
    if (this.phase !== "camp") return;
    const p = this.player;
    if (kind === "heal") {
      if (this.run.healed || this.run.gold < this.healCost || p.hp >= p.maxHp)
        return;
      this.run.gold -= this.healCost;
      this.run.healed = true;
      p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.4));
    } else {
      if (this.run.purchases >= 2 || this.run.gold < this.forgeCost) return;
      this.run.gold -= this.forgeCost;
      this.run.purchases++;
      p.damage *= 1.08;
    }
    this.sound(520, 0.1, "sine", 0.04);
    this.onChange();
  }
  nextRoom() {
    if (this.phase !== "camp") return;
    if (advanceRoom(this.run)) this.beginRoom();
  }
  skill(slot: 0 | 1 = 0) {
    const id = this.run.skills[slot];
    const p = this.player;
    if (
      !id ||
      this.phase !== "combat" ||
      this.intro > 0 ||
      (slot === 0 ? p.skillCd : p.secondCd) > 0
    )
      return;
    const definition = skillById(id);
    if (slot === 0) p.skillCd = definition.cooldown;
    else p.secondCd = definition.cooldown;
    if (this.run.rewards.echo) {
      if (slot === 0) p.secondCd = Math.max(0, p.secondCd - 1.3);
      else p.skillCd = Math.max(0, p.skillCd - 1.3);
    }
    const target = this.nearest() ?? {
      x: p.x + this.aim.x * 180,
      y: p.y + this.aim.y * 180,
    };
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    if (id === "volley") {
      for (let i = -3; i <= 3; i++)
        this.projectile(p, angle + i * 0.13, p.damage * 1.8, false, 2, 720);
    } else if (id === "nova" || id === "quake") {
      let hits = 0;
      const radius = id === "nova" ? 265 : 220;
      for (const enemy of [...this.enemies]) {
        if (distance(p, enemy) > radius + enemy.radius) continue;
        hits++;
        if (enemy.kind !== "boss") {
          const a = Math.atan2(enemy.y - p.y, enemy.x - p.x);
          enemy.x = clamp(enemy.x + Math.cos(a) * 85, 45, this.width - 45);
          enemy.y = clamp(enemy.y + Math.sin(a) * 85, 45, this.height - 45);
        }
        if (id === "nova") enemy.slowed = 2;
        this.hitEnemy(enemy, p.damage * (id === "quake" ? 3 : 2.6));
      }
      if (id === "quake")
        p.hp = Math.min(p.maxHp, p.hp + Math.min(12, hits * 3));
      else
        this.bullets = this.bullets.filter(
          (b) => !b.hostile || distance(b, p) > radius,
        );
    } else {
      const at = id === "vortex" || id === "storm" ? target : p;
      this.addField(id as Field["kind"], at);
      if (id === "decoy") p.invulnerable = Math.max(p.invulnerable, 0.5);
    }
    this.onFeedback({
      type: "skill",
      x: id === "vortex" || id === "storm" ? target.x : p.x,
      y: id === "vortex" || id === "storm" ? target.y : p.y,
      radius:
        id === "nova"
          ? 265
          : id === "quake"
            ? 220
            : id === "vortex"
              ? 185
              : id === "storm"
                ? 145
                : 100,
      color: definition.color,
    });
    this.shake = 4;
    this.sound(160, 0.22, "triangle", 0.06);
  }
  private addField(kind: Field["kind"], at: Point) {
    // One build cannot flood the scene with persistent objects.
    if (this.fields.length >= 6) this.fields.shift();
    const radii = {
      vortex: 185,
      storm: 145,
      turret: 30,
      mine: 150,
      orbit: 100,
      decoy: 120,
    };
    const lives = {
      vortex: 3,
      storm: 2.4,
      turret: 4,
      mine: 5,
      orbit: 3.2,
      decoy: 2.5,
    };
    this.fields.push({
      kind,
      x: clamp(at.x, 45, this.width - 45),
      y: clamp(at.y, 45, this.height - 45),
      radius: radii[kind],
      life: lives[kind],
      timer: kind === "mine" ? 0.45 : 0,
      power: this.player.damage,
    });
  }
  private updateFields(dt: number) {
    for (const field of this.fields) {
      field.life -= dt;
      field.timer -= dt;
      if (field.kind === "orbit") {
        field.x = this.player.x;
        field.y = this.player.y;
      }
      if (field.kind === "vortex") {
        for (const enemy of this.enemies) {
          const d = distance(enemy, field);
          if (d < field.radius && d > 15 && enemy.kind !== "boss") {
            enemy.x += ((field.x - enemy.x) / d) * 190 * dt;
            enemy.y += ((field.y - enemy.y) / d) * 190 * dt;
            enemy.slowed = Math.max(enemy.slowed, 0.2);
          }
        }
      }
      if (field.kind === "orbit")
        this.bullets = this.bullets.filter(
          (b) => !b.hostile || distance(b, field) > field.radius,
        );
      if (field.timer > 0) continue;
      if (field.kind === "turret") {
        const target = this.enemies
          .filter((e) => e.hp > 0)
          .sort((a, b) => distance(a, field) - distance(b, field))[0];
        if (target)
          this.projectile(
            field,
            Math.atan2(target.y - field.y, target.x - field.x),
            field.power * 0.8,
            false,
          );
        field.timer = 0.3;
      } else if (field.kind === "mine" || field.kind === "decoy") {
        const triggered =
          field.kind === "mine"
            ? this.enemies.some(
                (e) => e.hp > 0 && distance(e, field) < 75 + e.radius,
              ) || field.life <= 0
            : field.life <= 0;
        if (triggered) {
          for (const enemy of this.enemies)
            if (distance(enemy, field) < field.radius + enemy.radius)
              this.hitEnemy(enemy, field.power * 4, !!this.run.rewards.poison);
          this.onFeedback({
            type: "skill",
            x: field.x,
            y: field.y,
            radius: field.radius,
            color: "#ffbc8a",
          });
          this.burst(field, "#ffbc8a", 35, 180);
          field.life = 0;
        }
      } else {
        for (const enemy of this.enemies)
          if (distance(enemy, field) < field.radius + enemy.radius)
            this.hitEnemy(
              enemy,
              field.power *
                (field.kind === "storm"
                  ? 0.85
                  : field.kind === "orbit"
                    ? 0.65
                    : 0.35),
            );
        if (field.kind === "storm") this.burst(field, "#85d8ef", 8, 145);
        field.timer = field.kind === "storm" ? 0.4 : 0.35;
      }
    }
    this.fields = this.fields.filter((f) => f.life > 0);
  }
  dash() {
    if (this.phase !== "combat" || this.intro > 0 || this.player.dashCd > 0)
      return;
    const direction = this.direction();
    const length = Math.hypot(direction.x, direction.y);
    const p = this.player;
    p.dashX = length ? direction.x / length : this.aim.x;
    p.dashY = length ? direction.y / length : this.aim.y;
    p.dashTime = 0.18;
    p.invulnerable = Math.max(p.invulnerable, 0.28);
    p.dashCd = 2.6;
    if (this.run.rewards.speed) this.addField("mine", p);
    if (this.run.rewards.dashload) {
      p.charge = this.fireInterval;
      const angle = Math.atan2(-p.dashY, -p.dashX);
      for (const offset of [-0.2, 0, 0.2])
        this.projectile(p, angle + offset, p.damage, false);
    }
    this.onFeedback({
      type: "dash",
      x: p.x,
      y: p.y,
      color: CLASSES[this.run.classId].color,
    });
    this.sound(240, 0.06, "triangle", 0.025);
  }
  private direction() {
    return {
      x:
        Number(this.keys.has("d") || this.keys.has("arrowright")) -
        Number(this.keys.has("a") || this.keys.has("arrowleft")) +
        this.stick.x,
      y:
        Number(this.keys.has("s") || this.keys.has("arrowdown")) -
        Number(this.keys.has("w") || this.keys.has("arrowup")) +
        this.stick.y,
    };
  }
  private nearest() {
    return this.enemies.reduce<Enemy | null>(
      (best, e) =>
        !best || distance(e, this.player) < distance(best, this.player)
          ? e
          : best,
      null,
    );
  }
  private spawn(kind: EnemyKind, x: number, y: number) {
    const act = this.run.act;
    const stats = {
      chaser: [14, 88, 10, 14],
      runner: [10, 145, 8, 11],
      shooter: [30, 65, 12, 19],
      guard: [70, 57, 19, 27],
      boss: [1800 + (act - 1) * 1800, 42, 23, 66],
    }[kind];
    const hp = stats[0] * (kind === "boss" ? 1 : 1 + (act - 1) * 0.38);
    this.enemies.push({
      id: this.nextId++,
      kind,
      x,
      y,
      hp,
      maxHp: hp,
      speed: stats[1] * (1 + (act - 1) * 0.07),
      damage: stats[2] + (act - 1) * 3,
      radius: stats[3],
      timer: kind === "boss" ? 2.2 : 1.4 + this.random(),
      flash: 0,
      poisoned: 0,
      bossAct: act,
      cycle: 0,
      enraged: false,
      phase: 1,
      transition: 0,
      slowed: 0,
    });
    this.burst({ x, y }, "#8295a8", 12, 45);
  }
  private projectile(
    origin: Point,
    angle: number,
    damage: number,
    hostile: boolean,
    pierce = 0,
    speed = 600,
  ) {
    this.bullets.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      hostile,
      pierce,
      radius: hostile ? 6 : 4,
      life: hostile ? 7 : 2.3,
      hit: new Set(),
    });
  }
  get fireInterval() {
    return (this.player.reload * weaponById(this.run.weapon).interval) / 0.2;
  }
  equipWeapon(id: WeaponId) {
    if (this.phase !== "camp" || !this.run.weapons.includes(id)) return;
    this.run.weapon = id;
    this.player.charge = 0;
    this.onChange();
  }
  private fire(): boolean {
    const target = this.nearest();
    if (!target) return false;
    const p = this.player,
      weapon = weaponById(this.run.weapon);
    if (distance(p, target) > weapon.range + target.radius) return false;
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    this.shotCount++;
    if (weapon.pattern === "circle") {
      for (const enemy of this.enemies)
        if (distance(enemy, p) <= weapon.range + enemy.radius)
          this.hitEnemy(
            enemy,
            p.damage * weapon.power,
            !!this.run.rewards.poison,
          );
      this.onFeedback({
        type: "skill",
        x: p.x,
        y: p.y,
        radius: weapon.range,
        color: weapon.color,
      });
      this.shake = Math.max(this.shake, 2);
    } else if (weapon.pattern === "chain") {
      const hit = new Set<number>();
      let from: Point = p,
        next: Enemy | undefined = target;
      for (let i = 0; i < 3 && next; i++) {
        hit.add(next.id);
        this.onFeedback({
          type: "beam",
          x: from.x,
          y: from.y,
          toX: next.x,
          toY: next.y,
          color: weapon.color,
        });
        this.hitEnemy(
          next,
          p.damage * weapon.power * (i ? 0.8 : 1),
          !!this.run.rewards.poison,
        );
        from = next;
        next = this.enemies
          .filter((e) => e.hp > 0 && !hit.has(e.id) && distance(e, from) < 190)
          .sort((a, b) => distance(a, from) - distance(b, from))[0];
      }
    } else {
      const anchored =
        this.run.rewards.anchor &&
        p.stationary >= 1 &&
        this.shotCount % 3 === 0;
      const base =
        weapon.pattern === "cone"
          ? [-0.33, -0.22, -0.11, 0, 0.11, 0.22, 0.33]
          : [0];
      const double = !!this.run.rewards.double;
      const offsets = double ? base.flatMap((a) => [a - 0.05, a + 0.05]) : base;
      for (const offset of offsets) {
        const speed = this.run.weapon === "rail" ? 1100 : 820;
        this.projectile(
          p,
          angle + offset,
          p.damage * weapon.power * (double ? 0.75 : 1) * (anchored ? 3 : 1),
          false,
          anchored
            ? 6
            : (this.run.weapon === "rail" ? 4 : 0) +
                (this.run.rewards.pierce ? 2 : 0),
          speed,
        );
        const bullet = this.bullets[this.bullets.length - 1];
        bullet.life = weapon.range / speed;
        bullet.color = weapon.color;
        bullet.ricochets = this.run.weapon !== "shotgun";
      }
      if (this.run.rewards.crossfire)
        for (const offset of [Math.PI / 2, Math.PI, -Math.PI / 2]) {
          this.projectile(p, angle + offset, p.damage, false, 0, 820);
          const bullet = this.bullets[this.bullets.length - 1];
          bullet.life = weapon.range / 820;
          bullet.color = weapon.color;
          bullet.ricochets = this.run.weapon !== "shotgun";
        }
      this.onFeedback({ type: "shot", x: p.x, y: p.y, color: weapon.color });
    }
    this.burst(p, weapon.color, weapon.pattern === "cone" ? 10 : 3, 100);
    this.sound(
      weapon.pattern === "circle" ? 160 : 390,
      0.035,
      "triangle",
      0.018,
    );
    return true;
  }
  private hitEnemy(enemy: Enemy, damage: number, poison = false) {
    if (enemy.hp <= 0) return;
    if (enemy.kind === "boss") {
      if (enemy.transition > 0) return;
      const floor =
        enemy.phase < 4 ? enemy.maxHp * (1 - enemy.phase * 0.25) : -Infinity;
      enemy.hp = Math.max(floor, enemy.hp - damage);
      if (enemy.phase < 4 && enemy.hp <= floor) {
        enemy.phase++;
        enemy.enraged = true;
        enemy.transition = 1.2;
        enemy.timer = 1.3;
        this.bullets = this.bullets.filter((b) => !b.hostile);
        this.notice = `FASE ${["", "I", "II", "III", "IV"][enemy.phase]} · ${["", "", "CERCO", "RUPTURA", "COLAPSO"][enemy.phase]}`;
        this.noticeTime = 2.5;
        this.burst(enemy, "#ffbc8a", 50, 160);
        if (
          enemy.phase >= 3 &&
          this.enemies.filter((e) => e.kind !== "boss").length < 12
        ) {
          for (let i = 0; i < 3 + enemy.bossAct; i++)
            this.spawn(
              i % 2 ? "runner" : "chaser",
              i % 2 ? 65 : this.width - 65,
              80 + ((i * 97) % (this.height - 160)),
            );
        }
      }
    } else enemy.hp -= damage;
    if (damage >= 1) {
      if (this.hitClock <= 0) {
        this.combo = this.comboTimer > 0 ? this.combo + 1 : 1;
        this.comboTimer = 3.5;
        this.peakCombo = Math.max(this.peakCombo, this.combo);
        this.hitClock = 0.12;
      }
      this.onFeedback({
        type: "hit",
        x: enemy.x,
        y: enemy.y,
        value: Math.round(damage),
        color: enemy.poisoned > 0 ? "#b8ff62" : "#fff3cd",
      });
      this.burst(enemy, "#ffda8a", 5, 120);
    }
    enemy.flash = 0.12;
    if (poison) {
      enemy.poisoned = 3;
      enemy.slowed = Math.max(enemy.slowed, 0.6);
    }
    if (enemy.hp <= 0) this.chainQueue.push(enemy);
  }
  private resolveDeaths() {
    // Iterative queue avoids recursion and duplicate rewards in explosion chains.
    while (this.chainQueue.length) {
      const enemy = this.chainQueue.shift()!;
      if (!this.enemies.includes(enemy)) continue;
      this.enemies = this.enemies.filter((e) => e !== enemy);
      this.run.kills++;
      this.combo = this.comboTimer > 0 ? this.combo + 1 : 1;
      this.comboTimer = 3.5;
      this.peakCombo = Math.max(this.peakCombo, this.combo);
      this.onFeedback({
        type: "kill",
        x: enemy.x,
        y: enemy.y,
        boss: enemy.kind === "boss",
        value: this.combo,
      });
      this.hitStop = this.reducedMotion
        ? 0
        : Math.max(
            this.hitStop,
            enemy.kind === "boss"
              ? 0.13
              : enemy.kind === "guard"
                ? 0.035
                : 0.012,
          );
      this.shake = Math.max(this.shake, enemy.kind === "boss" ? 14 : 1.5);
      this.sound(
        enemy.kind === "boss" ? 95 : 560,
        0.1,
        "triangle",
        enemy.kind === "boss" ? 0.16 : 0.035,
      );
      if (enemy.kind === "boss") {
        // A guardian's fall collapses its remaining horde in a single chain.
        for (const other of this.enemies)
          if (other.hp > 0) this.hitEnemy(other, other.hp + 1);
      }
      if (enemy.kind === "boss") this.run.bosses++;
      const bonus =
        this.lootRandom() < comboLootChance(this.combo)
          ? this.run.rewards.gambit
            ? 3
            : 1
          : 0;
      const value =
        (enemy.kind === "boss" ? 35 : enemy.kind === "guard" ? 3 : 1) + bonus;
      if (bonus) this.burst(enemy, "#ffda8a", 8, 90);
      if (this.run.rewards.battery) {
        this.player.skillCd = Math.max(0, this.player.skillCd - 0.18);
        this.player.secondCd = Math.max(0, this.player.secondCd - 0.18);
      }
      this.pickups.push({ x: enemy.x, y: enemy.y, value, life: 0 });
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp +
          (this.run.rewards.vampire && distance(enemy, this.player) < 190
            ? 1
            : 0) *
            (enemy.kind === "boss" ? 10 : 2),
      );
      this.burst(
        enemy,
        enemy.kind === "boss" ? "#ffbc8a" : "#a4f6c1",
        enemy.kind === "boss" ? 130 : 18,
        enemy.kind === "boss" ? 360 : 200,
      );
      if (this.run.rewards.explosion) {
        this.burst(enemy, "#c5afff", 22, 130);
        for (const other of this.enemies)
          if (distance(enemy, other) < 130)
            this.hitEnemy(
              other,
              this.player.damage * 0.7,
              !!this.run.rewards.poison,
            );
      }
    }
  }
  private hurt(damage: number) {
    const p = this.player;
    if (p.invulnerable > 0 || this.phase !== "combat") return;
    if (this.labGod) return;
    if (this.run.rewards.armor && p.shieldCd <= 0) {
      p.shieldCd = 6;
      p.invulnerable = 0.5;
      for (const enemy of this.enemies)
        if (distance(enemy, p) < 180 && enemy.kind !== "boss") {
          const d = distance(enemy, p) || 1;
          enemy.x = clamp(
            enemy.x + ((enemy.x - p.x) / d) * 70,
            45,
            this.width - 45,
          );
          enemy.y = clamp(
            enemy.y + ((enemy.y - p.y) / d) * 70,
            45,
            this.height - 45,
          );
        }
      this.burst(p, "#85d8ef", 25, 180);
      return;
    }
    const actual = Math.max(1, Math.round(damage));
    if (this.run.rewards.gambit) {
      this.combo = 0;
      this.comboTimer = 0;
    } else this.comboTimer *= 0.45;
    if (this.run.rewards.thorns) {
      this.bullets = this.bullets.filter(
        (b) => !b.hostile || distance(b, p) > 200,
      );
      for (const enemy of this.enemies)
        if (distance(enemy, p) < 200) this.hitEnemy(enemy, p.damage * 2);
      this.burst(p, "#ffbc8a", 35, 200);
    }
    p.hp = Math.max(0, p.hp - actual);
    this.run.damageTaken += actual;
    p.invulnerable = 0.75;
    this.shake = 8;
    this.flash = 0.16;
    this.sound(80, 0.12, "sawtooth", 0.035);
    if (p.hp <= 0) this.finish(false);
  }
  private bossAttack(boss: Enemy) {
    boss.cycle++;
    // HP gates guarantee all four patterns; transitions clear bullets and announce the next phase.
    const phase = boss.phase;
    const enraged = phase >= 2;
    const act = boss.bossAct;
    const angle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
    if (boss.cycle % 2 === 1) {
      // Clearly separated radial lanes. Phase two rotates and adds projectiles.
      const count = 8 + act * 2 + (phase - 1) * 2;
      for (let i = 0; i < count; i++)
        this.projectile(
          boss,
          (i / count) * Math.PI * 2 + boss.cycle * 0.28,
          boss.damage,
          true,
          0,
          135 + act * 20 + (phase - 1) * 12,
        );
      if (act >= 2)
        for (let i = -1; i <= 1; i++)
          this.projectile(boss, angle + i * 0.18, boss.damage, true, 0, 225);
    } else {
      // Snapshot positions: warnings never follow the player after placement.
      this.hazards.push({
        x: this.player.x,
        y: this.player.y,
        radius: 75 + act * 7,
        delay: 1.1,
        life: 0.35,
        damage: boss.damage + 5,
        fired: false,
      });
      for (let i = 0; i < act + (enraged ? 1 : 0); i++) {
        this.hazards.push({
          x: 110 + this.random() * (this.width - 220),
          y: 110 + this.random() * (this.height - 220),
          radius: 65,
          delay: 1.3,
          life: 0.35,
          damage: boss.damage,
          fired: false,
        });
      }
      if (act === 3)
        for (let i = -2; i <= 2; i++)
          this.projectile(boss, angle + i * 0.27, boss.damage, true, 0, 190);
    }
    if (phase >= 3) {
      // Paired offset rings leave lanes; the final phase adds a delayed cross around a snapshot.
      for (let i = 0; i < 6; i++)
        this.projectile(
          boss,
          (i / 6) * Math.PI * 2 - boss.cycle * 0.22,
          boss.damage,
          true,
          0,
          110,
        );
    }
    if (phase === 4)
      for (const [dx, dy] of [
        [-110, 0],
        [110, 0],
        [0, -110],
        [0, 110],
      ])
        this.hazards.push({
          x: clamp(this.player.x + dx, 65, this.width - 65),
          y: clamp(this.player.y + dy, 65, this.height - 65),
          radius: 48,
          delay: 1.3,
          life: 0.3,
          damage: boss.damage,
          fired: false,
        });
    boss.timer = [0, 2.7, 2.2, 1.9, 1.6][phase];
    this.sound(110 + act * 20, 0.15, "sine", 0.035);
  }
  update(dt: number) {
    if (this.phase !== "combat") return;
    const p = this.player;
    this.comboTimer = Math.max(
      0,
      this.comboTimer - dt * comboDrain(this.combo, p.moving),
    );
    this.hitClock = Math.max(0, this.hitClock - dt);
    if (this.comboTimer === 0) this.combo = 0;
    this.roomTime += dt;
    this.run.elapsed += dt;
    this.intro = Math.max(0, this.intro - dt);
    this.shake = Math.max(0, this.shake - dt * 24);
    this.flash = Math.max(0, this.flash - dt);
    this.noticeTime = Math.max(0, this.noticeTime - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.skillCd = Math.max(0, p.skillCd - dt);
    p.secondCd = Math.max(0, p.secondCd - dt);
    p.shieldCd = Math.max(0, p.shieldCd - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    const direction = this.direction();
    const magnitude = Math.hypot(direction.x, direction.y);
    p.moving = magnitude > 0.12 || p.dashTime > 0;
    p.stationary = p.moving ? 0 : p.stationary + dt;
    if (magnitude > 0.12)
      this.aim = { x: direction.x / magnitude, y: direction.y / magnitude };
    if (p.dashTime > 0) {
      p.x += p.dashX * 850 * dt;
      p.y += p.dashY * 850 * dt;
      p.dashTime = Math.max(0, p.dashTime - dt);
      this.burst(p, CLASSES[this.run.classId].color, 1, 5);
    } else if (magnitude > 0.12) {
      p.x += (direction.x / Math.max(1, magnitude)) * p.speed * dt;
      p.y += (direction.y / Math.max(1, magnitude)) * p.speed * dt;
    }
    p.x = clamp(p.x, 40, this.width - 40);
    p.y = clamp(p.y, 40, this.height - 40);
    p.charge = Math.min(
      this.fireInterval,
      p.charge + dt * (p.moving ? 0.65 : 1),
    );
    if (
      !p.moving &&
      p.charge >= this.fireInterval &&
      this.enemies.length &&
      this.intro <= 0
    ) {
      if (this.fire()) p.charge = 0;
    }
    while (this.spawnQueue[0] && this.spawnQueue[0].at <= this.roomTime) {
      const spawn = this.spawnQueue.shift()!;
      this.spawn(spawn.kind, spawn.x, spawn.y);
    }
    this.updateFields(dt);
    for (const enemy of [...this.enemies]) {
      enemy.transition = Math.max(0, enemy.transition - dt);
      enemy.slowed = Math.max(0, enemy.slowed - dt);
      enemy.flash = Math.max(0, enemy.flash - dt);
      if (enemy.hp <= 0) continue;
      if (enemy.poisoned > 0) {
        enemy.poisoned -= dt;
        this.hitEnemy(enemy, (this.run.rewards.poison ?? 1) * 4 * dt);
      }
      const lure =
        enemy.kind !== "boss"
          ? this.fields.find((f) => f.kind === "decoy")
          : null;
      const destination = lure ?? p;
      const dist = distance(enemy, destination) || 1;
      const dx = (destination.x - enemy.x) / dist;
      const dy = (destination.y - enemy.y) / dist;
      const stop =
        enemy.kind === "shooter" ? 310 : enemy.kind === "boss" ? 240 : 0;
      if (dist > stop && enemy.transition <= 0) {
        const slow = enemy.slowed > 0 ? 0.35 : 1;
        enemy.x += dx * enemy.speed * dt * slow;
        enemy.y += dy * enemy.speed * dt * slow;
      }
      enemy.timer -= dt;
      if (enemy.kind === "shooter" && enemy.timer <= 0) {
        this.projectile(enemy, Math.atan2(dy, dx), enemy.damage, true, 0, 215);
        enemy.timer = 2.3;
      }
      if (enemy.kind === "boss" && enemy.timer <= 0 && enemy.transition <= 0)
        this.bossAttack(enemy);
      if (!this.engineCollisions && distance(enemy, p) < enemy.radius + 14)
        this.hurt(enemy.damage);
      if (this.phase !== "combat") return;
    }
    // Local spatial buckets keep separation bounded as hordes grow.
    const cells = new Map<string, Enemy[]>();
    for (const enemy of this.enemies) {
      const cx = Math.floor(enemy.x / 96),
        cy = Math.floor(enemy.y / 96);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          for (const other of cells.get(`${cx + dx},${cy + dy}`) ?? []) {
            const dist = distance(enemy, other) || 0.01;
            const overlap = enemy.radius + other.radius + 2 - dist;
            if (overlap <= 0) continue;
            const amount = Math.min(overlap / 2, 45 * dt);
            const nx = (enemy.x - other.x) / dist,
              ny = (enemy.y - other.y) / dist;
            enemy.x += nx * amount;
            enemy.y += ny * amount;
            other.x -= nx * amount;
            other.y -= ny * amount;
          }
        }
      const key = `${cx},${cy}`;
      const bucket = cells.get(key) ?? [];
      bucket.push(enemy);
      cells.set(key, bucket);
      enemy.x = clamp(
        enemy.x,
        enemy.radius + 25,
        this.width - enemy.radius - 25,
      );
      enemy.y = clamp(
        enemy.y,
        enemy.radius + 25,
        this.height - enemy.radius - 25,
      );
    }
    for (const bullet of this.bullets) {
      const oldX = bullet.x,
        oldY = bullet.y;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      if (this.engineCollisions) continue;
      // Headless fallback used by simulations without a Kaplay scene.
      const hits = (target: Point, radius: number) => {
        const dx = bullet.x - oldX,
          dy = bullet.y - oldY;
        const t = clamp(
          ((target.x - oldX) * dx + (target.y - oldY) * dy) /
            (dx * dx + dy * dy || 1),
          0,
          1,
        );
        return (
          Math.hypot(target.x - oldX - dx * t, target.y - oldY - dy * t) <
          radius + bullet.radius
        );
      };
      if (bullet.hostile) {
        if (hits(p, 13)) {
          this.hurt(bullet.damage);
          bullet.life = 0;
        }
      } else
        for (const enemy of this.enemies) {
          if (
            enemy.hp > 0 &&
            !bullet.hit.has(enemy.id) &&
            hits(enemy, enemy.radius)
          ) {
            this.contactBullet(bullet, enemy);
            if (bullet.life <= 0) break;
          }
        }
      if (this.phase !== "combat") return;
    }
    this.bullets = this.bullets.filter(
      (b) =>
        b.life > 0 &&
        b.x > 15 &&
        b.x < this.width - 15 &&
        b.y > 15 &&
        b.y < this.height - 15,
    );
    for (const hazard of this.hazards) {
      hazard.delay -= dt;
      if (hazard.delay <= 0) {
        hazard.fired = true;
        hazard.life -= dt;
        if (!this.engineCollisions && distance(hazard, p) < hazard.radius + 10)
          this.hurt(hazard.damage);
      }
      if (this.phase !== "combat") return;
    }
    this.hazards = this.hazards.filter((h) => h.life > 0);
    this.resolveDeaths();
    for (const pickup of this.pickups) {
      pickup.life += dt;
      const dist = distance(pickup, p);
      if (dist < 150 || pickup.life > 5) {
        pickup.x += (p.x - pickup.x) * Math.min(1, dt * 9);
        pickup.y += (p.y - pickup.y) * Math.min(1, dt * 9);
      }
      if (!this.engineCollisions && dist < 20) this.contactPickup(pickup);
    }
    this.pickups = this.pickups.filter((pickup) => pickup.value > 0);
    if (!this.enemies.length && !this.spawnQueue.length && this.roomTime > 2)
      this.clearRoom();
  }
  contactEnemy(enemy: Enemy) {
    if (this.phase === "combat" && enemy.hp > 0 && this.enemies.includes(enemy))
      this.hurt(enemy.damage);
  }
  contactBullet(bullet: Bullet, enemy?: Enemy) {
    if (
      this.phase !== "combat" ||
      bullet.life <= 0 ||
      !this.bullets.includes(bullet)
    )
      return;
    if (bullet.hostile) {
      this.hurt(bullet.damage);
      bullet.life = 0;
      return;
    }
    if (
      !enemy ||
      enemy.hp <= 0 ||
      !this.enemies.includes(enemy) ||
      bullet.hit.has(enemy.id)
    )
      return;
    bullet.hit.add(enemy.id);
    this.hitEnemy(enemy, bullet.damage, !!this.run.rewards.poison);
    if (
      this.run.rewards.ricochet &&
      bullet.ricochets !== false &&
      bullet.hit.size < 3
    ) {
      const next = this.enemies
        .filter(
          (e) => e.hp > 0 && !bullet.hit.has(e.id) && distance(e, enemy) < 240,
        )
        .sort((a, b) => distance(a, enemy) - distance(b, enemy))[0];
      if (next) {
        const angle = Math.atan2(next.y - enemy.y, next.x - enemy.x);
        bullet.vx = Math.cos(angle) * 600;
        bullet.vy = Math.sin(angle) * 600;
        bullet.x = enemy.x;
        bullet.y = enemy.y;
        bullet.life = 1;
        return;
      }
    }
    if (--bullet.pierce < 0) bullet.life = 0;
  }
  contactHazard(hazard: Hazard) {
    if (
      this.phase === "combat" &&
      hazard.fired &&
      hazard.life > 0 &&
      this.hazards.includes(hazard)
    )
      this.hurt(hazard.damage);
  }
  contactPickup(pickup: Pickup) {
    if (
      this.phase !== "combat" ||
      pickup.value <= 0 ||
      !this.pickups.includes(pickup)
    )
      return;
    this.run.gold += pickup.value;
    pickup.value = 0;
    this.onFeedback({ type: "pickup", x: this.player.x, y: this.player.y });
    this.sound(920, 0.05, "sine", 0.02);
  }
  private clearRoom() {
    this.onFeedback({
      type: "clear",
      x: this.player.x,
      y: this.player.y,
      boss: this.run.room % 4 === 0,
    });
    this.run.gold +=
      this.pickups.reduce((sum, drop) => sum + drop.value, 0) +
      8 +
      this.run.act * 2;
    this.pickups = [];
    this.bullets = [];
    this.hazards = [];
    this.fields = [];
    if (this.run.room === TOTAL_ROOMS) {
      this.finish(true);
      return;
    }
    if (this.run.room % 4 === 0) {
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + this.player.maxHp * 0.25,
      );
      this.run.rerolls++;
    }
    this.rewardSlot = !this.run.skills[0] ? 0 : !this.run.skills[1] ? 1 : 0;
    this.run.offers = rewardOffers(
      this.run,
      randomFromSeed(`${this.run.seed}:offers:${this.run.room}:0`),
    );
    this.sound(780, 0.2, "sine", 0.04);
    this.setPhase(this.run.offers.length ? "reward" : "camp");
  }
  private finish(won: boolean) {
    if (this.run.finished) return;
    this.run.finished = true;
    this.run.won = won;
    if (!this.run.practice)
      this.records = finishRecords(this.records, this.run);
    try {
      if (!this.run.practice)
        localStorage.setItem(RECORD_KEY, JSON.stringify(this.records));
    } catch {
      /* Play without persistence. */
    }
    this.setPhase("result");
  }
  /** Bounded practice presets are also available on Vercel; practice never writes records. */
  practice(
    room: number,
    phase = 1,
    build = "control",
    classId: ClassId = this.run.classId,
    state: "combat" | "reward" | "camp" | "result" = "combat",
  ) {
    if (
      !Number.isInteger(room) ||
      room < 1 ||
      room > TOTAL_ROOMS ||
      !Number.isInteger(phase) ||
      phase < 1 ||
      phase > 4 ||
      !CLASSES[classId]
    )
      return;
    this.start(classId, "LAB-CORE");
    this.run.practice = true;
    this.run.room = room;
    this.run.act = Math.ceil(room / 4);
    this.run.gold = 250;
    this.player.damage += (this.run.act - 1) * 6;
    const builds: Record<string, { skills: Run["skills"]; perks: string[] }> = {
      control: {
        skills: ["vortex", "storm"],
        perks: ["poison", "explosion", "echo"],
      },
      gunner: {
        skills: ["volley", "turret"],
        perks: ["anchor", "pierce", "ricochet"],
      },
      brawler: {
        skills: ["quake", "orbit"],
        perks: ["vampire", "armor", "thorns"],
      },
      trickster: {
        skills: ["decoy", "mine"],
        perks: ["speed", "dashload", "gambit"],
      },
      fresh: { skills: [null, null], perks: [] },
    };
    const preset = builds[build] ?? builds.control;
    this.run.skills = [...preset.skills];
    this.run.weapon =
      build === "brawler"
        ? "seismic"
        : build === "trickster"
          ? "shotgun"
          : "pulse";
    this.run.weapons = [...new Set<WeaponId>(["pulse", this.run.weapon])];
    for (const id of preset.perks) applyReward(this.run, this.player, id);
    this.beginRoom();
    if (room % 4 === 0) {
      this.spawnQueue = [];
      this.spawn("boss", this.width / 2, 150);
      const boss = this.enemies[0];
      boss.phase = phase;
      boss.hp = boss.maxHp * (1 - (phase - 1) * 0.25);
      boss.enraged = phase > 1;
    }
    if (state !== "combat") {
      this.enemies = [];
      this.bullets = [];
      this.hazards = [];
      this.pickups = [];
      this.fields = [];
      this.spawnQueue = [];
      if (state === "reward") {
        this.rewardSlot = 0;
        this.run.offers = rewardOffers(this.run, randomFromSeed("LAB-OFFERS"));
        this.setPhase("reward");
      } else if (state === "result") this.finish(false);
      else this.setPhase("camp");
    }
    this.onChange();
  }
  labWeapon(id: string) {
    if (!this.run.practice || !WEAPONS.some((w) => w.id === id)) return;
    this.run.weapon = id as WeaponId;
    if (!this.run.weapons.includes(id as WeaponId))
      this.run.weapons.push(id as WeaponId);
    this.player.charge = 0;
    this.onChange();
  }
  labEquip(id: string, slot: 0 | 1) {
    if (
      !this.run.practice ||
      (id !== "" && !SKILLS.some((s) => s.id === id)) ||
      (id !== "" && this.run.skills[1 - slot] === id)
    )
      return;
    this.run.skills[slot] = id || null;
    this.player.skillCd = this.player.secondCd = 0;
    this.fields = [];
    this.onChange();
  }
  labPerk(id: string) {
    if (
      this.run.practice &&
      REWARDS.some(
        (r) =>
          r.id === id && !id.startsWith("skill:") && !id.startsWith("weapon:"),
      )
    ) {
      applyReward(this.run, this.player, id);
      this.onChange();
    }
  }
  labClear() {
    if (!this.run.practice || this.phase !== "combat") return;
    this.spawnQueue = [];
    for (const enemy of [...this.enemies]) {
      enemy.hp = 0;
      this.chainQueue.push(enemy);
    }
    this.resolveDeaths();
    this.roomTime = Math.max(3, this.roomTime);
    this.clearRoom();
  }
  burst(origin: Point, color: string, count: number, speed: number) {
    this.onFeedback({
      type: "burst",
      x: origin.x,
      y: origin.y,
      color,
      count: this.reducedMotion ? Math.min(count, 3) : count,
      speed,
    });
  }
  toggleEffects() {
    this.reducedMotion = !this.reducedMotion;
    try {
      localStorage.setItem(
        "rogue.effects.v1",
        this.reducedMotion ? "reduced" : "full",
      );
    } catch {
      /* Optional. */
    }
    this.onChange();
  }
  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem("rogue.muted", String(this.muted));
    } catch {
      /* Optional. */
    }
    this.onChange();
  }
  private resumeAudio() {
    this.resumeSound();
  }
  private sound(
    frequency: number,
    _duration: number,
    _type: OscillatorType,
    volume: number,
  ) {
    if (!this.muted) this.onSound(frequency, volume);
  }
}
