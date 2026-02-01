import type { GameObj, KAPLAYCtx } from "kaplay";
import { skillsRegistry, updateChargeRegen, getCharges } from "./skills";
import { gameState } from "../state/gameState";
import { createTopBar } from "./ui/topBar";
import { createShopPanel } from "./ui/shopPanel";
import { createSkillOverlay } from "./ui/skillOverlay";

export type UIHandles = {
  updateHearts: (count: number) => void;
  updateGold: (amount: number) => void;
  updateXP: (xp: number, xpToLevel: number, level: number) => void;
  updateWave: (wave: number) => void;
  onPlayClick: (handler: () => void) => void;
  setPlayVisible: (visible: boolean) => void;
  onShopToggle: (open: boolean) => void;
  setShopVisible: (visible: boolean) => void;
  setUpgradeHandlers: (handlers: {
    onMoveSpeed: () => void;
    onHealth: () => void;
    onReload: () => void;
    onLuck: () => void;
    onProjectile?: () => void;
  }) => void;
  setQuickHealHandler: (handler: () => void) => void;
  refreshShopStats: (stats: {
    moveSpeed: number;
    maxHealth: number;
    reloadSpeed: number;
    luck: number;
    gold: number;
    projectileSpeed?: number;
  }) => void;
};

export function setupUI(k: KAPLAYCtx): UIHandles {
  const topBar = createTopBar(k);
  const shop = createShopPanel(k);
  const skillOverlay = createSkillOverlay(k);

  // Bottom-right skill cooldown indicator
  const skillSize = 64;
  const skillBg = k.add([
    k.rect(skillSize, skillSize, { radius: 8 }),
    k.pos(k.width() - skillSize - 20, k.height() - skillSize - 20),
    k.color(24, 24, 28),
    k.outline(3, k.rgb(255, 255, 255)),
    k.fixed(),
    k.z(1200),
    { id: "ui-skill-bg" },
  ]);
  const skillKey = k.add([
    k.text("Q", { size: 28 }),
    k.pos(skillBg.pos.x + skillSize / 2 - 8, skillBg.pos.y + skillSize - 34),
    k.color(220, 220, 220),
    k.fixed(),
    k.z(1202),
    { id: "ui-skill-key" },
  ]);
  const cdText = k.add([
    k.text("", { size: 22 }),
    k.pos(skillBg.pos.x + 10, skillBg.pos.y + 10),
    k.color(255, 255, 255),
    k.fixed(),
    k.z(1203),
    { id: "ui-skill-cd-text" },
  ]);
  const cdMask = k.add([
    k.rect(skillSize, skillSize),
    k.pos(skillBg.pos.x, skillBg.pos.y),
    k.color(0, 0, 0),
    k.opacity(0.55),
    k.fixed(),
    k.z(1201),
    { id: "ui-skill-cd-mask" },
  ]);
  const positionSkillUI = () => {
    const x = k.width() - skillSize - 20;
    const y = k.height() - skillSize - 20;
    skillBg.pos = k.vec2(x, y);
    cdMask.pos = k.vec2(x, y);
    skillKey.pos = k.vec2(x + skillSize / 2 - 8, y + skillSize - 34);
    cdText.pos = k.vec2(x + 10, y + 10);
  };
  k.onResize(positionSkillUI);
  positionSkillUI();

  k.onUpdate(() => {
    const skillId = gameState.skills.skill1;
    if (!skillId || !skillsRegistry[skillId]) {
      skillBg.hidden = true;
      skillKey.hidden = true;
      cdText.hidden = true;
      cdMask.hidden = true;
    } else {
      skillBg.hidden = false;
      skillKey.hidden = false;
      const skill = skillsRegistry[skillId];
      const lvl = gameState.skills.levels[skillId] ?? 1;
      const cd = skill.getCooldown ? skill.getCooldown(lvl) : 3000;

      // Skill com cargas
      if (skill.getMaxCharges) {
        updateChargeRegen(skillId);
        const charges = getCharges(skillId);
        const maxCharges = skill.getMaxCharges(lvl);
        const regenStart = gameState.skills.chargeRegenTimers[skillId] ?? 0;

        // Mostrar cargas atuais
        (cdText as any).text = `${charges}/${maxCharges}`;
        cdText.hidden = false;

        // Se não tem todas as cargas, mostrar progresso de regeneração
        if (charges < maxCharges && regenStart > 0) {
          const elapsed = Date.now() - regenStart;
          const ratio = Math.max(0, 1 - elapsed / cd);
          cdMask.hidden = false;
          (cdMask as any).width = skillSize;
          (cdMask as any).height = Math.floor(skillSize * ratio);
          cdMask.pos = k.vec2(
            skillBg.pos.x,
            skillBg.pos.y + (skillSize - (cdMask as any).height),
          );
        } else if (charges === 0) {
          // Sem cargas e sem regeneração
          cdMask.hidden = false;
          (cdMask as any).width = skillSize;
          (cdMask as any).height = skillSize;
          cdMask.pos = k.vec2(skillBg.pos.x, skillBg.pos.y);
        } else {
          cdMask.hidden = true;
        }
      } else {
        // Skill normal (sem cargas)
        const last = gameState.skills.lastUsedAt[skillId] ?? 0;
        const elapsed = Date.now() - last;
        const remaining = Math.max(0, cd - elapsed);
        const ratio = remaining / cd;
        if (remaining > 0) {
          (cdText as any).text = (remaining / 1000).toFixed(1) + "s";
          cdText.hidden = false;
          cdMask.hidden = false;
          (cdMask as any).width = skillSize;
          (cdMask as any).height = Math.floor(skillSize * ratio);
          cdMask.pos = k.vec2(
            skillBg.pos.x,
            skillBg.pos.y + (skillSize - (cdMask as any).height),
          );
        } else {
          cdText.hidden = true;
          cdMask.hidden = true;
        }
      }
    }
    skillOverlay.update();
  });

  // Wire shop toggle via TopBar's shopBtn
  topBar.shopBtn.onClick(() => shop.toggle());

  return {
    updateHearts: topBar.updateHearts,
    updateGold: (amount) => {
      topBar.updateGold(amount);
    },
    updateXP: topBar.updateXP,
    updateWave: topBar.updateWave,
    onPlayClick: topBar.onPlayClick,
    setPlayVisible: topBar.setPlayVisible,
    onShopToggle: (open) => shop.setVisible(open),
    setShopVisible: (visible) => shop.setVisible(visible),
    setUpgradeHandlers: (handlers) => shop.setUpgradeHandlers(handlers),
    setQuickHealHandler: (handler) => shop.setQuickHealHandler(handler),
    refreshShopStats: (stats) => shop.refreshStats(stats),
  };
}
