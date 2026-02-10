import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../state/gameState";
import type { UIHandles } from "./ui";

const ATTR_COST = 1; // pontos de elevação por atributo
const SKILL_COST = 3; // pontos de elevação por nível de skill
const MAX_ATTR_LEVEL = 10;
const MAX_SKILL_LEVEL = 5;

export function setupShop(k: KAPLAYCtx, ui: UIHandles, player: GameObj) {
  if (typeof gameState.gold === "number") ui.updateGold(gameState.gold);
  if (typeof gameState.wave === "number") ui.updateWave(gameState.wave);

  const canUpgradeAttr = (key: keyof typeof gameState.upgrades) => {
    const lv = gameState.upgrades[key] as number;
    return lv < MAX_ATTR_LEVEL && gameState.elevationPoints >= ATTR_COST;
  };

  const spendAttr = (key: keyof typeof gameState.upgrades) => {
    const lv = gameState.upgrades[key] as number;
    if (lv >= MAX_ATTR_LEVEL || gameState.elevationPoints < ATTR_COST)
      return false;
    gameState.elevationPoints -= ATTR_COST;
    (gameState.upgrades as any)[key] = lv + 1;
    return true;
  };

  ui.setUpgradeHandlers({
    onMoveSpeed: () => {
      if (!canUpgradeAttr("moveSpeed")) return;
      if (!spendAttr("moveSpeed")) return;
      gameState.moveSpeed += 20;
      (player as any).speed = gameState.moveSpeed;
      ui.refreshShopStats();
    },
    onHealth: () => {
      if (!canUpgradeAttr("maxHealth")) return;
      if (!spendAttr("maxHealth")) return;
      gameState.maxHealth += 100;
      (player as any).hp = Math.min(
        (player as any).hp + 100,
        gameState.maxHealth,
      );
      ui.updateHearts((player as any).hp);
      ui.refreshShopStats();
    },
    onReload: () => {
      if (!canUpgradeAttr("reloadSpeed")) return;
      if (!spendAttr("reloadSpeed")) return;
      gameState.reloadSpeed = Math.max(
        0.1,
        Number((gameState.reloadSpeed * 0.9).toFixed(3)),
      );
      ui.refreshShopStats();
    },
    onLuck: () => {
      if (!canUpgradeAttr("luck")) return;
      if (!spendAttr("luck")) return;
      gameState.luck = Number((gameState.luck + 0.1).toFixed(2));
      ui.refreshShopStats();
    },
    onProjectile: () => {
      if (!canUpgradeAttr("projectileSpeed")) return;
      if (!spendAttr("projectileSpeed")) return;
      gameState.projectileSpeed += 40;
      ui.refreshShopStats();
    },
    onAbilityHaste: () => {
      if (!canUpgradeAttr("abilityHaste")) return;
      if (!spendAttr("abilityHaste")) return;
      gameState.abilityHaste = Number(
        (gameState.abilityHaste + 0.05).toFixed(2),
      );
      ui.refreshShopStats();
    },
    onShotDamage: () => {
      if (!canUpgradeAttr("shotDamage")) return;
      if (!spendAttr("shotDamage")) return;
      gameState.shotDamage += 1;
      ui.refreshShopStats();
    },
  });

  // Skill upgrade handler
  ui.setSkillUpgradeHandler(() => {
    const skillId = gameState.skills.skill1;
    if (!skillId) return;
    const lv = gameState.skills.levels[skillId] ?? 1;
    if (lv >= MAX_SKILL_LEVEL) return;
    if (gameState.elevationPoints < SKILL_COST) return;
    gameState.elevationPoints -= SKILL_COST;
    gameState.skills.levels[skillId] = lv + 1;
  });

  // Quick heal
  ui.setQuickHealHandler(() => {
    const cost = 20;
    if (gameState.gold < cost) return;
    if ((player as any).hp >= gameState.maxHealth) return;
    gameState.gold -= cost;
    (player as any).hp = Math.min(
      (player as any).hp + 100,
      gameState.maxHealth,
    );
    ui.updateHearts((player as any).hp);
    ui.updateGold(gameState.gold);
    ui.refreshShopStats();
  });

  // Initial refresh
  ui.refreshShopStats();
}
