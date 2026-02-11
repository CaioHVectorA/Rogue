import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

// ===== Tabela de escalamento por nível =====
type RicochetLevelData = {
  bounces: number; // quantas vezes o projétil pode quicar (total de inimigos acertados)
  damageFalloff: number; // multiplicador de dano por quique (ex: 0.85 = -15% por quique)
  cooldown: number; // cooldown base em ms
  speedMul: number; // multiplicador sobre projectileSpeed
  bounceRadius: number; // raio de busca para próximo alvo
  projSize: number; // tamanho visual do projétil
  trailLife: number; // duração das partículas de trail
};

const RICOCHET_LEVELS: RicochetLevelData[] = [
  // level 1
  {
    bounces: 2,
    damageFalloff: 0.8,
    cooldown: 2200,
    speedMul: 1.4,
    bounceRadius: 280,
    projSize: 12,
    trailLife: 0.2,
  },
  // level 2
  {
    bounces: 3,
    damageFalloff: 0.82,
    cooldown: 2000,
    speedMul: 1.45,
    bounceRadius: 310,
    projSize: 13,
    trailLife: 0.22,
  },
  // level 3
  {
    bounces: 4,
    damageFalloff: 0.85,
    cooldown: 1800,
    speedMul: 1.5,
    bounceRadius: 340,
    projSize: 14,
    trailLife: 0.24,
  },
  // level 4
  {
    bounces: 5,
    damageFalloff: 0.87,
    cooldown: 1600,
    speedMul: 1.55,
    bounceRadius: 370,
    projSize: 15,
    trailLife: 0.26,
  },
  // level 5
  {
    bounces: 6,
    damageFalloff: 0.9,
    cooldown: 1400,
    speedMul: 1.6,
    bounceRadius: 400,
    projSize: 16,
    trailLife: 0.28,
  },
];

function getLevelData(level: number): RicochetLevelData {
  const idx = Math.min(level, RICOCHET_LEVELS.length) - 1;
  return RICOCHET_LEVELS[Math.max(0, idx)];
}

// ===== Paleta de cores =====
// Gradiente ciano → azul intenso conforme o projétil quica mais
function getProjColor(
  bounceIndex: number,
  maxBounces: number,
): [number, number, number] {
  const t = maxBounces <= 1 ? 0 : bounceIndex / (maxBounces - 1);
  const r = Math.round(60 + t * 60); // 60 → 120
  const g = Math.round(200 - t * 60); // 200 → 140
  const b = Math.round(255);
  return [r, g, b];
}

function getTrailColor(
  bounceIndex: number,
  maxBounces: number,
): [number, number, number] {
  const t = maxBounces <= 1 ? 0 : bounceIndex / (maxBounces - 1);
  const r = Math.round(40 + t * 80);
  const g = Math.round(160 - t * 40);
  const b = Math.round(255);
  return [r, g, b];
}

function getGlowColor(): [number, number, number] {
  return [100, 200, 255];
}

// ===== Config visual =====
const RICOCHET_CONFIG = {
  trailInterval: 0.025,
  maxRange: 2.0, // multiplicador sobre k.width()
  rotationSpeed: 540, // graus/s
} as const;

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

