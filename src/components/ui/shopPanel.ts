import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../../state/gameState";
import {
  canOpenPerkSelection,
  MAX_PERKS,
  PERK_COST,
  MIN_LEVEL_FOR_PERKS,
} from "../perks";

// ─── Attribute definitions ───────────────────────────────
type AttrDef = {
  key: string;
  icon: string;
  label: string;
  tooltip: string;
  color: [number, number, number];
  handler: string;
};

const ATTR_DEFS: AttrDef[] = [
  {
    key: "moveSpeed",
    icon: "➤",
    label: "Velocidade",
    tooltip: "Aumenta a velocidade\nde movimento do jogador.",
    color: [60, 200, 120],
    handler: "onMoveSpeed",
  },
  {
    key: "maxHealth",
    icon: "❤",
    label: "Vida",
    tooltip: "Aumenta a vida máxima\ne restaura um pouco de HP.",
    color: [220, 70, 80],
    handler: "onHealth",
  },
  {
    key: "reloadSpeed",
    icon: "⟳",
    label: "Recarga",
    tooltip: "Reduz o tempo de\nrecarga do tiro básico.",
    color: [80, 100, 220],
    handler: "onReload",
  },
  {
    key: "luck",
    icon: "✦",
    label: "Sorte",
    tooltip: "Aumenta a chance de\ndrops melhores.",
    color: [220, 190, 50],
    handler: "onLuck",
  },
  {
    key: "projectileSpeed",
    icon: "➲",
    label: "Vel. Projétil",
    tooltip: "Aumenta a velocidade\ndos projéteis.",
    color: [100, 120, 240],
    handler: "onProjectile",
  },
  {
    key: "abilityHaste",
    icon: "⏱",
    label: "Aceleração",
    tooltip: "Reduz o tempo de\nrecarga das habilidades.",
    color: [60, 180, 240],
    handler: "onAbilityHaste",
  },
  {
    key: "shotDamage",
    icon: "🗡",
    label: "Dano de Tiro",
    tooltip: "Aumenta o dano base\ndos tiros e skills de tiro.",
    color: [240, 140, 50],
    handler: "onShotDamage",
  },
  {
    key: "magnetRadius",
    icon: "🧲",
    label: "Imã de Ouro",
    tooltip: "Aumenta o raio de\natração de ouro.",
    color: [255, 200, 60],
    handler: "onMagnetRadius",
  },
  {
    key: "vampirism",
    icon: "❤+",
    label: "Vampirismo",
    tooltip: "Cura o jogador ao matar inimigos; cura fixa + % da vida perdida.",
    color: [200, 60, 120],
    handler: "onVampirism",
  },
];

// ─── Types ───────────────────────────────────────────────
export type ShopPanelHandles = {
  setVisible: (visible: boolean) => void;
  refreshStats: () => void;
  setUpgradeHandlers: (handlers: Record<string, () => void>) => void;
  setQuickHealHandler: (handler: () => void) => void;
  setPerkHandler: (handler: () => void) => void;
  setSkillUpgradeHandler: (handler: () => void) => void;
  toggle: () => void;
};

