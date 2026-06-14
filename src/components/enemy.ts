import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { speed } from "./speed";
import { movimentable } from "./movimentable";
import { spawnGoldDrop } from "./gold";
import { Enemies, ENEMY_PRESETS } from "./enemies";
import {
  applyGreenBehavior,
  applyRedBehavior,
  applyPurpleBehavior,
  applySmartBehavior,
  applySpinnerBehavior,
  applySummonerBehavior,
  applyRegenBehavior,
  applyColossusBehavior,
  applyConeShooterBehavior,
  applyBerserkerBehavior,
  applyShieldGuardBehavior,
  applyChargerBehavior,
  applyPhantomBehavior,
  applyNinjaBehavior,
  applyDetonatorBehavior,
  applyVampireBehavior,
  applyIllusionistBehavior,
  applyTrapperBehavior,
} from "./behaviors";
import { gameState } from "../state/gameState";
import { hasPerk, triggerToxinaExplosivaExplosion } from "./perks";
import { debug } from "../state/debug";
import {
  getGoldWeightsByLuck,
  pickGoldTier,
  getGoldColor,
  getGoldScale,
} from "../state/luck";
import { getMarksToExplode } from "./skills/markedShot";

export type EnemyOptions = {
  pos?: Vec2;
  size?: number;
  color?: [number, number, number];
  speed?: number;
  target: GameObj;
  arenaBounds?: { x: number; y: number; w: number; h: number };
  margin?: number;
  hp?: number;
  type?: Enemies;
  damage?: number;
};

// Helper for visual feedback when receiving damage
function triggerDamageFeedback(k: KAPLAYCtx, enemy: any, dmg: number) {
  const type = enemy._lastDamageType ?? "normal";
  enemy._lastDamageType = "normal"; // reset to avoid leaks

  const preset = ENEMY_PRESETS[enemy.enemyType as Enemies] || ENEMY_PRESETS.red;
  const size = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };
  const cx = enemy.pos.x + size.width / 2;
  const cy = enemy.pos.y + size.height / 2;

  // 1. Damage Flash (Flash White / Red)
  const isElite = enemy.enemyType.endsWith("_elite");
  const flashColor = isElite ? k.rgb(255, 230, 150) : k.rgb(255, 255, 255);
  
  enemy.color = flashColor;
  if (enemy._flashTimeout) {
    clearTimeout(enemy._flashTimeout);
  }
  enemy._flashTimeout = setTimeout(() => {
    if (enemy.exists()) {
      const orig = enemy._originalColor || k.rgb(preset.color[0], preset.color[1], preset.color[2]);
      enemy.color = orig;
    }
  }, 80);

  // 2. Camera Shake based on damage type and enemy type (reduced by ~40% for better playability)
  let shakeIntensity = 0.7;
  if (type === "shock") shakeIntensity = 1.5;
  if (type === "explosion") shakeIntensity = 2.0;
  if (type === "marked") shakeIntensity = 1.6;
  if (enemy.enemyType.includes("colossus")) shakeIntensity *= 1.5;
  if (enemy.enemyType.includes("stone")) shakeIntensity *= 1.3;
  if (isElite) shakeIntensity *= 1.2;
  k.shake(shakeIntensity);

  // 3. Floating Damage Number
  let textColor = k.rgb(255, 255, 255);
  let outlineColor = k.rgb(0, 0, 0);
  let labelPrefix = "";
  let fontSize = 14;

  if (type === "poison") {
    textColor = k.rgb(80, 240, 80);
    outlineColor = k.rgb(0, 60, 0);
    labelPrefix = "☠";
    fontSize = 12;
  } else if (type === "shock") {
    textColor = k.rgb(255, 240, 80);
    outlineColor = k.rgb(80, 50, 0);
    labelPrefix = "⚡";
    fontSize = 15;
  } else if (type === "fire") {
    textColor = k.rgb(255, 120, 30);
    outlineColor = k.rgb(80, 20, 0);
    labelPrefix = "🔥";
    fontSize = 14;
  } else if (type === "explosion") {
    textColor = k.rgb(255, 60, 20);
    outlineColor = k.rgb(0, 0, 0);
    fontSize = 18;
  } else if (type === "marked") {
    textColor = k.rgb(255, 100, 180);
    outlineColor = k.rgb(50, 0, 30);
    labelPrefix = "🎯";
    fontSize = 16;
  }

  const dispDmg = typeof dmg === "number" ? Math.round(dmg * 10) / 10 : dmg;
  const labelText = `${labelPrefix}${dispDmg}`;

  const label = k.add([
    k.text(labelText, { size: fontSize }),
    k.pos(cx + k.rand(-10, 10), enemy.pos.y - 12),
    k.anchor("center"),
    k.color(textColor),
    k.outline(2, outlineColor),
    k.z(850),
    k.opacity(1),
    k.lifespan(0.7, { fade: 0.35 }),
    {
      vx: k.rand(-30, 30),
      vy: -70 - k.rand(0, 30),
    }
  ]);
  label.onUpdate(() => {
    label.pos.x += label.vx * k.dt();
    label.pos.y += label.vy * k.dt();
    label.vy *= 0.96;
  });

  // 4. Hit sparks (particles)
  let sparkColor = k.rgb(preset.color[0], preset.color[1], preset.color[2]);
  if (type === "poison") sparkColor = k.rgb(80, 220, 60);
  else if (type === "shock") sparkColor = k.rgb(255, 255, 140);
  else if (type === "fire" || type === "explosion") sparkColor = k.rgb(255, 120, 40);
  else if (type === "marked") sparkColor = k.rgb(255, 100, 180);

  const sparkCount = type === "explosion" ? 8 : type === "poison" ? 2 : 4;
  const sparkSize = type === "explosion" ? 4 : 2;
  const sparkSpeedRange = type === "explosion" ? [120, 240] : [80, 160];

  for (let i = 0; i < sparkCount; i++) {
    const angle = k.rand(0, Math.PI * 2);
    const spd = k.rand(sparkSpeedRange[0], sparkSpeedRange[1]);
    const sz = k.rand(sparkSize, sparkSize + 2);
    const p = k.add([
      k.rect(sz, sz),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(sparkColor),
      k.opacity(0.85),
      k.z(650),
      k.lifespan(0.35, { fade: 0.25 }),
      {
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
      }
    ]);
    p.onUpdate(() => {
      p.pos.x += p.vx * k.dt();
      p.pos.y += p.vy * k.dt();
      p.vx *= 0.93;
      p.vy *= 0.93;
    });
  }
}

