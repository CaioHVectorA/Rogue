import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

type LevelData = {
  cooldown: number;
  damage: number;
  radius: number;
};

const LEVELS: LevelData[] = [
  { cooldown: 7000, damage: 8, radius: 150 },
  { cooldown: 6500, damage: 11, radius: 170 },
  { cooldown: 6000, damage: 14, radius: 190 },
  { cooldown: 5500, damage: 18, radius: 210 },
  { cooldown: 5000, damage: 22, radius: 230 },
];

function getLevelData(level: number): LevelData {
  const idx = Math.min(level, LEVELS.length) - 1;
  return LEVELS[Math.max(0, idx)];
}

registerSkill({
  id: "frost-nova",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["frost-nova"] ?? 1;
    const data = getLevelData(level);

    const center = player.pos.add(
      (player.width ?? player.getSize?.().width ?? 32) / 2,
      (player.height ?? player.getSize?.().height ?? 32) / 2
    );

    // Freezing ring visual expansion
    const ring = k.add([
      k.circle(10),
      k.pos(center.x, center.y),
      k.color(147, 197, 253), // Blue 300
      k.outline(3.5, k.rgb(255, 255, 255)),
      k.opacity(0.85),
      k.z(450),
      { t: 0 },
    ]);

    const duration = 0.35;
    const hitEnemies = new Set<GameObj>();

    ring.onUpdate(() => {
      if (!ring.exists()) return;
      (ring as any).t += k.dt();
      const p = Math.min((ring as any).t / duration, 1);
      const currentRadius = 10 + p * (data.radius - 10);
      ring.use(k.circle(currentRadius));
      ring.opacity = 0.85 * (1 - p);

      // Ice crystals particles along the expanding ring
      if (Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const crystal = k.add([
          k.rect(k.rand(4, 8), k.rand(4, 8)),
          k.pos(center.x + Math.cos(angle) * currentRadius, center.y + Math.sin(angle) * currentRadius),
          k.anchor("center"),
          k.color(219, 234, 254),
          k.rotate(k.rand(0, 360)),
          k.opacity(0.8),
          k.z(451),
          k.lifespan(0.3, { fade: 0.2 }),
        ]);
      }

      // Check collision with enemies inside the wave radius
      const enemies = k.get("enemy") as GameObj[];
      const baseDmg = data.damage * gameState.castPower;

      for (const e of enemies) {
        if (!e.exists() || hitEnemies.has(e)) continue;
        const dist = e.pos.dist(center);
        if (dist <= currentRadius + 15) {
          hitEnemies.add(e);

          const isElite = (e.enemyType ?? "").endsWith("_elite");
          const defaultSpeed = (e as any).defaultSpeed ?? (e as any).speed ?? 120;
          const currentSpeed = e.speed ?? defaultSpeed;

          // Check if already slowed or poisoned
          const isSlowed = currentSpeed < defaultSpeed;
          const isPoisoned = (e as any).poisonStacks && (e as any).poisonStacks > 0;
          const alreadyImpaired = isSlowed || isPoisoned;

          // Apply damage
          const finalDmg = Math.max(1, Math.round(baseDmg));
          if (typeof (e as any).hp === "number") {
            (e as any)._lastDamageType = "skill-frost";
            (e as any).hp -= finalDmg;
            if ((e as any).hp <= 0) e.destroy();
          }

          if (e.exists()) {
            const prevColor = (e as any)._originalColor || e.color || k.rgb(255, 255, 255);

            if (alreadyImpaired) {
              // 1. FREEZE / STUN for 1.5 seconds
              (e as any)._isFrozen = true;
              e.speed = 0;
              e.color = k.rgb(224, 242, 254); // Icy white

              // Draw lock symbol above head
              const stunIcon = k.add([
                k.text("❄", { size: 14 }),
                k.pos(e.pos.x + (e.width ?? 30) / 2, e.pos.y - 12),
                k.anchor("center"),
                k.color(186, 230, 253),
                k.z(650)
              ]);

              const stunTimer = k.onUpdate(() => {
                if (!e.exists()) {
                  stunIcon.destroy();
                  stunTimer.cancel();
                  return;
                }
                stunIcon.pos.x = e.pos.x + (e.width ?? 30) / 2;
                stunIcon.pos.y = e.pos.y - 12;
              });

              k.wait(1.5, () => {
                stunTimer.cancel();
                stunIcon.destroy();
                if (e.exists()) {
                  (e as any)._isFrozen = false;
                  e.speed = defaultSpeed;
                  e.color = prevColor;
                }
              });

              // Freeze feedback flash
              addImpactFlash(k, e.pos.clone(), [224, 242, 254], { target: e, size: 28, duration: 0.35 });
            } else {
              // 2. SLOW by 50% for 3 seconds
              e.speed = defaultSpeed * 0.5;
              e.color = k.rgb(147, 197, 253); // Ice blue

              if ((e as any)._slowTimer) (e as any)._slowTimer.cancel();
              (e as any)._slowTimer = k.wait(3.0, () => {
                if (e.exists() && !(e as any)._isFrozen) {
                  e.speed = defaultSpeed;
                  e.color = prevColor;
                }
              });

              // Slow feedback flash
              addImpactFlash(k, e.pos.clone(), [147, 197, 253], { target: e, size: 20, duration: 0.25 });
            }
          }
        }
      }

      if (p >= 1) ring.destroy();
    });

    // Muzzle impact flash at player pos
    addImpactFlash(k, center, [147, 197, 253], { size: 36, duration: 0.3 });
  },
});
