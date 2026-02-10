import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

function findNearestEnemy(k: KAPLAYCtx, from: any): GameObj | null {
  const enemies = k.get("enemy") as GameObj[];
  if (!enemies || enemies.length === 0) return null;
  let nearest: GameObj | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const e of enemies) {
    const d = from.dist(e.pos);
    if (d < best) {
      best = d;
      nearest = e;
    }
  }
  return nearest;
}

function getPlayerDirection(
  k: KAPLAYCtx,
  player: GameObj,
): { x: number; y: number } {
  // Tenta detectar movimento pelas teclas
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

  // Se parado, vai na direção do inimigo mais próximo
  const nearestEnemy = findNearestEnemy(k, player.pos);
  if (nearestEnemy) {
    const dir = nearestEnemy.pos.sub(player.pos);
    if (dir.len() > 0) {
      const unit = dir.unit();
      return { x: unit.x, y: unit.y };
    }
  }

  // Fallback: direção para direita
  return { x: 1, y: 0 };
}

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

    // Direção baseada no movimento do player ou inimigo mais próximo
    const dir = getPlayerDirection(k, player);
    const dirUnit = k.vec2(dir.x, dir.y);

    const baseAngle = Math.atan2(dirUnit.y, dirUnit.x);
    const halfSize =
      Math.max((player as any).width ?? 18, (player as any).height ?? 18) / 2;
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
        addImpactFlash(k, c.pos.clone(), [255, 120, 0], {
          target: e,
          size: 28,
          duration: 0.5,
        });
        c.destroy();
      });
      c.onCollide("arena-wall", () => c.destroy());
    }
  },
});
