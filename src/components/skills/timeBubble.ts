import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

type LevelData = {
  cooldown: number;
  duration: number;
  radius: number;
};

const LEVELS: LevelData[] = [
  { cooldown: 12000, duration: 5.0, radius: 160 },
  { cooldown: 11000, duration: 5.0, radius: 180 },
  { cooldown: 10000, duration: 5.0, radius: 200 },
  { cooldown: 9000, duration: 5.0, radius: 220 },
  { cooldown: 8000, duration: 5.0, radius: 240 },
];

function getLevelData(level: number): LevelData {
  const idx = Math.min(level, LEVELS.length) - 1;
  return LEVELS[Math.max(0, idx)];
}

registerSkill({
  id: "time-bubble",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["time-bubble"] ?? 1;
    const data = getLevelData(level);

    const bubblePos = player.pos.clone().add(
      (player.width ?? player.getSize?.().width ?? 32) / 2,
      (player.height ?? player.getSize?.().height ?? 32) / 2
    );

    // Visual circular dome for stasis field
    const bubble = k.add([
      k.circle(data.radius),
      k.pos(bubblePos.x, bubblePos.y),
      k.anchor("center"),
      k.color(129, 140, 248), // Indigo 400
      k.outline(3.5, k.rgb(199, 210, 254)), // Indigo 200
      k.opacity(0.14),
      k.z(95),
      {
        t: 0,
        duration: 5.0,
      }
    ]) as any;

    // Dome outer ring glow
    const borderGlow = k.add([
      k.circle(data.radius + 6),
      k.pos(bubblePos.x, bubblePos.y),
      k.anchor("center"),
      k.color(129, 140, 248),
      k.opacity(0.05),
      k.z(94)
    ]);

    bubble.onUpdate(() => {
      if (!bubble.exists()) return;
      const dt = k.dt();
      bubble.t += dt;

      // Pulsing scale animation
      const scalePct = 1.0 + Math.sin(bubble.t * 3.5) * 0.03;
      bubble.scale = k.vec2(scalePct);

      // Star / Clock visual particles inside stasis dome
      if (Math.random() < 0.16) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * data.radius * 0.85;
        k.add([
          k.text("⏱", { size: 11 }),
          k.pos(bubblePos.x + Math.cos(angle) * dist, bubblePos.y + Math.sin(angle) * dist),
          k.anchor("center"),
          k.color(199, 210, 254),
          k.opacity(0.65),
          k.z(400),
          k.lifespan(0.55, { fade: 0.25 })
        ]);
      }

      // Query and slow down all enemies & bullets inside the stasis radius
      const enemies = k.get("enemy") as GameObj[];
      const bullets = k.get("enemy-bullet") as GameObj[];
      const targets = [...enemies, ...bullets];

      for (const obj of targets) {
        if (!obj.exists()) continue;

        const objCenter = obj.pos.add(
          (obj.width ?? obj.getSize?.().width ?? 16) / 2,
          (obj.height ?? obj.getSize?.().height ?? 16) / 2
        );
        const distance = objCenter.dist(bubblePos);

        if (distance <= data.radius) {
          // Slow down object by 80% if not already slowed
          if (!obj._inTimeBubble) {
            obj._inTimeBubble = true;
            obj._originalColor = obj.color ? obj.color.clone() : undefined;
            obj.color = k.rgb(129, 140, 248);

            const originalMove = obj.move;
            obj._originalMove = originalMove;

            // Intercept move and scale input vectors by 0.2 (80% slow)
            obj.move = function(this: any, ...args: any[]) {
              if (args[0] && typeof args[0].scale === "function") {
                args[0] = args[0].scale(0.2);
              } else if (typeof args[0] === "number" && typeof args[1] === "number") {
                args[0] *= 0.2;
                args[1] *= 0.2;
              }
              return originalMove.apply(this, args);
            };
          }
        } else {
          // Restore movement if they leave the bubble
          if (obj._inTimeBubble && obj._originalMove) {
            obj.move = obj._originalMove;
            if (obj._originalColor) {
              obj.color = obj._originalColor;
            } else {
              obj.color = k.rgb(255, 255, 255);
            }
            obj._inTimeBubble = false;
          }
        }
      }

      if (bubble.t >= bubble.duration) {
        bubble.destroy();
      }
    });

    bubble.onDestroy(() => {
      // Find all objects in game and restore movement of any affected by stasis
      const enemies = k.get("enemy") as GameObj[];
      const bullets = k.get("enemy-bullet") as GameObj[];
      const all = [...enemies, ...bullets];

      for (const obj of all) {
        if (obj.exists() && obj._inTimeBubble && obj._originalMove) {
          obj.move = obj._originalMove;
          if (obj._originalColor) {
            obj.color = obj._originalColor;
          } else {
            obj.color = k.rgb(255, 255, 255);
          }
          obj._inTimeBubble = false;
        }
      }

      if (borderGlow.exists()) borderGlow.destroy();
    });

    // Initial cast explosion flash
    addImpactFlash(k, bubblePos, [129, 140, 248], { size: 48, duration: 0.4 });
  },
});
