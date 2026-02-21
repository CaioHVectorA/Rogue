import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../state/gameState";
import type { UIHandles } from "./ui";

const ATTR_COST = 1; // pontos de elevação por atributo
const SKILL_COST = 3; // pontos de elevação por nível de skill
const MAX_ATTR_LEVEL = 10;
const MAX_SKILL_LEVEL = 5;
const MAX_LEVEL_BONUS = 0.15; // 15% bonus when attribute reaches max level

// New helper: cost to buy next level (based on target level)
function nextLevelCost(nextLevel: number): number {
  // nextLevel is the level you will reach after the purchase
  if (nextLevel <= 2) return 1;
  if (nextLevel <= 4) return 2; // from lvl3 cost 2 (i.e., buying to level 3 or 4)
  if (nextLevel <= 7) return 3; // from lvl5 cost 3
  if (nextLevel <= 9) return 5; // levels 8-9 cost 5
  return 10; // level 10 costs 10
}

// Helper to count how many attributes are already maxed
function countMaxedAttributes(): number {
  let cnt = 0;
  for (const k of Object.keys(
    gameState.upgrades,
  ) as (keyof typeof gameState.upgrades)[]) {
    if ((gameState.upgrades as any)[k] >= MAX_ATTR_LEVEL) cnt++;
  }
  return cnt;
}

export function setupShop(k: KAPLAYCtx, ui: UIHandles, player: GameObj) {
  if (typeof gameState.gold === "number") ui.updateGold(gameState.gold);
  if (typeof gameState.wave === "number") ui.updateWave(gameState.wave);

  const canUpgradeAttr = (key: keyof typeof gameState.upgrades) => {
    const lv = gameState.upgrades[key] as number;
    const nextLv = lv + 1;
    const goldCost = nextLevelCost(nextLv); // new cost scheme
    // Cannot buy level 10 if maxed attributes limit reached (2) unless luck is maxed
    if (nextLv === MAX_ATTR_LEVEL) {
      const maxAllowed =
        (gameState.upgrades as any).luck >= MAX_ATTR_LEVEL ? 3 : 2;
      if (countMaxedAttributes() >= maxAllowed) return false;
    }
    return (
      lv < MAX_ATTR_LEVEL &&
      gameState.elevationPoints >= ATTR_COST &&
      gameState.gold >= goldCost
    );
  };

  const spendAttr = (key: keyof typeof gameState.upgrades) => {
    const lv = gameState.upgrades[key] as number;
    const nextLv = lv + 1;
    const goldCost = nextLevelCost(nextLv);
    if (
      lv >= MAX_ATTR_LEVEL ||
      gameState.elevationPoints < ATTR_COST ||
      gameState.gold < goldCost
    )
      return false;
    // If buying to level 10, enforce maxed count
    if (nextLv === MAX_ATTR_LEVEL) {
      const maxAllowed =
        (gameState.upgrades as any).luck >= MAX_ATTR_LEVEL ? 3 : 2;
      if (countMaxedAttributes() >= maxAllowed) return false;
    }
    gameState.elevationPoints -= ATTR_COST;
    gameState.gold -= goldCost;
    (gameState.upgrades as any)[key] = lv + 1;

    // If reached max level, optionally apply any immediate effects (some are applied elsewhere)
    return true;
  };

  ui.setUpgradeHandlers({
    onMoveSpeed: () => {
      if (!canUpgradeAttr("moveSpeed")) return;
      if (!spendAttr("moveSpeed")) return;
      gameState.moveSpeed += 30;
      // +15% bonus at max level
      if (gameState.upgrades.moveSpeed >= MAX_ATTR_LEVEL) {
        gameState.moveSpeed = Math.floor(
          gameState.moveSpeed * (1 + MAX_LEVEL_BONUS),
        );
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
        gameState.maxHealth = Math.floor(
          gameState.maxHealth * (1 + MAX_LEVEL_BONUS),
        );
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
        0.05,
        Number((gameState.reloadSpeed * 0.9).toFixed(3)),
      );
      // +15% bonus at max level (faster reload = lower value)
      if (gameState.upgrades.reloadSpeed >= MAX_ATTR_LEVEL) {
        gameState.reloadSpeed = Math.max(
          0.05,
          Number((gameState.reloadSpeed * (1 - MAX_LEVEL_BONUS)).toFixed(3)),
        );
      }
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onLuck: () => {
      if (!canUpgradeAttr("luck")) return;
      if (!spendAttr("luck")) return;
      gameState.luck = Number((gameState.luck + 0.12).toFixed(2));
      // +15% bonus at max level
      if (gameState.upgrades.luck >= MAX_ATTR_LEVEL) {
        gameState.luck = Number(
          (gameState.luck * (1 + MAX_LEVEL_BONUS)).toFixed(2),
        );
      }
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onProjectile: () => {
      if (!canUpgradeAttr("projectileSpeed")) return;
      if (!spendAttr("projectileSpeed")) return;
      gameState.projectileSpeed += 60;
      // +15% bonus at max level
      if (gameState.upgrades.projectileSpeed >= MAX_ATTR_LEVEL) {
        gameState.projectileSpeed = Math.floor(
          gameState.projectileSpeed * (1 + MAX_LEVEL_BONUS),
        );
      }
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onAbilityHaste: () => {
      if (!canUpgradeAttr("abilityHaste")) return;
      if (!spendAttr("abilityHaste")) return;
      gameState.abilityHaste = Number(
        (gameState.abilityHaste + 0.06).toFixed(2),
      );
      // +15% bonus at max level
      if (gameState.upgrades.abilityHaste >= MAX_ATTR_LEVEL) {
        gameState.abilityHaste = Math.min(
          0.9,
          Number((gameState.abilityHaste * (1 + MAX_LEVEL_BONUS)).toFixed(2)),
        );
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
        gameState.shotDamage = Math.floor(
          gameState.shotDamage * (1 + MAX_LEVEL_BONUS),
        );
      }
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onMagnetRadius: () => {
      if (!canUpgradeAttr("magnetRadius")) return;
      if (!spendAttr("magnetRadius")) return;
      // magnetRadius effect is read dynamically from upgrades (global magnet at max)
      ui.updateGold(gameState.gold);
      ui.refreshShopStats();
    },
    onVampirism: () => {
      if (!canUpgradeAttr("vampirism")) return;
      if (!spendAttr("vampirism")) return;
      // vampirism effect is read dynamically on enemy death
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
    ui.refreshShopStats();
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
