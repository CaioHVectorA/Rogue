import { waves } from "./waves";
import { upgrades } from "./upgrades";
import { debug } from "./debug";

export type GameState = {
  moveSpeed: number,
  reloadSpeed: number,
  reloadMovePenalty: number,
  maxHealth: number,
  cooldown: number,
  luck: number,
  wave: number,
  gold: number,
  xp: number,
  level: number,
  xpToLevel: number,
  playerHealth: number,
  enemyDamageCooldownMs: number,
  waves: typeof waves,
  projectileSpeed: number,
  upgrades: typeof upgrades,
};

export const gameState: GameState = {
  moveSpeed: 360,
  reloadSpeed: 0.33,
  reloadMovePenalty: 0.5,
  maxHealth: 5,
  cooldown: 0,
  luck: 1.0,
  wave: debug.INITIAL_WAVE ?? 1,
  gold: debug.INITIAL_GOLD ?? 0,
  xp: 0,
  level: 1,
  xpToLevel: 10,
  playerHealth: 5,
  enemyDamageCooldownMs: 1000,
  waves,
  projectileSpeed: 560,
  upgrades,
};
