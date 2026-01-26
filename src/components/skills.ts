import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { gameState } from "../state/gameState";

export type SkillContext = {
  k: KAPLAYCtx,
  player: GameObj,
};

export type Skill = {
  id: string,
  use(ctx: SkillContext): void,
  getCooldown?(level: number): number,
};

function now() { return Date.now(); }

export const skillsRegistry: Record<string, Skill> = {};

export function registerSkill(skill: Skill) {
  skillsRegistry[skill.id] = skill;
}

export function canUse(skillId: string): boolean {
  const last = gameState.skills.lastUsedAt[skillId] ?? 0;
  const lvl = gameState.skills.levels[skillId] ?? 1;
  const cd = skillsRegistry[skillId]?.getCooldown?.(lvl) ?? 3000; // default 3s
  return (now() - last) >= cd;
}

export function useSkill(skillId: string, k: KAPLAYCtx, player: GameObj) {
  if (!skillsRegistry[skillId]) return;
  if (!canUse(skillId)) return;
  skillsRegistry[skillId].use({ k, player });
  gameState.skills.lastUsedAt[skillId] = now();
}

// Visual helpers
function addImpactFlash(k: KAPLAYCtx, pos: Vec2, color: [number, number, number]) {
  //const kab = k.addKaboom(pos, { scale: 1 });
  // Optional: additional flashy rectangles
  const r = k.add([k.rect(6, 6), k.pos(pos.x - 3, pos.y - 3), k.color(color[0], color[1], color[2]), k.outline(2), { id: "skill-flash" }]);
  k.wait(0.2, () => r.destroy());
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
    // Direção principal: do player até o mouse
    const mouse = k.mousePos();
    let dir = mouse.sub(center);
    if (dir.len() === 0) dir = k.vec2(1, 0);
    const dirUnit = dir.unit();
    const baseAngle = Math.atan2(dirUnit.y, dirUnit.x);
    // Origem na borda do jogador, na direção do mouse (com pequena margem)
    const halfSize = Math.max((player as any).width ?? 18, (player as any).height ?? 18) / 2;
    const margin = 6; // afasta um pouco da borda
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
          e.hp -= 2; // foco em dano
          if (e.hp <= 0) e.destroy();
        }
        addImpactFlash(k, c.pos.clone(), [255, 120, 0]);
        c.destroy();
      });
      c.onCollide("arena-wall", () => c.destroy());
    }
  }
});

// Skill 2: Tiro rápido, maior e com ricochete (fork em 2 inimigos próximos)
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
        e.hp -= 2; // dano elevado
        if (e.hp <= 0) e.destroy();
      }
      // Ricochetear: encontrar até 2 inimigos próximos e spawnar tiros em direção a eles
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
          addImpactFlash(k, child.pos.clone(), [120, 200, 255]);
          child.destroy();
        });
        child.onCollide("arena-wall", () => child.destroy());
      }
      addImpactFlash(k, p.pos.clone(), [80, 160, 255]);
      p.destroy();
    });
    p.onCollide("arena-wall", () => p.destroy());
  }
});

// Skill 3: Raio ao redor do jogador (dano em área)
registerSkill({
  id: "shockwave",
  getCooldown: (level) => Math.max(2000, 3000 - level * 150),
  use: ({ k, player }) => {
    const origin = player.pos.clone();
    const level = gameState.skills.levels["shockwave"] ?? 1;
    const finalRadius = 80 + level * 10;
    const duration = 0.4; // seconds
    const thickness = 4;
    const post_duration = 2;
    const wave = k.add([
      k.circle(finalRadius),
      k.pos(origin.x, origin.y),
      k.rgb(40, 0, 0),
      k.outline(thickness, k.rgb(255, 255, 255)),
      k.area({ collisionIgnore: ["player"] }),
      //k.opacity(0.4), // semi-transparente
      k.scale(0.01),  // começa pequeno e cresce
      k.z(-1),        // abaixo do player
      { id: "skill-shockwave", t: 0, duration },
    ]) as GameObj & { t: number; duration: number };

    wave.onUpdate(() => {
      wave.t += k.dt();
      wave.pos = player.pos.clone();
      wave.pos.x += 28
      wave.pos.y += 28
      const p = Math.min(1, wave.t / wave.duration);
      const s = Math.max(0.01, p);
      if (p >= 1) {
        if (wave.t >= wave.duration * post_duration) wave.destroy();
        return;
      };
      // acompanhar o player e manter no centro
      wave.scale = k.vec2(s);
      wave.color = k.rgb(40, 0, 0);
    });

    wave.onCollide("enemy", (e: any) => {
      if (typeof e.hp === "number") {
        e.hp -= 2;
        if (e.hp <= 0) e.destroy();
      }
      addImpactFlash(k, e.pos.clone(), [255, 230, 0]);
    });
  }
});

function findNearestEnemy(k: KAPLAYCtx, from: Vec2): GameObj | null {
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

function findNearestEnemies(k: KAPLAYCtx, from: Vec2, count: number, exclude?: GameObj): GameObj[] {
  const enemies = (k.get("enemy") as GameObj[]).filter(e => e !== exclude);
  enemies.sort((a, b) => from.dist(a.pos) - from.dist(b.pos));
  return enemies.slice(0, count);
}
