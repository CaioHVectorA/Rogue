import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { gameState } from "../../state/gameState";

export type SkillContext = {
  k: KAPLAYCtx;
  player: GameObj;
};

export type Skill = {
  id: string;
  use(ctx: SkillContext): void;
  getCooldown?(level: number): number;
  getMaxCharges?(level: number): number; // para skills com cargas
  canAlwaysUse?(): boolean; // permite usar mesmo em cooldown (ex: recall do bumerangue)
};

function now() {
  return Date.now();
}

export const skillsRegistry: Record<string, Skill> = {};

export function registerSkill(skill: Skill) {
  skillsRegistry[skill.id] = skill;
}

// Inicializa cargas de uma skill (chamar quando skill for equipada)
export function initCharges(skillId: string) {
  const skill = skillsRegistry[skillId];
  if (!skill?.getMaxCharges) return;

  const lvl = gameState.skills.levels[skillId] ?? 1;
  const maxCharges = skill.getMaxCharges(lvl);
  gameState.skills.maxCharges[skillId] = maxCharges;
  gameState.skills.charges[skillId] = maxCharges;
  gameState.skills.chargeRegenTimers[skillId] = 0;
}

// Atualiza regeneração de cargas (chamar no game loop)
export function updateChargeRegen(skillId: string) {
  const skill = skillsRegistry[skillId];
  if (!skill?.getMaxCharges) return;

  const lvl = gameState.skills.levels[skillId] ?? 1;
  const maxCharges = skill.getMaxCharges(lvl);
  const currentCharges = gameState.skills.charges[skillId] ?? maxCharges;
  const regenStartTime = gameState.skills.chargeRegenTimers[skillId] ?? 0;

  // Se já tem todas as cargas, não precisa regenerar
  if (currentCharges >= maxCharges) return;

  // Se não há timer ativo, não regenera
  if (regenStartTime === 0) return;

  const cd = skill.getCooldown?.(lvl) ?? 3000;

  // Verifica se passou tempo suficiente para regenerar uma carga
  if (now() - regenStartTime >= cd) {
    gameState.skills.charges[skillId] = currentCharges + 1;

    // Se ainda não está cheio, reinicia o timer para próxima carga
    if (currentCharges + 1 < maxCharges) {
      gameState.skills.chargeRegenTimers[skillId] = now();
    } else {
      gameState.skills.chargeRegenTimers[skillId] = 0;
    }
  }
}

// Retorna as cargas atuais de uma skill
export function getCharges(skillId: string): number {
  const skill = skillsRegistry[skillId];
  if (!skill?.getMaxCharges) return 1; // skill sem cargas sempre tem "1"

  const lvl = gameState.skills.levels[skillId] ?? 1;
  const maxCharges = skill.getMaxCharges(lvl);

  // Inicializa se não existir
  if (gameState.skills.charges[skillId] === undefined) {
    gameState.skills.charges[skillId] = maxCharges;
    gameState.skills.maxCharges[skillId] = maxCharges;
  }

  return gameState.skills.charges[skillId];
}

export function canUse(skillId: string): boolean {
  const skill = skillsRegistry[skillId];

  // Se a skill permite uso sempre (ex: recall do bumerangue)
  if (skill?.canAlwaysUse?.()) {
    return true;
  }

  // Skill com cargas
  if (skill?.getMaxCharges) {
    return getCharges(skillId) > 0;
  }

  // Skill normal (sem cargas)
  const last = gameState.skills.lastUsedAt[skillId] ?? 0;
  const lvl = gameState.skills.levels[skillId] ?? 1;
  const cd = skill?.getCooldown?.(lvl) ?? 3000;
  return now() - last >= cd;
}

export function useSkill(skillId: string, k: KAPLAYCtx, player: GameObj) {
  const skill = skillsRegistry[skillId];
  if (!skill) return;
  if (!canUse(skillId)) return;

  // Se é um uso via canAlwaysUse (ex: recall), apenas executa sem atualizar cooldown
  if (skill.canAlwaysUse?.()) {
    skill.use({ k, player });
    return;
  }

  skill.use({ k, player });

  // Skill com cargas
  if (skill.getMaxCharges) {
    const currentCharges = gameState.skills.charges[skillId] ?? 0;
    gameState.skills.charges[skillId] = currentCharges - 1;

    // Se não havia timer de regeneração ativo, inicia agora
    if (
      gameState.skills.chargeRegenTimers[skillId] === 0 ||
      gameState.skills.chargeRegenTimers[skillId] === undefined
    ) {
      gameState.skills.chargeRegenTimers[skillId] = now();
    }

    // Reseta o cooldown visual se ainda tem cargas
    if (gameState.skills.charges[skillId] > 0) {
      gameState.skills.lastUsedAt[skillId] = 0; // permite usar de novo imediatamente
    } else {
      gameState.skills.lastUsedAt[skillId] = now();
    }
  } else {
    // Skill normal
    gameState.skills.lastUsedAt[skillId] = now();
  }
}

// Visual helpers
export function addImpactFlash(
  k: KAPLAYCtx,
  pos: Vec2,
  color: [number, number, number],
  opts?: { target?: GameObj; size?: number; duration?: number },
) {
  const size = opts?.size ?? 24; // bigger by default
  const duration = opts?.duration ?? 0.45; // a bit longer
  const r = k.add([
    k.rect(size, size),
    k.pos(pos.x - size / 2, pos.y - size / 2),
    k.color(color[0], color[1], color[2]),
    k.outline(3, k.rgb(255, 255, 255)),
    k.z(1000),
    {
      id: "skill-flash",
      t: 0,
      follow: opts?.target,
      baseSize: size,
      opacity: 1,
    },
  ]) as GameObj & {
    t: number;
    follow?: GameObj;
    baseSize: number;
    opacity: number;
  };

  r.onUpdate(() => {
    r.t += k.dt();
    // Follow target if provided and not destroyed (guard isDestroyed presence)
    const f: any = r.follow;
    const isDestroyedFn =
      f && typeof f.isDestroyed === "function" ? f.isDestroyed : undefined;
    const targetAlive = f && (isDestroyedFn ? !isDestroyedFn.call(f) : true);
    if (targetAlive) {
      r.pos.x = f.pos.x - r.baseSize / 2;
      r.pos.y = f.pos.y - r.baseSize / 2;
    }
    // Ease scale up then down
    const progress = Math.min(r.t / duration, 1);
    const scaleUp =
      progress < 0.5 ? 1 + progress * 0.6 : 1.3 - (progress - 0.5) * 0.6;
    r.scale = k.vec2(scaleUp);
    // Fade out
    (r as any).opacity = 1 - progress;
    if (r.t >= duration) r.destroy();
  });
}
