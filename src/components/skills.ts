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

export { skillsRegistry, registerSkill, canUse, useSkill, addImpactFlash } from "./skills/registry";

// Import skill modules after exports to avoid TDZ on skillsRegistry
import "./skills/coneShot";
import "./skills/ricochetShot";
import "./skills/shockwave";

export { };
