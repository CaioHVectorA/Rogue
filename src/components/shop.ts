import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../state/gameState";
import type { UIHandles } from "./ui";

function costForLevel(n: number) { return 5 + (n - 1) * (n - 1) + n; }

function makeStats() {
  return {
    moveSpeed: gameState.moveSpeed,
    maxHealth: gameState.maxHealth,
    reloadSpeed: gameState.reloadSpeed,
    luck: gameState.luck,
    gold: gameState.gold,
    projectileSpeed: gameState.projectileSpeed,
    abilityHaste: gameState.abilityHaste,
  };
}

export function setupShop(k: KAPLAYCtx, ui: UIHandles, player: GameObj) {
  // Apply debug initial values
  if (typeof gameState.gold === "number") ui.updateGold(gameState.gold);
  if (typeof gameState.wave === "number") ui.updateWave(gameState.wave);

  const canUpgrade = (key: keyof typeof gameState.upgrades) => {
    const lv = gameState.upgrades[key] as number;
    if (lv >= 10) return false;
    const isChosen = lv > 0;
    if (!isChosen && gameState.upgrades.chosenCount >= 3) return false;
    const cost = costForLevel(lv + 1);
    return gameState.gold >= cost;
  };

  const spendAndLevel = (key: keyof typeof gameState.upgrades) => {
    const lv = gameState.upgrades[key] as number;
    const nextCost = costForLevel(lv + 1);
    if (gameState.gold < nextCost || lv >= 10) return false;
    if (lv === 0 && gameState.upgrades.chosenCount < 3) {
      gameState.upgrades.chosenCount += 1;
    }
    gameState.gold -= nextCost;
    (gameState.upgrades as any)[key] = lv + 1;
    ui.updateGold(gameState.gold);
    return true;
  };

  ui.setUpgradeHandlers({
    onMoveSpeed: () => {
      if (!canUpgrade("moveSpeed")) return;
      if (!spendAndLevel("moveSpeed")) return;
      gameState.moveSpeed += 20;
      (player as any).speed = gameState.moveSpeed;
      ui.refreshShopStats(makeStats());
    },
    onHealth: () => {
      if (!canUpgrade("maxHealth")) return;
      if (!spendAndLevel("maxHealth")) return;
      gameState.maxHealth += 100;
      (player as any).hp = Math.min((player as any).hp + 100, gameState.maxHealth);
      ui.updateHearts((player as any).hp);
      ui.refreshShopStats(makeStats());
    },
    onReload: () => {
      if (!canUpgrade("reloadSpeed")) return;
      if (!spendAndLevel("reloadSpeed")) return;
      // Treat reloadSpeed as reload time (seconds). Upgrading should increase rate by reducing time multiplicatively.
      gameState.reloadSpeed = Math.max(0.1, Number((gameState.reloadSpeed * 0.9).toFixed(3)));
      ui.refreshShopStats(makeStats());
    },
    onLuck: () => {
      if (!canUpgrade("luck")) return;
      if (!spendAndLevel("luck")) return;
      gameState.luck = Number((gameState.luck + 0.1).toFixed(2));
      ui.refreshShopStats(makeStats());
    },
    onProjectile: () => {
      if (!canUpgrade("projectileSpeed")) return;
      if (!spendAndLevel("projectileSpeed")) return;
      gameState.projectileSpeed += 40;
      ui.refreshShopStats(makeStats());
    },
    onAbilityHaste: () => {
      if (!canUpgrade("abilityHaste")) return;
      if (!spendAndLevel("abilityHaste")) return;
      gameState.abilityHaste = Number((gameState.abilityHaste + 0.05).toFixed(2)); // +5% per level
      ui.refreshShopStats(makeStats());
    },
  });

  // Quick heal
  ui.setQuickHealHandler(() => {
    const cost = 20;
    if (gameState.gold < cost) return;
    if ((player as any).hp >= gameState.maxHealth) return;
    gameState.gold -= cost;
    (player as any).hp = Math.min((player as any).hp + 100, gameState.maxHealth);
    ui.updateHearts((player as any).hp);
    ui.updateGold(gameState.gold);
    ui.refreshShopStats(makeStats());
  });

  // Initial refresh
  ui.refreshShopStats(makeStats());
}
