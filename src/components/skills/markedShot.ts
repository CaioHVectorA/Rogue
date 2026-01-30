import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";

registerSkill({
  id: "marked-shot",
  getCooldown: () => 0,
  use: ({ k, player }) => {
    // Passive: attach a marker component to enemies when hit by player bullets
    // Implementation hook: intercept enemy onCollide with 'projectile' to add a mark flag.
    // Simple approach: add a global flag in k.context.
    (k as any)._markedShotActive = true;
    // Visual feedback
    const note = k.add([
      k.text("Marcado ativo", { size: 18 }),
      k.pos(player.pos.x + 20, player.pos.y - 40),
      k.color(255, 255, 255),
      { id: "skill-marked-shot-msg", life: 1.2 },
    ]) as GameObj & { life: number };
    note.onUpdate(() => { note.life -= k.dt(); if (note.life <= 0) note.destroy(); });
  }
});