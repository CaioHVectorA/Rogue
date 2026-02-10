import type { GameObj, KAPLAYCtx } from "kaplay";
import { registerSkill } from "./registry";
import { gameState } from "../../state/gameState";
import { addPoisonStacks } from "./poison";

const POOL_CONFIG = {
  poolRadius: 70,           // raio grande
  baseDuration: 10,         // 10s base
  durationPerLevel: 3,      // +3s por nível
  spawnDistance: 110,        // distância do player
  stacksPerTick: 1,         // acúmulos por tick
  tickInterval: 0.8,        // aplica veneno a cada 0.8s
  slowPerLevel: [0.10, 0.15, 0.20, 0.25, 0.35], // slow menor por nível (1-5)
  bubbleInterval: 0.3,      // intervalo entre bolhas brotando
} as const;

function getDuration(level: number): number {
  return POOL_CONFIG.baseDuration + (level - 1) * POOL_CONFIG.durationPerLevel;
}

function getSlowFactor(level: number): number {
  const idx = Math.min(level, POOL_CONFIG.slowPerLevel.length) - 1;
  return POOL_CONFIG.slowPerLevel[idx];
}

function getPlayerCenter(k: KAPLAYCtx, player: GameObj): { x: number; y: number } {
  const size = player.getSize ? player.getSize() : { width: 60, height: 60 };
  return {
    x: player.pos.x + size.width / 2,
    y: player.pos.y + size.height / 2,
  };
}

/**
 * Direção da poça: inimigo mais próximo, ou pra cima se sem inimigos.
 */
function getPoolDirection(k: KAPLAYCtx, center: { x: number; y: number }): { x: number; y: number } {
  const enemies = k.get("enemy") as GameObj[];
  if (enemies.length === 0) {
    return { x: 0, y: -1 }; // pra cima
  }

  // Inimigo mais próximo
  let nearest = enemies[0];
  let bestDist = Infinity;
  for (const e of enemies) {
    const d = Math.hypot(e.pos.x - center.x, e.pos.y - center.y);
    if (d < bestDist) {
      bestDist = d;
      nearest = e;
    }
  }

  const dx = nearest.pos.x - center.x;
  const dy = nearest.pos.y - center.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: dx / len, y: dy / len };
}

/**
 * Cria a poça roxa com visual 2D bonito
 */
