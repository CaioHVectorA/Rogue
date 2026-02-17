import { waves } from "./waves";
import { upgrades } from "./upgrades";
import { debug } from "./debug";
import { getMapStateForWave } from "../components/walls";

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
  abilityHaste: number; // % cooldown reduction (0.0 = 0%, 0.5 = 50%)
  shotDamage: number; // base shot damage (affects shot-based skills)
  elevationPoints: number; // pontos de elevação para comprar atributos e upar skills
  mapState: number; // tamanho do mapa (1..5), cresce a cada 5 waves
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
    damageMul: number; // multiplicador de dano
    reloadSpeedMul: number; // multiplicador de velocidade de recarga
    activeUntil: number; // timestamp de quando o buff expira (0 = sem buff)
    markedShot: {
      active: boolean;
      activeUntil: number; // timestamp de quando o buff expira (0 = sem buff)
    };
  };
  // Perks
  perks: {
    acquired: string[]; // IDs das perks adquiridas (máx 2)
    stacks: { [key: string]: number }; // contadores runtime (ex: sede-de-caca kills)
  };
  // Gold → elevation exchange counter
  bonusElevationsBought: number;
  // Quick heal usage counter (cost increases per use)
  healUseCount: number;
};

export const gameState: GameState = {
  moveSpeed: 600,
  reloadSpeed: 3,
  reloadMovePenalty: 0.8,
  maxHealth: 500,
  cooldown: 0,
  luck: 1.0,
  abilityHaste: 0.0,
  shotDamage: 1.25,
  elevationPoints: debug.INITIAL_ELEVATION ?? 25,
  mapState:
    debug.INITIAL_MAP_STATE ?? getMapStateForWave(debug.INITIAL_WAVE ?? 1),
  wave: debug.INITIAL_WAVE ?? 1,
  gold: debug.INITIAL_GOLD ?? 0,
  xp: debug.INITIAL_XP ?? 0,
  level: debug.INITIAL_LEVEL ?? 1,
  xpToLevel: xpRequiredFor(debug.INITIAL_LEVEL ?? 1),
  playerHealth: 500,
  enemyDamageCooldownMs: 1000,
  waves,
  projectileSpeed: 900,
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
    markedShot: {
      active: false,
      activeUntil: 0,
    },
  },
  perks: {
    acquired: debug.INITIAL_PERKS ?? [],
    stacks: {},
  },
  bonusElevationsBought: 0,
  healUseCount: 0,
};

// Helper to be called whenever level changes
export function recalcXpToLevel() {
  gameState.xpToLevel = xpRequiredFor(gameState.level);
}