function findNearestEnemyInRadius(
  k: KAPLAYCtx,
  from: { x: number; y: number },
  radius: number,
  exclude: Set<GameObj>,
): GameObj | null {
  const enemies = k.get("enemy") as GameObj[];
  let nearest: GameObj | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const e of enemies) {
    if (exclude.has(e)) continue;
    const d = k.vec2(from.x, from.y).dist(e.pos);
    if (d < radius && d < best) {
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
  const size = 24;
  const glow = getGlowColor();
  const flash = k.add([
    k.rect(size, size * 0.5),
    k.pos(pos.x, pos.y),
    k.color(glow[0], glow[1], glow[2]),
    k.outline(2, k.rgb(180, 230, 255)),
    k.anchor("center"),
    k.rotate(angle * (180 / Math.PI)),
    k.scale(1),
    k.z(900),
    { t: 0 },
  ]);
  flash.onUpdate(() => {
    (flash as any).t += k.dt();
    const p = Math.min((flash as any).t / 0.15, 1);
    const s = 1 + p * 0.6;
    flash.scale = k.vec2(s, s * 0.4);
    (flash as any).opacity = 1 - p;
    if (p >= 1) flash.destroy();
  });
}

/** Trail de partícula para o projétil principal */
function spawnTrail(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  color: [number, number, number],
  life: number,
): void {
  const size = 4 + Math.random() * 3;
  const trail = k.add([
    k.rect(size, size),
    k.pos(pos.x - size / 2, pos.y - size / 2),
    k.color(color[0], color[1], color[2]),
    k.anchor("center"),
    k.rotate(Math.random() * 45),
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

/** Linha visual de ricochete entre dois pontos (arco rápido) */
function spawnBounceLine(
  k: KAPLAYCtx,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: [number, number, number],
): void {
  const segments = 6;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const px = from.x + dx * t;
    const py = from.y + dy * t;
    const dotSize = 3 + (1 - Math.abs(t - 0.5) * 2) * 3; // mais grosso no meio
    const dot = k.add([
      k.rect(dotSize, dotSize),
      k.pos(px - dotSize / 2, py - dotSize / 2),
      k.color(color[0], color[1], color[2]),
      k.anchor("center"),
      k.rotate(45),
      k.scale(1),
      k.z(850),
      { t: 0 },
    ]);
    dot.onUpdate(() => {
      (dot as any).t += k.dt();
      const p = Math.min((dot as any).t / 0.35, 1);
      (dot as any).opacity = 1 - p;
      const s = 1 + p * 0.5;
      dot.scale = k.vec2(s);
      if (p >= 1) dot.destroy();
    });
  }
}

/** Efeito de impacto ao acertar inimigo com ricochete */
function spawnRicochetHitEffect(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  color: [number, number, number],
  target: any,
  isFinal: boolean,
): void {
  const flashSize = isFinal ? 32 : 24;
  addImpactFlash(k, k.vec2(pos.x, pos.y), color, {
    target,
    size: flashSize,
    duration: 0.4,
  });

  // Sparks de ricochete
  const sparkCount = isFinal ? 6 : 4;
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 6 + Math.random() * 14;
    const sparkSize = 2 + Math.random() * 3;
    const spark = k.add([
      k.rect(sparkSize, sparkSize),
      k.pos(pos.x, pos.y),
      k.color(180, 230, 255),
      k.anchor("center"),
      k.rotate(Math.random() * 360),
      k.z(1001),
      {
        t: 0,
        vx: Math.cos(angle) * dist * 5,
        vy: Math.sin(angle) * dist * 5,
      },
    ]);
    spark.onUpdate(() => {
      (spark as any).t += k.dt();
      spark.pos.x += (spark as any).vx * k.dt();
      spark.pos.y += (spark as any).vy * k.dt();
      const p = Math.min((spark as any).t / 0.22, 1);
      (spark as any).opacity = 1 - p;
      if (p >= 1) spark.destroy();
    });
  }

  // Anel de ricochete (visual de "ping")
  if (!isFinal) {
    const ring = k.add([
      k.circle(10),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(color[0], color[1], color[2]),
      k.outline(2, k.rgb(200, 230, 255)),
      k.opacity(0.6),
      k.scale(0.3),
      k.z(850),
      { t: 0 },
    ]);
    ring.onUpdate(() => {
      (ring as any).t += k.dt();
      const p = Math.min((ring as any).t / 0.3, 1);
      ring.scale = k.vec2(0.3 + p * 2.5);
      ring.opacity = 0.6 * (1 - p);
      if (p >= 1) ring.destroy();
    });
  }
}

/** Label flutuante mostrando o número do quique */
function spawnBounceLabel(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  bounceNum: number,
  maxBounces: number,
): void {
  const color = getProjColor(bounceNum, maxBounces);
  const label = k.add([
    k.text(`×${bounceNum + 1}`, { size: 12 }),
    k.pos(pos.x + (Math.random() - 0.5) * 20, pos.y - 18),
    k.anchor("center"),
    k.color(color[0], color[1], color[2]),
    k.outline(1, k.rgb(20, 40, 80)),
    k.opacity(0.9),
    k.z(1000),
    { t: 0 },
  ]);
  label.onUpdate(() => {
    (label as any).t += k.dt();
    label.pos.y -= 28 * k.dt();
    if ((label as any).t > 0.3) {
      label.opacity = 0.9 * (1 - ((label as any).t - 0.3) / 0.4);
    }
    if ((label as any).t >= 0.7) label.destroy();
  });
}

// ===== Skill =====

registerSkill({
  id: "ricochet-shot",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["ricochet-shot"] ?? 1;
    const data = getLevelData(level);
    const origin = player.pos.clone();
    const speed = gameState.projectileSpeed * data.speedMul;
    const baseDamage = gameState.shotDamage;

    // Direção: movimento do jogador ou inimigo mais próximo
    const dir = getPlayerDirection(k, player);
    const dirUnit = k.vec2(dir.x, dir.y);
    const baseAngle = Math.atan2(dirUnit.y, dirUnit.x);

    // Spawn origin fora do player
    const halfSize =
      Math.max((player as any).width ?? 18, (player as any).height ?? 18) / 2;
    const margin = 8;
    const spawnOrigin = origin.add(dirUnit.scale(halfSize + margin));

    // Muzzle flash
    spawnMuzzleFlash(k, { x: spawnOrigin.x, y: spawnOrigin.y }, baseAngle);

    // Estado de ricochete
    const hitEnemies = new Set<GameObj>();
    let currentBounce = 0;
    const maxDist = k.width() * RICOCHET_CONFIG.maxRange;

    function launchBolt(
      fromPos: { x: number; y: number },
      target: GameObj,
      bounceIndex: number,
    ): void {
      const projColor = getProjColor(bounceIndex, data.bounces);
      const trailColor = getTrailColor(bounceIndex, data.bounces);
      const projDir = target.pos.sub(k.vec2(fromPos.x, fromPos.y)).unit();
      const projSpeed = speed * (1 - bounceIndex * 0.03); // levemente mais lento a cada quique
      const projSize = data.projSize - bounceIndex; // levemente menor a cada quique

      let trailTimer = 0;
      let alive = true;

      const p = k.add([
        k.rect(projSize, projSize),
        k.pos(fromPos.x, fromPos.y),
        k.color(projColor[0], projColor[1], projColor[2]),
        k.outline(2, k.rgb(200, 230, 255)),
        k.anchor("center"),
        k.rotate(45), // diamante
        k.area(),
        k.z(900),
        {
          id: "skill-ricochet",
          vel: projDir.scale(projSpeed),
          spawnPos: k.vec2(fromPos.x, fromPos.y),
          bounceIdx: bounceIndex,
        },
      ]);

      p.onUpdate(() => {
        if (!alive) return;
        p.move((p as any).vel);
        // Rotação contínua
        p.angle += RICOCHET_CONFIG.rotationSpeed * k.dt();
        // Trail
        trailTimer += k.dt();
        if (trailTimer >= RICOCHET_CONFIG.trailInterval) {
          trailTimer = 0;
          spawnTrail(k, { x: p.pos.x, y: p.pos.y }, trailColor, data.trailLife);
        }
        // Limite de alcance
        if (p.pos.dist((p as any).spawnPos) > maxDist) {
          alive = false;
          p.destroy();
        }
      });

      p.onCollide("enemy", (e: any) => {
        if (!alive) return;
        alive = false;

        // Calcular dano com falloff
        const dmgMul = Math.pow(data.damageFalloff, bounceIndex);
        const damage = Math.max(1, Math.round(baseDamage * dmgMul));

        if (typeof e.hp === "number") {
          e.hp -= damage;
          if (e.hp <= 0) e.destroy();
        }

        hitEnemies.add(e);
        const hitPos = { x: p.pos.x, y: p.pos.y };
        const isFinal = bounceIndex >= data.bounces - 1;

        // Efeitos visuais
        spawnRicochetHitEffect(k, hitPos, projColor, e, isFinal);
        spawnBounceLabel(k, hitPos, bounceIndex, data.bounces);

        // Tentar ricochetear para próximo inimigo
        if (!isFinal) {
          const nextTarget = findNearestEnemyInRadius(
            k,
            hitPos,
            data.bounceRadius,
            hitEnemies,
          );
          if (nextTarget) {
            // Linha visual de ricochete
            spawnBounceLine(
              k,
              hitPos,
              { x: nextTarget.pos.x, y: nextTarget.pos.y },
              projColor,
            );
            // Lançar próximo bolt com pequeno delay visual
            k.wait(0.04, () => {
              launchBolt(hitPos, nextTarget, bounceIndex + 1);
            });
          }
        }

        p.destroy();
      });

      p.onCollide("arena-wall", () => {
        if (!alive) return;
        alive = false;
        p.destroy();
      });
    }

    // Encontrar primeiro alvo
    const firstTarget = findNearestEnemy(k, spawnOrigin);
    if (!firstTarget) return;

    launchBolt({ x: spawnOrigin.x, y: spawnOrigin.y }, firstTarget, 0);
  },
});
