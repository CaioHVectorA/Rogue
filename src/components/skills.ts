import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { gameState } from "../state/gameState";

export type SkillContext = {
  k: KAPLAYCtx;
  player: GameObj;
};

export type Skill = {
  id: string;
  use(ctx: SkillContext): void;
  getCooldown?(level: number): number;
};

function now() {
  return Date.now();
}

export {
  skillsRegistry,
  registerSkill,
  canUse,
  useSkill,
  addImpactFlash,
  initCharges,
  updateChargeRegen,
  getCharges,
  getEffectiveCooldown,
} from "./skills/registry";

// Import skill modules after exports to avoid TDZ on skillsRegistry
import "./skills/ricochetShot";
import "./skills/shockwave";
import "./skills/arcMine";
import "./skills/attackBuff";
import "./skills/boomerangBolt";
import "./skills/chainLightning";
import "./skills/orbitalOrbs";
import "./skills/poisonPool";
import "./skills/summonedTotem";

// New active skills
import "./skills/sniperShot";
import "./skills/tacticalRoll";
import "./skills/voidRift";
import "./skills/frostNova";
import "./skills/phoenixBurst";
import "./skills/juggernautRush";
import "./skills/baluarteShield";
import "./skills/luckyDome";
import "./skills/lifeTether";
import "./skills/timeBubble";

export {};
