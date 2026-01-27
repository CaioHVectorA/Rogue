import type { GameObj } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "../skills";

registerSkill({
  id: "shockwave",
  getCooldown: (level) => Math.max(2000, 3000 - level * 150),
  use: ({ k, player }) => {
    const origin = player.pos.clone();
    const level = gameState.skills.levels["shockwave"] ?? 1;
    const finalRadius = 80 + level * 10;
    const duration = 0.4;
    const thickness = 4;
    const post_duration = 2;
    const wave = k.add([
      k.circle(finalRadius),
      k.pos(origin.x, origin.y),
      k.rgb(40, 0, 0),
      k.outline(thickness, k.rgb(255, 255, 255)),
      k.area({ collisionIgnore: ["player"] }),
      k.scale(0.01),
      k.z(-1),
      { id: "skill-shockwave", t: 0, duration, damaged: new Set<GameObj>() },
    ]) as GameObj & { t: number; duration: number; damaged: Set<GameObj> };

    wave.onUpdate(() => {
      wave.t += k.dt();
      wave.pos = player.pos.clone();
      wave.pos.x += 28;
      wave.pos.y += 28;
      const p = Math.min(1, wave.t / wave.duration);
      const s = Math.max(0.01, p);
      if (p >= 1) {
        if (wave.t >= wave.duration * post_duration) wave.destroy();
        return;
      }
      wave.scale = k.vec2(s);
      wave.color = k.rgb(40, 0, 0);
    });

    wave.onCollide("enemy", (e: any) => {
      // Damage only once per enemy per wave
      if (!wave.damaged.has(e)) {
        if (typeof e.hp === "number") {
          e.hp -= 2;
          if (e.hp <= 0) e.destroy();
        }
        wave.damaged.add(e);
      }

      // Longer single-impulse knockback (no stacking)
      const hasKB = !!(e as any)._kbActive;
      if (!hasKB) {
        const dir = e.pos.sub(player.pos).unit();
        const knockbackStrength = 120; // stronger push
        const kbDuration = 0.6; // longer push time
        const kbVel = dir.scale(knockbackStrength);
        // immediate displacement for feedback
        e.pos.x += kbVel.x * 0.15;
        e.pos.y += kbVel.y * 0.15;
        (e as any)._kbActive = true;
        (e as any)._kb = { vx: kbVel.x, vy: kbVel.y, t: 0 };
        const kbUpdate = () => {
          const kb = (e as any)._kb;
          if (!(e as any)._kbActive || !kb) return;
          kb.t += k.dt();
          const remaining = Math.max(0, kbDuration - kb.t);
          const factor = remaining / kbDuration;
          e.pos.x += kb.vx * factor * k.dt();
          e.pos.y += kb.vy * factor * k.dt();
          if (kb.t >= kbDuration) {
            (e as any)._kbActive = false;
            (e as any)._kb = null;
          }
        };
        if (!(e as any)._kbListenerAttached) {
          (e as any)._kbListenerAttached = true;
          e.onUpdate(kbUpdate);
        }
      }

      //addImpactFlash(k, e.pos.clone(), [255, 230, 0], { target: e, size: 24, duration: 0.5 });
    });
  }
});
