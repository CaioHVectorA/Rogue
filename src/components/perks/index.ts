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
  onEnemyKilledPerkEffects,
  getSedeMultiplier,
  onPlayerDeathPerkEffects,
  onPlayerDamagedPerkEffects,
  getZonaDePerigoDamageMultiplier,
  getZonaDePerigoDamageReceivedMultiplier,
  onKillReduceQCooldown,
  updateMovementTracking,
  onKillWhileMovingReduceQ,
  onShotFiredReduceQ,
  shouldTriggerChainExplosion,
  onShotHitLigeirinho,
  onShotMissLigeirinho,
  getLigeirinhoSpeedBonus,
  getLigeirinhoReloadBonus,
  shouldPierceAfterQ,
  getPierceDamageFalloff,
  getShockDamageBonus,
  shouldShockExplode,
  applyImaMagneticoEffect,
  DANGER_ZONE_RADIUS,
} from "./perkEffects";
