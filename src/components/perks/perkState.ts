// ─── Perk State Management ──────────────────────────────
// Manages acquiring perks and runtime stacks.

import { gameState } from "../../state/gameState";
import { PERK_COST, MAX_PERKS, getPerkById } from "./perkData";

/**
 * Acquire a perk by ID. Returns true if successful.
 */
export function acquirePerk(perkId: string): boolean {
  const perks = gameState.perks;
  if (perks.acquired.length >= MAX_PERKS) return false;
  if (gameState.elevationPoints < PERK_COST) return false;
  if (perks.acquired.includes(perkId)) return false;

  gameState.elevationPoints -= PERK_COST;
  perks.acquired.push(perkId);
  return true;
}

/**
 * Check if a specific perk is active this run.
 */
export function hasPerk(perkId: string): boolean {
  return gameState.perks.acquired.includes(perkId);
}

/**
 * Get all acquired perk IDs.
 */
export function getAcquiredPerks(): string[] {
  return [...gameState.perks.acquired];
}

/**
 * Get a numeric stack value for a perk (e.g. sede-de-caca kill stacks).
 */
export function getPerkStacks(perkId: string): number {
  return gameState.perks.stacks[perkId] ?? 0;
}

/**
 * Add stacks to a perk.
 */
export function addPerkStacks(perkId: string, amount: number): void {
  gameState.perks.stacks[perkId] =
    (gameState.perks.stacks[perkId] ?? 0) + amount;
}

/**
 * Multiply stacks by a factor (e.g. lose 50% on death).
 */
export function multiplyPerkStacks(perkId: string, factor: number): void {
  const current = gameState.perks.stacks[perkId] ?? 0;
  gameState.perks.stacks[perkId] = Math.floor(current * factor);
}
