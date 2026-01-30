import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";

registerSkill({
  id: "orbital-orbs",
  getCooldown: () => 6000,
  use: ({ k, player }) => {
    // Passive: ensure two orbs exist orbiting the player
    const ensureOrbit = (idx: number) => {
      const tag = `skill-orbital-${idx}`;
      const existing = (k.get(tag) as GameObj[])[0];
      if (existing) return existing;
      const orb = k.add([
        k.circle(8),
        k.pos(player.pos.x, player.pos.y),
        k.color(180, 220, 255),
        k.outline(2, k.rgb(255, 255, 255)),
        { id: tag, a: Math.random() * Math.PI * 2, r: 40, speed: 2.0 },
      ]) as GameObj & { a: number; r: number; speed: number };
      orb.onUpdate(() => {
        orb.a += orb.speed * k.dt();
        const ox = Math.cos(orb.a) * orb.r;
        const oy = Math.sin(orb.a) * orb.r;
        orb.pos = player.pos.add(k.vec2(ox, oy));
      });
      // Collide with enemies by area check using a small circle created on demand
      const hitProbe = k.add([
        k.circle(10),
        k.pos(orb.pos.x, orb.pos.y),
        k.color(0, 0, 0),
        k.opacity(0),
        k.area(),
        { id: `${tag}-probe` },
      ]) as GameObj;
      hitProbe.onUpdate(() => { hitProbe.pos = orb.pos.clone(); });
      hitProbe.onCollide("enemy", (e: any) => { if (typeof e.hp === "number") { e.hp -= 1; if (e.hp <= 0) e.destroy(); } });
      return orb;
    };

    const orb1 = ensureOrbit(1);
    const orb2 = ensureOrbit(2);
    // Active: speed boost for a short duration
    const boost = 3.5;
    const dur = 2.5;
    const endTime = Date.now() + dur * 1000;
    const original1 = orb1.speed;
    const original2 = orb2.speed;
    orb1.speed = original1 * boost;
    orb2.speed = original2 * boost;
    k.wait(dur, () => { orb1.speed = original1; orb2.speed = original2; });
  }
});