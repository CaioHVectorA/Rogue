import type { GameObj, KAPLAYCtx } from "kaplay";
import { registerSkill, addImpactFlash } from "./registry";

function nearestEnemies(k: KAPLAYCtx, from: any, max: number, exclude: Set<GameObj>): GameObj[] {
  const enemies = (k.get("enemy") as GameObj[]).filter(e => !exclude.has(e));
  enemies.sort((a, b) => from.dist(a.pos) - from.dist(b.pos));
  return enemies.slice(0, max);
}

registerSkill({
  id: "chain-lightning",
  getCooldown: () => 2000,
  use: ({ k, player }) => {
    const origin = player.pos.clone();
    const firstTargets = nearestEnemies(k, origin, 1, new Set());
    if (firstTargets.length === 0) return;
    const maxJumps = 3;
    const hit = new Set<GameObj>();
    let current = firstTargets[0];
    for (let i = 0; i < maxJumps && current; i++) {
      hit.add(current);
      // damage
      if (typeof (current as any).hp === "number") {
        (current as any).hp -= 2;
        if ((current as any).hp <= 0) (current as any).destroy();
      }
      addImpactFlash(k, current.pos.clone(), [180, 240, 255], { target: current, size: 20, duration: 0.25 });
      // find next
      const next = nearestEnemies(k, current.pos.clone(), 1, hit)[0];
      current = next;
    }
  }
});