// ─── Perk Rules ─────────────────────────────────────────
// Validates which perks can be picked given already-acquired perks.

import type { PerkDef } from "./perkData";
import {
  perkDefs,
  MAX_PERKS,
  MIN_LEVEL_FOR_PERKS,
  PERK_COST,
} from "./perkData";
import { gameState } from "../../state/gameState";

/**
 * Check if the player can open the perk selection screen at all.
 */
export function canOpenPerkSelection(): boolean {
  const acquired = gameState.perks?.acquired ?? [];
  return (
    gameState.level >= MIN_LEVEL_FOR_PERKS &&
    acquired.length < MAX_PERKS &&
    gameState.elevationPoints >= PERK_COST
  );
}

/**
 * Returns the list of perks the player is allowed to pick from,
 * respecting category exclusion rules.
 */
export function getAvailablePerks(): PerkDef[] {
  const acquired = gameState.perks?.acquired ?? [];
  const acquiredIds = new Set(acquired);

  // Collect categories already taken
  const takenCategories = new Set<string>();
  for (const id of acquired) {
    const def = perkDefs.find((p) => p.id === id);
    if (def) takenCategories.add(def.category);
  }

  return perkDefs.filter((p) => {
    // Can't pick same perk twice
    if (acquiredIds.has(p.id)) return false;

    // Max 1 reset perk per run
    if (p.category === "reset" && takenCategories.has("reset")) return false;

    // Max 1 stack infinito perk per run
    if (p.category === "stack" && takenCategories.has("stack")) return false;

    return true;
  });
}

/**
 * Pick N random perks from the available pool.
 */
export function samplePerks(count: number): PerkDef[] {
  const pool = [...getAvailablePerks()];
  const result: PerkDef[] = [];
  while (result.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}