function createPool(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  level: number,
): void {
  const duration = getDuration(level);
  const slowFactor = getSlowFactor(level);
  const { poolRadius, stacksPerTick, tickInterval } = POOL_CONFIG;

  const enemiesInPool = new Set<GameObj>();
  const enemyTickTimers = new Map<GameObj, number>();

  // ===== Glow externo =====
  const glow = k.add([
    k.circle(poolRadius + 16),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(100, 30, 160),
    k.opacity(0.08),
    k.z(95),
    { id: "pool-glow", t: 0 },
  ]) as GameObj & { t: number };

  // ===== Poça principal =====
  const pool = k.add([
    k.circle(poolRadius),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(120, 40, 180),
    k.opacity(0),
    k.area({ shape: new k.Rect(k.vec2(-poolRadius, -poolRadius), poolRadius * 2, poolRadius * 2) }),
    k.z(96),
    { id: "poison-pool", t: 0, tickT: 0, duration },
  ]) as GameObj & { t: number; tickT: number; duration: number };

  // ===== Anel interno =====
  const innerRing = k.add([
    k.circle(poolRadius * 0.55),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(180, 80, 255),
    k.opacity(0.12),
    k.z(97),
    { id: "pool-inner", t: 0 },
  ]) as GameObj & { t: number };

  // ===== Segundo anel (mais interno, mais claro) =====
  const innerRing2 = k.add([
    k.circle(poolRadius * 0.3),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(210, 140, 255),
    k.opacity(0.08),
    k.z(97),
    { id: "pool-inner2", t: 1.5 },
  ]) as GameObj & { t: number };

  // ===== Borda =====
  const outline = k.add([
    k.circle(poolRadius - 2),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.outline(2, k.rgb(180, 100, 255)),
    k.color(0, 0, 0),
    k.opacity(0),
    k.z(98),
    { id: "pool-outline" },
  ]);

  // ===== Partículas de impacto =====
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10;
    const px = pos.x + Math.cos(angle) * poolRadius * 0.6;
    const py = pos.y + Math.sin(angle) * poolRadius * 0.6;
    const particle = k.add([
      k.circle(2.5 + Math.random() * 3),
      k.pos(px, py),
      k.anchor("center"),
      k.color(140 + Math.random() * 60, 60 + Math.random() * 40, 200 + Math.random() * 55),
      k.opacity(0.7),
      k.z(99),
      { id: "pool-spawn-particle", t: 0 },
    ]) as GameObj & { t: number };
    particle.onUpdate(() => {
      particle.t += k.dt();
      particle.pos.y -= 22 * k.dt();
      particle.opacity = 0.7 * (1 - particle.t / 0.5);
      particle.scale = k.vec2(1 - particle.t * 0.5);
      if (particle.t >= 0.5) particle.destroy();
    });
  }

  let bubbleTimer = 0;

  // ===== Update =====
  pool.onUpdate(() => {
    const dt = k.dt();
    pool.t += dt;

    // Fade in (0.4s)
    if (pool.t < 0.4) {
      const f = pool.t / 0.4;
      pool.opacity = 0.45 * f;
      glow.opacity = 0.08 * f;
      innerRing.opacity = 0.12 * f;
      innerRing2.opacity = 0.08 * f;
      outline.opacity = 0.2 * f;
    }

    // Fade out (últimos 2s)
    const timeLeft = duration - pool.t;
    if (timeLeft < 2) {
      const f = Math.max(0, timeLeft / 2);
      pool.opacity = 0.45 * f;
      glow.opacity = 0.08 * f;
      innerRing.opacity = 0.12 * f;
      innerRing2.opacity = 0.08 * f;
      outline.opacity = 0.2 * f;
    } else if (pool.t >= 0.4) {
      pool.opacity = 0.45;
      outline.opacity = 0.2;
    }

    // Animações
    glow.t += dt;
    const gPulse = 1 + Math.sin(glow.t * 1.8) * 0.06;
    glow.scale = k.vec2(gPulse, gPulse);
    const fadeM = timeLeft < 2 ? Math.max(0, timeLeft / 2) : 1;
    glow.opacity = (0.06 + Math.sin(glow.t * 1.3) * 0.03) * fadeM;

    innerRing.t += dt;
    const iPulse = 0.5 + Math.sin(innerRing.t * 2.5) * 0.12;
    innerRing.scale = k.vec2(iPulse, iPulse);
    innerRing.opacity = (0.10 + Math.sin(innerRing.t * 1.8) * 0.04) * fadeM;

    innerRing2.t += dt;
    const i2Pulse = 0.25 + Math.sin(innerRing2.t * 3.2) * 0.1;
    innerRing2.scale = k.vec2(i2Pulse, i2Pulse);
    innerRing2.opacity = (0.06 + Math.sin(innerRing2.t * 2.2) * 0.03) * fadeM;

    // Bolhas
    bubbleTimer += dt;
    if (bubbleTimer >= POOL_CONFIG.bubbleInterval && timeLeft > 1) {
      bubbleTimer -= POOL_CONFIG.bubbleInterval;
      spawnPoolBubble(k, pos, poolRadius);
    }

    // Inimigos na poça (distância circular 2D)
    const enemies = k.get("enemy") as GameObj[];
    const currentInPool = new Set<GameObj>();

    for (const enemy of enemies) {
      if (!enemy.exists()) continue;
      const eSize = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };
      const ecx = enemy.pos.x + eSize.width / 2;
      const ecy = enemy.pos.y + eSize.height / 2;
      const dx = ecx - pos.x;
      const dy = ecy - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= poolRadius) {
        currentInPool.add(enemy);

        if (!enemiesInPool.has(enemy)) {
          enemiesInPool.add(enemy);
          const e = enemy as any;
          if (typeof e.defaultSpeed === "number" && typeof e.speed === "number") {
            e.speed = e.defaultSpeed * (1 - slowFactor);
          }
        }

        const lastTick = enemyTickTimers.get(enemy) ?? 0;
        if (pool.t - lastTick >= tickInterval) {
          enemyTickTimers.set(enemy, pool.t);
          addPoisonStacks(k, enemy, stacksPerTick);
        }
      }
    }

    for (const enemy of enemiesInPool) {
      if (!currentInPool.has(enemy)) {
        enemiesInPool.delete(enemy);
        enemyTickTimers.delete(enemy);
        if (enemy.exists()) {
          const e = enemy as any;
          if (typeof e.defaultSpeed === "number") {
            e.speed = e.defaultSpeed;
          }
        }
      }
    }

    if (pool.t >= duration) {
      for (const enemy of enemiesInPool) {
        if (enemy.exists()) {
          const e = enemy as any;
          if (typeof e.defaultSpeed === "number") {
            e.speed = e.defaultSpeed;
          }
        }
      }
      enemiesInPool.clear();
      enemyTickTimers.clear();
      glow.destroy();
      innerRing.destroy();
      innerRing2.destroy();
      outline.destroy();
      pool.destroy();
    }
  });
}

