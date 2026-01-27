import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { gameState } from "../../state/gameState";

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
export function addImpactFlash(
  k: KAPLAYCtx,
  pos: Vec2,
  color: [number, number, number],
  opts?: { target?: GameObj, size?: number, duration?: number }
) {
  const size = (opts?.size ?? 24); // bigger by default
  const duration = opts?.duration ?? 0.45; // a bit longer
  const r = k.add([
    k.rect(size, size),
    k.pos(pos.x - size / 2, pos.y - size / 2),
    k.color(color[0], color[1], color[2]),
    k.outline(3, k.rgb(255, 255, 255)),
    k.z(1000),
    { id: "skill-flash", t: 0, follow: opts?.target, baseSize: size, opacity: 1 },
  ]) as GameObj & { t: number; follow?: GameObj; baseSize: number; opacity: number };

  r.onUpdate(() => {
    r.t += k.dt();
    // Follow target if provided and not destroyed (guard isDestroyed presence)
    const f: any = r.follow;
    const isDestroyedFn = f && typeof f.isDestroyed === "function" ? f.isDestroyed : undefined;
    const targetAlive = f && (isDestroyedFn ? !isDestroyedFn.call(f) : true);
    if (targetAlive) {
      r.pos.x = f.pos.x - r.baseSize / 2;
      r.pos.y = f.pos.y - r.baseSize / 2;
    }
    // Ease scale up then down
    const progress = Math.min(r.t / duration, 1);
    const scaleUp = progress < 0.5 ? (1 + progress * 0.6) : (1.3 - (progress - 0.5) * 0.6);
    r.scale = k.vec2(scaleUp);
    // Fade out
    (r as any).opacity = 1 - progress;
    if (r.t >= duration) r.destroy();
  });
}
