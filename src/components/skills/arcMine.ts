import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";

registerSkill({
  id: "arc-mine",
  getCooldown: () => 3000,
  use: ({ k, player }) => {
    const count = 2;
    const radius = 60;
    const lifetime = 6;
    for (let i = 0; i < count; i++) {
      const offset = k.vec2((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120);
      const pos = player.pos.add(offset);
      const mine = k.add([
        k.circle(8),
        k.pos(pos.x, pos.y),
        k.color(120, 120, 255),
        k.outline(2, k.rgb(255, 255, 255)),
        k.area(),
        { id: "skill-arc-mine", t: 0 },
      ]) as GameObj & { t: number };

      const triggerArea = k.add([
        k.circle(radius),
        k.pos(pos.x, pos.y),
        k.color(0, 0, 0),
        k.opacity(0.1),
        k.area(),
        { id: "skill-arc-mine-area" },
      ]);

      triggerArea.onCollide("enemy", (e: any) => {
        // explode
        const explosion = k.add([
          k.circle(radius),
          k.pos(pos.x, pos.y),
          k.color(200, 200, 255),
          k.outline(3, k.rgb(255, 255, 255)),
          k.area(),
          { id: "skill-arc-mine-explosion", life: 0.2 },
        ]) as GameObj & { life: number };
        explosion.onUpdate(() => { explosion.life -= k.dt(); if (explosion.life <= 0) explosion.destroy(); });
        explosion.onCollide("enemy", (en: any) => { if (typeof en.hp === "number") { en.hp -= 3; if (en.hp <= 0) en.destroy(); } });
        mine.destroy(); triggerArea.destroy();
      });

      mine.onUpdate(() => { mine.t += k.dt(); if (mine.t >= lifetime) { mine.destroy(); triggerArea.destroy(); } });
    }
  }
});