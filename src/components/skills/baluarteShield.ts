import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

type LevelData = {
  cooldown: number;
  duration: number;
  width: number;
};

const LEVELS: LevelData[] = [
  { cooldown: 10000, duration: 4.0, width: 44 },
  { cooldown: 9500, duration: 4.5, width: 48 },
  { cooldown: 9000, duration: 5.0, width: 52 },
  { cooldown: 8500, duration: 5.5, width: 56 },
  { cooldown: 8000, duration: 6.0, width: 60 },
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

  // Find nearest enemy
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
  id: "baluarte-shield",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["baluarte-shield"] ?? 1;
    const data = getLevelData(level);

    const playerSize = Math.max(player.width ?? 32, player.height ?? 32);

    // Apply movement penalty
    player.speed = gameState.moveSpeed * 0.75;

    // Semicircular front shield object
    const shield = k.add([
      k.rect(data.width, 10, { radius: 3 }),
      k.pos(player.pos.clone()),
      k.anchor("center"),
      k.color(148, 163, 184), // Slate 400
      k.outline(2, k.rgb(255, 255, 255)),
      k.area(),
      k.z(500),
      "player-shield",
      { active: true }
    ]) as any;

    const updateShield = () => {
      if (!player.exists() || !shield.exists()) return;

      const dir = getPlayerDirection(k, player);
      const dirUnit = k.vec2(dir.x, dir.y);
      const angle = Math.atan2(dirUnit.y, dirUnit.x);

      // Position in front of the player
      const offsetDist = playerSize / 2 + 18;
      const playerCenter = player.pos.add(playerSize / 2, playerSize / 2);
      shield.pos = playerCenter.add(dirUnit.scale(offsetDist));
      shield.angle = k.rad2deg(angle) + 90; // perpendicular to direction

      // Pulsing effect
      shield.opacity = 0.8 + Math.sin(k.time() * 12) * 0.15;
    };

    shield.onUpdate(updateShield);
    updateShield();

    // Handle projectile reflection
    shield.onCollide("enemy-bullet", (bullet: any) => {
      if (!shield.active || !bullet.exists()) return;

      // Extract original details
      const bulletDmg = bullet.damage ?? 15;
      const origVel = bullet.vel ? bullet.vel.clone() : k.vec2(0, 0);

      // Reverse and amplify direction
      let reflectVel;
      if (origVel.len() > 0) {
        reflectVel = origVel.scale(-1.25);
      } else {
        const dir = getPlayerDirection(k, player);
        reflectVel = k.vec2(-dir.x, -dir.y).scale(gameState.projectileSpeed * 0.8);
      }

      // Destroy the enemy bullet
      bullet.destroy();

      // Spawn reflected friendly projectile
      const refDamage = Math.max(2, Math.round(bulletDmg * 0.5 * gameState.castPower));
      const refProj = k.add([
        k.rect(8, 8),
        k.pos(bullet.pos.clone()),
        k.color(56, 189, 248), // Sky blue 300
        k.outline(2, k.rgb(255, 255, 255)),
        k.area(),
        k.z(900),
        "projectile",
        {
          id: "projectile",
          vel: reflectVel,
          hitsLeft: 1,
          hitEnemies: new Set<any>(),
        }
      ]) as any;

      refProj.onUpdate(() => {
        refProj.move(refProj.vel);
        if (refProj.pos.dist(player.pos) > k.width() * 2) refProj.destroy();
      });

      refProj.onCollide("enemy", (e: any) => {
        if (!refProj.exists()) return;
        if (e.exists()) {
          if (typeof e.hp === "number") {
            e._lastDamageType = "reflected-projectile";
            e.hp -= refDamage;
            if (e.hp <= 0) e.destroy();
          }
          addImpactFlash(k, e.pos.clone(), [56, 189, 248], { target: e, size: 18, duration: 0.25 });
        }
        refProj.destroy();
      });

      refProj.onCollide("arena-wall", () => {
        refProj.destroy();
      });

      // Sparks visual on shield hit
      addImpactFlash(k, shield.pos.clone(), [255, 255, 255], { size: 16, duration: 0.25 });
    });

    // Cleanup and speed restore after duration
    k.wait(data.duration, () => {
      if (shield.exists()) shield.destroy();
      if (player.exists()) {
        player.speed = gameState.moveSpeed;
      }
    });

    // Initial shield activation glow
    addImpactFlash(k, player.pos.clone(), [148, 163, 184], { size: 36, duration: 0.3 });
  },
});
