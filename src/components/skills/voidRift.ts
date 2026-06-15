import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

type LevelData = {
  cooldown: number;
  tickDamage: number;
  pullRadius: number;
};

const LEVELS: LevelData[] = [
  { cooldown: 8000, tickDamage: 3, pullRadius: 160 },
  { cooldown: 7500, tickDamage: 4, pullRadius: 180 },
  { cooldown: 7000, tickDamage: 5, pullRadius: 200 },
  { cooldown: 6500, tickDamage: 6, pullRadius: 220 },
  { cooldown: 6000, tickDamage: 8, pullRadius: 240 },
];

function getLevelData(level: number): LevelData {
  const idx = Math.min(level, LEVELS.length) - 1;
  return LEVELS[Math.max(0, idx)];
}

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

registerSkill({
  id: "void-rift",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["void-rift"] ?? 1;
    const data = getLevelData(level);

    // Target the nearest enemy (or player position if no enemies)
    const target = findNearestEnemy(k, player.pos);
    const riftPos = target ? target.pos.clone() : player.pos.clone().add(k.vec2(80, 0));

    // Spawn the Void Rift visual center
    const rift = k.add([
      k.circle(36),
      k.pos(riftPos.x, riftPos.y),
      k.anchor("center"),
      k.color(124, 58, 237), // Violet 600
      k.outline(3.5, k.rgb(196, 181, 253)),
      k.opacity(0.85),
      k.z(400),
      {
        t: 0,
        tickTimer: 0,
      }
    ]) as GameObj & { t: number; tickTimer: number };

    // Spin/pulse visual animation for the rift
    rift.onUpdate(() => {
      if (!rift.exists()) return;
      rift.t += k.dt();
      rift.tickTimer += k.dt();

      // Pulsing scale
      const pulse = 1.0 + Math.sin(rift.t * 8) * 0.15;
      rift.scale = k.vec2(pulse);

      // Spin particles
      if (Math.random() < 0.25) {
        const angle = Math.random() * Math.PI * 2;
        const orbitDist = k.rand(20, data.pullRadius);
        const p = k.add([
          k.circle(k.rand(2, 4)),
          k.pos(rift.pos.x + Math.cos(angle) * orbitDist, rift.pos.y + Math.sin(angle) * orbitDist),
          k.color(167, 139, 250),
          k.opacity(0.7),
          k.z(402),
          k.lifespan(0.4, { fade: 0.25 }),
          {
            vx: -Math.cos(angle) * 150,
            vy: -Math.sin(angle) * 150,
          }
        ]);
        p.onUpdate(() => {
          p.pos.x += p.vx * k.dt();
          p.pos.y += p.vy * k.dt();
        });
      }

      // 1. Pull enemies in radius
      const enemies = k.get("enemy") as GameObj[];
      const pullSpeed = 220;
      for (const e of enemies) {
        if (!e.exists()) continue;
        const dist = e.pos.dist(rift.pos);
        if (dist < data.pullRadius && dist > 5) {
          const pullDir = rift.pos.sub(e.pos).unit();
          e.move(pullDir.scale(pullSpeed * (1 - dist / data.pullRadius * 0.5)));
        }
      }

      // 2. Damage ticks every 0.5s
      if (rift.tickTimer >= 0.5) {
        rift.tickTimer -= 0.5;

        // Apply damage to all enemies inside the pull radius
        const finalDmg = Math.max(1, Math.round(data.tickDamage * gameState.castPower));
        for (const e of enemies) {
          if (!e.exists()) continue;
          const dist = e.pos.dist(rift.pos);
          if (dist < data.pullRadius) {
            if (typeof (e as any).hp === "number") {
              (e as any)._lastDamageType = "skill-rift";
              (e as any).hp -= finalDmg;
              if ((e as any).hp <= 0) e.destroy();
            }

            // Visual sparkles on tick hit
            if (e.exists()) {
              addImpactFlash(k, e.pos.clone(), [139, 92, 246], { target: e, size: 16, duration: 0.25 });
            }
          }
        }
      }

      // Expire after 3 seconds
      if (rift.t >= 3.0) {
        rift.destroy();
      }
    });

    // Spawn initial rift impact flash
    addImpactFlash(k, riftPos, [124, 58, 237], { size: 48, duration: 0.45 });
  },
});