// Helper for physical debris and visual effects on death
function explodeEnemyDebris(k: KAPLAYCtx, pos: Vec2, type: string) {
  const preset = ENEMY_PRESETS[type as Enemies] || ENEMY_PRESETS.red;
  const isElite = type.endsWith("_elite");
  const color = preset.color;

  let count = 8;
  let sizeRange = [3, 6];
  let gravity = 450;
  let speedRange = [100, 220];
  let dustCloud = false;
  let dustColor = k.rgb(180, 180, 180);
  let specialEffect = "";

  if (type.includes("stone")) {
    count = 14;
    sizeRange = [5, 9];
    gravity = 650;
    speedRange = [80, 180];
    dustCloud = true;
    dustColor = k.rgb(140, 120, 100);
  } else if (type.includes("colossus")) {
    count = 24;
    sizeRange = [6, 12];
    gravity = 800;
    speedRange = [120, 280];
    dustCloud = true;
    dustColor = k.rgb(150, 130, 110);
    specialEffect = "colossus-slam";
  } else if (type.includes("blue")) {
    count = 12;
    sizeRange = [4, 8];
    gravity = 550;
    speedRange = [90, 200];
    dustCloud = true;
    dustColor = k.rgb(100, 140, 180);
  } else if (type.includes("purple")) {
    count = 6;
    sizeRange = [2, 5];
    gravity = 300;
    speedRange = [150, 320];
  } else if (type.includes("green") || type.includes("regen")) {
    specialEffect = "green-sparks";
  } else if (type.includes("summoner")) {
    specialEffect = "purple-smoke";
  } else if (type.includes("spinner")) {
    specialEffect = "orange-sparks";
  }

  // 1. Shake screen on death based on weight (reduced by ~40%)
  let deathShake = 1.2;
  if (type.includes("stone")) deathShake = 2.4;
  if (type.includes("colossus")) deathShake = 4.0;
  if (type.includes("blue")) deathShake = 1.8;
  if (isElite) deathShake *= 1.2;
  k.shake(deathShake);

  // 2. Dust cloud
  if (dustCloud) {
    const dustCount = type.includes("colossus") ? 10 : 5;
    for (let i = 0; i < dustCount; i++) {
      const angle = k.rand(0, Math.PI * 2);
      const dist = k.rand(10, 30);
      const sz = k.rand(15, 30);
      const dust = k.add([
        k.circle(sz / 2),
        k.pos(pos.x + Math.cos(angle) * dist, pos.y + Math.sin(angle) * dist),
        k.anchor("center"),
        k.color(dustColor),
        k.opacity(0.35),
        k.z(90),
        k.lifespan(0.45, { fade: 0.35 }),
        {
          vx: Math.cos(angle) * k.rand(20, 60),
          vy: Math.sin(angle) * k.rand(20, 60),
        }
      ]);
      dust.onUpdate(() => {
        dust.pos.x += dust.vx * k.dt();
        dust.pos.y += dust.vy * k.dt();
        dust.vx *= 0.94;
        dust.vy *= 0.94;
      });
    }
  }

  // 3. Debris pieces
  for (let i = 0; i < count; i++) {
    const angle = k.rand(0, Math.PI * 2);
    const spd = k.rand(speedRange[0], speedRange[1]);
    const sz = k.rand(sizeRange[0], sizeRange[1]);
    
    const colorVariance = k.rand(-25, 25);
    const r = k.clamp(color[0] + colorVariance, 0, 255);
    const g = k.clamp(color[1] + colorVariance, 0, 255);
    const b = k.clamp(color[2] + colorVariance, 0, 255);
    
    const debColor = isElite ? k.rgb(255, 215, 0) : k.rgb(r, g, b);
    const rotSpeed = k.rand(-360, 360);

    const piece = k.add([
      k.rect(sz, sz),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(debColor),
      k.opacity(1),
      k.z(590),
      k.lifespan(0.55, { fade: 0.3 }),
      k.rotate(k.rand(0, 360)),
      {
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - k.rand(50, 120),
        rotSpd: rotSpeed,
      }
    ]);

    piece.onUpdate(() => {
      piece.vy += gravity * k.dt();
      piece.pos.x += piece.vx * k.dt();
      piece.pos.y += piece.vy * k.dt();
      piece.angle += piece.rotSpd * k.dt();
      piece.rotSpd *= 0.98;
    });
  }

  // 4. Elite Sparkles (Golden stars)
  if (isElite) {
    for (let i = 0; i < 6; i++) {
      const angle = k.rand(0, Math.PI * 2);
      const spd = k.rand(40, 100);
      const star = k.add([
        k.circle(3),
        k.pos(pos.x, pos.y),
        k.anchor("center"),
        k.color(255, 220, 80),
        k.opacity(0.9),
        k.z(600),
        k.lifespan(0.6, { fade: 0.4 }),
        {
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 30,
        }
      ]);
      star.onUpdate(() => {
        star.pos.x += star.vx * k.dt();
        star.pos.y += star.vy * k.dt();
        star.vy -= 15 * k.dt();
      });
    }
  }

  // 5. Special effects
  if (specialEffect === "green-sparks") {
    for (let i = 0; i < 5; i++) {
      const bubble = k.add([
        k.circle(k.rand(2, 4)),
        k.pos(pos.x + k.rand(-15, 15), pos.y + k.rand(-15, 15)),
        k.anchor("center"),
        k.color(80, 220, 60),
        k.opacity(0.7),
        k.z(95),
        k.lifespan(0.5, { fade: 0.3 }),
        {
          vx: k.rand(-15, 15),
          vy: -k.rand(30, 65),
        }
      ]);
      bubble.onUpdate(() => {
        bubble.pos.x += bubble.vx * k.dt();
        bubble.pos.y += bubble.vy * k.dt();
      });
    }
  } else if (specialEffect === "purple-smoke") {
    for (let i = 0; i < 3; i++) {
      const ring = k.add([
        k.circle(12),
        k.pos(pos.x + k.rand(-10, 10), pos.y + k.rand(-10, 10)),
        k.anchor("center"),
        k.color(140, 60, 200),
        k.opacity(0.4),
        k.z(92),
        k.scale(0.5),
        k.lifespan(0.4, { fade: 0.3 }),
        { t: 0, maxScale: k.rand(1.5, 2.2) }
      ]) as GameObj & { t: number, maxScale: number };
      ring.onUpdate(() => {
        ring.t += k.dt();
        const p = Math.min(ring.t / 0.4, 1);
        ring.scale = k.vec2(0.5 + p * (ring.maxScale - 0.5));
      });
    }
  } else if (specialEffect === "orange-sparks") {
    for (let i = 0; i < 6; i++) {
      const angle = k.rand(0, Math.PI * 2);
      const spd = k.rand(120, 190);
      const spark = k.add([
        k.rect(5, 2),
        k.pos(pos.x, pos.y),
        k.anchor("center"),
        k.rotate(k.rad2deg(angle)),
        k.color(255, 140, 40),
        k.opacity(0.9),
        k.z(595),
        k.lifespan(0.3, { fade: 0.2 }),
        {
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
        }
      ]);
      spark.onUpdate(() => {
        spark.pos.x += spark.vx * k.dt();
        spark.pos.y += spark.vy * k.dt();
      });
    }
  }
}

