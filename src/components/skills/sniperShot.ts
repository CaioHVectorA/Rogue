import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

type LevelData = {
  cooldown: number;
  damageMul: number;
  width: number;
};

const LEVELS: LevelData[] = [
  { cooldown: 4500, damageMul: 2.2, width: 6 },
  { cooldown: 4000, damageMul: 2.5, width: 8 },
  { cooldown: 3500, damageMul: 2.8, width: 10 },
  { cooldown: 3000, damageMul: 3.2, width: 12 },
  { cooldown: 2500, damageMul: 3.6, width: 14 },
];

function getLevelData(level: number): LevelData {
  const idx = Math.min(level, LEVELS.length) - 1;
  return LEVELS[Math.max(0, idx)];
}

function getPlayerDirection(k: KAPLAYCtx, player: GameObj): { x: number; y: number } {
  let moveX = 0;
  let moveY = 0;
  if (k.isKeyDown("a") || k.isKeyDown("left")) moveX -= 1;
  if (k.isKeyDown("d") || k.isKeyDown("right")) moveX += 1;
  if (k.isKeyDown("w") || k.isKeyDown("up")) moveY -= 1;
  if (k.isKeyDown("s") || k.isKeyDown("down")) moveY += 1;

  if (moveX !== 0 || moveY !== 0) {
    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    return { x: moveX / len, y: moveY / len };
  }

  // Find nearest enemy if standing still
  const enemies = k.get("enemy") as GameObj[];
  if (enemies && enemies.length > 0) {
    let nearest: GameObj | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const e of enemies) {
      const d = player.pos.dist(e.pos);
      if (d < best) {
        best = d;
        nearest = e;
      }
    }
    if (nearest) {
      const dir = nearest.pos.sub(player.pos);
      if (dir.len() > 0) {
        const unit = dir.unit();
        return { x: unit.x, y: unit.y };
      }
    }
  }

  return { x: 1, y: 0 };
}

registerSkill({
  id: "sniper-shot",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["sniper-shot"] ?? 1;
    const data = getLevelData(level);
    const origin = player.pos.clone();
    const dir = getPlayerDirection(k, player);
    const dirUnit = k.vec2(dir.x, dir.y);
    const angle = Math.atan2(dirUnit.y, dirUnit.x);

    // Initial position outside the player
    const halfSize = Math.max(player.width ?? 28, player.height ?? 28) / 2;
    const spawnPos = origin.add(dirUnit.scale(halfSize + 10));

    // Screen shake
    k.shake(2.5);

    // Laser visual line that fades quickly
    const lineLength = 1200;
    const endPos = spawnPos.add(dirUnit.scale(lineLength));

    // Laser beam visual
    const beam = k.add([
      k.rect(lineLength, data.width, { radius: data.width / 2 }),
      k.pos(spawnPos.x, spawnPos.y),
      k.rotate(k.rad2deg(angle)),
      k.color(34, 211, 238), // Cyan 400
      k.outline(3, k.rgb(255, 255, 255)),
      k.z(950),
      k.opacity(1),
      { t: 0 },
    ]);
    beam.onUpdate(() => {
      (beam as any).t += k.dt();
      const p = Math.min((beam as any).t / 0.2, 1);
      beam.opacity = 1 - p;
      if (p >= 1) beam.destroy();
    });

    // Muzzle effect
    addImpactFlash(k, spawnPos, [255, 255, 255], { size: 30, duration: 0.25 });

    // Collide with enemies along the line
    const enemies = k.get("enemy") as GameObj[];
    const hitList: { enemy: GameObj; dist: number }[] = [];

    // Find all enemies intersected by the laser line
    for (const e of enemies) {
      if (!e.exists()) continue;
      // Project enemy position onto the line segment
      const v = e.pos.sub(spawnPos);
      const proj = v.dot(dirUnit);
      if (proj < 0 || proj > lineLength) continue; // Out of segment bounds
      const closestPoint = spawnPos.add(dirUnit.scale(proj));
      const distToLine = e.pos.dist(closestPoint);
      if (distToLine < (e.width ?? 30) / 2 + data.width * 2) {
        hitList.push({ enemy: e, dist: proj });
      }
    }

    // Sort by distance from player to apply pierce damage falloff
    hitList.sort((a, b) => a.dist - b.dist);

    let pierceIndex = 0;
    const baseDmg = gameState.shotDamage * gameState.castPower * data.damageMul;

    for (const hit of hitList) {
      const e = hit.enemy;
      if (!e.exists()) continue;

      // Apply damage: decays 30% per pierced target
      const damageFactor = Math.pow(0.7, pierceIndex);
      const finalDmg = Math.max(1, Math.round(baseDmg * damageFactor));

      if (typeof (e as any).hp === "number") {
        (e as any)._lastDamageType = "skill-sniper";
        (e as any).hp -= finalDmg;
        if ((e as any).hp <= 0) e.destroy();
      }

      // Visual flash on hit
      addImpactFlash(k, e.pos.clone(), [34, 211, 238], { target: e, size: 24, duration: 0.3 });
      
      // Floating damage number
      const label = k.add([
        k.text(`${finalDmg}`, { size: 16 }),
        k.pos(e.pos.x, e.pos.y - 20),
        k.anchor("center"),
        k.color(34, 211, 238),
        k.outline(2, k.rgb(0, 50, 70)),
        k.z(1000),
        k.lifespan(0.6, { fade: 0.3 })
      ]);
      label.onUpdate(() => {
        label.pos.y -= 40 * k.dt();
      });

      pierceIndex++;
    }
  },
});
