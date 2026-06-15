import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

type LevelData = {
  cooldown: number;
  damage: number;
  speed: number;
  size: number;
};

const LEVELS: LevelData[] = [
  { cooldown: 9000, damage: 16, speed: 450, size: 28 },
  { cooldown: 8500, damage: 20, speed: 475, size: 32 },
  { cooldown: 8000, damage: 25, speed: 500, size: 36 },
  { cooldown: 7500, damage: 30, speed: 525, size: 40 },
  { cooldown: 7000, damage: 40, speed: 550, size: 45 },
];

function getLevelData(level: number): LevelData {
  const idx = Math.min(level, LEVELS.length) - 1;
  return LEVELS[Math.max(0, idx)];
}

function getPlayerDirection(k: KAPLAYCtx, player: GameObj): { x: number; y: number } {
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

  // Find nearest enemy if standing still
  const enemies = k.get("enemy") as GameObj[];
  if (enemies && enemies.length > 0) {
    let nearest: GameObj | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const e of enemies) {
      const d = player.pos.dist(e.pos);
      if (d < best) {
        best = d;
        nearest = e;
      }
    }
    if (nearest) {
      const dir = nearest.pos.sub(player.pos);
      if (dir.len() > 0) {
        const unit = dir.unit();
        return { x: unit.x, y: unit.y };
      }
    }
  }

  return { x: 1, y: 0 };
}

function applyBurnStatus(k: KAPLAYCtx, enemy: GameObj, ticks: number, dmgPerTick: number) {
  if (!enemy.exists() || (enemy as any)._isBurning) return;
  (enemy as any)._isBurning = true;

  // Visual fire sparkles around burning enemy
  const fireSparkles: GameObj[] = [];
  const eSize = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };

  const burnTimer = k.onUpdate(() => {
    if (!enemy.exists()) {
      burnTimer.cancel();
      for (const s of fireSparkles) {
        if (s.exists()) s.destroy();
      }
      return;
    }
    // Spawn fire sparkle
    if (Math.random() < 0.3 && fireSparkles.length < 5) {
      const sp = k.add([
        k.circle(k.rand(2, 4)),
        k.pos(enemy.pos.x + k.rand(0, eSize.width), enemy.pos.y + k.rand(0, eSize.height)),
        k.color(249, 115, 22), // Orange 500
        k.opacity(0.8),
        k.z(510),
        k.lifespan(0.35, { fade: 0.2 })
      ]);
      fireSparkles.push(sp);
      sp.onUpdate(() => {
        sp.pos.y -= 15 * k.dt();
      });
      // Clean dead references
      k.wait(0.35, () => {
        const idx = fireSparkles.indexOf(sp);
        if (idx !== -1) fireSparkles.splice(idx, 1);
      });
    }
  });

  let currentTick = 0;
  const tickInterval = setInterval(() => {
    if (!enemy.exists() || currentTick >= ticks) {
      clearInterval(tickInterval);
      burnTimer.cancel();
      for (const s of fireSparkles) {
        if (s.exists()) s.destroy();
      }
      if (enemy.exists()) {
        (enemy as any)._isBurning = false;
      }
      return;
    }

    currentTick++;
    if (typeof (enemy as any).hp === "number") {
      (enemy as any)._lastDamageType = "burn";
      (enemy as any).hp -= dmgPerTick;
      if ((enemy as any).hp <= 0) {
        enemy.destroy();
        clearInterval(tickInterval);
      }
    }
  }, 1000);
}

function triggerCombustionExplosion(k: KAPLAYCtx, pos: any, baseDmg: number) {
  const radius = 180;
  const dmg = Math.round(baseDmg * 2.0);

  // Screen shake
  k.shake(3.5);

  // Large fire explosion visual circle
  const explosion = k.add([
    k.circle(radius),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(239, 68, 68), // Red 500
    k.outline(4, k.rgb(251, 146, 60)), // Orange 400
    k.opacity(0.8),
    k.z(500),
    { t: 0 }
  ]);

  explosion.onUpdate(() => {
    (explosion as any).t += k.dt();
    const p = Math.min((explosion as any).t / 0.45, 1);
    explosion.scale = k.vec2(p);
    explosion.opacity = 0.8 * (1 - p);
    if (p >= 1) explosion.destroy();
  });

  // Spawn fire smoke particles
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = k.rand(100, 240);
    const p = k.add([
      k.circle(k.rand(8, 16)),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(249, 115, 22),
      k.opacity(0.7),
      k.z(501),
      k.lifespan(0.5, { fade: 0.35 }),
      { vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd }
    ]);
    p.onUpdate(() => {
      p.pos.x += p.vx * k.dt();
      p.pos.y += p.vy * k.dt();
    });
  }

  // Damage and ignite enemies in radius
  const enemies = k.get("enemy") as GameObj[];
  for (const e of enemies) {
    if (!e.exists()) continue;
    if (e.pos.dist(pos) <= radius + 15) {
      if (typeof (e as any).hp === "number") {
        (e as any)._lastDamageType = "combustion";
        (e as any).hp -= dmg;
        if ((e as any).hp <= 0) e.destroy();
      }

      if (e.exists()) {
        applyBurnStatus(k, e, 4, 3);
        addImpactFlash(k, e.pos.clone(), [239, 68, 68], { target: e, size: 30, duration: 0.35 });
      }
    }
  }
}

