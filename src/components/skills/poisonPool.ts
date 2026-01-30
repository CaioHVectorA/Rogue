import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";

registerSkill({
  id: "poison-pool",
  getCooldown: () => 3500,
  use: ({ k, player }) => {
    const pools = 3;
    const size = 48;
    const duration = 4;
    for (let i = 0; i < pools; i++) {
      const offset = k.vec2((Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160);
      const pos = player.pos.add(offset);
      const pool = k.add([
        k.rect(size, size),
        k.pos(pos.x - size / 2, pos.y - size / 2),
        k.color(160, 60, 200),
        k.opacity(0.6),
        k.outline(2, k.rgb(255, 255, 255)),
        k.area(),
        { id: "skill-poison-pool", t: 0 },
      ]) as GameObj & { t: number };
      pool.onUpdate(() => { pool.t += k.dt(); if (pool.t >= duration) pool.destroy(); });
      pool.onCollide("enemy", (e: any) => {
        if (typeof e.hp === "number") {
          // simple DoT: 0.2 hp per tick
          e.hp -= 0.2;
          if (e.hp <= 0) e.destroy();
        }
      });
    }
  }
});