// ─── Panel builder ───────────────────────────────────────
export function createShopPanel(k: KAPLAYCtx): ShopPanelHandles {
  const ATTR_COST = 1;
  const MAX_ATTR_LEVEL = 10;

  function nextAttrGoldCost(nextLevel: number) {
    if (nextLevel <= 2) return 1;
    if (nextLevel <= 4) return 2; // lvl 3-4 -> 2
    if (nextLevel <= 7) return 3; // lvl 5-7 -> 3
    if (nextLevel <= 9) return 5; // lvl 8-9 -> 5
    return 10; // lvl 10 -> 10
  }

  const panelW = 460;
  const panelH = 700;
  const panelX = () => Math.floor((k.width() - panelW) / 2);
  const panelY = () => Math.floor((k.height() - panelH) / 2);

  // Track all objects for bulk show/hide
  const allObjs: GameObj[] = [];
  const track = <T extends GameObj>(obj: T): T => {
    allObjs.push(obj);
    return obj;
  };

  // ── Background panel ──
  const panel = track(
    k.add([
      k.rect(panelW, panelH, { radius: 16 }),
      k.pos(panelX(), panelY()),
      k.color(18, 18, 24),
      k.outline(3, k.rgb(60, 60, 80)),
      k.area(),
      k.fixed(),
      k.z(2000),
      { id: "shop-bg" },
    ]),
  );

  // ── Title ──
  const title = track(
    k.add([
      k.text("Loja de Atributos", { size: 24 }),
      k.pos(panel.pos.x + 20, panel.pos.y + 16),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(2001),
      { id: "shop-title" },
    ]),
  );

  // ── Close button ──
  const closeBtn = track(
    k.add([
      k.rect(28, 28, { radius: 6 }),
      k.pos(panel.pos.x + panelW - 44, panel.pos.y + 14),
      k.color(70, 30, 30),
      k.outline(2, k.rgb(200, 80, 80)),
      k.area(),
      k.fixed(),
      k.z(2002),
      { id: "shop-close" },
    ]),
  );
  const closeTxt = track(
    k.add([
      k.text("✕", { size: 16 }),
      k.pos(closeBtn.pos.x + 7, closeBtn.pos.y + 4),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(2003),
      { id: "shop-close-txt" },
    ]),
  );

  // ── Elevation points display ──
  const epLabel = track(
    k.add([
      k.text("★ 25", { size: 20 }),
      k.pos(panel.pos.x + 20, panel.pos.y + 50),
      k.color(180, 140, 255),
      k.fixed(),
      k.z(2001),
      { id: "shop-ep" },
    ]),
  );

  const costHint = track(
    k.add([
      k.text("Custo: ★1 + ⎔(nível)", { size: 14 }),
      k.pos(panel.pos.x + 100, panel.pos.y + 54),
      k.color(120, 120, 140),
      k.fixed(),
      k.z(2001),
      { id: "shop-cost-hint" },
    ]),
  );

  // ── Attribute grid ──
  const gridCols = 4;
  const sqSize = 80;
  const sqGap = 16;
  const gridXFn = () =>
    panel.pos.x +
    Math.floor((panelW - (sqSize * gridCols + sqGap * (gridCols - 1))) / 2);
  const gridYFn = () => panel.pos.y + 86;

  type AttrSquare = {
    bg: GameObj;
    icon: GameObj;
    label: GameObj;
    lvLabel: GameObj;
    def: AttrDef;
    col: number;
    row: number;
  };

  const squares: AttrSquare[] = [];

  for (let i = 0; i < ATTR_DEFS.length; i++) {
    const def = ATTR_DEFS[i];
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);
    const sx = gridXFn() + col * (sqSize + sqGap);
    const sy = gridYFn() + row * (sqSize + sqGap + 20);

    const bg = track(
      k.add([
        k.rect(sqSize, sqSize, { radius: 10 }),
        k.pos(sx, sy),
        k.color(def.color[0], def.color[1], def.color[2]),
        k.outline(3, k.rgb(255, 255, 255)),
        k.area(),
        k.fixed(),
        k.z(2002),
        k.opacity(1),
        { id: `shop-sq-${def.key}` },
      ]),
    );

    const icon = track(
      k.add([
        k.text(def.icon, { size: 32 }),
        k.pos(sx + sqSize / 2, sy + 12),
        k.anchor("top"),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(2003),
        { id: `shop-icon-${def.key}` },
      ]),
    );

    const label = track(
      k.add([
        k.text(def.label, { size: 11 }),
        k.pos(sx + sqSize / 2, sy + sqSize + 2),
        k.anchor("top"),
        k.color(200, 200, 220),
        k.fixed(),
        k.z(2003),
        { id: `shop-lbl-${def.key}` },
      ]),
    );

    const lvLabel = track(
      k.add([
        k.text("0", { size: 14 }),
        k.pos(sx + sqSize - 6, sy + sqSize - 6),
        k.anchor("botright"),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(2004),
        { id: `shop-lv-${def.key}` },
      ]),
    );

    squares.push({ bg, icon, label, lvLabel, def, col, row });
  }

  // ── Tooltip (hidden by default) ──
  const tooltipW = 180;
  const tooltipH = 80;
  const tooltipBg = track(
    k.add([
      k.rect(tooltipW, tooltipH, { radius: 8 }),
      k.pos(-500, -500),
      k.color(30, 30, 40),
      k.outline(2, k.rgb(140, 140, 180)),
      k.fixed(),
      k.z(2100),
      k.opacity(0.95),
      { id: "shop-tooltip-bg" },
    ]),
  );
  const tooltipTitle = track(
    k.add([
      k.text("", { size: 15 }),
      k.pos(-500, -500),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(2101),
      { id: "shop-tooltip-title" },
    ]),
  );
  const tooltipDesc = track(
    k.add([
      k.text("", { size: 12 }),
      k.pos(-500, -500),
      k.color(180, 180, 200),
      k.fixed(),
      k.z(2101),
      { id: "shop-tooltip-desc" },
    ]),
  );
  const tooltipLv = track(
    k.add([
      k.text("", { size: 12 }),
      k.pos(-500, -500),
      k.color(180, 140, 255),
      k.fixed(),
      k.z(2101),
      { id: "shop-tooltip-lv" },
    ]),
  );

  tooltipBg.hidden = true;
  tooltipTitle.hidden = true;
  tooltipDesc.hidden = true;
  tooltipLv.hidden = true;

  // ── Quick heal ──
  const quickBtn = track(
    k.add([
      k.rect(panelW - 40, 40, { radius: 8 }),
      k.pos(panel.pos.x + 20, panel.pos.y + panelH - 100),
      k.color(180, 140, 40),
      k.outline(2, k.rgb(255, 215, 0)),
      k.area(),
      k.fixed(),
      k.z(2002),
      { id: "shop-quick-heal" },
    ]),
  );
  const quickBtnText = track(
    k.add([
      k.text("❤ Curar 100HP (20 gold)", { size: 16 }),
      k.pos(quickBtn.pos.x + (panelW - 40) / 2, quickBtn.pos.y + 10),
      k.anchor("top"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(2003),
      { id: "shop-quick-heal-txt" },
    ]),
  );

  // ── Gold display ──
  // Layout from bottom: Quick Heal (-60), Exchange (-120), Skill Upgrade (-180), Perks (-240), Gold label (-280)
  const goldLabel = track(
    k.add([
      k.text("⎔ 0", { size: 18 }),
      k.pos(panel.pos.x + 20, panel.pos.y + panelH - 300),
      k.color(255, 215, 0),
      k.fixed(),
      k.z(2001),
      { id: "shop-gold" },
    ]),
  );

  // ── Perks button ──
  const perkBtn = track(
    k.add([
      k.rect(panelW - 40, 44, { radius: 8 }),
      k.pos(panel.pos.x + 20, panel.pos.y + panelH - 280),
      k.color(100, 60, 180),
      k.outline(2, k.rgb(180, 140, 255)),
      k.area(),
      k.fixed(),
      k.z(2002),
      { id: "shop-perks-btn" },
    ]),
  );
  const perkBtnText = track(
    k.add([
      k.text("🔮 Perks (★5)", { size: 16 }),
      k.pos(perkBtn.pos.x + (panelW - 40) / 2, perkBtn.pos.y + 12),
      k.anchor("top"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(2003),
      { id: "shop-perks-btn-txt" },
    ]),
  );

  // ── Skill upgrade button ──
  const skillUpBtn = track(
    k.add([
      k.rect(panelW - 40, 44, { radius: 8 }),
      k.pos(panel.pos.x + 20, panel.pos.y + panelH - 220),
      k.color(60, 120, 200),
      k.outline(2, k.rgb(120, 180, 255)),
      k.area(),
      k.fixed(),
      k.z(2002),
      { id: "shop-skill-up-btn" },
    ]),
  );
  const skillUpBtnText = track(
    k.add([
      k.text("⬆ Aprimorar Habilidade (★3)", { size: 15 }),
      k.pos(skillUpBtn.pos.x + (panelW - 40) / 2, skillUpBtn.pos.y + 12),
      k.anchor("top"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(2003),
      { id: "shop-skill-up-btn-txt" },
    ]),
  );

  // ── Gold → Elevation exchange button ──
  const exchangeBtn = track(
    k.add([
      k.rect(panelW - 40, 44, { radius: 8 }),
      k.pos(panel.pos.x + 20, panel.pos.y + panelH - 160),
      k.color(180, 140, 40),
      k.outline(2, k.rgb(255, 215, 0)),
      k.area(),
      k.fixed(),
      k.z(2002),
      { id: "shop-exchange-btn" },
    ]),
  );
  const exchangeBtnText = track(
    k.add([
      k.text("⎔→★ Trocar Gold por Elevação", { size: 15 }),
      k.pos(exchangeBtn.pos.x + (panelW - 40) / 2, exchangeBtn.pos.y + 12),
      k.anchor("top"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(2003),
      { id: "shop-exchange-btn-txt" },
    ]),
  );

  // ─── Handlers ─────────────────────────────────────────
  let upgradeHandlers: Record<string, () => void> = {};
  let quickHealHandler: (() => void) | null = null;
  let perkHandler: (() => void) | undefined = undefined;
  let skillUpgradeHandler: (() => void) | null = null;

  /** Cost of next gold→elevation exchange: 3^(bonusElevationsBought+1) */
  function getExchangeCost(): number {
    return Math.pow(3, gameState.bonusElevationsBought + 1);
  }

  // Wire clicks
  for (const sq of squares) {
    sq.bg.onClick(() => {
      if (panel.hidden) return; // guard: panel not visible
      const handlerKey = sq.def.handler;
      if (handlerKey && upgradeHandlers[handlerKey]) {
        upgradeHandlers[handlerKey]();
      }
    });
  }
  closeBtn.onClick(() => {
    if (panel.hidden) return;
    setVisible(false);
  });
  quickBtn.onClick(() => {
    if (panel.hidden) return;
    if (quickHealHandler) quickHealHandler();
  });
  perkBtn.onClick(() => {
    if (panel.hidden) return;
    if (perkHandler) perkHandler();
  });
  exchangeBtn.onClick(() => {
    if (panel.hidden) return;
    const cost = getExchangeCost();
    if (gameState.gold < cost) return;
    gameState.gold -= cost;
    gameState.elevationPoints += 1;
    gameState.bonusElevationsBought += 1;
    refreshStats();
  });
  skillUpBtn.onClick(() => {
    if (panel.hidden) return;
    if (skillUpgradeHandler) skillUpgradeHandler();
    refreshStats();
  });

  // ─── Hover tooltip logic ──────────────────────────────
  let hoveredSquare: AttrSquare | null = null;

  k.onUpdate(() => {
    if (panel.hidden) return;

    const mp = k.mousePos();
    let found: AttrSquare | null = null;

    for (const sq of squares) {
      if (sq.bg.hidden) continue;
      const bx = sq.bg.pos.x;
      const by = sq.bg.pos.y;
      if (
        mp.x >= bx &&
        mp.x <= bx + sqSize &&
        mp.y >= by &&
        mp.y <= by + sqSize
      ) {
        found = sq;
        break;
      }
    }

    if (found) {
      if (hoveredSquare !== found) {
        hoveredSquare = found;
        const def = found.def;
        const lv = (gameState.upgrades as any)[def.key] ?? 0;
        const goldCost = nextAttrGoldCost(lv + 1);
        const canUp =
          lv < MAX_ATTR_LEVEL &&
          gameState.elevationPoints >= ATTR_COST &&
          gameState.gold >= goldCost;

        let tx = found.bg.pos.x + sqSize + 8;
        let ty = found.bg.pos.y;
        if (tx + tooltipW > k.width() - 10) {
          tx = found.bg.pos.x - tooltipW - 8;
        }
        if (ty + tooltipH > k.height() - 10) {
          ty = k.height() - tooltipH - 10;
        }

        tooltipBg.pos = k.vec2(tx, ty);
        tooltipTitle.pos = k.vec2(tx + 10, ty + 8);
        tooltipDesc.pos = k.vec2(tx + 10, ty + 28);
        tooltipLv.pos = k.vec2(tx + 10, ty + tooltipH - 20);

        (tooltipTitle as any).text = def.label;
        (tooltipDesc as any).text = def.tooltip;
        (tooltipLv as any).text =
          `Nv ${lv}/${MAX_ATTR_LEVEL}${canUp ? `  ★-1 ⎔-${goldCost}` : lv >= MAX_ATTR_LEVEL ? "  MÁX" : "  sem recursos"}`;

        tooltipBg.hidden = false;
        tooltipTitle.hidden = false;
        tooltipDesc.hidden = false;
        tooltipLv.hidden = false;
      }
    } else {
      if (hoveredSquare) {
        hoveredSquare = null;
        tooltipBg.hidden = true;
        tooltipTitle.hidden = true;
        tooltipDesc.hidden = true;
        tooltipLv.hidden = true;
      }
    }
  });

  // ─── Visibility ───────────────────────────────────────
  const setVisible = (visible: boolean) => {
    for (const obj of allObjs) obj.hidden = !visible;
    if (!visible) {
      tooltipBg.hidden = true;
      tooltipTitle.hidden = true;
      tooltipDesc.hidden = true;
      tooltipLv.hidden = true;
      hoveredSquare = null;
    }
  };
  setVisible(false);

  // ─── Reposition on resize ─────────────────────────────
  const reposition = () => {
    const px = panelX();
    const py = panelY();
    panel.pos = k.vec2(px, py);
    title.pos = k.vec2(px + 20, py + 16);
    closeBtn.pos = k.vec2(px + panelW - 44, py + 14);
    closeTxt.pos = k.vec2(closeBtn.pos.x + 7, closeBtn.pos.y + 4);
    epLabel.pos = k.vec2(px + 20, py + 50);
    costHint.pos = k.vec2(px + 100, py + 54);
    goldLabel.pos = k.vec2(px + 20, py + panelH - 300);
    perkBtn.pos = k.vec2(px + 20, py + panelH - 280);
    perkBtnText.pos = k.vec2(px + 20 + (panelW - 40) / 2, perkBtn.pos.y + 12);
    skillUpBtn.pos = k.vec2(px + 20, py + panelH - 220);
    skillUpBtnText.pos = k.vec2(px + 20 + (panelW - 40) / 2, skillUpBtn.pos.y + 12);
    exchangeBtn.pos = k.vec2(px + 20, py + panelH - 160);
    exchangeBtnText.pos = k.vec2(
      px + 20 + (panelW - 40) / 2,
      exchangeBtn.pos.y + 12,
    );
    quickBtn.pos = k.vec2(px + 20, py + panelH - 100);
    quickBtnText.pos = k.vec2(px + 20 + (panelW - 40) / 2, quickBtn.pos.y + 10);

    const gx =
      px +
      Math.floor((panelW - (sqSize * gridCols + sqGap * (gridCols - 1))) / 2);
    const gy = py + 86;
    for (const sq of squares) {
      const sx = gx + sq.col * (sqSize + sqGap);
      const sy = gy + sq.row * (sqSize + sqGap + 20);
      sq.bg.pos = k.vec2(sx, sy);
      sq.icon.pos = k.vec2(sx + sqSize / 2, sy + 12);
      sq.label.pos = k.vec2(sx + sqSize / 2, sy + sqSize + 2);
      sq.lvLabel.pos = k.vec2(sx + sqSize - 6, sy + sqSize - 6);
    }
  };
  k.onResize(reposition);

  // ─── Refresh stats ────────────────────────────────────
  const refreshStats = () => {
    (epLabel as any).text = `★ ${gameState.elevationPoints}`;
    (goldLabel as any).text = `⎔ ${gameState.gold}`;

    for (const sq of squares) {
      const lv = (gameState.upgrades as any)[sq.def.key] ?? 0;
      const nextLv = lv + 1;
      const goldCost = nextAttrGoldCost(nextLv);
      const canUp =
        lv < MAX_ATTR_LEVEL &&
        gameState.elevationPoints >= ATTR_COST &&
        gameState.gold >= goldCost;

      (sq.lvLabel as any).text = `${lv}`;

      if (lv >= MAX_ATTR_LEVEL) {
        sq.bg.outline.color = k.rgb(255, 215, 0);
        sq.bg.outline.width = 3;
        (sq.bg as any).opacity = 0.7;
      } else if (canUp) {
        sq.bg.outline.color = k.rgb(255, 255, 255);
        sq.bg.outline.width = 3;
        (sq.bg as any).opacity = 1;
      } else {
        sq.bg.outline.color = k.rgb(60, 60, 70);
        sq.bg.outline.width = 2;
        (sq.bg as any).opacity = 0.45;
      }
    }

    const healCost = 20 + (gameState as any).healUseCount * 5;
    const canHeal = gameState.gold >= healCost;
    (quickBtn as any).opacity = canHeal ? 1 : 0.4;
    quickBtn.outline.color = canHeal ? k.rgb(255, 215, 0) : k.rgb(80, 80, 80);
    (quickBtnText as any).text = `❤ Curar 100HP (${healCost} gold)`;

    // ── Perk button state ──
    const canPerk = canOpenPerkSelection();
    const acquiredCount = gameState.perks.acquired.length;
    if (acquiredCount >= MAX_PERKS) {
      (perkBtnText as any).text =
        `🔮 Perks (${acquiredCount}/${MAX_PERKS} MÁX)`;
      (perkBtn as any).opacity = 0.35;
      perkBtn.outline.color = k.rgb(80, 80, 80);
    } else if (gameState.level < MIN_LEVEL_FOR_PERKS) {
      (perkBtnText as any).text = `🔮 Perks (Nível ${MIN_LEVEL_FOR_PERKS}+)`;
      (perkBtn as any).opacity = 0.35;
      perkBtn.outline.color = k.rgb(80, 80, 80);
    } else if (!canPerk) {
      (perkBtnText as any).text = `🔮 Perks (★ insuficiente)`;
      (perkBtn as any).opacity = 0.4;
      perkBtn.outline.color = k.rgb(80, 80, 80);
    } else {
      (perkBtnText as any).text = `🔮 Adquirir Perk (★${PERK_COST})`;
      (perkBtn as any).opacity = 1;
      perkBtn.outline.color = k.rgb(180, 140, 255);
    }

    if (hoveredSquare) {
      const def = hoveredSquare.def;
      const lv = (gameState.upgrades as any)[def.key] ?? 0;
      const nextLv = lv + 1;
      const goldCostHov = nextAttrGoldCost(nextLv);
      const canHov =
        lv < MAX_ATTR_LEVEL &&
        gameState.elevationPoints >= ATTR_COST &&
        gameState.gold >= goldCostHov;
      (tooltipLv as any).text =
        `Nv ${lv}/${MAX_ATTR_LEVEL}${canHov ? `  ★-1 ⎔-${goldCostHov}` : lv >= MAX_ATTR_LEVEL ? "  MÁX" : "  sem recursos"}`;
    }

    // ── Exchange button state ──
    const exchCost = getExchangeCost();
    const canExchange = gameState.gold >= exchCost;
    (exchangeBtnText as any).text =
      `⎔→★ Trocar Gold por Elevação (⎔${exchCost})`;
    (exchangeBtn as any).opacity = canExchange ? 1 : 0.4;
    exchangeBtn.outline.color = canExchange
      ? k.rgb(255, 215, 0)
      : k.rgb(80, 80, 80);

    // ── Skill upgrade button state ──
    const SKILL_UP_COST = 3;
    const MAX_SKILL_LVL = 5;
    const skillId = gameState.skills.skill1;
    if (skillId) {
      const skillLv = gameState.skills.levels[skillId] ?? 1;
      const canSkillUp = skillLv < MAX_SKILL_LVL && gameState.elevationPoints >= SKILL_UP_COST;
      if (skillLv >= MAX_SKILL_LVL) {
        (skillUpBtnText as any).text = `⬆ Habilidade (MÁX)`;
        (skillUpBtn as any).opacity = 0.35;
        skillUpBtn.outline.color = k.rgb(80, 80, 80);
      } else if (canSkillUp) {
        (skillUpBtnText as any).text = `⬆ Aprimorar Habilidade Nv${skillLv}→${skillLv + 1} (★${SKILL_UP_COST})`;
        (skillUpBtn as any).opacity = 1;
        skillUpBtn.outline.color = k.rgb(120, 180, 255);
      } else {
        (skillUpBtnText as any).text = `⬆ Aprimorar Habilidade (★ insuficiente)`;
        (skillUpBtn as any).opacity = 0.4;
        skillUpBtn.outline.color = k.rgb(80, 80, 80);
      }
      skillUpBtn.hidden = false;
      skillUpBtnText.hidden = false;
    } else {
      // No skill equipped yet
      skillUpBtn.hidden = true;
      skillUpBtnText.hidden = true;
    }
  };

  // ─── API ──────────────────────────────────────────────
  return {
    setVisible,
    refreshStats,
    setUpgradeHandlers: (handlers: Record<string, () => void>) => {
      upgradeHandlers = handlers;
    },
    setQuickHealHandler: (handler: () => void) => {
      quickHealHandler = handler;
    },
    setPerkHandler: (handler: () => void) => {
      perkHandler = handler;
    },
    setSkillUpgradeHandler: (handler: () => void) => {
      skillUpgradeHandler = handler;
    },
    toggle: () => setVisible(panel.hidden),
  };
}