function destroyPoisonPool(k: KAPLAYCtx, pool: GameObj) {
  const center = pool.pos.clone();
  // Find associated visual rings
  const glowObjs = k.get("pool-glow").concat(k.get("pool-inner"), k.get("pool-inner2"), k.get("pool-outline"));
  for (const obj of glowObjs) {
    if (obj.pos.dist(center) < 10) {
      obj.destroy();
    }
  }
  pool.destroy();
}

registerSkill({
  id: "phoenix-burst",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["phoenix-burst"] ?? 1;
    const data = getLevelData(level);

    const center = player.pos.add(
      (player.width ?? player.getSize?.().width ?? 32) / 2,
      (player.height ?? player.getSize?.().height ?? 32) / 2
    );
    const dir = getPlayerDirection(k, player);
    const dirUnit = k.vec2(dir.x, dir.y);
    const angle = Math.atan2(dirUnit.y, dirUnit.x);

    // Fire wave projectile
    const wave = k.add([
      k.rect(data.size, data.size * 2, { radius: 6 }),
      k.pos(center.x, center.y),
      k.anchor("center"),
      k.rotate(k.rad2deg(angle)),
      k.color(239, 68, 68), // Red 500
      k.outline(3.5, k.rgb(251, 146, 60)), // Orange 400
      k.area(),
      k.z(900),
      {
        id: "phoenix-wave",
        vel: dirUnit.scale(data.speed),
        spawnPos: center.clone(),
      }
    ]) as any;

    const hitEnemies = new Set<GameObj>();
    const baseDmg = data.damage * gameState.castPower;

    wave.onUpdate(() => {
      if (!wave.exists()) return;
      wave.move(wave.vel);

      // Leaves fire particles trail
      if (Math.random() < 0.4) {
        const trail = k.add([
          k.circle(k.rand(3, 6)),
          k.pos(wave.pos.x + k.rand(-10, 10), wave.pos.y + k.rand(-10, 10)),
          k.color(249, 115, 22),
          k.opacity(0.6),
          k.z(850),
          k.lifespan(0.25, { fade: 0.15 })
        ]);
        trail.onUpdate(() => {
          trail.pos.y -= 10 * k.dt();
        });
      }

      // Check collision with poison pools
      const pools = k.get("poison-pool") as GameObj[];
      for (const pool of pools) {
        if (pool.exists() && wave.pos.dist(pool.pos) < (pool.width ?? 140) / 2 + 20) {
          // Trigger explosion!
          const explosionCenter = pool.pos.clone();
          destroyPoisonPool(k, pool);
          triggerCombustionExplosion(k, explosionCenter, baseDmg);
          wave.destroy();
          return;
        }
      }

      // Expire if too far
      if (wave.pos.dist(wave.spawnPos) > k.width() * 1.5) {
        wave.destroy();
      }
    });

    wave.onCollide("enemy", (e: any) => {
      if (hitEnemies.has(e)) return;
      hitEnemies.add(e);

      // Damage
      const finalDmg = Math.max(1, Math.round(baseDmg));
      if (typeof e.hp === "number") {
        e._lastDamageType = "fire";
        e.hp -= finalDmg;
        if (e.hp <= 0) e.destroy();
      }

      if (e.exists()) {
        applyBurnStatus(k, e, 4, 2);
        addImpactFlash(k, e.pos.clone(), [249, 115, 22], { target: e, size: 24, duration: 0.3 });
      }
    });

    wave.onCollide("arena-wall", () => {
      if (wave.exists()) wave.destroy();
    });

    // Muzzle flash
    addImpactFlash(k, center.add(dirUnit.scale(20)), [239, 68, 68], { size: 30, duration: 0.2 });
  },
});
