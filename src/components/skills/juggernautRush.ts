import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

type LevelData = {
  cooldown: number;
  wallSlamDmgPct: number; // percentage of player Max HP
  normalDmgPct: number;
};

const LEVELS: LevelData[] = [
  { cooldown: 7500, wallSlamDmgPct: 0.12, normalDmgPct: 0.05 },
  { cooldown: 7000, wallSlamDmgPct: 0.15, normalDmgPct: 0.06 },
  { cooldown: 6500, wallSlamDmgPct: 0.18, normalDmgPct: 0.07 },
  { cooldown: 6000, wallSlamDmgPct: 0.22, normalDmgPct: 0.08 },
  { cooldown: 5500, wallSlamDmgPct: 0.26, normalDmgPct: 0.10 },
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

  // Fallback: direction towards cursor
  const playerScreenPos = k.toScreen(player.pos);
  const mousePos = k.mousePos();
  const diff = mousePos.sub(playerScreenPos);
  if (diff.len() > 0) {
    const unit = diff.unit();
    return { x: unit.x, y: unit.y };
  }

  return { x: 1, y: 0 };
}

registerSkill({
  id: "juggernaut-rush",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["juggernaut-rush"] ?? 1;
    const data = getLevelData(level);

    const dir = getPlayerDirection(k, player);
    const dirUnit = k.vec2(dir.x, dir.y);

    const rushSpeed = 1200;
    let rushTime = 0.4;
    let hitWall = false;

    // Grant temporary damage immunity during rush
    gameState.intangibleUntil = Date.now() + 400;

    // Visual red glow on player
    const originalColor = player.color?.clone?.() ?? k.rgb(255, 255, 255);
    player.color = k.rgb(239, 68, 68); // Red 500

    // Set of enemies being carried by the charge
    const carriedEnemies = new Set<GameObj>();
    const pSize = player.width ?? player.getSize?.().width ?? 32;

    const cancelRush = player.onUpdate(() => {
      rushTime -= k.dt();
      
      // Stop charge on timeout or if a wall is hit
      if (rushTime <= 0 || hitWall || !player.exists()) {
        cancelRush.cancel();
        if (player.exists()) {
          player.color = originalColor;
          
          // Slam enemies
          const baseSlamDmg = gameState.maxHealth * data.wallSlamDmgPct * gameState.castPower;
          const baseNormalDmg = gameState.maxHealth * data.normalDmgPct * gameState.castPower;
          const dmg = hitWall ? baseSlamDmg : baseNormalDmg;

          for (const e of carriedEnemies) {
            if (!e.exists()) continue;
            
            // Apply damage
            const finalDmg = Math.max(1, Math.round(dmg));
            if (typeof (e as any).hp === "number") {
              (e as any)._lastDamageType = "skill-rush";
              (e as any).hp -= finalDmg;
              if ((e as any).hp <= 0) e.destroy();
            }

            if (e.exists()) {
              // Push back
              e.pos = e.pos.add(dirUnit.scale(30));

              if (hitWall) {
                // Apply stun for 2 seconds
                const oldSpd = (e as any).defaultSpeed ?? e.speed ?? 120;
                e.speed = 0;
                e.color = k.rgb(254, 205, 211); // Rose red/white

                const stunIcon = k.add([
                  k.text("晕", { size: 12 }), // Or "X" to symbolize stun
                  k.pos(e.pos.x + (e.width ?? 30) / 2, e.pos.y - 12),
                  k.anchor("center"),
                  k.color(239, 68, 68),
                  k.z(650)
                ]);
                const stunTimer = k.onUpdate(() => {
                  if (!e.exists()) {
                    stunIcon.destroy();
                    stunTimer.cancel();
                    return;
                  }
                  stunIcon.pos.x = e.pos.x + (e.width ?? 30) / 2;
                  stunIcon.pos.y = e.pos.y - 12;
                });

                k.wait(2.0, () => {
                  stunTimer.cancel();
                  stunIcon.destroy();
                  if (e.exists()) {
                    e.speed = oldSpd;
                    const prevColor = (e as any)._originalColor || k.rgb(255, 60, 60);
                    e.color = prevColor;
                  }
                });
              }

              // Impact visual
              addImpactFlash(k, e.pos.clone(), [239, 68, 68], { target: e, size: 30, duration: 0.35 });
            }
          }
          
          if (hitWall) {
            k.shake(4.0);
            addImpactFlash(k, player.pos.clone(), [255, 255, 255], { size: 48, duration: 0.4 });
          }
          carriedEnemies.clear();
        }
        return;
      }

      // Move player forward
      player.move(dirUnit.scale(rushSpeed));

      // Ghost trail effect
      if (Math.random() < 0.5) {
        k.add([
          k.rect(pSize, pSize),
          k.pos(player.pos.clone()),
          k.color(239, 68, 68),
          k.opacity(0.3),
          k.z(450),
          k.lifespan(0.12, { fade: 0.08 })
        ]);
      }

      // Check for nearby enemies to carry along
      const enemies = k.get("enemy") as GameObj[];
      for (const e of enemies) {
        if (!e.exists()) continue;
        const dist = e.pos.dist(player.pos);
        if (dist < pSize + 10) {
          carriedEnemies.add(e);
        }
      }

      // Positions carried enemies directly in front of the player
      for (const e of carriedEnemies) {
        if (!e.exists()) {
          carriedEnemies.delete(e);
          continue;
        }
        e.pos = player.pos.add(dirUnit.scale(pSize / 2 + 10));
      }
    });

    // Detect wall collisions during rush
    const wallCollide = player.onCollide("arena-wall", () => {
      hitWall = true;
      wallCollide.cancel();
    });

    k.wait(0.4, () => {
      wallCollide.cancel();
    });

    addImpactFlash(k, player.pos.clone(), [239, 68, 68], { size: 36, duration: 0.25 });
  },
});
