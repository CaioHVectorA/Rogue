import {
  WIDTH,
  HEIGHT,
  CLASSES,
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
  Phase,
  ClassId,
  Player,
  Run,
  Enemy,
  EnemyKind,
  Bullet,
  Hazard,
  Particle,
  Pickup,
  RecordBook,
  Point,
} from "./model";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const RECORD_KEY = "rogue.records.v2";
export class Game {
  phase: Phase = "menu";
  player: Player = createPlayer("ranger");
  run: Run = createRun("", "ranger");
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  hazards: Hazard[] = [];
  particles: Particle[] = [];
  pickups: Pickup[] = [];
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
  private audio: AudioContext | null = null;
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
    } catch {
      /* Storage is optional, including in private browsing. */
    }
  }
  start(classId: ClassId, seed: string) {
    this.resumeAudio();
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
  beginRoom() {
    this.enemies = [];
    this.bullets = [];
    this.hazards = [];
    this.particles = [];
    this.pickups = [];
    this.chainQueue = [];
    this.roomTime = 0;
    this.intro = 1.5;
    this.offerRound = 0;
    this.random = randomFromSeed(`${this.run.seed}:encounter:${this.run.room}`);
    this.player.x = WIDTH / 2;
    this.player.y = HEIGHT / 2;
    this.player.charge = this.player.reload;
    this.player.skillCd = 0;
    this.player.dashCd = 0;
    this.player.invulnerable = 1.5;
    this.player.dashTime = 0;
    this.player.moving = false;
    this.spawnQueue = roomComposition(this.run.room).map((kind, i) => {
      const side = Math.floor(this.random() * 4);
      const offset =
        90 + this.random() * (side % 2 ? HEIGHT - 180 : WIDTH - 180);
      return {
        kind,
        at: 1.5 + i * 0.32,
        x:
          kind === "boss"
            ? WIDTH / 2
            : side === 1
              ? WIDTH - 65
              : side === 3
                ? 65
                : offset,
        y:
          kind === "boss"
            ? 150
            : side === 0
              ? 65
              : side === 2
                ? HEIGHT - 65
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
    if (!applyReward(this.run, this.player, id)) return;
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
  skill() {
    if (this.phase !== "combat" || this.intro > 0 || this.player.skillCd > 0)
      return;
    const p = this.player;
    const power = 1 + (this.run.rewards.cast ?? 0) * 0.3;
    const skillDamage = CLASSES[this.run.classId].damage * power;
    p.skillCd =
      CLASSES[this.run.classId].cooldown *
      Math.pow(0.82, this.run.rewards.haste ?? 0);
    if (this.run.classId === "ranger") {
      const target = this.nearest();
      const angle = target
        ? Math.atan2(target.y - p.y, target.x - p.x)
        : Math.atan2(this.aim.y, this.aim.x);
      for (let i = -3; i <= 3; i++)
        this.projectile(p, angle + i * 0.13, skillDamage * 1.8, false, 2, 720);
    } else {
      const radius = this.run.classId === "colossus" ? 220 : 265;
      let hits = 0;
      for (const enemy of [...this.enemies]) {
        if (distance(p, enemy) < radius + enemy.radius) {
          hits++;
          const angle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
          if (enemy.kind !== "boss") {
            enemy.x = clamp(enemy.x + Math.cos(angle) * 85, 45, WIDTH - 45);
            enemy.y = clamp(enemy.y + Math.sin(angle) * 85, 45, HEIGHT - 45);
          }
          this.hitEnemy(
            enemy,
            skillDamage * (this.run.classId === "colossus" ? 3 : 2.6),
          );
        }
      }
      if (this.run.classId === "colossus")
        p.hp = Math.min(p.maxHp, p.hp + Math.min(12, hits * 3));
      this.burst(p, CLASSES[this.run.classId].color, 40, radius);
    }
    this.shake = 5;
    this.sound(160, 0.22, "triangle", 0.06);
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
    p.dashCd = 3 * Math.pow(0.85, this.run.rewards.speed ?? 0);
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
      chaser: [32, 100, 13, 15],
      runner: [22, 155, 10, 11],
      shooter: [38, 65, 12, 16],
      guard: [90, 57, 19, 23],
      boss: [640 + (act - 1) * 450, 42, 23, 45],
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
  private fire() {
    const target = this.nearest();
    if (!target) return;
    const p = this.player;
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    const double = this.run.rewards.double;
    for (const offset of double ? [-0.07, 0.07] : [0]) {
      this.projectile(
        p,
        angle + offset,
        p.damage * (double ? 0.75 : 1),
        false,
        this.run.rewards.pierce ?? 0,
      );
    }
    this.burst(p, CLASSES[this.run.classId].color, 3, 30);
    this.sound(390, 0.035, "triangle", 0.018);
  }
  private hitEnemy(enemy: Enemy, damage: number, poison = false) {
    if (enemy.hp <= 0) return;
    enemy.hp -= damage;
    enemy.flash = 0.12;
    if (poison) enemy.poisoned = 3;
    if (enemy.hp <= 0) this.chainQueue.push(enemy);
  }
  private resolveDeaths() {
    // Iterative queue avoids recursion and duplicate rewards in explosion chains.
    while (this.chainQueue.length) {
      const enemy = this.chainQueue.shift()!;
      if (!this.enemies.includes(enemy)) continue;
      this.enemies = this.enemies.filter((e) => e !== enemy);
      this.run.kills++;
      if (enemy.kind === "boss") this.run.bosses++;
      const value = enemy.kind === "boss" ? 35 : enemy.kind === "guard" ? 5 : 3;
      this.pickups.push({ x: enemy.x, y: enemy.y, value, life: 0 });
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp +
          (this.run.rewards.vampire ?? 0) * (enemy.kind === "boss" ? 10 : 1),
      );
      this.burst(
        enemy,
        enemy.kind === "boss" ? "#ffbc8a" : "#a4f6c1",
        enemy.kind === "boss" ? 55 : 10,
        90,
      );
      if (enemy.poisoned > 0 && this.run.rewards.explosion) {
        this.burst(enemy, "#c5afff", 22, 130);
        for (const other of this.enemies)
          if (distance(enemy, other) < 130)
            this.hitEnemy(other, this.player.damage * 0.7, true);
      }
    }
  }
  private hurt(damage: number) {
    const p = this.player;
    if (p.invulnerable > 0 || this.phase !== "combat") return;
    const actual = Math.max(
      1,
      Math.round(
        damage * (1 - Math.min(0.3, (this.run.rewards.armor ?? 0) * 0.1)),
      ),
    );
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
    const enraged = boss.hp <= boss.maxHp * 0.5;
    if (enraged && !boss.enraged) {
      boss.enraged = true;
      this.notice = "FASE II · O ritmo mudou";
      this.noticeTime = 2.5;
      this.burst(boss, "#ffbc8a", 35, 130);
    }
    const act = boss.bossAct;
    const angle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
    if (boss.cycle % 2 === 1) {
      // Clearly separated radial lanes. Phase two rotates and adds projectiles.
      const count = 8 + act * 2 + (enraged ? 4 : 0);
      for (let i = 0; i < count; i++)
        this.projectile(
          boss,
          (i / count) * Math.PI * 2 + boss.cycle * 0.28,
          boss.damage,
          true,
          0,
          135 + act * 20,
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
          x: 110 + this.random() * (WIDTH - 220),
          y: 110 + this.random() * (HEIGHT - 220),
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
    boss.timer = enraged ? 1.8 : 2.7;
    this.sound(110 + act * 20, 0.15, "sine", 0.035);
  }
  update(dt: number) {
    if (this.phase !== "combat") return;
    const p = this.player;
    this.roomTime += dt;
    this.run.elapsed += dt;
    this.intro = Math.max(0, this.intro - dt);
    this.shake = Math.max(0, this.shake - dt * 24);
    this.flash = Math.max(0, this.flash - dt);
    this.noticeTime = Math.max(0, this.noticeTime - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.skillCd = Math.max(0, p.skillCd - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    const direction = this.direction();
    const magnitude = Math.hypot(direction.x, direction.y);
    p.moving = magnitude > 0.12 || p.dashTime > 0;
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
    p.x = clamp(p.x, 40, WIDTH - 40);
    p.y = clamp(p.y, 40, HEIGHT - 40);
    p.charge = Math.min(p.reload, p.charge + dt * (p.moving ? 0.65 : 1));
    if (
      !p.moving &&
      p.charge >= p.reload &&
      this.enemies.length &&
      this.intro <= 0
    ) {
      this.fire();
      p.charge = 0;
    }
    while (this.spawnQueue[0] && this.spawnQueue[0].at <= this.roomTime) {
      const spawn = this.spawnQueue.shift()!;
      this.spawn(spawn.kind, spawn.x, spawn.y);
    }
    for (const enemy of this.enemies) {
      enemy.flash = Math.max(0, enemy.flash - dt);
      if (enemy.hp <= 0) continue;
      if (enemy.poisoned > 0) {
        enemy.poisoned -= dt;
        this.hitEnemy(enemy, (this.run.rewards.poison ?? 1) * 4 * dt);
      }
      const dist = distance(enemy, p) || 1;
      const dx = (p.x - enemy.x) / dist;
      const dy = (p.y - enemy.y) / dist;
      const stop =
        enemy.kind === "shooter" ? 310 : enemy.kind === "boss" ? 240 : 0;
      if (dist > stop) {
        enemy.x += dx * enemy.speed * dt;
        enemy.y += dy * enemy.speed * dt;
      }
      enemy.timer -= dt;
      if (enemy.kind === "shooter" && enemy.timer <= 0) {
        this.projectile(enemy, Math.atan2(dy, dx), enemy.damage, true, 0, 215);
        enemy.timer = 2.3;
      }
      if (enemy.kind === "boss" && enemy.timer <= 0) this.bossAttack(enemy);
      if (dist < enemy.radius + 14) this.hurt(enemy.damage);
      if (this.phase !== "combat") return;
    }
    // Soft separation keeps enemy groups readable without quadratic physics machinery.
    for (let i = 0; i < this.enemies.length; i++)
      for (let j = i + 1; j < this.enemies.length; j++) {
        const a = this.enemies[i],
          b = this.enemies[j];
        const dist = distance(a, b) || 0.01;
        const overlap = a.radius + b.radius + 3 - dist;
        if (overlap > 0) {
          const amount = Math.min(overlap / 2, 45 * dt);
          const dx = (a.x - b.x) / dist,
            dy = (a.y - b.y) / dist;
          a.x += dx * amount;
          a.y += dy * amount;
          b.x -= dx * amount;
          b.y -= dy * amount;
        }
      }
    for (const bullet of this.bullets) {
      const oldX = bullet.x,
        oldY = bullet.y;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      // Swept segment collision prevents high-speed bullets tunnelling through targets.
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
            bullet.hit.add(enemy.id);
            this.hitEnemy(enemy, bullet.damage, !!this.run.rewards.poison);
            bullet.pierce--;
            if (bullet.pierce < 0) {
              bullet.life = 0;
              break;
            }
          }
        }
      if (this.phase !== "combat") return;
    }
    this.bullets = this.bullets.filter(
      (b) =>
        b.life > 0 &&
        b.x > 15 &&
        b.x < WIDTH - 15 &&
        b.y > 15 &&
        b.y < HEIGHT - 15,
    );
    for (const hazard of this.hazards) {
      hazard.delay -= dt;
      if (hazard.delay <= 0) {
        hazard.fired = true;
        hazard.life -= dt;
        if (distance(hazard, p) < hazard.radius + 10) this.hurt(hazard.damage);
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
      if (dist < 20) {
        this.run.gold += pickup.value;
        pickup.value = 0;
      }
    }
    this.pickups = this.pickups.filter((pickup) => pickup.value > 0);
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
    if (!this.enemies.length && !this.spawnQueue.length && this.roomTime > 2)
      this.clearRoom();
  }
  private clearRoom() {
    this.run.gold +=
      this.pickups.reduce((sum, drop) => sum + drop.value, 0) +
      8 +
      this.run.act * 2;
    this.pickups = [];
    this.bullets = [];
    this.hazards = [];
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
    this.records = finishRecords(this.records, this.run);
    try {
      localStorage.setItem(RECORD_KEY, JSON.stringify(this.records));
    } catch {
      /* Play without persistence. */
    }
    this.setPhase("result");
  }
  burst(origin: Point, color: string, count: number, speed: number) {
    if (this.reducedMotion) count = Math.min(count, 3);
    for (let i = 0; i < count && this.particles.length < 350; i++) {
      // Cosmetic randomness is deliberately separate from the run seed.
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * speed;
      const life = 0.2 + Math.random() * 0.35;
      this.particles.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        color,
        radius: 1 + Math.random() * 3,
      });
    }
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
    try {
      this.audio ??= new AudioContext();
      void this.audio.resume().catch(() => {});
    } catch {
      /* Audio is optional. */
    }
  }
  private sound(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ) {
    if (this.muted || !this.audio || this.audio.state !== "running") return;
    const oscillator = this.audio.createOscillator();
    const gain = this.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.audio.currentTime + duration,
    );
    oscillator.connect(gain);
    gain.connect(this.audio.destination);
    oscillator.start();
    oscillator.stop(this.audio.currentTime + duration);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}
