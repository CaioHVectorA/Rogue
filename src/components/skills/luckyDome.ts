import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

type LevelData = {
  cooldown: number;
  radius: number;
};

const LEVELS: LevelData[] = [
  { cooldown: 14000, radius: 150 },
  { cooldown: 13000, radius: 170 },
  { cooldown: 12000, radius: 190 },
  { cooldown: 11000, radius: 210 },
  { cooldown: 10000, radius: 230 },
];

function getLevelData(level: number): LevelData {
  const idx = Math.min(level, LEVELS.length) - 1;
  return LEVELS[Math.max(0, idx)];
}

registerSkill({
  id: "lucky-dome",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["lucky-dome"] ?? 1;
    const data = getLevelData(level);

    const domePos = player.pos.clone().add(
      (player.width ?? player.getSize?.().width ?? 32) / 2,
      (player.height ?? player.getSize?.().height ?? 32) / 2
    );

    // Golden dome visual circle
    const dome = k.add([
      k.circle(data.radius),
      k.pos(domePos.x, domePos.y),
      k.anchor("center"),
      k.color(234, 179, 8), // Yellow/Gold 500
      k.outline(3.5, k.rgb(254, 240, 138)), // Light Yellow 200
      k.opacity(0.12),
      k.z(95),
      {
        t: 0,
        duration: 6.0,
      }
    ]) as any;

    // Dome decoration elements
    const borderGlow = k.add([
      k.circle(data.radius + 8),
      k.pos(domePos.x, domePos.y),
      k.anchor("center"),
      k.color(250, 204, 21),
      k.opacity(0.04),
      k.z(94)
    ]);

    let luckBoosted = false;

    dome.onUpdate(() => {
      if (!dome.exists() || !player.exists()) return;
      const dt = k.dt();
      dome.t += dt;

      // Animate scales
      const scalePct = 1.0 + Math.sin(dome.t * 4) * 0.04;
      dome.scale = k.vec2(scalePct);

      // Sparkles floating inside
      if (Math.random() < 0.2) {
        const angle = Math.random() * Math.PI * 2;
        const d = Math.random() * data.radius * 0.85;
        k.add([
          k.text("🍀", { size: 10 }),
          k.pos(domePos.x + Math.cos(angle) * d, domePos.y + Math.sin(angle) * d),
          k.anchor("center"),
          k.color(253, 224, 71),
          k.opacity(0.7),
          k.z(400),
          k.lifespan(0.5, { fade: 0.3 })
        ]);
      }

      // Check if player is inside
      const pCenter = player.pos.add(
        (player.width ?? player.getSize?.().width ?? 32) / 2,
        (player.height ?? player.getSize?.().height ?? 32) / 2
      );
      const distToPlayer = pCenter.dist(domePos);
      const inside = distToPlayer < data.radius;

      if (inside && !luckBoosted) {
        luckBoosted = true;
        gameState.luck *= 3.0;

        // Floating feedback text
        const label = k.add([
          k.text("🍀 SORTE 3x!", { size: 12 }),
          k.pos(player.pos.x + 16, player.pos.y - 18),
          k.anchor("center"),
          k.color(250, 204, 21),
          k.outline(2, k.rgb(0, 0, 0)),
          k.z(1000),
          k.lifespan(1.0, { fade: 0.5 })
        ]);
        label.onUpdate(() => {
          label.pos.y -= 25 * k.dt();
        });
      } else if (!inside && luckBoosted) {
        luckBoosted = false;
        gameState.luck /= 3.0;
      }

      // Check incoming enemy bullets and delete 40% of them
      const bullets = k.get("enemy-bullet") as GameObj[];
      for (const b of bullets) {
        if (!b.exists()) continue;
        const dist = b.pos.dist(domePos);
        if (dist < data.radius) {
          if (!(b as any)._domeChecked) {
            (b as any)._domeChecked = true;
            if (Math.random() < 0.4) {
              // Destroy bullet and show miss feedback
              const missPos = b.pos.clone();
              b.destroy();

              // Floating MISS text
              const missLabel = k.add([
                k.text("🍀 DESVIADO!", { size: 11 }),
                k.pos(missPos.x, missPos.y - 12),
                k.anchor("center"),
                k.color(253, 224, 71),
                k.outline(2, k.rgb(0, 0, 0)),
                k.z(1000),
                k.lifespan(0.6, { fade: 0.3 })
              ]);
              missLabel.onUpdate(() => {
                missLabel.pos.y -= 30 * k.dt();
              });

              // Sparks
              addImpactFlash(k, missPos, [250, 204, 21], { size: 18, duration: 0.25 });
            }
          }
        }
      }

      // Expire dome
      if (dome.t >= dome.duration) {
        dome.destroy();
      }
    });

    dome.onDestroy(() => {
      if (luckBoosted) {
        gameState.luck /= 3.0;
      }
      if (borderGlow.exists()) borderGlow.destroy();
    });

    addImpactFlash(k, domePos, [234, 179, 8], { size: 48, duration: 0.4 });
  },
});
