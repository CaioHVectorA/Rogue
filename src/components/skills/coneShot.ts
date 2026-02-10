import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

// ===== Tabela de escalamento por nível =====
type ConeLevelData = {
  projectiles: number;
  arcDeg: number;
  cooldown: number;
  speedMul: number; // multiplicador sobre projectileSpeed
  trailLife: number;
};

const CONE_LEVELS: ConeLevelData[] = [
  // level 1
  {
    projectiles: 3,
    arcDeg: 50,
    cooldown: 2400,
    speedMul: 0.95,
    trailLife: 0.18,
  },
  // level 2
  {
    projectiles: 5,
    arcDeg: 55,
    cooldown: 2200,
    speedMul: 0.95,
    trailLife: 0.2,
  },
  // level 3
  {
    projectiles: 7,
    arcDeg: 60,
    cooldown: 2000,
    speedMul: 1.0,
    trailLife: 0.22,
  },
  // level 4
  {
    projectiles: 9,
    arcDeg: 65,
    cooldown: 1800,
    speedMul: 1.0,
    trailLife: 0.24,
  },
  // level 5
  {
    projectiles: 11,
    arcDeg: 70,
    cooldown: 1600,
    speedMul: 1.05,
    trailLife: 0.26,
  },
];

function getLevelData(level: number): ConeLevelData {
  const idx = Math.min(level, CONE_LEVELS.length) - 1;
  return CONE_LEVELS[Math.max(0, idx)];
}

// ===== Config visual =====
const CONE_CONFIG = {
  projectileSize: 9,
  trailInterval: 0.025,
  maxRange: 1.2, // multiplicador sobre k.width()
} as const;

// Paleta gradiente: centro = branco quente, bordas = laranja-avermelhado
function getProjectileColor(t: number): [number, number, number] {
  // t=0 (centro) → amarelo brilhante, t=1 (borda) → laranja escuro
  const r = Math.round(255);
  const g = Math.round(240 - t * 120);
  const b = Math.round(120 - t * 100);
  return [r, g, b];
}

function getTrailColor(t: number): [number, number, number] {
  // Trail mais sutil, alaranjado
  const r = Math.round(255);
  const g = Math.round(180 - t * 80);
  const b = Math.round(60 - t * 40);
  return [r, g, b];
}

function getGlowColor(): [number, number, number] {
  return [255, 200, 60];
}

// ===== Helpers =====

function findNearestEnemy(k: KAPLAYCtx, from: any): GameObj | null {
  const enemies = k.get("enemy") as GameObj[];
  if (!enemies || enemies.length === 0) return null;
  let nearest: GameObj | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const e of enemies) {
    const d = from.dist(e.pos);
    if (d < best) {
      best = d;
      nearest = e;
    }
  }
  return nearest;
}

function getPlayerDirection(
  k: KAPLAYCtx,
  player: GameObj,
): { x: number; y: number } {
  let moveX = 0;
  let moveY = 0;
  if (k.isKeyDown("a") || k.isKeyDown("left")) moveX -= 1;
  if (k.isKeyDown("d") || k.isKeyDown("right")) moveX += 1;
  if (k.isKeyDown("w") || k.isKeyDown("up")) moveY -= 1;
  if (k.isKeyDown("s") || k.isKeyDown("down")) moveY += 1;

  if (moveX !== 0 || moveY !== 0) {
    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    return { x: moveX / len, y: moveY / len };
  }

  const nearestEnemy = findNearestEnemy(k, player.pos);
  if (nearestEnemy) {
    const dir = nearestEnemy.pos.sub(player.pos);
    if (dir.len() > 0) {
      const unit = dir.unit();
      return { x: unit.x, y: unit.y };
    }
  }

  return { x: 1, y: 0 };
}

// ===== Efeitos visuais =====

/** Flash de muzzle (boca de fogo) ao disparar */
function spawnMuzzleFlash(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  angle: number,
): void {
  const size = 28;
  const glow = getGlowColor();
  const flash = k.add([
    k.rect(size, size * 0.5),
    k.pos(pos.x - size / 2, pos.y - size * 0.25),
    k.color(glow[0], glow[1], glow[2]),
    k.outline(2, k.rgb(255, 255, 255)),
    k.anchor("center"),
    k.rotate(angle * (180 / Math.PI)),
    k.scale(1),
    k.z(900),
    { t: 0 },
  ]);
  flash.onUpdate(() => {
    (flash as any).t += k.dt();
    const p = Math.min((flash as any).t / 0.15, 1);
    const s = 1 + p * 0.5;
    flash.scale = k.vec2(s, s * 0.5);
    (flash as any).opacity = 1 - p;
    if (p >= 1) flash.destroy();
  });
}

/** Trail de partícula para cada projétil */
function spawnTrail(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  color: [number, number, number],
  life: number,
): void {
  const size = 5 + Math.random() * 3;
  const trail = k.add([
    k.rect(size, size),
    k.pos(pos.x - size / 2, pos.y - size / 2),
    k.color(color[0], color[1], color[2]),
    k.scale(1),
    k.z(800),
    { t: 0, life },
  ]);
  trail.onUpdate(() => {
    (trail as any).t += k.dt();
    const p = Math.min((trail as any).t / (trail as any).life, 1);
    const s = 1 - p * 0.7;
    trail.scale = k.vec2(s);
    (trail as any).opacity = 1 - p;
    if (p >= 1) trail.destroy();
  });
}

