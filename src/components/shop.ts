import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../state/gameState";
import type { UIHandles } from "./ui";

const ATTR_COST = 1; // pontos de elevação por atributo
const SKILL_COST = 3; // pontos de elevação por nível de skill
const MAX_ATTR_LEVEL = 10;
const MAX_SKILL_LEVEL = 5;
const MAX_LEVEL_BONUS = 0.15; // 15% bonus when attribute reaches max level

export function setupShop(k: KAPLAYCtx, ui: UIHandles, player: GameObj) {
  if (typeof gameState.gold === "number") ui.updateGold(gameState.gold);
  if (typeof gameState.wave === "number") ui.updateWave(gameState.wave);

  const canUpgradeAttr = (key: keyof typeof gameState.upgrades) => {
    const lv = gameState.upgrades[key] as number;
    const goldCost = lv + 1; // gold cost = new level
    return (
      lv < MAX_ATTR_LEVEL &&
      gameState.elevationPoints >= ATTR_COST &&
      gameState.gold >= goldCost
    );
  };

  const spendAttr = (key: keyof typeof gameState.upgrades) => {
    const lv = gameState.upgrades[key] as number;
    const goldCost = lv + 1;
    if (
      lv >= MAX_ATTR_LEVEL ||
      gameState.elevationPoints < ATTR_COST ||
      gameState.gold < goldCost
    )
      return false;
    gameState.elevationPoints -= ATTR_COST;
    gameState.gold -= goldCost;
    (gameState.upgrades as any)[key] = lv + 1;
    return true;
  };

  ui.setUpgradeHandlers({
    onMoveSpeed: () => {
      if (!canUpgradeAttr("moveSpeed")) return;
      if (!spendAttr("moveSpeed")) return;
      gameState.moveSpeed += 25;
      // +15% bonus at max level
      if (gameState.upgrades.moveSpeed >= MAX_ATTR_LEVEL) {
        gameState.moveSpeed = Math.floor(gameState.moveSpeed * (1 + MAX_LEVEL_BONUS));
      }
      (player as any).speed = gameState.moveSpeed;
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onHealth: () => {
      if (!canUpgradeAttr("maxHealth")) return;
      if (!spendAttr("maxHealth")) return;
      gameState.maxHealth += 100;
      // +15% bonus at max level
      if (gameState.upgrades.maxHealth >= MAX_ATTR_LEVEL) {
        gameState.maxHealth = Math.floor(gameState.maxHealth * (1 + MAX_LEVEL_BONUS));
      }
      (player as any).hp = Math.min(
        (player as any).hp + 100,
        gameState.maxHealth,
      );
      ui.updateHearts((player as any).hp);
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onReload: () => {
      if (!canUpgradeAttr("reloadSpeed")) return;
      if (!spendAttr("reloadSpeed")) return;
      gameState.reloadSpeed = Math.max(
        0.1,
        Number((gameState.reloadSpeed * 0.9).toFixed(3)),
      );
      // +15% bonus at max level (faster reload = lower value)
      if (gameState.upgrades.reloadSpeed >= MAX_ATTR_LEVEL) {
        gameState.reloadSpeed = Math.max(0.1, Number((gameState.reloadSpeed * (1 - MAX_LEVEL_BONUS)).toFixed(3)));
      }
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onLuck: () => {
      if (!canUpgradeAttr("luck")) return;
      if (!spendAttr("luck")) return;
      gameState.luck = Number((gameState.luck + 0.1).toFixed(2));
      // +15% bonus at max level
      if (gameState.upgrades.luck >= MAX_ATTR_LEVEL) {
        gameState.luck = Number((gameState.luck * (1 + MAX_LEVEL_BONUS)).toFixed(2));
      }
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onProjectile: () => {
      if (!canUpgradeAttr("projectileSpeed")) return;
      if (!spendAttr("projectileSpeed")) return;
      gameState.projectileSpeed += 40;
      // +15% bonus at max level
      if (gameState.upgrades.projectileSpeed >= MAX_ATTR_LEVEL) {
        gameState.projectileSpeed = Math.floor(gameState.projectileSpeed * (1 + MAX_LEVEL_BONUS));
      }
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onAbilityHaste: () => {
      if (!canUpgradeAttr("abilityHaste")) return;
      if (!spendAttr("abilityHaste")) return;
      gameState.abilityHaste = Number(
        (gameState.abilityHaste + 0.05).toFixed(2),
      );
      // +15% bonus at max level
      if (gameState.upgrades.abilityHaste >= MAX_ATTR_LEVEL) {
        gameState.abilityHaste = Math.min(0.75, Number((gameState.abilityHaste * (1 + MAX_LEVEL_BONUS)).toFixed(2)));
      }
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onShotDamage: () => {
      if (!canUpgradeAttr("shotDamage")) return;
      if (!spendAttr("shotDamage")) return;
      gameState.shotDamage += 1;
      // +15% bonus at max level
      if (gameState.upgrades.shotDamage >= MAX_ATTR_LEVEL) {
        gameState.shotDamage = Math.floor(gameState.shotDamage * (1 + MAX_LEVEL_BONUS));
      }
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onMagnetRadius: () => {
      if (!canUpgradeAttr("magnetRadius")) return;
      if (!spendAttr("magnetRadius")) return;
      // magnetRadius effect is read dynamically from upgrades (15% bonus applied at read time)
      ui.updateGold(gameState.gold);
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

  // Quick heal (cost increases by 5 per use, starting at 20)
  ui.setQuickHealHandler(() => {
    const cost = 20 + gameState.healUseCount * 5;
    if (gameState.gold < cost) return;
    if ((player as any).hp >= gameState.maxHealth) return;
    gameState.gold -= cost;
    gameState.healUseCount += 1;
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
