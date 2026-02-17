// ─── Perk Effects ───────────────────────────────────────
// Runtime effect calculations based on acquired perks.

import {
  hasPerk,
  getPerkStacks,
  addPerkStacks,
  multiplyPerkStacks,
} from "./perkState";
import { gameState } from "../../state/gameState";

// ── Sede de Caça: +1% dano permanente por kill ──
export function onEnemyKilledPerkEffects(): void {
  if (hasPerk("sede-de-caca")) {
    addPerkStacks("sede-de-caca", 1);
  }
}

/**
 * Get the bonus damage multiplier from Sede de Caça.
 * E.g. 50 stacks = 1.5x multiplier (50% bonus).
 */
export function getSedeMultiplier(): number {
  if (!hasPerk("sede-de-caca")) return 1.0;
  const stacks = getPerkStacks("sede-de-caca");
  return 1.0 + stacks * 0.01;
}

/**
 * Called when the player dies — lose 50% of Sede de Caça stacks.
 */
export function onPlayerDeathPerkEffects(): void {
  if (hasPerk("sede-de-caca")) {
    multiplyPerkStacks("sede-de-caca", 0.5);
  }
}

// ── Aprendizado Doloroso: +0.5% Vida Máxima por dano recebido ──
let _lastDamageTime = 0;
const CONSECUTIVE_PENALTY_MS = 500; // 0.5s

export function onPlayerDamagedPerkEffects(): void {
  if (!hasPerk("aprendizado-doloroso")) return;

  const now = Date.now();
  const timeSinceLast = now - _lastDamageTime;
  _lastDamageTime = now;

  // Eficiência reduzida se receber dano consecutivo
  const efficiency = timeSinceLast < CONSECUTIVE_PENALTY_MS ? 0.25 : 1.0;
  const hpGain = gameState.maxHealth * 0.005 * efficiency;

  addPerkStacks("aprendizado-doloroso", 1);
  gameState.maxHealth = Math.floor(gameState.maxHealth + hpGain);
}

// ── Zona de Perigo: +5% dano / +3% dano recebido por inimigo próximo ──
const DANGER_ZONE_RADIUS = 200;

export function getZonaDePerigoDamageMultiplier(
  nearbyEnemyCount: number,
): number {
  if (!hasPerk("zona-de-perigo")) return 1.0;
  return 1.0 + nearbyEnemyCount * 0.05;
}

export function getZonaDePerigoDamageReceivedMultiplier(
  nearbyEnemyCount: number,
): number {
  if (!hasPerk("zona-de-perigo")) return 1.0;
  return 1.0 + nearbyEnemyCount * 0.03;
}

export { DANGER_ZONE_RADIUS };

// ── Execução Limpa: matar reduz CD de Q em 40%, elite/campeão = 100% ──
export function onKillReduceQCooldown(isElite: boolean = false): void {
  if (!hasPerk("execucao-limpa")) return;
  const skillId = gameState.skills.skill1;
  if (!skillId) return;

  const lastUsed = gameState.skills.lastUsedAt[skillId] ?? 0;
  if (lastUsed === 0) return;

  if (isElite) {
    // Full reset
    gameState.skills.lastUsedAt[skillId] = 0;
  } else {
    // Reduce remaining cooldown by 40%
    const now = Date.now();
    const elapsed = now - lastUsed;
    const reduction = elapsed * 0.4;
    gameState.skills.lastUsedAt[skillId] = lastUsed - Math.floor(reduction);
  }
}

// ── Não Olhe Para Trás: matar enquanto se move reduz CD de Q em 25% ──
let _lastStationaryTime = 0;
let _wasMoving = false;

export function updateMovementTracking(isMoving: boolean): void {
  if (!hasPerk("nao-olhe-para-tras")) return;
  if (!isMoving) {
    _lastStationaryTime = Date.now();
    _wasMoving = false;
  } else {
    _wasMoving = true;
  }
}

