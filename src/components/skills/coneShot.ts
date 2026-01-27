import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

// Skill 1: Tiro em cone (área)
registerSkill({
  id: "cone-shot",
  getCooldown: (level) => Math.max(800, 1600 - level * 100),
  use: ({ k, player }) => {
    const center = player.pos.clone();
    const baseCount = 3;
    const level = gameState.skills.levels["cone-shot"] ?? 1;
    const count = baseCount + Math.floor(level / 2);
    const arc = Math.PI / 3; // 60 graus
    const mouse = k.mousePos();
    let dir = mouse.sub(center);
    if (dir.len() === 0) dir = k.vec2(1, 0);
    const dirUnit = dir.unit();
    const baseAngle = Math.atan2(dirUnit.y, dirUnit.x);
    const halfSize = Math.max((player as any).width ?? 18, (player as any).height ?? 18) / 2;
    const margin = 6;
    const spawnOrigin = center.add(dirUnit.scale(halfSize + margin));

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = baseAngle + (-arc / 2 + t * arc);
      const unit = k.vec2(Math.cos(angle), Math.sin(angle));
      const speed = gameState.projectileSpeed * 0.9;
      const size = 10;
      const c = k.add([
        k.rect(size, size),
        k.pos(spawnOrigin.x, spawnOrigin.y),
        k.color(255, 120, 0),
        k.outline(2, k.rgb(255, 255, 255)),
        k.area(),
        { id: "skill-cone", vel: unit.scale(speed) },
      ]);
      c.onUpdate(() => {
        c.move((c as any).vel);
        if (c.pos.dist(spawnOrigin) > k.width() * 1.5) c.destroy();
      });
      c.onCollide("enemy", (e: any) => {
        if (typeof e.hp === "number") {
          e.hp -= 2;
          if (e.hp <= 0) e.destroy();
        }
        addImpactFlash(k, c.pos.clone(), [255, 120, 0], { target: e, size: 28, duration: 0.5 });
        c.destroy();
      });
      c.onCollide("arena-wall", () => c.destroy());
    }
  }
});
