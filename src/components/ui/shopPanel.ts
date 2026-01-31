import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../../state/gameState";

export type ShopPanelHandles = {
  setVisible: (visible: boolean) => void,
  refreshStats: (stats: { moveSpeed: number, maxHealth: number, reloadSpeed: number, luck: number, gold: number, projectileSpeed?: number }) => void,
  setUpgradeHandlers: (handlers: { onMoveSpeed: () => void, onHealth: () => void, onReload: () => void, onLuck: () => void, onProjectile?: () => void }) => void,
  setQuickHealHandler: (handler: () => void) => void,
  toggle: () => void,
};

export function createShopPanel(k: KAPLAYCtx): ShopPanelHandles {
  const panelW = 520;
  const panelH = k.height() - 40;
  const shopPanel = k.add([k.rect(panelW, panelH), k.pos(20, 20), k.color(20, 20, 24), k.outline(4, k.rgb(255, 255, 255)), k.area(), k.fixed(), k.z(1005), { id: "ui-shop-panel" }]);
  const title = k.add([k.text("Loja", { size: 32 }), k.pos(shopPanel.pos.x + 16, shopPanel.pos.y + 16), k.color(255, 255, 255), k.fixed(), k.z(1006), { id: "ui-shop-title" }]);
  const closeBtn = k.add([k.rect(32, 32), k.pos(shopPanel.pos.x + panelW - 48, shopPanel.pos.y + 12), k.color(80, 30, 30), k.outline(3, k.rgb(255, 255, 255)), k.area(), k.fixed(), k.z(1006), { id: "ui-shop-close" }]);
  const closeTxt = k.add([k.text("✕", { size: 20 }), k.pos(closeBtn.pos.x + 8, closeBtn.pos.y + 4), k.color(255, 255, 255), k.fixed(), k.z(1007), { id: "ui-shop-close-txt" }]);
  const subtitle = k.add([k.text("Aprimorar (10x) • Até 3 atributos", { size: 18 }), k.pos(shopPanel.pos.x + 16, shopPanel.pos.y + 54), k.color(180, 180, 200), k.fixed(), k.z(1006), { id: "ui-shop-subtitle" }]);

  const rowGap = 84;
  const baseY = shopPanel.pos.y + 100;
  const labelColor = k.rgb(220, 220, 220);

  const lvMoveLbl = k.add([k.text("0", { size: 22 }), k.pos(shopPanel.pos.x + 8, baseY + 6), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-lv-move" }]);
  const iconMove = k.add([k.text("➤", { size: 36 }), k.pos(shopPanel.pos.x + 40, baseY), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-icon-move" }]);
  const statMove = k.add([k.text("Lv 0 • Custo 0", { size: 22 }), k.pos(shopPanel.pos.x + 90, baseY + 4), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-shop-move" }]);
  const btnMove = k.add([k.rect(160, 44), k.pos(shopPanel.pos.x + panelW - 180, baseY - 6), k.color(30, 140, 30), k.outline(3), k.area(), k.fixed(), k.z(1007), { id: "ui-up-move" }]);
  const btnMoveText = k.add([k.text("Aprimorar", { size: 22 }), k.pos(btnMove.pos.x + 20, btnMove.pos.y + 6), k.color(255, 255, 255), k.fixed(), k.z(1008), { id: "ui-up-move-text" }]);

  const lvHPLbl = k.add([k.text("0", { size: 22 }), k.pos(shopPanel.pos.x + 8, baseY + rowGap + 6), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-lv-hp" }]);
  const iconHP = k.add([k.text("❤", { size: 36 }), k.pos(shopPanel.pos.x + 40, baseY + rowGap), k.color(k.rgb(255, 90, 90)), k.fixed(), k.z(1006), { id: "ui-icon-hp" }]);
  const statHP = k.add([k.text("Lv 0 • Custo 0", { size: 22 }), k.pos(shopPanel.pos.x + 90, baseY + rowGap + 4), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-shop-hp" }]);
  const btnHP = k.add([k.rect(160, 44), k.pos(shopPanel.pos.x + panelW - 180, baseY + rowGap - 6), k.color(160, 60, 60), k.outline(3), k.area(), k.fixed(), k.z(1007), { id: "ui-up-hp" }]);
  const btnHPText = k.add([k.text("Aprimorar", { size: 22 }), k.pos(btnHP.pos.x + 20, btnHP.pos.y + 6), k.color(255, 255, 255), k.fixed(), k.z(1008), { id: "ui-up-hp-text" }]);

  const lvRelLbl = k.add([k.text("0", { size: 22 }), k.pos(shopPanel.pos.x + 8, baseY + rowGap * 2 + 6), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-lv-rel" }]);
  const iconRel = k.add([k.text("⟳", { size: 36 }), k.pos(shopPanel.pos.x + 40, baseY + rowGap * 2), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-icon-rel" }]);
  const statRel = k.add([k.text("Lv 0 • Custo 0", { size: 22 }), k.pos(shopPanel.pos.x + 90, baseY + rowGap * 2 + 4), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-shop-rel" }]);
  const btnRel = k.add([k.rect(160, 44), k.pos(shopPanel.pos.x + panelW - 180, baseY + rowGap * 2 - 6), k.color(60, 60, 160), k.outline(3), k.area(), k.fixed(), k.z(1007), { id: "ui-up-rel" }]);
  const btnRelText = k.add([k.text("Aprimorar", { size: 22 }), k.pos(btnRel.pos.x + 20, btnRel.pos.y + 6), k.color(255, 255, 255), k.fixed(), k.z(1008), { id: "ui-up-rel-text" }]);

  const lvLuckLbl = k.add([k.text("0", { size: 22 }), k.pos(shopPanel.pos.x + 8, baseY + rowGap * 3 + 6), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-lv-luck" }]);
  const iconLuck = k.add([k.text("✦", { size: 36 }), k.pos(shopPanel.pos.x + 40, baseY + rowGap * 3), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-icon-luck" }]);
  const statLuck = k.add([k.text("0", { size: 22 }), k.pos(shopPanel.pos.x + 90, baseY + rowGap * 3 + 4), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-shop-luck" }]);
  const btnLuck = k.add([k.rect(160, 44), k.pos(shopPanel.pos.x + panelW - 180, baseY + rowGap * 3 - 6), k.color(160, 140, 60), k.outline(3), k.area(), k.fixed(), k.z(1007), { id: "ui-up-luck" }]);
  const btnLuckText = k.add([k.text("Aprimorar", { size: 22 }), k.pos(btnLuck.pos.x + 20, btnLuck.pos.y + 6), k.color(255, 255, 255), k.fixed(), k.z(1008), { id: "ui-up-luck-text" }]);

  const lvProjLbl = k.add([k.text("0", { size: 22 }), k.pos(shopPanel.pos.x + 8, baseY + rowGap * 4 + 6), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-lv-proj" }]);
  const iconProj = k.add([k.text("➲", { size: 36 }), k.pos(shopPanel.pos.x + 40, baseY + rowGap * 4), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-icon-proj" }]);
  const statProj = k.add([k.text("0", { size: 22 }), k.pos(shopPanel.pos.x + 90, baseY + rowGap * 4 + 4), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-shop-proj" }]);
  const btnProj = k.add([k.rect(160, 44), k.pos(shopPanel.pos.x + panelW - 180, baseY + rowGap * 4 - 6), k.color(80, 80, 200), k.outline(3), k.area(), k.fixed(), k.z(1007), { id: "ui-up-proj" }]);
  const btnProjText = k.add([k.text("Aprimorar", { size: 22 }), k.pos(btnProj.pos.x + 20, btnProj.pos.y + 6), k.color(255, 255, 255), k.fixed(), k.z(1008), { id: "ui-up-proj-text" }]);

  const statGold = k.add([k.text("⎔ 0", { size: 22 }), k.pos(shopPanel.pos.x + 20, shopPanel.pos.y + panelH - 48), k.color(k.rgb(255, 215, 0)), k.fixed(), k.z(1006), { id: "ui-shop-gold" }]);

  const quickBtn = k.add([k.rect(220, 44), k.pos(shopPanel.pos.x + panelW - 240, shopPanel.pos.y + panelH - 60), k.color(200, 160, 40), k.outline(3), k.area(), k.fixed(), k.z(1007), { id: "ui-quick-heal" }]);
  const quickBtnText = k.add([k.text("❤ Curar (20)", { size: 22 }), k.pos(quickBtn.pos.x + 24, quickBtn.pos.y + 6), k.color(255, 255, 255), k.fixed(), k.z(1008), { id: "ui-quick-heal-text" }]);

  let upgradeHandlers: { onMoveSpeed: () => void, onHealth: () => void, onReload: () => void, onLuck: () => void, onProjectile?: () => void } | null = null;
  let quickHealHandler: (() => void) | null = null;

  const setVisible = (visible: boolean) => {
    const all = [shopPanel, title, closeBtn, closeTxt, subtitle, lvMoveLbl, iconMove, statMove, btnMove, btnMoveText, lvHPLbl, iconHP, statHP, btnHP, btnHPText, lvRelLbl, iconRel, statRel, btnRel, btnRelText, lvLuckLbl, iconLuck, statLuck, btnLuck, btnLuckText, lvProjLbl, iconProj, statProj, btnProj, btnProjText, statGold, quickBtn, quickBtnText];
    for (const obj of all) obj.hidden = !visible;
  };
  setVisible(false);

  closeBtn.onClick(() => setVisible(false));
  btnMove.onClick(() => { if (upgradeHandlers) upgradeHandlers.onMoveSpeed(); });
  btnHP.onClick(() => { if (upgradeHandlers) upgradeHandlers.onHealth(); });
  btnRel.onClick(() => { if (upgradeHandlers) upgradeHandlers.onReload(); });
  btnLuck.onClick(() => { if (upgradeHandlers) upgradeHandlers.onLuck(); });
  btnProj.onClick(() => { if (upgradeHandlers?.onProjectile) upgradeHandlers.onProjectile(); });
  quickBtn.onClick(() => { if (quickHealHandler) quickHealHandler(); });

  const costForLevel = (n: number) => 5 + (n - 1) * (n - 1) + n;
  const setButtonEnabled = (btn: GameObj, label: GameObj, enabled: boolean) => {
    const bright = k.rgb(255, 255, 255);
    const dimText = k.rgb(120, 120, 120);
    (label as any).color = enabled ? bright : dimText;
    btn.outline.width = enabled ? 3 : 1;
    const base = enabled ? k.rgb(90, 180, 90) : k.rgb(50, 50, 50);
    (btn as any).color = base;
  };

  const refreshStats = (stats: { moveSpeed: number, maxHealth: number, reloadSpeed: number, luck: number, gold: number, projectileSpeed?: number }) => {
    const ups = gameState.upgrades ?? { moveSpeed: 0, maxHealth: 0, reloadSpeed: 0, luck: 0, projectileSpeed: 0, chosenCount: 0 };
    const lvMove = ups.moveSpeed;
    const lvHP = ups.maxHealth;
    const lvRel = ups.reloadSpeed;
    const lvLuck = ups.luck;
    const lvProj = ups.projectileSpeed ?? 0;
    const costMove = costForLevel(lvMove + 1);
    const costHP = costForLevel(lvHP + 1);
    const costRel = costForLevel(lvRel + 1);
    const costLuck = costForLevel(lvLuck + 1);
    const costProj = costForLevel(lvProj + 1);
    (statMove as any).text = `${costMove}`;
    (lvMoveLbl as any).text = `${lvMove}`;
    (statHP as any).text = `${costHP}`;
    (lvHPLbl as any).text = `${lvHP}`;
    (statRel as any).text = `${costRel}`;
    (lvRelLbl as any).text = `${lvRel}`;
    (statLuck as any).text = `${costLuck}`;
    (lvLuckLbl as any).text = `${lvLuck}`;
    (statProj as any).text = `${costProj}`;
    (lvProjLbl as any).text = `${lvProj}`;
    (statGold as any).text = `⎔ ${stats.gold}`;
    const canMove = stats.gold >= costMove && lvMove < 10 && (lvMove > 0 || (ups.chosenCount ?? 0) < 3);
    const canHP = stats.gold >= costHP && lvHP < 10 && (lvHP > 0 || (ups.chosenCount ?? 0) < 3);
    const canRel = stats.gold >= costRel && lvRel < 10 && (lvRel > 0 || (ups.chosenCount ?? 0) < 3);
    const canLuck = stats.gold >= costLuck && lvLuck < 10 && (lvLuck > 0 || (ups.chosenCount ?? 0) < 3);
    const canProj = stats.gold >= costProj && lvProj < 10 && (lvProj > 0 || (ups.chosenCount ?? 0) < 3);
    setButtonEnabled(btnMove, btnMoveText, canMove);
    setButtonEnabled(btnHP, btnHPText, canHP);
    setButtonEnabled(btnRel, btnRelText, canRel);
    setButtonEnabled(btnLuck, btnLuckText, canLuck);
    setButtonEnabled(btnProj, btnProjText, canProj);
    const healCost = 20;
    setButtonEnabled(quickBtn, quickBtnText, stats.gold >= healCost);
  };

  const setUpgradeHandlers = (handlers: { onMoveSpeed: () => void, onHealth: () => void, onReload: () => void, onLuck: () => void, onProjectile?: () => void }) => { upgradeHandlers = handlers; };
  const setQuickHealHandler = (handler: () => void) => { quickHealHandler = handler; };
  const toggle = () => setVisible(shopPanel.hidden);

  return { setVisible, refreshStats, setUpgradeHandlers, setQuickHealHandler, toggle };
}