/**
 * Bolha decorativa roxa (2D circular)
 */
function spawnPoolBubble(
  k: KAPLAYCtx,
  poolPos: { x: number; y: number },
  poolRadius: number,
): void {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * poolRadius * 0.7;
  const bx = poolPos.x + Math.cos(angle) * dist;
  const by = poolPos.y + Math.sin(angle) * dist;
  const size = 2 + Math.random() * 3;

  const bubble = k.add([
    k.circle(size),
    k.pos(bx, by),
    k.anchor("center"),
    k.color(140 + Math.random() * 60, 50 + Math.random() * 50, 200 + Math.random() * 55),
    k.opacity(0.45),
    k.z(100),
    { id: "pool-bubble", t: 0, maxLife: 0.6 + Math.random() * 0.6 },
  ]) as GameObj & { t: number; maxLife: number };

  const driftX = (Math.random() - 0.5) * 15;
  bubble.onUpdate(() => {
    bubble.t += k.dt();
    bubble.pos.y -= 22 * k.dt();
    bubble.pos.x += driftX * k.dt();
    const progress = bubble.t / bubble.maxLife;
    bubble.opacity = 0.45 * (1 - progress);
    bubble.scale = k.vec2(1 + progress * 0.5);
    if (bubble.t >= bubble.maxLife) bubble.destroy();
  });
}

registerSkill({
  id: "poison-pool",
  getCooldown: () => 8000,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["poison-pool"] ?? 1;
    const center = getPlayerCenter(k, player);
    const dir = getPoolDirection(k, center);

    const poolPos = {
      x: center.x + dir.x * POOL_CONFIG.spawnDistance,
      y: center.y + dir.y * POOL_CONFIG.spawnDistance,
    };

    // Onda roxa de cast
    const castRing = k.add([
      k.circle(30),
      k.pos(center.x, center.y),
      k.anchor("center"),
      k.color(140, 60, 220),
      k.outline(2, k.rgb(200, 130, 255)),
      k.opacity(0.4),
      k.z(200),
      { id: "pool-cast-ring", t: 0 },
    ]) as GameObj & { t: number };
    castRing.onUpdate(() => {
      castRing.t += k.dt();
      const p = Math.min(castRing.t / 0.3, 1);
      castRing.scale = k.vec2(0.5 + p * 3);
      castRing.opacity = 0.4 * (1 - p);
      if (castRing.t >= 0.3) castRing.destroy();
    });

    // Projétil roxo em arco
    const projectile = k.add([
      k.circle(6),
      k.pos(center.x, center.y),
      k.anchor("center"),
      k.color(160, 80, 255),
      k.outline(2, k.rgb(220, 160, 255)),
      k.opacity(0.9),
      k.z(200),
      { id: "pool-projectile", t: 0 },
    ]) as GameObj & { t: number };

    const travelTime = 0.25;
    let trailT = 0;

    projectile.onUpdate(() => {
      const dt = k.dt();
      projectile.t += dt;
      const p = Math.min(projectile.t / travelTime, 1);
      const arcHeight = -40 * Math.sin(p * Math.PI);
      projectile.pos.x = center.x + (poolPos.x - center.x) * p;
      projectile.pos.y = center.y + (poolPos.y - center.y) * p + arcHeight;
      projectile.scale = k.vec2(1 + p * 0.6);

      // Trail
      trailT += dt;
      if (trailT >= 0.025 && projectile.exists()) {
        trailT -= 0.025;
        const trail = k.add([
          k.circle(3),
          k.pos(projectile.pos.x, projectile.pos.y),
          k.anchor("center"),
          k.color(180, 100, 255),
          k.opacity(0.4),
          k.z(199),
          { id: "pool-trail", t: 0 },
        ]) as GameObj & { t: number };
        trail.onUpdate(() => {
          trail.t += k.dt();
          trail.opacity = 0.4 * (1 - trail.t / 0.2);
          if (trail.t >= 0.2) trail.destroy();
        });
      }

      if (p >= 1) {
        projectile.destroy();
        createPool(k, poolPos, level);
      }
    });
  },
});