export function createEnemy(k: KAPLAYCtx, opts: EnemyOptions): GameObj {
  const type = opts.type ?? "red";
  const preset = ENEMY_PRESETS[type];
  const s = opts.size ?? preset.size;

  // ── Escalonamento pós-wave 5 ──
  const wave = gameState.wave;
  const scaleStacks = wave > 5 ? Math.floor((wave - 1) / 5) : 0; // 0 até wave 5
  const hpScale = 1 + scaleStacks * 0.5;
  const isShooterType = [
    "spinner",
    "spinner_elite",
    "green",
    "green_elite",
    "cone_shooter",
    "cone_shooter_elite",
  ].includes(type);

  // ── GAME_SPEED multiplicador global ──
  const gs = debug.GAME_SPEED ?? 1.0;
  const spd = (opts.speed ?? preset.speed) * gs;
  const margin = opts.margin ?? 32; // avoid spawning inside walls
  const arena = opts.arenaBounds;
  const playerPos = opts.target.pos.clone();
  const minSpawnDist = 180; // minimum distance from player
  let startPos =
    opts.pos ??
    (arena
      ? k.vec2(
          k.rand(arena.x + margin, arena.x + arena.w - margin),
          k.rand(arena.y + margin, arena.y + arena.h - margin),
        )
      : k.vec2(k.rand(0, k.width()), k.rand(0, k.height())));
  // Reposition if too close to player
  if (startPos.dist(playerPos) < minSpawnDist) {
    const dir = playerPos
      .sub(k.vec2(k.rand(0, k.width()), k.rand(0, k.height())))
      .unit();
    startPos = playerPos.add(dir.scale(minSpawnDist));
  }
  const color = opts.color ?? preset.color;
  const maxHP = Math.round((opts.hp ?? preset.hp) * hpScale);
  const dmg = opts.damage ?? preset.damage;

  const isElite = type.endsWith("_elite");
  const outlineColor = isElite ? k.rgb(255, 215, 0) : k.rgb(0, 0, 0);
  const outlineThick = isElite ? 4 : 3;

  let enemy: any;
  enemy = k.add([
    k.rect(s, s),
    k.pos(startPos.x, startPos.y),
    k.color(color[0], color[1], color[2]),
    k.outline(outlineThick, outlineColor),
    k.area(),
    k.body(), // enable physics collisions with walls and other enemies
    speed({ value: spd }),
    movimentable(k, {
      getDirection: (self) => {
        // Chase the target based on current position
        return opts.target.pos.sub(self.pos);
      },
    }),
    {
      id: "enemy",
      enemyType: type,
      name: preset.name,
      _hp: maxHP,
      _originalColor: k.rgb(color[0], color[1], color[2]),
      get hp() {
        return this._hp;
      },
      set hp(val: number) {
        const diff = this._hp - val;
        if (diff > 0 && enemy.exists()) {
          triggerDamageFeedback(k, enemy, diff);
        }
        this._hp = val;
      },
      maxHp: maxHP,
      marks: 0,
      marksDecayTimer: 0, // tempo desde última marca (reseta ao estacar)
      poisonStacks: 0, // acúmulos de veneno (sistema desacoplado)
      poisonTickTimer: 0, // timer interno do sistema de veneno
      damage: dmg,
      lastDamageTime: 0,
      defaultSpeed: spd,
      update(this: GameObj & { hp: number; maxHp: number }) {
        // keep inside arena bounds by nudging back if beyond
        if (arena) {
          const minX = arena.x + margin;
          const maxX = arena.x + arena.w - margin;
          const minY = arena.y + margin;
          const maxY = arena.y + arena.h - margin;
          this.pos.x = k.clamp(this.pos.x, minX, maxX);
          this.pos.y = k.clamp(this.pos.y, minY, maxY);
        }
        // Red-specific schooling: tend to group with nearby reds
        if (this.enemyType === "red" || this.enemyType === "red_elite") {
          applyRedBehavior(k, this as any);
        }
        if (this.enemyType === "green" || this.enemyType === "green_elite") {
          applyGreenBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "purple" || this.enemyType === "purple_elite") {
          applyPurpleBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "smart" || this.enemyType === "smart_elite") {
          applySmartBehavior(k, this as any, opts.target);
        }
        if (
          this.enemyType === "spinner" ||
          this.enemyType === "spinner_elite"
        ) {
          // fire rate escalada para shooters pós-wave 5
          const fireRateMul =
            isShooterType && scaleStacks > 0
              ? Math.max(0.25, 1 / (1 + scaleStacks * 0.5))
              : 1;
          const spinData = this as any;
          if (spinData._spinFireRate !== undefined) {
            spinData._spinFireRate = 0.55 * fireRateMul;
          }
          applySpinnerBehavior(k, this as any, dmg);
        }
        if (
          this.enemyType === "summoner" ||
          this.enemyType === "summoner_elite"
        ) {
          applySummonerBehavior(k, this as any, opts.target, opts.arenaBounds);
        }
        if (this.enemyType === "regen" || this.enemyType === "regen_elite") {
          applyRegenBehavior(k, this as any);
        }
        if (
          this.enemyType === "colossus" ||
          this.enemyType === "colossus_elite"
        ) {
          applyColossusBehavior(k, this as any, opts.target);
        }
        if (
          this.enemyType === "cone_shooter" ||
          this.enemyType === "cone_shooter_elite"
        ) {
          const coneFireMul =
            isShooterType && scaleStacks > 0
              ? Math.max(0.6, 1 / (1 + scaleStacks * 0.4))
              : 1;
          const coneData = this as any;
          if (coneData._coneCooldown !== undefined) {
            coneData._coneCooldown = 2.2 * coneFireMul;
          }
          applyConeShooterBehavior(k, this as any, opts.target, dmg);
        }
        if (this.enemyType === "berserker" || this.enemyType === "berserker_elite") {
          applyBerserkerBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "shield_guard" || this.enemyType === "shield_guard_elite") {
          applyShieldGuardBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "charger" || this.enemyType === "charger_elite") {
          applyChargerBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "phantom" || this.enemyType === "phantom_elite") {
          applyPhantomBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "ninja" || this.enemyType === "ninja_elite") {
          applyNinjaBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "detonator" || this.enemyType === "detonator_elite") {
          applyDetonatorBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "vampire" || this.enemyType === "vampire_elite") {
          applyVampireBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "illusionist" || this.enemyType === "illusionist_elite") {
          applyIllusionistBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "trapper" || this.enemyType === "trapper_elite") {
          applyTrapperBehavior(k, this as any, opts.target);
        }
      },
    },
  ]) as any;

  // Collide with walls: body handles resolution; add small bounce feedback
  enemy.onCollide("arena-wall", () => {
    const away = enemy.pos.sub(opts.target.pos).unit();
    enemy.move(away.scale(enemy.speed ?? spd));
  });

  // --- Borda de vida (4 linhas percorrendo o perímetro) ---
  const outlineWidth = 3;
  const halfOut = outlineWidth / 2;
  const fullLen = s + outlineWidth;

  // Top: cresce da esquerda → direita, ancorado no topleft
  const hpTop = enemy.add([
    k.rect(1, outlineWidth),
    k.pos(-halfOut, -halfOut),
    k.color(255, 255, 255),
    k.scale(fullLen, 1),
    k.z(10),
    { id: "hp-border-top" },
  ]);
  // Right: some de cima → baixo, ancorado embaixo
  const hpRight = enemy.add([
    k.rect(outlineWidth, 1),
    k.pos(s - halfOut, s + halfOut),
    k.color(255, 255, 255),
    k.scale(1, fullLen),
    k.anchor("botleft"),
    k.z(10),
    { id: "hp-border-right" },
  ]);
  // Bottom: some da direita → esquerda, ancorado na esquerda
  const hpBottom = enemy.add([
    k.rect(1, outlineWidth),
    k.pos(-halfOut, s - halfOut),
    k.color(255, 255, 255),
    k.scale(fullLen, 1),
    k.z(10),
    { id: "hp-border-bottom" },
  ]);
  // Left: some de baixo → cima, ancorado no topo
  const hpLeft = enemy.add([
    k.rect(outlineWidth, 1),
    k.pos(-halfOut, -halfOut),
    k.color(255, 255, 255),
    k.scale(1, fullLen),
    k.z(10),
    { id: "hp-border-left" },
  ]);

  // --- Indicadores visuais de marcas (marked shot) ---
  const MAX_MARKS = 5;
  const markSize = 4;
  const markGap = 2;
  const totalMarksWidth = MAX_MARKS * markSize + (MAX_MARKS - 1) * markGap;
  const marksStartX = (s - totalMarksWidth) / 2;

  const markDots: GameObj[] = [];
  for (let i = 0; i < MAX_MARKS; i++) {
    const dot = enemy.add([
      k.rect(markSize, markSize),
      k.pos(marksStartX + i * (markSize + markGap), -markSize - 10),
      k.color(60, 60, 60),
      k.z(11),
      { id: "mark-dot" },
    ]);
    dot.hidden = true;
    markDots.push(dot);
  }

  // --- Indicador visual de veneno (ícone + contador) ---
  const poisonLabel = enemy.add([
    k.text("", { size: 10 }),
    k.pos(s + 4, -2),
    k.color(80, 230, 60),
    k.z(12),
    { id: "poison-label" },
  ]);
  poisonLabel.hidden = true;

  // --- Indicador do escudo (Guarda do Escudo) ---
  let shieldBar: any = null;
  if (type === "shield_guard" || type === "shield_guard_elite") {
    shieldBar = enemy.add([
      k.rect(s * 0.9, 6, { radius: 2 }),
      k.pos(s / 2, s / 2),
      k.anchor("center"),
      k.color(180, 185, 195),
      k.outline(1.5, k.rgb(0, 0, 0)),
      k.z(10),
      k.rotate(0),
      { id: "shield-bar" },
    ]);
  }

  enemy.onUpdate(() => {
    const ratio = Math.max(0, (enemy as any).hp / (enemy as any).maxHp);

    // --- Atualizar escudo do Guarda do Escudo ---
    const e = enemy as any;
    if (shieldBar && shieldBar.exists()) {
      const isStaggered = e.staggeredUntil && e.staggeredUntil > Date.now();
      
      // Encontrar direção ao player
      const playerSize = opts.target.width ?? opts.target.getSize?.().width ?? 28;
      const enemyCenter = k.vec2(s / 2, s / 2);
      const toPlayer = opts.target.pos.add(playerSize / 2, playerSize / 2)
        .sub(e.pos.add(enemyCenter))
        .unit();
      
      // Posicionar escudo à frente perpendicular ao player
      const dirAngle = k.rad2deg(Math.atan2(toPlayer.y, toPlayer.x));
      shieldBar.pos = enemyCenter.add(toPlayer.scale(s / 2 + 5));
      shieldBar.angle = dirAngle + 90;
      
      // Controlar opacidade e feedback de stagger
      shieldBar.opacity = isStaggered ? 0.2 : 1.0;
      
      if (isStaggered) {
        // Reduz velocidade pela metade
        e.speed = e.defaultSpeed * 0.5;
        // Piscar em vermelho
        const blinkPhase = Math.floor(k.time() * 8) % 2 === 0;
        e.color = blinkPhase ? k.rgb(255, 50, 50) : e._originalColor;
        e._wasStaggered = true;
      } else {
        if (e._wasStaggered) {
          e._wasStaggered = false;
          e.color = e._originalColor;
          e.speed = e.defaultSpeed;
        }
      }
    }
    // Sentido horário de preenchimento:
    //   75-100% → top       (esq→dir)  — última a esvaziar
    //   50-75%  → right     (cima→baixo)
    //   25-50%  → bottom    (dir→esq)
    //   0-25%   → left      (baixo→cima) — primeira a esvaziar
    const pct = ratio * 100;

    // Top: preenche de 75-100% (última a sumir)
    {
      const seg = Math.max(0, Math.min(pct - 75, 25)) / 25;
      hpTop.scale = k.vec2(seg * fullLen, 1);
    }
    // Right: preenche de 50-75%
    {
      const seg = Math.max(0, Math.min(pct - 50, 25)) / 25;
      hpRight.scale = k.vec2(1, seg * fullLen);
    }
    // Bottom: preenche de 25-50%
    {
      const seg = Math.max(0, Math.min(pct - 25, 25)) / 25;
      hpBottom.scale = k.vec2(seg * fullLen, 1);
    }
    // Left: preenche de 0-25% (primeira a sumir)
    {
      const seg = Math.max(0, Math.min(pct, 25)) / 25;
      hpLeft.scale = k.vec2(1, seg * fullLen);
    }

    // --- Atualizar visual das marcas + expiração ---
    const currentMarks = e.marks ?? 0;

    // Timer de expiração: se tem marcas, incrementa timer
    if (currentMarks > 0) {
      e.marksDecayTimer += k.dt();
      // Após 3s sem receber nova marca, marcas expiram
      if (e.marksDecayTimer >= 3) {
        e.marks = 0;
        e.marksDecayTimer = 0;
      }
    }

    const hasMarks = (e.marks ?? 0) > 0;
    const activeMaxMarks = getMarksToExplode(
      gameState.skills.levels["marked-shot"] ?? 1,
    );
    for (let i = 0; i < MAX_MARKS; i++) {
      // Esconde dots acima do limite atual
      if (i >= activeMaxMarks) {
        markDots[i].hidden = true;
        continue;
      }
      markDots[i].hidden = !hasMarks;
      if (hasMarks) {
        if (i < (e.marks ?? 0)) {
          // Marca ativa: vermelho/rosa
          markDots[i].color = k.rgb(255, 80, 100);
        } else {
          // Marca vazia: cinza escuro
          markDots[i].color = k.rgb(60, 60, 60);
        }
      }
    }

    // --- Atualizar indicador de veneno ---
    const pStacks = e.poisonStacks ?? 0;
    if (pStacks > 0) {
      poisonLabel.hidden = false;
      (poisonLabel as any).text = `☠${pStacks}`;
      // Cor fica mais intensa com mais stacks
      const intensity = Math.min(pStacks / 10, 1);
      poisonLabel.color = k.rgb(
        60 + intensity * 40,
        180 + intensity * 75,
        40 + intensity * 20,
      );
    } else {
      poisonLabel.hidden = true;
    }
  });

  // Collide with other enemies to avoid overlapping
  enemy.onCollide("enemy", (other: GameObj) => {
    const push = enemy.pos.sub(other.pos).unit();
    enemy.move(push.scale(20));
  });

  enemy.onDestroy(() => {
    // Visual debris explosion based on enemy type
    explodeEnemyDebris(k, enemy.pos.clone(), type);

    // Toxina Explosiva explosion check
    if (hasPerk("toxina-explosiva") && (enemy.poisonStacks ?? 0) > 0) {
      triggerToxinaExplosivaExplosion(k, enemy.pos.clone(), enemy.poisonStacks);
    }

    // Compute gold drop based on luck table
    const luck = gameState.luck;
    const weights = getGoldWeightsByLuck(luck);
    const tier = pickGoldTier(weights, k.rand);
    const amount = tier;
    const drop = spawnGoldDrop(k, enemy.pos.clone(), amount);
    // Apply color and scale based on tier
    const [r, g, b] = getGoldColor(tier);
    drop.color = k.rgb(r, g, b);
    drop.scale = k.vec2(getGoldScale(tier), getGoldScale(tier));

    // Rare chance to drop an elevation point (luck makes it more likely)
    // Base chance: 1.5%, scales with luck up to ~7.5% at luck 3.0
    const elevChance = 0.015 * luck;
    if (Math.random() < elevChance) {
      // Spawn a visual elevation point drop (star)
      const starSize = 14;
      const star = k.add([
        k.rect(starSize, starSize),
        k.pos(enemy.pos.x - starSize / 2 + 12, enemy.pos.y - starSize / 2),
        k.color(180, 140, 255),
        k.outline(2, k.rgb(255, 220, 100)),
        k.area(),
        k.opacity(1),
        k.z(55),
        {
          id: "elevation-drop",
          age: 0,
          blinkT: 0,
        },
      ]);
      // Animate the star
      star.onUpdate(() => {
        if (!star.exists()) return;
        (star as any).age += k.dt();
        // Expires after 20s
        if ((star as any).age >= 20) {
          star.destroy();
          return;
        }
        // Blink after 15s
        if ((star as any).age >= 15) {
          (star as any).blinkT += k.dt();
          const remaining = 20 - (star as any).age;
          const blinkRate = remaining < 2 ? 0.08 : remaining < 3 ? 0.12 : 0.2;
          star.opacity =
            Math.sin(((star as any).blinkT / blinkRate) * Math.PI) > 0
              ? 1
              : 0.2;
        }
        // Magnetism toward player (same as gold)
        const players = k.get("player");
        if (players.length > 0) {
          const player = players[0];
          const dist = star.pos.dist(player.pos);
          if (dist < 120 && dist > 2) {
            const dir = player.pos.sub(star.pos).unit();
            star.move(dir.scale(400 * (1 + (1 - dist / 120) * 2)));
          }
        }
      });
    }
  });

  // --- Geometric sub-shapes for visual differentiation ---
  // Tanks: double border/inner concentric box
  if (type.includes("stone") || type.includes("colossus") || type.includes("blue") || type.includes("shield_guard")) {
    enemy.add([
      k.rect(s * 0.6, s * 0.6),
      k.pos(s / 2, s / 2),
      k.anchor("center"),
      k.color(k.rgb(Math.max(0, color[0] - 40), Math.max(0, color[1] - 40), Math.max(0, color[2] - 40))),
      k.outline(2, k.rgb(color[0], color[1], color[2])),
      "enemy-tank-inner",
    ]);
  }
  // Shooters: aim pointer
  else if (type.includes("spinner") || type.includes("cone_shooter") || type.includes("green")) {
    const turret = enemy.add([
      k.polygon([k.vec2(-8, -6), k.vec2(10, 0), k.vec2(-8, 6)]),
      k.pos(s / 2, s / 2),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(1.5, k.rgb(0, 0, 0)),
      "enemy-aim-pointer",
    ]);
    turret.onUpdate(() => {
      if (enemy.exists() && opts.target && opts.target.exists()) {
        const angle = k.rad2deg(Math.atan2(opts.target.pos.y - enemy.pos.y, opts.target.pos.x - enemy.pos.x));
        turret.angle = angle;
      }
    });
  }
  // Veloxio: speed chevron/diamond
  else if (type.includes("purple")) {
    enemy.add([
      k.rect(s * 0.3, s * 0.65),
      k.pos(s / 2, s / 2),
      k.anchor("center"),
      k.rotate(45),
      k.color(255, 255, 255),
      k.outline(1.5, k.rgb(0, 0, 0)),
      "enemy-speed-diamond",
    ]);
  }
  // Summoners: concentric pulsing circle
  else if (type.includes("summoner")) {
    const orb = enemy.add([
      k.circle(s * 0.25),
      k.pos(s / 2, s / 2),
      k.anchor("center"),
      k.color(140, 60, 200),
      k.outline(1.5, k.rgb(255, 255, 255)),
      "enemy-summoner-orb",
    ]);
    orb.onUpdate(() => {
      if (orb.exists()) {
        const sc = 1.0 + Math.sin(k.time() * 10) * 0.18;
        orb.scale = k.vec2(sc);
      }
    });
  }
  // Regenerators: green plus sign
  else if (type.includes("regen")) {
    // Horiz
    enemy.add([
      k.rect(s * 0.5, 4),
      k.pos(s / 2, s / 2),
      k.anchor("center"),
      k.color(80, 220, 60),
      k.outline(1, k.rgb(0, 0, 0)),
      "enemy-plus-h",
    ]);
    // Vert
    enemy.add([
      k.rect(4, s * 0.5),
      k.pos(s / 2, s / 2),
      k.anchor("center"),
      k.color(80, 220, 60),
      k.outline(1, k.rgb(0, 0, 0)),
      "enemy-plus-v",
    ]);
  }
  // Grunts: simple black inner square
  else {
    enemy.add([
      k.rect(s * 0.35, s * 0.35),
      k.pos(s / 2, s / 2),
      k.anchor("center"),
      k.color(0, 0, 0),
      "enemy-grunt-inner",
    ]);
  }

  // Elite Crown / Halo above Elite heads
  if (isElite) {
    const halo = enemy.add([
      k.circle(s * 0.25),
      k.pos(s / 2, -s * 0.22),
      k.anchor("center"),
      k.color(0, 0, 0, 0), // transparent prefill
      k.opacity(1),
      k.outline(2.5, k.rgb(255, 215, 0)),
      "enemy-elite-halo",
    ]);
    halo.onUpdate(() => {
      if (halo.exists()) {
        // Subtle floating pulse
        halo.pos.y = -s * 0.22 + Math.sin(k.time() * 5) * 2;
      }
    });
  }

  return enemy;
}
