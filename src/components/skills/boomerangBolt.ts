import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";

registerSkill({
  id: "boomerang-bolt",
  getCooldown: () => 2200,
  use: ({ k, player }) => {
    const origin = player.pos.clone();
    const mouse = k.mousePos();
    let dir = mouse.sub(origin);
    if (dir.len() === 0) dir = k.vec2(1, 0);
    const unit = dir.unit();
    const maxDist = 220;
    const speed = 340;
    const size = 10;
    const proj = k.add([
      k.rect(size, size),
      k.pos(origin.x, origin.y),
      k.color(255, 255, 100),
      k.outline(2, k.rgb(255, 255, 255)),
      k.area(),
      { id: "skill-boomerang", vel: unit.scale(speed), phase: "out", traveled: 0 },
    ]) as GameObj & { vel: any; phase: "out" | "back"; traveled: number };
    proj.onUpdate(() => {
      const step = proj.vel.scale(k.dt());
      proj.pos.x += step.x; proj.pos.y += step.y;
      proj.traveled += step.len();
      if (proj.phase === "out" && proj.traveled >= maxDist) {
        proj.phase = "back";
        const back = player.pos.sub(proj.pos).unit();
        proj.vel = back.scale(speed);
      }
      if (proj.phase === "back" && proj.pos.dist(player.pos) < 12) {
        proj.destroy();
      }
    });
    proj.onCollide("enemy", (e: any) => { if (typeof e.hp === "number") { e.hp -= 2; if (e.hp <= 0) e.destroy(); } });
    proj.onCollide("arena-wall", () => { if (proj.phase === "out") proj.phase = "back"; });
  }
});