export function onKillWhileMovingReduceQ(): void {
  if (!hasPerk("nao-olhe-para-tras")) return;
  if (!_wasMoving) return;
  const now = Date.now();
  if (now - _lastStationaryTime < 500) return; // parado recentemente

  const skillId = gameState.skills.skill1;
  if (!skillId) return;
  const lastUsed = gameState.skills.lastUsedAt[skillId] ?? 0;
  if (lastUsed === 0) return;

  const elapsed = now - lastUsed;
  const reduction = elapsed * 0.25;
  gameState.skills.lastUsedAt[skillId] = lastUsed - Math.floor(reduction);
}

// ── Ciclo Vicioso: cada tiro reduz CD de Q em 20% do valor restante ──
let _lastCicloTime = 0;
const CICLO_PENALTY_MS = 300;

export function onShotFiredReduceQ(): void {
  if (!hasPerk("ciclo-vicioso")) return;
  const skillId = gameState.skills.skill1;
  if (!skillId) return;

  const now = Date.now();
  const lastUsed = gameState.skills.lastUsedAt[skillId] ?? 0;
  if (lastUsed === 0) return;

  // Eficiência reduzida por 0.3s
  const timeSinceLast = now - _lastCicloTime;
  _lastCicloTime = now;
  const efficiency = timeSinceLast < CICLO_PENALTY_MS ? 0.5 : 1.0;

  const remaining = now - lastUsed;
  const reduction = remaining * 0.2 * efficiency;
  gameState.skills.lastUsedAt[skillId] = lastUsed - Math.floor(reduction);
}

// ── Reação em Cadeia: 10% chance de explosão ──
export function shouldTriggerChainExplosion(): boolean {
  if (!hasPerk("reacao-em-cadeia")) return false;
  return Math.random() < 0.1;
}

// ── Ligeirinho: tiros acertados dão vel. mov., errar reseta ──
let _ligeirinhoStacks = 0;
const LIGEIRINHO_MAX = 5;

export function onShotHitLigeirinho(): void {
  if (!hasPerk("ligeirinho")) return;
  _ligeirinhoStacks = Math.min(_ligeirinhoStacks + 1, LIGEIRINHO_MAX);
}

export function onShotMissLigeirinho(): void {
  if (!hasPerk("ligeirinho")) return;
  _ligeirinhoStacks = 0;
}

export function getLigeirinhoSpeedBonus(): number {
  if (!hasPerk("ligeirinho")) return 0;
  return _ligeirinhoStacks * 0.04; // 4% per stack
}

export function getLigeirinhoReloadBonus(): number {
  if (!hasPerk("ligeirinho")) return 0;
  return getLigeirinhoSpeedBonus() * 0.1; // 10% of speed bonus
}

// ── Diga Onde Você Vai: 3s pós Q, tiros atravessam ──
export function shouldPierceAfterQ(): boolean {
  if (!hasPerk("diga-onde-voce-vai")) return false;
  const skillId = gameState.skills.skill1;
  if (!skillId) return false;
  const lastUsed = gameState.skills.lastUsedAt[skillId] ?? 0;
  return Date.now() - lastUsed < 3000;
}

export function getPierceDamageFalloff(pierceCount: number): number {
  // Each pierce: -20% damage
  return Math.max(0, 1.0 - pierceCount * 0.2);
}

// ── Sobrecarga Elétrica: bonus dano para inimigos com choque ──
export function getShockDamageBonus(shockStacks: number): number {
  if (!hasPerk("sobrecarga-eletrica")) return 1.0;
  return 1.0 + shockStacks * 0.05; // +5% per shock stack
}

export function shouldShockExplode(shockStacks: number): boolean {
  if (!hasPerk("sobrecarga-eletrica")) return false;
  return shockStacks >= 10;
}

// ── Imã Magnético: dobra raio do imã, +0.3 sorte ──
// Luck bonus is applied once when perk is acquired via applyImaMagneticoEffect()
export function applyImaMagneticoEffect(): void {
  if (!hasPerk("ima-magnetico")) return;
  gameState.luck = Number((gameState.luck + 0.3).toFixed(2));
}

// Magnet radius doubling is handled directly in gold.ts
