/**
 * Gold drop system with:
 * - Magnetism: gold is attracted to the player within a radius
 * - Expiration: gold disappears after 20 seconds
 * - Blinking: gold blinks when 5 seconds remain (at 15s mark)
 */
import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { gameState } from "../state/gameState";

const GOLD_LIFETIME = 20; // seconds before gold disappears
const GOLD_BLINK_START = 15; // seconds when blinking starts
const BASE_MAGNET_RADIUS = 80; // base attraction radius in pixels
const MAGNET_SPEED = 400; // speed of attraction movement
const MAGNET_PER_UPGRADE = 15; // extra radius per magnetRadius upgrade level

/** Get effective magnet radius based on upgrades and perks */
export function getEffectiveMagnetRadius(): number {
  const upgradeLv = (gameState.upgrades as any).magnetRadius ?? 0;
  let radius = BASE_MAGNET_RADIUS + upgradeLv * MAGNET_PER_UPGRADE;
  // +15% bonus at max level (10)
  if (upgradeLv >= 10) {
    radius = Math.floor(radius * 1.15);
  }
  // Perk: imã magnético doubles radius
  if (gameState.perks.acquired.includes("ima-magnetico")) {
    radius *= 2;
  }
  // Max-level magnet makes it effectively global
  if (upgradeLv >= 10) {
    radius = Math.max(radius, 9999);
  }
  return radius;
}

export function spawnGoldDrop(k: KAPLAYCtx, pos: Vec2, amount = 1): GameObj {
  const w = 10;
  const h = 6;
  const drop = k.add([
    k.rect(w, h),
    k.pos(pos.x - w / 2, pos.y - h / 2),
    k.area(),
    k.opacity(1),
    k.z(50),
    {
      id: "gold-drop",
      value: amount,
      age: 0, // time alive in seconds
      blinkT: 0, // blink timer
    },
  ]) as GameObj & { value: number; age: number; blinkT: number };

  drop.onUpdate(() => {
    if (!drop.exists()) return;
    drop.age += k.dt();

    // Destroy after lifetime
    if (drop.age >= GOLD_LIFETIME) {
      drop.destroy();
      return;
    }

    // Blinking effect when approaching expiration
    if (drop.age >= GOLD_BLINK_START) {
      drop.blinkT += k.dt();
      // Blink faster as time runs out
      const remaining = GOLD_LIFETIME - drop.age;
      const blinkRate = remaining < 2 ? 0.08 : remaining < 3 ? 0.12 : 0.2;
      drop.opacity =
        Math.sin((drop.blinkT / blinkRate) * Math.PI) > 0 ? 1 : 0.2;
    }

    // Magnetism: attract toward player
    const players = k.get("player");
    if (players.length > 0) {
      const player = players[0];
      const dist = drop.pos.dist(player.pos);
      const magnetR = getEffectiveMagnetRadius();
      if (dist < magnetR && dist > 2) {
        const dir = player.pos.sub(drop.pos).unit();
        // Accelerate as it gets closer
        const speedMul = 1 + (1 - dist / magnetR) * 2;
        drop.move(dir.scale(MAGNET_SPEED * speedMul));
      }
    }
  });

  return drop;
}

/** Destroy all gold drops currently in the scene */
export function destroyAllGoldDrops(k: KAPLAYCtx): void {
  const drops = k.get("gold-drop");
  for (const d of drops) {
    if (d.exists()) d.destroy();
  }
}
