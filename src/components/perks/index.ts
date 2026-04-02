// ─── Perks System – Public API ──────────────────────────

export {
  perkDefs,
  getPerkById,
  PERK_COST,
  MAX_PERKS,
  MIN_LEVEL_FOR_PERKS,
} from "./perkData";
export type { PerkDef, PerkCategory } from "./perkData";

export {
  acquirePerk,
  hasPerk,
  getAcquiredPerks,
  getPerkStacks,
  addPerkStacks,
  multiplyPerkStacks,
} from "./perkState";

export {
  canOpenPerkSelection,
  getAvailablePerks,
  samplePerks,
} from "./perkRules";

export {
  onKillReduceQCooldown,
  shouldTriggerChainExplosion,
  spawnChainExplosion,
  canTriggerSeismic,
  triggerSeismic,
  onShotHitLigeirinho,
  onShotMissLigeirinho,
  getLigeirinhoSpeedBonus,
  getLigeirinhoReloadBonus,
  getZonaDePerigoAttackMul,
  getZonaDePerigoDefenseMul,
  getShockDamageBonus,
  shouldShockExplode,
  triggerShockExplosion,
  applyImaMagneticoEffect,
  getEngenhariaRunicaBonusSlots,
  getEngenhariaRunicaDamageBonus,
} from "./perkEffects";