/** Efeito de impacto melhorado ao acertar inimigo */
function spawnHitEffect(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  color: [number, number, number],
  target: any,
): void {
  // Flash principal
  addImpactFlash(k, k.vec2(pos.x, pos.y), color, {
    target,
    size: 30,
    duration: 0.4,
  });
  // Mini partículas de sparks
  for (let i = 0; i < 4; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 16;
    const sparkSize = 3 + Math.random() * 3;
    const spark = k.add([
      k.rect(sparkSize, sparkSize),
      k.pos(pos.x, pos.y),
      k.color(255, 255, 200),
      k.z(1001),
      {
        t: 0,
        vx: Math.cos(angle) * dist * 6,
        vy: Math.sin(angle) * dist * 6,
      },
    ]);
    spark.onUpdate(() => {
      (spark as any).t += k.dt();
      spark.pos.x += (spark as any).vx * k.dt();
      spark.pos.y += (spark as any).vy * k.dt();
      const p = Math.min((spark as any).t / 0.25, 1);
      (spark as any).opacity = 1 - p;
      if (p >= 1) spark.destroy();
    });
  }
}

/** Efeito de onda de cone ao atirar (arco visual sutil) */
function spawnConeWave(
  k: KAPLAYCtx,
  origin: { x: number; y: number },
  baseAngle: number,
  arcRad: number,
): void {
  const segments = 8;
  const radius = 40;
  const glow = getGlowColor();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = baseAngle + (-arcRad / 2 + t * arcRad);
    const px = origin.x + Math.cos(angle) * radius;
    const py = origin.y + Math.sin(angle) * radius;
    const dotSize = 4;
    const dot = k.add([
      k.rect(dotSize, dotSize),
      k.pos(px - dotSize / 2, py - dotSize / 2),
      k.color(glow[0], glow[1], glow[2]),
      k.scale(1),
      k.z(850),
      { t: 0 },
    ]);
    dot.onUpdate(() => {
      (dot as any).t += k.dt();
      const p = Math.min((dot as any).t / 0.3, 1);
      (dot as any).opacity = 1 - p;
      const s = 1 + p * 2;
      dot.scale = k.vec2(s);
      if (p >= 1) dot.destroy();
    });
  }
}

// ===== Skill =====

registerSkill({
  id: "cone-shot",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const center = player.pos.clone();
    const level = gameState.skills.levels["cone-shot"] ?? 1;
    const data = getLevelData(level);

    const count = data.projectiles;
    const arcRad = (data.arcDeg * Math.PI) / 180;

    // Direção baseada no movimento do player ou inimigo mais próximo
    const dir = getPlayerDirection(k, player);
    const dirUnit = k.vec2(dir.x, dir.y);

    const baseAngle = Math.atan2(dirUnit.y, dirUnit.x);
    const halfSize =
      Math.max((player as any).width ?? 18, (player as any).height ?? 18) / 2;
    const margin = 8;
    const spawnOrigin = center.add(dirUnit.scale(halfSize + margin));

    // Efeito de muzzle flash
    spawnMuzzleFlash(k, { x: spawnOrigin.x, y: spawnOrigin.y }, baseAngle);

    // Onda visual de cone
    spawnConeWave(k, { x: spawnOrigin.x, y: spawnOrigin.y }, baseAngle, arcRad);

    const speed = gameState.projectileSpeed * data.speedMul;
    const damage = gameState.shotDamage;
    const maxDist = k.width() * CONE_CONFIG.maxRange;
    const projSize = CONE_CONFIG.projectileSize;

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = baseAngle + (-arcRad / 2 + t * arcRad);
      const unit = k.vec2(Math.cos(angle), Math.sin(angle));

      // Cor do projétil: gradiente do centro para as bordas do cone
      const colorT = Math.abs(t - 0.5) * 2; // 0 no centro, 1 nas bordas
      const projColor = getProjectileColor(colorT);
      const trailColor = getTrailColor(colorT);

      let trailTimer = 0;

      const c = k.add([
        k.rect(projSize, projSize),
        k.pos(spawnOrigin.x, spawnOrigin.y),
        k.color(projColor[0], projColor[1], projColor[2]),
        k.outline(2, k.rgb(255, 255, 255)),
        k.anchor("center"),
        k.rotate(angle * (180 / Math.PI) + 45), // rotaciona como "diamante"
        k.area(),
        k.z(900),
        {
          id: "skill-cone",
          vel: unit.scale(speed),
          spawnPos: spawnOrigin.clone(),
        },
      ]);

      c.onUpdate(() => {
        c.move((c as any).vel);
        // Rotação sutil contínua
        c.angle += 360 * k.dt();
        // Trail
        trailTimer += k.dt();
        if (trailTimer >= CONE_CONFIG.trailInterval) {
          trailTimer = 0;
          spawnTrail(k, { x: c.pos.x, y: c.pos.y }, trailColor, data.trailLife);
        }
        // Limite de alcance
        if (c.pos.dist((c as any).spawnPos) > maxDist) c.destroy();
      });

      c.onCollide("enemy", (e: any) => {
        if (typeof e.hp === "number") {
          e.hp -= damage;
          if (e.hp <= 0) e.destroy();
        }
        spawnHitEffect(k, { x: c.pos.x, y: c.pos.y }, projColor, e);
        c.destroy();
      });

      c.onCollide("arena-wall", () => c.destroy());
    }
  },
});
