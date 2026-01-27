import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "../skills";

function findNearestEnemy(k: KAPLAYCtx, from: any): GameObj | null {
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

function findNearestEnemies(k: KAPLAYCtx, from: any, count: number, exclude?: GameObj): GameObj[] {
  const enemies = (k.get("enemy") as GameObj[]).filter(e => e !== exclude);
  enemies.sort((a, b) => from.dist(a.pos) - from.dist(b.pos));
  return enemies.slice(0, count);
}

registerSkill({
  id: "ricochet-shot",
  getCooldown: (level) => Math.max(1200, 2200 - level * 120),
  use: ({ k, player }) => {
    const origin = player.pos.clone();
    const speed = gameState.projectileSpeed * 1.5;
    const size = 14;
    const target = findNearestEnemy(k, origin);
    if (!target) return;
    const dir = target.pos.sub(origin).unit();
    const p = k.add([
      k.rect(size, size),
      k.pos(origin.x, origin.y),
      k.color(80, 160, 255),
      k.outline(2, k.rgb(255, 255, 255)),
      k.area(),
      { id: "skill-ricochet", vel: dir.scale(speed) },
    ]);
    p.onUpdate(() => {
      p.move((p as any).vel);
      if (p.pos.dist(origin) > k.width() * 2) p.destroy();
    });
    p.onCollide("enemy", (e: any) => {
      if (typeof e.hp === "number") {
        e.hp -= 2;
        if (e.hp <= 0) e.destroy();
      }
      const forks = findNearestEnemies(k, p.pos.clone(), 2, e);
      for (const f of forks) {
        const d = f.pos.sub(p.pos).unit();
        const child = k.add([
          k.rect(size - 4, size - 4),
          k.pos(p.pos.x, p.pos.y),
          k.color(120, 200, 255),
          k.outline(2, k.rgb(255, 255, 255)),
          k.area(),
          { id: "skill-ricochet-child", vel: d.scale(gameState.projectileSpeed * 1.4) },
        ]);
        child.onUpdate(() => {
          child.move((child as any).vel);
          if (child.pos.dist(origin) > k.width() * 2) child.destroy();
        });
        child.onCollide("enemy", (ee: any) => {
          if (typeof ee.hp === "number") {
            ee.hp -= 1;
            if (ee.hp <= 0) ee.destroy();
          }
          addImpactFlash(k, child.pos.clone(), [120, 200, 255], { target: ee, size: 18 });
          child.destroy();
        });
        child.onCollide("arena-wall", () => child.destroy());
      }
      addImpactFlash(k, p.pos.clone(), [80, 160, 255], { target: e, size: 22 });
      p.destroy();
    });
    p.onCollide("arena-wall", () => p.destroy());
  }
});
