// ─── Perk Selection Overlay ─────────────────────────────
// Shows 2 random perk cards with 1 reroll, similar to skill selection.

import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../../state/gameState";
import { type PerkDef, PERK_COST } from "../perks/perkData";
import { samplePerks, canOpenPerkSelection } from "../perks/perkRules";
import { acquirePerk } from "../perks/perkState";
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
      k.color(0, 0, 0),
      k.opacity(0.7),
      k.fixed(),
      k.z(5000),
      { id: "perk-overlay-bg" },
    ]),
  );

  // ── Title ──
  const titleText = track(
    k.add([
      k.text("Escolha uma Perk", { size: 32 }),
      k.pos(k.width() / 2, 40),
      k.anchor("top"),
      k.color(255, 220, 100),
      k.fixed(),
      k.z(5001),
      { id: "perk-overlay-title" },
    ]),
  );

  // ── Cost info ──
  const costText = track(
    k.add([
      k.text(`★ Custo: ${PERK_COST} pontos de elevação`, { size: 16 }),
      k.pos(k.width() / 2, 80),
      k.anchor("top"),
      k.color(180, 140, 255),
      k.fixed(),
      k.z(5001),
      { id: "perk-overlay-cost" },
    ]),
  );

  // ── Perk slots info ──
  const slotsText = track(
    k.add([
      k.text("", { size: 14 }),
      k.pos(k.width() / 2, 102),
      k.anchor("top"),
      k.color(140, 140, 160),
      k.fixed(),
      k.z(5001),
      { id: "perk-overlay-slots" },
    ]),
  );

  // ── Cards ──
  const cardW = 340;
  const cardH = 420;
  const gap = 40;

  type PerkCard = {
    bg: GameObj;
    iconTxt: GameObj;
    nameTxt: GameObj;
    descTxt: GameObj;
    categoryTxt: GameObj;
    chooseBtn: GameObj;
    chooseBtnTxt: GameObj;
    rerollBtn: GameObj;
    rerollBtnTxt: GameObj;
    perkId: string;
    rerolled: boolean;
  };

  function cardPositions() {
    const totalW = cardW * 2 + gap;
    const startX = Math.floor((k.width() - totalW) / 2);
    const y = Math.floor((k.height() - cardH) / 2) + 20;
    return [k.vec2(startX, y), k.vec2(startX + cardW + gap, y)];
  }

  function buildCard(x: number, y: number): PerkCard {
    const bg = track(
      k.add([
        k.rect(cardW, cardH, { radius: 16 }),
        k.pos(x, y),
        k.color(28, 28, 36),
        k.outline(4, k.rgb(180, 140, 255)),
        k.area(),
        k.fixed(),
        k.z(5002),
        { id: "perk-card-bg" },
      ]),
    );

    const iconTxt = track(
      k.add([
        k.text("?", { size: 52 }),
        k.pos(x + cardW / 2, y + 30),
        k.anchor("top"),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(5003),
        { id: "perk-card-icon" },
      ]),
    );

    const nameTxt = track(
      k.add([
        k.text("Perk", { size: 24 }),
        k.pos(x + cardW / 2, y + 100),
        k.anchor("top"),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(5003),
        { id: "perk-card-name" },
      ]),
    );

    const descTxt = track(
      k.add([
        k.text("", { size: 17 }),
        k.pos(x + 20, y + 145),
        k.color(200, 200, 220),
        k.fixed(),
        k.z(5003),
        { id: "perk-card-desc" },
      ]),
    );

    const categoryTxt = track(
      k.add([
        k.text("", { size: 13 }),
        k.pos(x + cardW / 2, y + cardH - 170),
        k.anchor("top"),
        k.color(140, 140, 160),
        k.fixed(),
        k.z(5003),
        { id: "perk-card-category" },
      ]),
    );

    const btnW = cardW - 40;

    const chooseBtn = track(
      k.add([
        k.rect(btnW, 48, { radius: 10 }),
        k.pos(x + 20, y + cardH - 130),
        k.color(40, 160, 80),
        k.outline(3, k.rgb(100, 255, 140)),
        k.area(),
        k.fixed(),
        k.z(5003),
        { id: "perk-card-choose" },
      ]),
    );

    const chooseBtnTxt = track(
      k.add([
        k.text("Adquirir", { size: 20 }),
        k.pos(x + 20 + btnW / 2, y + cardH - 117),
        k.anchor("top"),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(5004),
        { id: "perk-card-choose-txt" },
      ]),
    );

    const rerollBtn = track(
      k.add([
        k.rect(btnW, 44, { radius: 8 }),
        k.pos(x + 20, y + cardH - 70),
        k.color(80, 60, 160),
        k.outline(3, k.rgb(140, 120, 220)),
        k.area(),
        k.fixed(),
        k.z(5003),
        { id: "perk-card-reroll" },
      ]),
    );

    const rerollBtnTxt = track(
      k.add([
        k.text("🔀 Trocar", { size: 18 }),
        k.pos(x + 20 + btnW / 2, y + cardH - 58),
        k.anchor("top"),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(5004),
        { id: "perk-card-reroll-txt" },
      ]),
    );

    return {
      bg,
      iconTxt,
      nameTxt,
      descTxt,
      categoryTxt,
      chooseBtn,
      chooseBtnTxt,
      rerollBtn,
      rerollBtnTxt,
      perkId: "",
      rerolled: false,
    };
  }

  const positions = cardPositions();
  const cards: PerkCard[] = positions.map((p) => buildCard(p.x, p.y));

  // ── Cancel button ──
  const cancelBtnW = 200;
  const cancelBtn = track(
    k.add([
      k.rect(cancelBtnW, 44, { radius: 8 }),
      k.pos(k.width() / 2 - cancelBtnW / 2, k.height() - 80),
      k.color(80, 30, 30),
      k.outline(2, k.rgb(200, 80, 80)),
      k.area(),
      k.fixed(),
      k.z(5003),
      { id: "perk-cancel-btn" },
    ]),
  );
  const cancelBtnTxt = track(
    k.add([
      k.text("Cancelar", { size: 18 }),
      k.pos(k.width() / 2, k.height() - 68),
      k.anchor("top"),
      k.color(255, 200, 200),
      k.fixed(),
      k.z(5004),
      { id: "perk-cancel-txt" },
    ]),
  );

  // ── Track rerolls ──
  let _globalRerollUsed = false;

  // ── Visibility ──
  const setVisible = (visible: boolean) => {
    for (const obj of allObjs) obj.hidden = !visible;
  };
  setVisible(false);

  // ── Category label map ──
  const categoryLabels: Record<string, string> = {
    reset: "⚙ Reset (máx. 1)",
    stack: "∞ Stack Infinito (máx. 1)",
    general: "🎯 Geral",
    basic: "🗡 Ataque Básico",
    shock: "⚡ Choque",
  };

  // ── Fill a card with perk data ──
  function fillCard(card: PerkCard, perk: PerkDef) {
    card.perkId = perk.id;
    (card.iconTxt as any).text = perk.icon;
    (card.nameTxt as any).text = perk.name;
    (card.descTxt as any).text = perk.desc;
    (card.categoryTxt as any).text =
      categoryLabels[perk.category] ?? perk.category;

    card.bg.outline.color = k.rgb(perk.color[0], perk.color[1], perk.color[2]);
    card.nameTxt.color = k.rgb(perk.color[0], perk.color[1], perk.color[2]);
  }

  // ── Reposition ──
  function reposition() {
    const pos = cardPositions();
    for (let i = 0; i < cards.length; i++) {
      const p = pos[i];
      const c = cards[i];
      c.bg.pos = p;
      c.iconTxt.pos = k.vec2(p.x + cardW / 2, p.y + 30);
      c.nameTxt.pos = k.vec2(p.x + cardW / 2, p.y + 100);
      c.descTxt.pos = k.vec2(p.x + 20, p.y + 145);
      c.categoryTxt.pos = k.vec2(p.x + cardW / 2, p.y + cardH - 170);
      c.chooseBtn.pos = k.vec2(p.x + 20, p.y + cardH - 130);
      c.chooseBtnTxt.pos = k.vec2(
        p.x + 20 + (cardW - 40) / 2,
        p.y + cardH - 117,
      );
      c.rerollBtn.pos = k.vec2(p.x + 20, p.y + cardH - 70);
      c.rerollBtnTxt.pos = k.vec2(
        p.x + 20 + (cardW - 40) / 2,
        p.y + cardH - 58,
      );
    }

    (overlayBg as any).width = k.width();
    (overlayBg as any).height = k.height();
    titleText.pos = k.vec2(k.width() / 2, 40);
    costText.pos = k.vec2(k.width() / 2, 80);
    slotsText.pos = k.vec2(k.width() / 2, 102);
    cancelBtn.pos = k.vec2(k.width() / 2 - cancelBtnW / 2, k.height() - 80);
    cancelBtnTxt.pos = k.vec2(k.width() / 2, k.height() - 68);
  }
  k.onResize(reposition);

  // ── Actions ──
  for (const card of cards) {
    card.chooseBtn.onClick(() => {
      if (overlayBg.hidden) return; // guard: overlay not visible
      if (!card.perkId) return;
      const success = acquirePerk(card.perkId);
      if (success) {
        // Apply immediate perk effects
        if (card.perkId === "ima-magnetico") {
          applyImaMagneticoEffect();
        }
        hide();
      }
    });

    card.rerollBtn.onClick(() => {
      if (overlayBg.hidden) return; // guard: overlay not visible
      if (card.rerolled || _globalRerollUsed) return;
      _globalRerollUsed = true;

      const otherIds = new Set(
        cards.filter((c) => c !== card).map((c) => c.perkId),
      );
      const pool = samplePerks(5).filter(
        (p) => !otherIds.has(p.id) && p.id !== card.perkId,
      );
      if (pool.length === 0) return;

      const pick = pool[Math.floor(Math.random() * pool.length)];
      fillCard(card, pick);
      card.rerolled = true;

      // Disable both reroll buttons visually
      for (const c of cards) {
        (c.rerollBtn as any).color = k.rgb(50, 50, 55);
        c.rerollBtn.outline.color = k.rgb(80, 80, 80);
        (c.rerollBtnTxt as any).color = k.rgb(100, 100, 100);
      }
    });
  }

  cancelBtn.onClick(() => {
    if (overlayBg.hidden) return; // guard: overlay not visible
    hide();
  });

  // ── Show / Hide ──
  function show() {
    if (!canOpenPerkSelection()) return;

    _globalRerollUsed = false;
    const options = samplePerks(2);
    if (options.length < 2) return; // not enough perks available

    for (let i = 0; i < 2; i++) {
      fillCard(cards[i], options[i]);
      cards[i].rerolled = false;
      // Reset reroll button appearance
      (cards[i].rerollBtn as any).color = k.rgb(80, 60, 160);
      cards[i].rerollBtn.outline.color = k.rgb(140, 120, 220);
      (cards[i].rerollBtnTxt as any).color = k.rgb(255, 255, 255);
    }

    const acquired = gameState.perks?.acquired ?? [];
    (slotsText as any).text = `Perks: ${acquired.length}/2`;

    setVisible(true);
    reposition();
    (k as any).setTimeScale?.(0);
  }

  function hide() {
    setVisible(false);
    (k as any).setTimeScale?.(1);
  }

  function isVisible() {
    return !overlayBg.hidden;
  }

  return { show, hide, isVisible };
}
