import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";

registerSkill({
  id: "attack-buff",
  getCooldown: () => 7000,
  use: ({ k, player }) => {
    // Simple global flags for demo: increase projectile speed and damage for a few seconds
    const dur = 3.5;
    (k as any)._attackBuff = { speedMul: 1.4, dmgPlus: 1 };
    const msg = k.add([
      k.text("Buff de Ataque", { size: 18 }),
      k.pos(player.pos.x + 16, player.pos.y - 50),
      k.color(255, 255, 255),
      { id: "skill-attack-buff-msg", life: dur },
    ]) as GameObj & { life: number };
    msg.onUpdate(() => { msg.life -= k.dt(); if (msg.life <= 0) msg.destroy(); });
    k.wait(dur, () => { (k as any)._attackBuff = null; });
  }
});