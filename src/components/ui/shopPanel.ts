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
  col: number;
  row: number;
};

const ATTR_DEFS: AttrDef[] = [
  {
    key: "moveSpeed",
    icon: "➤",
    label: "Velocidade",
    tooltip: "Aumenta a velocidade\nde movimento.",
    color: [60, 200, 120],
    handler: "onMoveSpeed",
    row: 0,
    col: 0,
  },
  {
    key: "maxHealth",
    icon: "❤",
    label: "Vida",
    tooltip: "Aumenta a vida máxima\ne cura um pouco.",
    color: [220, 70, 80],
    handler: "onHealth",
    row: 0,
    col: 1,
  },
  {
    key: "reloadSpeed",
    icon: "⟳",
    label: "Recarga",
    tooltip: "Reduz o tempo de\nrecarga do tiro básico.",
    color: [80, 100, 220],
    handler: "onReload",
    row: 0,
    col: 2,
  },
  {
    key: "shotDamage",
    icon: "🗡",
    label: "Dano de Tiro",
    tooltip: "Aumenta o dano base\ndos tiros básicos.",
    color: [240, 140, 50],
    handler: "onShotDamage",
    row: 0,
    col: 3,
  },
  {
    key: "abilityHaste",
    icon: "⏱",
    label: "Aceleração",
    tooltip: "Reduz o tempo de\nrecarga das habilidades.",
    color: [60, 180, 240],
    handler: "onAbilityHaste",
    row: 1,
    col: 0.5,
  },
  {
    key: "castPower",
    icon: "✨",
    label: "Poder Arcano",
    tooltip: "Aumenta o dano e a eficácia\ndas habilidades ativas (Q).",
    color: [160, 80, 255],
    handler: "onCastPower",
    row: 1,
    col: 1.5,
  },
  {
    key: "vampirism",
    icon: "❤+",
    label: "Vampirismo",
    tooltip: "Cura o jogador ao matar inimigos;\ncura fixa + % da vida perdida.",
    color: [200, 60, 120],
    handler: "onVampirism",
    row: 1,
    col: 2.5,
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
  setExchangeHandler: (handler: () => void) => void;
  toggle: () => void;
};

// ─── Panel builder ───────────────────────────────────────
export function createShopPanel(k: KAPLAYCtx): ShopPanelHandles {
  const ATTR_COST = 1;
  const MAX_ATTR_LEVEL = 10;

  function nextAttrGoldCost(nextLevel: number) {
    // custo = (nível atual)² → ex: 1→2 custa 1, 2→3 custa 4, 3→4 custa 9 …
    const currentLevel = nextLevel - 1;
    return currentLevel * currentLevel;
  }

  const panelW = 460;
  const panelH = 500;
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
      k.color(15, 15, 22), // Deep slate dark mode
      k.outline(3, k.rgb(99, 102, 241)), // Indigo outline
      k.area(),
      k.fixed(),
      k.z(2000),
      "shop-bg",
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
    const col = def.col;
    const row = def.row;
    const sx = gridXFn() + col * (sqSize + sqGap);
    const sy = gridYFn() + row * (sqSize + sqGap + 20);

    const bg = track(
      k.add([
        k.rect(sqSize, sqSize, { radius: 10 }),
        k.pos(sx, sy),
        k.color(24, 24, 34), // Dark card base color
        k.outline(2, k.rgb(60, 60, 70)),
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
        k.color(def.color[0], def.color[1], def.color[2]), // Colored icon!
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
        k.color(160, 160, 180),
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
      k.rect(panelW - 40, 42, { radius: 8 }),
      k.pos(panel.pos.x + 20, panel.pos.y + 430),
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
      k.text("❤ Curar 100HP (20 gold)", { size: 15 }),
      k.pos(quickBtn.pos.x + (panelW - 40) / 2, quickBtn.pos.y + 12),
      k.anchor("top"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(2003),
      { id: "shop-quick-heal-txt" },
    ]),
  );

  // ── Gold display (Header top-right) ──
  const goldLabel = track(
    k.add([
      k.text("⎔ 0", { size: 20 }),
      k.pos(panel.pos.x + panelW - 130, panel.pos.y + 50),
      k.color(255, 215, 0),
      k.fixed(),
      k.z(2001),
      { id: "shop-gold" },
    ]),
  );

  // ── Skill upgrade button ──
  const skillUpBtn = track(
    k.add([
      k.rect(panelW - 40, 42, { radius: 8 }),
      k.pos(panel.pos.x + 20, panel.pos.y + 326),
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
      k.rect(panelW - 40, 42, { radius: 8 }),
      k.pos(panel.pos.x + 20, panel.pos.y + 378),
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
  let hoveredSquare: AttrSquare | null = null;
  let upgradeHandlers: Record<string, () => void> = {};
  let quickHealHandler: (() => void) | null = null;
  let perkHandler: (() => void) | undefined = undefined;
  let skillUpgradeHandler: (() => void) | null = null;
  let exchangeHandler: (() => void) | null = null;

  /** Cost of next gold→elevation exchange: 3^(bonusElevationsBought+1) */
  function getExchangeCost(): number {
    return Math.pow(3, gameState.bonusElevationsBought + 1);
  }

  const isHovering = (obj: GameObj, w: number, h: number) => {
    if (obj.hidden) return false;
    const mp = k.mousePos();
    const bx = obj.pos.x;
    const by = obj.pos.y;
    return mp.x >= bx && mp.x <= bx + w && mp.y >= by && mp.y <= by + h;
  };

  // Wire clicks manually in screen-space
  k.onMousePress("left", () => {
    if (panel.hidden) return;
    const mp = k.mousePos();

    // Check close button
    if (isHovering(closeBtn, 28, 28)) {
      setVisible(false);
      return;
    }

    // Check quick heal button
    const healCost = 20 + gameState.healUseCount * 5;
    if (gameState.gold >= healCost && isHovering(quickBtn, panelW - 40, 42)) {
      if (quickHealHandler) {
        quickHealHandler();
        refreshStats();
      }
      return;
    }

    // Check skill upgrade button
    const skillId = gameState.skills.skill1;
    const skillLv = skillId ? (gameState.skills.levels[skillId] ?? 1) : 1;
    const canSkillUp = skillId && skillLv < 5 && gameState.elevationPoints >= 3;
    if (canSkillUp && isHovering(skillUpBtn, panelW - 40, 42)) {
      if (skillUpgradeHandler) {
        skillUpgradeHandler();
        refreshStats();
      }
      return;
    }

    // Check gold->elevation exchange button
    const exchCost = getExchangeCost();
    if (gameState.gold >= exchCost && isHovering(exchangeBtn, panelW - 40, 42)) {
      if (exchangeHandler) {
        exchangeHandler();
        refreshStats();
      }
      return;
    }

    // Check attribute squares
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
        // Enforce the canUpgradeAttr check manually to prevent illegal buy
        const lv = (gameState.upgrades as any)[sq.def.key] ?? 0;
        const nextLv = lv + 1;
        const goldCost = nextAttrGoldCost(nextLv);
        const canUp =
          lv < MAX_ATTR_LEVEL &&
          gameState.elevationPoints >= ATTR_COST &&
          gameState.gold >= goldCost;
        if (nextLv === MAX_ATTR_LEVEL) {
          const maxAllowed = 2;
          if (countMaxedAttributes() >= maxAllowed) continue;
        }

        if (canUp) {
          const handlerKey = sq.def.handler;
          if (handlerKey && upgradeHandlers[handlerKey]) {
            upgradeHandlers[handlerKey]();
          }
        }
        break;
      }
    }
  });

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

    // Function to check button hover
    const isHoveringLocal = (obj: GameObj, w: number, h: number) => {
      if (obj.hidden) return false;
      const bx = obj.pos.x;
      const by = obj.pos.y;
      return mp.x >= bx && mp.x <= bx + w && mp.y >= by && mp.y <= by + h;
    };

    // Update squares styling dynamically with hover highlights
    for (const sq of squares) {
      const hovered = (found === sq);
      const lv = (gameState.upgrades as any)[sq.def.key] ?? 0;
      const nextLv = lv + 1;
      const goldCost = nextAttrGoldCost(nextLv);
      const canUp =
        lv < MAX_ATTR_LEVEL &&
        gameState.elevationPoints >= ATTR_COST &&
        gameState.gold >= goldCost;

      sq.bg.color = hovered ? k.rgb(38, 38, 50) : k.rgb(24, 24, 34);

      if (lv >= MAX_ATTR_LEVEL) {
        sq.bg.outline.color = k.rgb(255, 215, 0); // Gold
        sq.bg.outline.width = hovered ? 4 : 3;
        (sq.bg as any).opacity = 0.8;
      } else if (canUp) {
        sq.bg.outline.color = k.rgb(sq.def.color[0], sq.def.color[1], sq.def.color[2]);
        sq.bg.outline.width = hovered ? 4 : 2.5;
        (sq.bg as any).opacity = 1.0;
      } else {
        sq.bg.outline.color = k.rgb(60, 60, 70);
        sq.bg.outline.width = hovered ? 3 : 1.5;
        (sq.bg as any).opacity = 0.45;
      }
    }

    // Close button hover
    const closeHover = isHoveringLocal(closeBtn, 28, 28);
    closeBtn.color = closeHover ? k.rgb(120, 40, 40) : k.rgb(70, 30, 30);
    closeBtn.outline.color = closeHover ? k.rgb(255, 140, 140) : k.rgb(200, 80, 80);
    closeBtn.outline.width = closeHover ? 3 : 2;

    // Bottom action buttons styling & hover effects
    const updateBtnStyle = (
      btn: GameObj,
      w: number,
      h: number,
      affordable: boolean,
      baseOutlineColor: any,
      baseBtnColor: any,
      hoverBtnColor: any,
    ) => {
      const hovered = isHoveringLocal(btn, w, h);
      if (!affordable) {
        btn.color = k.rgb(24, 24, 30);
        btn.outline.color = k.rgb(55, 55, 65);
        btn.outline.width = 1.5;
        (btn as any).opacity = 0.45;
      } else {
        (btn as any).opacity = 1.0;
        btn.color = hovered ? hoverBtnColor : baseBtnColor;
        btn.outline.color = hovered ? k.rgb(255, 255, 255) : baseOutlineColor;
        btn.outline.width = hovered ? 3.5 : 2;
      }
    };

    // Quick Heal
    const healCost = 20 + (gameState as any).healUseCount * 5;
    const canHeal = gameState.gold >= healCost;
    updateBtnStyle(
      quickBtn,
      panelW - 40,
      42,
      canHeal,
      k.rgb(255, 215, 0),
      k.rgb(120, 90, 20),
      k.rgb(150, 115, 25),
    );

    // Skill Upgrade
    const skillId = gameState.skills.skill1;
    const skillLv = skillId ? (gameState.skills.levels[skillId] ?? 1) : 1;
    const canSkillUp = skillId && skillLv < 5 && gameState.elevationPoints >= 3;
    updateBtnStyle(
      skillUpBtn,
      panelW - 40,
      42,
      !!canSkillUp,
      k.rgb(120, 180, 255),
      k.rgb(40, 80, 150),
      k.rgb(55, 105, 190),
    );

    // Exchange Gold
    const exchCost = getExchangeCost();
    const canExchange = gameState.gold >= exchCost;
    updateBtnStyle(
      exchangeBtn,
      panelW - 40,
      42,
      canExchange,
      k.rgb(255, 215, 0),
      k.rgb(120, 90, 20),
      k.rgb(150, 115, 25),
    );

    // Tooltip logic
    if (found) {
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
    } else {
      tooltipBg.hidden = true;
      tooltipTitle.hidden = true;
      tooltipDesc.hidden = true;
      tooltipLv.hidden = true;
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
    goldLabel.pos = k.vec2(px + panelW - 130, py + 50);

    skillUpBtn.pos = k.vec2(px + 20, py + 326);
    skillUpBtnText.pos = k.vec2(
      px + 20 + (panelW - 40) / 2,
      skillUpBtn.pos.y + 12,
    );
    exchangeBtn.pos = k.vec2(px + 20, py + 378);
    exchangeBtnText.pos = k.vec2(
      px + 20 + (panelW - 40) / 2,
      exchangeBtn.pos.y + 12,
    );
    quickBtn.pos = k.vec2(px + 20, py + 430);
    quickBtnText.pos = k.vec2(px + 20 + (panelW - 40) / 2, quickBtn.pos.y + 12);

    const gx =
      px +
      Math.floor((panelW - (sqSize * gridCols + sqGap * (gridCols - 1))) / 2);
    const gy = py + 86;
    for (const sq of squares) {
      const sx = gx + sq.def.col * (sqSize + sqGap);
      const sy = gy + sq.def.row * (sqSize + sqGap + 20);
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
      (sq.lvLabel as any).text = `${lv}`;
    }

    const healCost = 20 + (gameState as any).healUseCount * 5;
    (quickBtnText as any).text = `❤ Curar 100HP (${healCost} gold)`;

    const exchCost = getExchangeCost();
    (exchangeBtnText as any).text = `⎔→★ Trocar Gold por Elevação (⎔${exchCost})`;

    const skillId = gameState.skills.skill1;
    if (skillId) {
      const skillLv = gameState.skills.levels[skillId] ?? 1;
      if (skillLv >= 5) {
        (skillUpBtnText as any).text = `⬆ Habilidade (MÁX)`;
      } else {
        (skillUpBtnText as any).text = `⬆ Aprimorar Habilidade Nv${skillLv}→${skillLv + 1} (★3)`;
      }
      skillUpBtn.hidden = false;
      skillUpBtnText.hidden = false;
    } else {
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
    setExchangeHandler: (handler: () => void) => {
      exchangeHandler = handler;
    },
    toggle: () => setVisible(panel.hidden),
  };
}
