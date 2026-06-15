import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

type LevelData = {
  cooldown: number;
  duration: number;
  damagePerTick: number;
  maxRange: number;
};

const LEVELS: LevelData[] = [
  { cooldown: 11000, duration: 5.0, damagePerTick: 4, maxRange: 300 },
  { cooldown: 10500, duration: 5.0, damagePerTick: 6, maxRange: 320 },
  { cooldown: 10000, duration: 5.0, damagePerTick: 8, maxRange: 340 },
  { cooldown: 9500, duration: 5.0, damagePerTick: 10, maxRange: 360 },
  { cooldown: 9000, duration: 5.0, damagePerTick: 12, maxRange: 380 },
];

function getLevelData(level: number): LevelData {
  const idx = Math.min(level, LEVELS.length) - 1;
  return LEVELS[Math.max(0, idx)];
}

registerSkill({
  id: "life-tether",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["life-tether"] ?? 1;
    const data = getLevelData(level);

    // Find nearest enemy within range
    const enemies = k.get("enemy") as GameObj[];
    let target: GameObj | null = null;
    let bestDist = data.maxRange;

    const pCenter = player.pos.add(16, 16); // Player center (approx size 32)

    for (const e of enemies) {
      if (!e.exists()) continue;
      const eCenter = e.pos.add((e.width ?? 30) / 2, (e.height ?? 30) / 2);
      const d = pCenter.dist(eCenter);
      if (d < bestDist) {
        bestDist = d;
        target = e;
      }
    }

    if (!target) {
      // Fizzle effect: show warning label
      const label = k.add([
        k.text("Sem alvos!", { size: 12 }),
        k.pos(player.pos.x + 16, player.pos.y - 16),
        k.anchor("center"),
        k.color(244, 63, 94), // Rose 500
        k.outline(1.5, k.rgb(0, 0, 0)),
        k.z(900),
        k.lifespan(0.6, { fade: 0.2 }),
      ]);
      label.onUpdate(() => {
        label.pos.y -= 20 * k.dt();
      });
      return;
    }

    // Save target speed and color details
    const defaultTargetSpeed = (target as any).defaultSpeed ?? target.speed ?? 120;
    const prevTargetColor = (target as any)._originalColor || target.color || k.rgb(255, 255, 255);

    // Initial speed change
    target.speed = defaultTargetSpeed * 0.7;
    player.speed = gameState.moveSpeed * 1.3;
    target.color = k.rgb(244, 63, 94);

    // Create dark energy beam
    const beam = k.add([
      k.rect(1, 4),
      k.pos(pCenter),
      k.anchor("center"),
      k.color(236, 72, 153), // Pink 500
      k.outline(1.5, k.rgb(255, 255, 255)),
      k.opacity(0.85),
      k.z(450),
      {
        t: 0,
        tickTimer: 0,
      }
    ]) as any;

    let tetherBroken = false;
    function breakTether() {
      if (tetherBroken) return;
      tetherBroken = true;

      if (beam.exists()) beam.destroy();
      if (target && target.exists()) {
        target.speed = defaultTargetSpeed;
        target.color = prevTargetColor;
      }
      if (player.exists()) {
        player.speed = gameState.moveSpeed;
      }
    }

    beam.onUpdate(() => {
      if (!player.exists() || !target || !target.exists()) {
        breakTether();
        return;
      }

      const pCurrCenter = player.pos.add(16, 16);
      const tCurrCenter = target.pos.add((target.width ?? 30) / 2, (target.height ?? 30) / 2);
      const dist = pCurrCenter.dist(tCurrCenter);

      if (dist > data.maxRange) {
        breakTether();
        return;
      }

      // Update position (midpoint), dimensions and angle
      const cx = (pCurrCenter.x + tCurrCenter.x) / 2;
      const cy = (pCurrCenter.y + tCurrCenter.y) / 2;
      beam.pos = k.vec2(cx, cy);
      
      const width = dist;
      const height = 4 + Math.sin(k.time() * 20) * 1.5;
      beam.use(k.rect(width, height));
      
      beam.angle = k.rad2deg(Math.atan2(tCurrCenter.y - pCurrCenter.y, tCurrCenter.x - pCurrCenter.x));

      // Visual particles along the tether
      if (Math.random() < 0.25) {
        const progress = Math.random();
        const spawnPos = pCurrCenter.add(tCurrCenter.sub(pCurrCenter).scale(progress));
        k.add([
          k.circle(k.rand(2, 4.5)),
          k.pos(spawnPos),
          k.color(244, 63, 94), // Rose
          k.opacity(0.75),
          k.z(451),
          k.lifespan(0.3, { fade: 0.15 }),
        ]);
      }

      // Keep speed modifications enforced
      target.speed = defaultTargetSpeed * 0.7;
      player.speed = gameState.moveSpeed * 1.3;

      // Handle ticks every 0.5 seconds
      const dt = k.dt();
      beam.t += dt;
      beam.tickTimer += dt;

      if (beam.tickTimer >= 0.5) {
        beam.tickTimer -= 0.5;

        // Damage target
        const finalDmg = Math.max(1, Math.round(data.damagePerTick * gameState.castPower));
        if (typeof target.hp === "number") {
          target._lastDamageType = "skill-tether";
          target.hp -= finalDmg;
          if (target.hp <= 0) {
            target.destroy();
            breakTether();
            return;
          }
        }

        // Heal player
        const healAmt = Math.max(1, Math.round(2 * gameState.castPower));
        player.hp = Math.min(gameState.maxHealth, player.hp + healAmt);
        gameState.playerHealth = player.hp;

        if ((window as any).ui) {
          (window as any).ui.updateHearts(player.hp);
        }

        // Green healing spark on player, crimson damage spark on target
        addImpactFlash(k, player.pos.clone().add(16, 16), [34, 197, 94], { target: player, size: 24, duration: 0.25 });
        if (target.exists()) {
          addImpactFlash(k, target.pos.clone().add((target.width ?? 30) / 2, (target.height ?? 30) / 2), [244, 63, 94], { target: target, size: 20, duration: 0.25 });
        }
      }

      if (beam.t >= data.duration) {
        breakTether();
      }
    });

    beam.onDestroy(() => {
      breakTether();
    });

    // Muzzle flash on cast
    addImpactFlash(k, pCenter, [236, 72, 153], { size: 36, duration: 0.35 });
  },
});
