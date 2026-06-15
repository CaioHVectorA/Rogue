import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../../state/gameState";
import { registerSkill, addImpactFlash } from "./registry";

type LevelData = {
  cooldown: number;
  trapDamage: number;
};

const LEVELS: LevelData[] = [
  { cooldown: 6000, trapDamage: 12 },
  { cooldown: 5500, trapDamage: 16 },
  { cooldown: 5000, trapDamage: 20 },
  { cooldown: 4500, trapDamage: 25 },
  { cooldown: 4000, trapDamage: 30 },
];

function getLevelData(level: number): LevelData {
  const idx = Math.min(level, LEVELS.length) - 1;
  return LEVELS[Math.max(0, idx)];
}

function spawnTrap(k: KAPLAYCtx, pos: any, dmg: number) {
  const size = 10;
  const trap = k.add([
    k.circle(size),
    k.pos(pos),
    k.anchor("center"),
    k.color(14, 116, 144), // Cyan 700
    k.outline(2.5, k.rgb(255, 255, 255)),
    k.area(),
    k.z(490),
    "player-trap",
    { active: true }
  ]);

  trap.onCollide("enemy", (e: any) => {
    if (!trap.active || !e.exists()) return;
    trap.active = false;

    // Damage
    const finalDmg = Math.max(1, Math.round(dmg * gameState.castPower));
    if (typeof e.hp === "number") {
      e._lastDamageType = "skill-trap";
      e.hp -= finalDmg;
      if (e.hp <= 0) e.destroy();
    }

    // Stun for 1.5s
    if (e.exists() && !e._isStunnedByTrap) {
      e._isStunnedByTrap = true;
      const oldSpd = e.speed ?? e.defaultSpeed ?? 180;
      e.speed = 0;

      // Visual indicator above stunned enemy (stretching lock icon)
      const eSize = e.getSize ? e.getSize() : { width: 30, height: 30 };
      const stunIcon = k.add([
        k.text("🔒", { size: 12 }),
        k.pos(e.pos.x + eSize.width / 2, e.pos.y - 12),
        k.anchor("center"),
        k.z(650)
      ]);

      const stunTimer = k.onUpdate(() => {
        if (!e.exists()) {
          stunIcon.destroy();
          stunTimer.cancel();
          return;
        }
        stunIcon.pos.x = e.pos.x + eSize.width / 2;
        stunIcon.pos.y = e.pos.y - 12;
      });

      k.wait(1.5, () => {
        stunTimer.cancel();
        stunIcon.destroy();
        if (e.exists()) {
          e._isStunnedByTrap = false;
          e.speed = oldSpd;
        }
      });
    }

    // Impact flash
    addImpactFlash(k, trap.pos.clone(), [34, 211, 238], { size: 20, duration: 0.3 });
    trap.destroy();
  });

  // Expire trap after 6s
  k.wait(6.0, () => {
    if (trap.exists()) trap.destroy();
  });
}

registerSkill({
  id: "tactical-roll",
  getCooldown: (level) => getLevelData(level).cooldown,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["tactical-roll"] ?? 1;
    const data = getLevelData(level);

    // Calculate opposite direction of mouse
    const playerScreenPos = k.toScreen(player.pos);
    const mousePos = k.mousePos();
    let dir = playerScreenPos.sub(mousePos);
    if (dir.len() === 0) {
      dir = k.vec2(-1, 0); // fallback
    } else {
      dir = dir.unit();
    }

    const rollSpeed = 1600;
    let rollTime = 0.3;

    // Grant temporary immunity
    gameState.intangibleUntil = Date.now() + 300;

    // Change color during roll
    const originalColor = player.color?.clone?.() ?? k.rgb(255, 255, 255);
    player.color = k.rgb(180, 185, 195);

    let trapSpawns = [false, false, false];

    const cancelRoll = player.onUpdate(() => {
      rollTime -= k.dt();
      if (rollTime <= 0 || !player.exists()) {
        cancelRoll.cancel();
        if (player.exists()) {
          player.color = originalColor;
          if (player.instantReload) player.instantReload();
        }
        return;
      }

      // Move player
      player.move(dir.scale(rollSpeed));

      // Ghost trail effect
      const w = player.width ?? player.getSize?.().width ?? 32;
      const h = player.height ?? player.getSize?.().height ?? 32;
      const trail = k.add([
        k.rect(w, h),
        k.pos(player.pos.x, player.pos.y),
        k.color(180, 185, 195),
        k.opacity(0.35),
        k.z(450),
        k.lifespan(0.15, { fade: 0.1 }),
      ]);

      // Trap spawn milestones
      const elapsed = 0.3 - rollTime;
      if (elapsed >= 0.0 && !trapSpawns[0]) {
        trapSpawns[0] = true;
        spawnTrap(k, player.pos.clone(), data.trapDamage);
      } else if (elapsed >= 0.1 && !trapSpawns[1]) {
        trapSpawns[1] = true;
        spawnTrap(k, player.pos.clone(), data.trapDamage);
      } else if (elapsed >= 0.2 && !trapSpawns[2]) {
        trapSpawns[2] = true;
        spawnTrap(k, player.pos.clone(), data.trapDamage);
      }
    });
  },
});
