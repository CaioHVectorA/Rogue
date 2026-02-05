import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";
import { gameState } from "../../state/gameState";

const BUFF_CONFIG = {
  baseDuration: 10000, // 10 segundos
  durationPerLevel: 500, // +0.5s por level
  baseDamageMul: 1.3, // +30% de dano base
  damagePerLevel: 0.1, // +10% por level
  baseReloadSpeedMul: 1.4, // +40% de velocidade de recarga base
  reloadSpeedPerLevel: 0.1, // +10% por level
} as const;

function getDuration(level: number): number {
  return BUFF_CONFIG.baseDuration + (level - 1) * BUFF_CONFIG.durationPerLevel;
}

function getDamageMul(level: number): number {
  return BUFF_CONFIG.baseDamageMul + (level - 1) * BUFF_CONFIG.damagePerLevel;
}

function getReloadSpeedMul(level: number): number {
  return (
    BUFF_CONFIG.baseReloadSpeedMul +
    (level - 1) * BUFF_CONFIG.reloadSpeedPerLevel
  );
}

registerSkill({
  id: "attack-buff",
  getCooldown: () => 9000,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["attack-buff"] ?? 1;
    const duration = getDuration(level);
    const damageMul = getDamageMul(level);
    const reloadSpeedMul = getReloadSpeedMul(level);

    // Aplicar buffs ao gameState
    gameState.buffs.damageMul = damageMul;
    gameState.buffs.reloadSpeedMul = reloadSpeedMul;
    gameState.buffs.activeUntil = Date.now() + duration;

    // Efeito visual no player (brilho amarelo/dourado)
    const originalColor = player.color?.clone?.() ?? k.rgb(255, 255, 255);
    player.color = k.rgb(255, 220, 100);

    // Timer para remover o buff
    k.wait(duration / 1000, () => {
      gameState.buffs.damageMul = 1.0;
      gameState.buffs.reloadSpeedMul = 1.0;
      gameState.buffs.activeUntil = 0;
      player.color = originalColor;
    });
  },
});
