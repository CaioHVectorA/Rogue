import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";

function nearestEnemy(k: any, from: any): GameObj | null {
  const enemies = k.get("enemy") as GameObj[];
  if (!enemies || enemies.length === 0) return null;
  let nearest: GameObj | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const e of enemies) {
    const d = from.dist(e.pos);
    if (d < best) { best = d; nearest = e; }
  }
  return nearest;
}

registerSkill({
  id: "summoned-totem",
  getCooldown: () => 5000,
  use: ({ k, player }) => {
    const pos = player.pos.add(k.vec2((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80));
    const life = 6;
    const totem = k.add([
      k.rect(20, 28),
      k.pos(pos.x - 10, pos.y - 14),
      k.color(200, 180, 80),
      k.outline(2, k.rgb(255, 255, 255)),
      k.area(),
      { id: "skill-totem", t: 0, hp: 5, fireCd: 0.6 },
    ]) as GameObj & { t: number; hp: number; fireCd: number };

    totem.onUpdate(() => {
      totem.t += k.dt();
      if (totem.t >= life) totem.destroy();
      (totem as any)._nextFire = ((totem as any)._nextFire ?? 0) - k.dt();
      if ((totem as any)._nextFire <= 0) {
        const target = nearestEnemy(k, totem.pos.clone());
        if (target) {
          const dir = target.pos.sub(totem.pos).unit();
          const b = k.add([
            k.rect(6, 6),
            k.pos(totem.pos.x, totem.pos.y),
            k.color(255, 220, 140),
            k.outline(1, k.rgb(255, 255, 255)),
            k.area(),
            { id: "skill-totem-bullet", vel: dir.scale(420) },
          ]);
          b.onUpdate(() => { b.move((b as any).vel); if (b.pos.dist(totem.pos) > k.width()) b.destroy(); });
          b.onCollide("enemy", (e: any) => { if (typeof e.hp === "number") { e.hp -= 1; if (e.hp <= 0) e.destroy(); } b.destroy(); });
          b.onCollide("arena-wall", () => b.destroy());
        }
        (totem as any)._nextFire = (totem.fireCd ?? 0.6);
      }
    });
  }
});