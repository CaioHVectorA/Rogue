import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";
import { gameState } from "../../state/gameState";

const BUFF_CONFIG = {
  baseDuration: 12000, // 12 segundos (buffed)
  durationPerLevel: 800, // +0.8s por level (buffed)
  baseDamageMul: 1.45, // +45% de dano base (buffed)
  damagePerLevel: 0.12, // +12% por level (buffed)
  baseReloadSpeedMul: 1.6, // +60% de velocidade de recarga base (buffed)
  reloadSpeedPerLevel: 0.12, // +12% por level (buffed)
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

function getMaxCharges(level: number): number {
  // 1 carga base, +1 a cada level, máximo 5
  return Math.min(5, 1 + Math.floor((level - 1) / 1));
}

registerSkill({
  id: "attack-buff",
  getCooldown: () => 9000,
  getMaxCharges: (level: number) => getMaxCharges(level),
  use: ({ k, player }) => {
    const level = gameState.skills.levels["attack-buff"] ?? 1;
    const duration = getDuration(level);
    const damageMul = getDamageMul(level);
    const reloadSpeedMul = getReloadSpeedMul(level);

    // Aplicar buffs ao gameState (re-ativa/estende o buff)
    gameState.buffs.damageMul = damageMul;
    gameState.buffs.reloadSpeedMul = reloadSpeedMul;
    gameState.buffs.activeUntil = Date.now() + duration;

    // Efeito visual no player (brilho amarelo/dourado)
    const originalColor = player.color?.clone?.() ?? k.rgb(255, 255, 255);
    player.color = k.rgb(255, 220, 100);

    // Timer para remover o buff
    k.wait(duration / 1000, () => {
      // Só remove se o buff não foi renovado
      if (Date.now() >= gameState.buffs.activeUntil) {
        gameState.buffs.damageMul = 1.0;
        gameState.buffs.reloadSpeedMul = 1.0;
        gameState.buffs.activeUntil = 0;
        player.color = originalColor;
      }
    });
  },
});
