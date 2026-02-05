import { waves } from "./waves";
import { upgrades } from "./upgrades";
import { debug } from "./debug";

// Exponential XP requirement: base and growth factor
function xpRequiredFor(level: number) {
  const base = 10; // base XP for level 1
  const factor = 1.25; // 25% more per level
  return Math.floor(base * Math.pow(factor, Math.max(0, level - 1)));
}

export type GameState = {
  moveSpeed: number;
  reloadSpeed: number;
  reloadMovePenalty: number;
  maxHealth: number;
  cooldown: number;
  luck: number;
  wave: number;
  gold: number;
  xp: number;
  level: number;
  xpToLevel: number;
  playerHealth: number;
  enemyDamageCooldownMs: number;
  waves: typeof waves;
  projectileSpeed: number;
  upgrades: typeof upgrades;
  // Skills
  skills: {
    skill1?: string;
    skill2?: string;
    ultimate?: string;
    levels: { [key: string]: number };
    cooldowns: { [key: string]: number };
    lastUsedAt: { [key: string]: number };
    charges: { [key: string]: number }; // cargas atuais
    maxCharges: { [key: string]: number }; // cargas máximas
    chargeRegenTimers: { [key: string]: number }; // timestamp de quando começou a regenerar
  };
  // Multiplicadores de buff (valores base = 1.0)
  buffs: {
    damageMul: number;      // multiplicador de dano
    reloadSpeedMul: number; // multiplicador de velocidade de recarga
    activeUntil: number;    // timestamp de quando o buff expira (0 = sem buff)
  };
};

export const gameState: GameState = {
  moveSpeed: 360,
  reloadSpeed: 5,
  reloadMovePenalty: 0.5,
  maxHealth: 5,
  cooldown: 0,
  luck: 1.0,
  wave: debug.INITIAL_WAVE ?? 1,
  gold: debug.INITIAL_GOLD ?? 0,
  xp: debug.INITIAL_XP ?? 0,
  level: debug.INITIAL_LEVEL ?? 1,
  xpToLevel: xpRequiredFor(debug.INITIAL_LEVEL ?? 1),
  playerHealth: 5,
  enemyDamageCooldownMs: 1000,
  waves,
  projectileSpeed: 560,
  upgrades,
  skills: {
    skill1: debug.INITIAL_SKILL1 ?? undefined,
    skill2: undefined,
    ultimate: undefined,
    levels: debug.INITIAL_SKILL1
      ? { [debug.INITIAL_SKILL1]: debug.INITIAL_SKILL1_LEVEL ?? 1 }
      : {},
    cooldowns: {},
    lastUsedAt: {},
    charges: {},
    maxCharges: {},
    chargeRegenTimers: {},
  },
  buffs: {
    damageMul: 1.0,
    reloadSpeedMul: 1.0,
    activeUntil: 0,
  },
};

// Helper to be called whenever level changes
export function recalcXpToLevel() {
  gameState.xpToLevel = xpRequiredFor(gameState.level);
}
