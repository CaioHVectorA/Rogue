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
};

export const gameState: GameState = {
  moveSpeed: 360,
  reloadSpeed: 1.0,
  reloadMovePenalty: 0.5,
  maxHealth: 5,
  cooldown: 0,
  luck: 1.0,
  wave: 1,
  gold: 0,
  xp: 0,
  level: 1,
  xpToLevel: 10,
};
