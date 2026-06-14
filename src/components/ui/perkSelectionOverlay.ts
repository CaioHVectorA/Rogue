// ─── Perk Selection Overlay ─────────────────────────────
// Redesigned: displays all available perks in a grid layout (left)
// and an inspector detail panel (right) with an Acquire button.

import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../../state/gameState";
import { type PerkDef, perkDefs } from "../perks/perkData";
import { getAvailablePerks } from "../perks/perkRules";
import { applyImaMagneticoEffect } from "../perks/perkEffects";
import { wrapText } from "./helpers";

export type PerkSelectionOverlayHandles = {
  show: () => void;
  hide: () => void;
  isVisible: () => boolean;
};

export function createPerkSelectionOverlay(
  k: KAPLAYCtx,
): PerkSelectionOverlayHandles {
  const allObjs: GameObj[] = [];
  const track = <T extends GameObj>(obj: T): T => {
    allObjs.push(obj);
    return obj;
  };

  // ── Dimmed background ──
  const overlayBg = track(
    k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(10, 10, 15),
      k.opacity(0.85),
      k.fixed(),
      k.z(5000),
      { id: "perk-overlay-bg" },
    ]),
  );

  // ── Title ──
  const titleText = track(
    k.add([
      k.text("Escolha uma Habilidade Passiva", { size: 28 }),
      k.pos(k.width() / 2, 40),
      k.anchor("top"),
      k.color(255, 220, 100),
      k.fixed(),
      k.z(5001),
    ]),
  );

  // ── Subtitle ──
  const costText = track(
    k.add([
      k.text("Escolha uma Passiva Grátis!", { size: 16 }),
      k.pos(k.width() / 2, 80),
      k.anchor("top"),
      k.color(180, 140, 255),
      k.fixed(),
      k.z(5001),
    ]),
  );

  // ── Slots info ──
  const slotsText = track(
    k.add([
      k.text("", { size: 14 }),
      k.pos(k.width() / 2, 102),
      k.anchor("top"),
      k.color(140, 140, 160),
      k.fixed(),
      k.z(5001),
    ]),
  );

  // ── Grid & Inspector dimensions ──
  const gridCols = 5;
  const sqSize = 80;
  const sqGap = 16;
  const inspectorW = 360;
  const inspectorH = 320;
  const cancelBtnW = 160;

  // Layout calculations
  const getLayoutPositions = () => {
    const layoutW = 872; // grid (464) + gap (48) + inspector (360)
    const startX = Math.floor((k.width() - layoutW) / 2);
    const startY = Math.floor((k.height() - 250) / 2) + 40;
    return {
      gridX: startX,
      gridY: startY,
      inspectorX: startX + 464 + 48,
      inspectorY: startY - 40,
    };
  };

  // ── Grid Squares ──
  type PerkSquare = {
    bg: GameObj;
    icon: GameObj;
    acquiredOverlay: GameObj;
    acquiredTxt: GameObj;
    def: PerkDef;
    index: number;
  };
  const squares: PerkSquare[] = [];

  for (let i = 0; i < perkDefs.length; i++) {
    const def = perkDefs[i];

    const bg = track(
      k.add([
        k.rect(sqSize, sqSize, { radius: 10 }),
        k.pos(0, 0),
        k.color(24, 24, 34),
        k.outline(1.5, k.rgb(60, 60, 70)),
        k.area(),
        k.fixed(),
        k.z(5002),
        { id: `perk-grid-bg-${def.id}` },
      ]),
    );

    const icon = track(
      k.add([
        k.text(def.icon, { size: 36 }),
        k.pos(0, 0),
        k.anchor("center"),
        k.fixed(),
        k.z(5003),
      ]),
    );

    const acquiredOverlay = track(
      k.add([
        k.rect(sqSize, sqSize, { radius: 10 }),
        k.pos(0, 0),
        k.color(0, 0, 0),
        k.opacity(0),
        k.fixed(),
        k.z(5004),
      ]),
    );

    const acquiredTxt = track(
      k.add([
        k.text("", { size: 10 }),
        k.pos(0, 0),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(5005),
      ]),
    );

    squares.push({
      bg,
      icon,
      acquiredOverlay,
      acquiredTxt,
      def,
      index: i,
    });
  }

  // ── Inspector Panel ──
  const inspectorBg = track(
    k.add([
      k.rect(inspectorW, inspectorH, { radius: 12 }),
      k.pos(0, 0),
      k.color(20, 20, 28),
      k.outline(3, k.rgb(180, 140, 255)),
      k.fixed(),
      k.z(5002),
    ]),
  );

  const inspectorIcon = track(
    k.add([
      k.text("", { size: 54 }),
      k.pos(0, 0),
      k.anchor("center"),
      k.fixed(),
      k.z(5003),
    ]),
  );

  const inspectorName = track(
    k.add([
      k.text("", { size: 20 }),
      k.pos(0, 0),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(5003),
    ]),
  );

  const inspectorCategory = track(
    k.add([
      k.text("", { size: 12 }),
      k.pos(0, 0),
      k.anchor("center"),
      k.color(140, 140, 160),
      k.fixed(),
      k.z(5003),
    ]),
  );

  const inspectorDesc = track(
    k.add([
      k.text("", { size: 15 }),
      k.pos(0, 0),
      k.color(200, 200, 220),
      k.fixed(),
      k.z(5003),
    ]),
  );

  const acquireBtnW = inspectorW - 40;
  const acquireBtn = track(
    k.add([
      k.rect(acquireBtnW, 46, { radius: 8 }),
      k.pos(0, 0),
      k.color(40, 160, 80),
      k.outline(2.5, k.rgb(100, 255, 140)),
      k.area(),
      k.fixed(),
      k.z(5003),
    ]),
  );

  const acquireBtnTxt = track(
    k.add([
      k.text("ADQUIRIR", { size: 18 }),
      k.pos(0, 0),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(5004),
    ]),
  );

  // ── Cancel/Close button ──
  const cancelBtn = track(
    k.add([
      k.rect(cancelBtnW, 36, { radius: 6 }),
      k.pos(0, 0),
      k.color(60, 30, 30),
      k.outline(2, k.rgb(180, 80, 80)),
      k.area(),
      k.fixed(),
      k.z(5003),
    ]),
  );
  const cancelBtnTxt = track(
    k.add([
      k.text("Voltar", { size: 14 }),
      k.pos(0, 0),
      k.anchor("center"),
      k.color(255, 200, 200),
      k.fixed(),
      k.z(5004),
    ]),
  );

  // ── State variables ──
  let selectedPerkId: string = perkDefs[0]?.id ?? "";
  const categoryLabels: Record<string, string> = {
    reset: "⚙ Reset (máx. 1)",
    stack: "∞ Stack Infinito (máx. 1)",
    general: "🎯 Geral",
    basic: "🗡 Ataque Básico",
    shock: "⚡ Choque",
  };

  const isHoveringLocal = (obj: GameObj, w: number, h: number) => {
    if (obj.hidden) return false;
    const mp = k.mousePos();
    const bx = obj.pos.x;
    const by = obj.pos.y;
    return mp.x >= bx && mp.x <= bx + w && mp.y >= by && mp.y <= by + h;
  };

  // ── Reposition elements on screen resize ──
  function reposition() {
    const layout = getLayoutPositions();

    (overlayBg as any).width = k.width();
    (overlayBg as any).height = k.height();

    titleText.pos = k.vec2(k.width() / 2, 40);
    costText.pos = k.vec2(k.width() / 2, 80);
    slotsText.pos = k.vec2(k.width() / 2, 102);

    cancelBtn.pos = k.vec2(k.width() / 2 - cancelBtnW / 2, k.height() - 60);
    cancelBtnTxt.pos = k.vec2(k.width() / 2, k.height() - 42);

    // Reposition grid squares
    for (const sq of squares) {
      const col = sq.index % gridCols;
      const row = Math.floor(sq.index / gridCols);
      const sx = layout.gridX + col * (sqSize + sqGap);
      const sy = layout.gridY + row * (sqSize + sqGap);

      sq.bg.pos = k.vec2(sx, sy);
      sq.icon.pos = k.vec2(sx + sqSize / 2, sy + sqSize / 2);
      sq.acquiredOverlay.pos = k.vec2(sx, sy);
      sq.acquiredTxt.pos = k.vec2(sx + sqSize / 2, sy + sqSize / 2);
    }

    // Reposition inspector
    inspectorBg.pos = k.vec2(layout.inspectorX, layout.inspectorY);
    inspectorIcon.pos = k.vec2(layout.inspectorX + inspectorW / 2, layout.inspectorY + 44);
    inspectorName.pos = k.vec2(layout.inspectorX + inspectorW / 2, layout.inspectorY + 92);
    inspectorCategory.pos = k.vec2(layout.inspectorX + inspectorW / 2, layout.inspectorY + 114);
    inspectorDesc.pos = k.vec2(layout.inspectorX + 24, layout.inspectorY + 136);

    acquireBtn.pos = k.vec2(layout.inspectorX + 20, layout.inspectorY + inspectorH - 66);
    acquireBtnTxt.pos = k.vec2(
      layout.inspectorX + 20 + acquireBtnW / 2,
      layout.inspectorY + inspectorH - 43,
    );
  }
  k.onResize(reposition);

  // ── Refresh UI representation based on state ──
  function refresh() {
    const available = getAvailablePerks();
    const availableIds = new Set(available.map((p) => p.id));
    const acquired = gameState.perks?.acquired ?? [];
    const acquiredIds = new Set(acquired);

    (slotsText as any).text = `Passivas Adquiridas: ${acquired.length}/2`;

    // Refresh grid squares styling
    for (const sq of squares) {
      const def = sq.def;
      const isSelected = selectedPerkId === def.id;
      const hasIt = acquiredIds.has(def.id);
      const isLocked = !availableIds.has(def.id) && !hasIt;

      if (isSelected) {
        sq.bg.outline.color = k.rgb(def.color[0], def.color[1], def.color[2]);
        sq.bg.outline.width = 4.0;
        sq.bg.color = k.rgb(36, 36, 48);
      } else {
        sq.bg.outline.color = k.rgb(60, 60, 70);
        sq.bg.outline.width = 1.5;
        sq.bg.color = k.rgb(24, 24, 34);
      }

      if (hasIt) {
        sq.acquiredOverlay.hidden = false;
        sq.acquiredOverlay.color = k.rgb(0, 40, 10);
        sq.acquiredOverlay.opacity = 0.65;
        (sq.acquiredTxt as any).text = "✓ Adquirida";
        sq.acquiredTxt.hidden = false;
        sq.acquiredTxt.color = k.rgb(120, 255, 140);
        sq.icon.opacity = 0.3;
      } else if (isLocked) {
        sq.acquiredOverlay.hidden = false;
        sq.acquiredOverlay.color = k.rgb(30, 30, 35);
        sq.acquiredOverlay.opacity = 0.75;
        (sq.acquiredTxt as any).text = "🔒 Bloqueada";
        sq.acquiredTxt.hidden = false;
        sq.acquiredTxt.color = k.rgb(200, 100, 100);
        sq.icon.opacity = 0.25;
      } else {
        sq.acquiredOverlay.hidden = true;
        sq.acquiredTxt.hidden = true;
        sq.icon.opacity = 1.0;
      }
    }

    // Refresh inspector details
    const activePerk = perkDefs.find((p) => p.id === selectedPerkId);
    if (activePerk) {
      (inspectorIcon as any).text = activePerk.icon;
      (inspectorName as any).text = activePerk.name;
      inspectorName.color = k.rgb(activePerk.color[0], activePerk.color[1], activePerk.color[2]);
      (inspectorCategory as any).text = categoryLabels[activePerk.category] ?? activePerk.category;
      (inspectorDesc as any).text = wrapText(activePerk.desc, 32);

      const hasIt = acquiredIds.has(activePerk.id);
      const isLocked = !availableIds.has(activePerk.id) && !hasIt;
      const canBuy = !hasIt && !isLocked && acquired.length < 2;

      inspectorBg.outline.color = k.rgb(activePerk.color[0], activePerk.color[1], activePerk.color[2]);

      if (hasIt) {
        (acquireBtnTxt as any).text = "JÁ ADQUIRIDA";
        acquireBtn.color = k.rgb(30, 40, 30);
        acquireBtn.outline.color = k.rgb(60, 80, 60);
        (acquireBtn as any).opacity = 0.6;
      } else if (isLocked) {
        (acquireBtnTxt as any).text = "BLOQUEADA";
        acquireBtn.color = k.rgb(40, 20, 20);
        acquireBtn.outline.color = k.rgb(80, 40, 40);
        (acquireBtn as any).opacity = 0.6;
      } else if (acquired.length >= 2) {
        (acquireBtnTxt as any).text = "LIMITE ALCANÇADO (MÁX 2)";
        acquireBtn.color = k.rgb(30, 30, 35);
        acquireBtn.outline.color = k.rgb(60, 60, 70);
        (acquireBtn as any).opacity = 0.6;
      } else {
        (acquireBtnTxt as any).text = "ADQUIRIR";
        acquireBtn.color = k.rgb(22, 163, 74);
        acquireBtn.outline.color = k.rgb(74, 222, 128);
        (acquireBtn as any).opacity = 1.0;
      }
    }
  }

  // ── Frame updates (for hover animations) ──
  k.onUpdate(() => {
    if (overlayBg.hidden) return;

    // Hover cancel button
    const cancelHover = isHoveringLocal(cancelBtn, cancelBtnW, 36);
    cancelBtn.color = cancelHover ? k.rgb(100, 40, 40) : k.rgb(60, 30, 30);
    cancelBtn.outline.color = cancelHover ? k.rgb(240, 120, 120) : k.rgb(180, 80, 80);
    cancelBtn.outline.width = cancelHover ? 3 : 2;

    const activePerk = perkDefs.find((p) => p.id === selectedPerkId);
    if (activePerk) {
      const acquired = gameState.perks?.acquired ?? [];
      const available = getAvailablePerks();
      const hasIt = acquired.includes(activePerk.id);
      const isLocked = !available.some((p) => p.id === activePerk.id) && !hasIt;
      const canBuy = !hasIt && !isLocked && acquired.length < 2;

      if (canBuy) {
        const buyHover = isHoveringLocal(acquireBtn, acquireBtnW, 46);
        acquireBtn.color = buyHover ? k.rgb(34, 197, 94) : k.rgb(22, 163, 74);
        acquireBtn.outline.color = buyHover ? k.rgb(255, 255, 255) : k.rgb(74, 222, 128);
        acquireBtn.outline.width = buyHover ? 3.5 : 2.5;
      } else {
        acquireBtn.outline.width = 1.5;
      }
    }

    // Grid square hover
    for (const sq of squares) {
      if (sq.bg.hidden) continue;
      const hover = isHoveringLocal(sq.bg, sqSize, sqSize);
      if (hover && selectedPerkId !== sq.def.id) {
        sq.bg.color = k.rgb(30, 30, 42);
        sq.bg.outline.color = k.rgb(140, 140, 160);
        sq.bg.outline.width = 2.0;
      }
    }
  });

  // ── Mouse Press Clicks ──
  k.onMousePress("left", () => {
    if (overlayBg.hidden) return;

    if (isHoveringLocal(cancelBtn, cancelBtnW, 36)) {
      hide();
      return;
    }

    for (const sq of squares) {
      if (isHoveringLocal(sq.bg, sqSize, sqSize)) {
        selectedPerkId = sq.def.id;
        refresh();
        return;
      }
    }

    const activePerk = perkDefs.find((p) => p.id === selectedPerkId);
    if (activePerk && isHoveringLocal(acquireBtn, acquireBtnW, 46)) {
      const acquired = gameState.perks?.acquired ?? [];
      const available = getAvailablePerks();
      const hasIt = acquired.includes(activePerk.id);
      const isLocked = !available.some((p) => p.id === activePerk.id) && !hasIt;
      const canBuy = !hasIt && !isLocked && acquired.length < 2;

      if (canBuy) {
        gameState.perks.acquired.push(activePerk.id);
        if (activePerk.id === "ima-magnetico") {
          applyImaMagneticoEffect();
        }
        hide();
      }
    }
  });

  function show() {
    const available = getAvailablePerks();
    if (available.length > 0) {
      selectedPerkId = available[0].id;
    } else {
      selectedPerkId = perkDefs[0]?.id ?? "";
    }

    setVisible(true);
    reposition();
    refresh();
    (k as any).setTimeScale?.(0);
  }

  function hide() {
    setVisible(false);
    (k as any).setTimeScale?.(1);
  }

  function isVisible() {
    return !overlayBg.hidden;
  }

  const setVisible = (visible: boolean) => {
    for (const obj of allObjs) obj.hidden = !visible;
  };
  setVisible(false);

  return { show, hide, isVisible };
}
