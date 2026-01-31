import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../../state/gameState";
import { skillsRegistry } from "../skills";
import { skillInfos } from "../../state/skillData";
import { centerCardsLayout, wrapText } from "./helpers";

export type SkillOverlayHandles = { show: () => void, hide: () => void, update: () => void };

export function createSkillOverlay(k: KAPLAYCtx): SkillOverlayHandles {
  const overlayBg = k.add([k.rect(k.width(), k.height()), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.6), k.fixed(), k.z(3000), { id: "ui-skill-overlay" }]);
  overlayBg.hidden = true;

  const cardW = 400; const cardH = 600; const gap = 32; // requested sizes
  const textWrap = 26; // narrower wrap to avoid overflow

  type Card = { card: GameObj, title: GameObj, desc: GameObj, meta: GameObj, choose: GameObj, chooseText: GameObj, reroll: GameObj, rerollText: GameObj, rerolled?: boolean };

  function buildCard(x: number, y: number): Card {
    const card = k.add([k.rect(cardW, cardH), k.pos(x, y), k.color(32, 32, 40), k.outline(4, k.rgb(255,255,255)), k.area(), k.fixed(), k.z(3001), { id: "ui-skill-card", skillId: "" }]);
    const title = k.add([k.text("Skill", { size: 28 }), k.pos(x + 20, y + 20), k.color(255, 255, 255), k.fixed(), k.z(3002), { id: "ui-skill-title" }]);
    const desc = k.add([k.text("", { size: 18 }), k.pos(x + 20, y + 60), k.color(200, 200, 220), k.fixed(), k.z(3002), { id: "ui-skill-desc" }]);
    const meta = k.add([k.text("", { size: 18 }), k.pos(x + 20, y + cardH - 180), k.color(220, 220, 220), k.fixed(), k.z(3002), { id: "ui-skill-meta" }]);
    const choose = k.add([k.rect(cardW - 40, 48), k.pos(x + 20, y + cardH - 110), k.color(30, 140, 30), k.outline(3), k.area(), k.fixed(), k.z(3002), { id: "ui-skill-choose" }]);
    const chooseText = k.add([k.text("Escolher", { size: 22 }), k.pos(choose.pos.x + Math.floor((cardW - 40) / 2) - 48, choose.pos.y + 8), k.color(255,255,255), k.fixed(), k.z(3003), { id: "ui-skill-choose-text" }]);
    const reroll = k.add([k.rect(cardW - 40, 44), k.pos(x + 20, y + cardH - 68), k.color(80, 60, 160), k.outline(3), k.area(), k.fixed(), k.z(3002), { id: "ui-skill-reroll" }]);
    const rerollText = k.add([k.text("Reroll", { size: 22 }), k.pos(reroll.pos.x + Math.floor((cardW - 40) / 2) - 36, reroll.pos.y + 8), k.color(255,255,255), k.fixed(), k.z(3003), { id: "ui-skill-reroll-text" }]);
    return { card, title, desc, meta, choose, chooseText, reroll, rerollText, rerolled: false };
  }

  let cards = centerCardsLayout(k, cardW, cardH, gap).map((p) => buildCard(p.x, p.y));

  function positionCards() {
    const positions = centerCardsLayout(k, cardW, cardH, gap);
    for (let i = 0; i < cards.length; i++) {
      const C = cards[i];
      const p = positions[i];
      C.card.pos = p;
      C.title.pos = p.add(k.vec2(20, 20));
      C.desc.pos = p.add(k.vec2(20, 60));
      C.meta.pos = p.add(k.vec2(20, cardH - 180));
      C.choose.pos = p.add(k.vec2(20, cardH - 110));
      C.chooseText.pos = C.choose.pos.add(k.vec2(Math.floor((cardW - 40) / 2) - 48, 8));
      C.reroll.pos = p.add(k.vec2(20, cardH - 68));
      C.rerollText.pos = C.reroll.pos.add(k.vec2(Math.floor((cardW - 40) / 2) - 36, 8));
    }
  }
  k.onResize(() => positionCards());
  positionCards();

  const setCardsVisible = (visible: boolean) => {
    for (const C of cards) {
      C.card.hidden = !visible;
      C.title.hidden = !visible;
      C.desc.hidden = !visible;
      C.meta.hidden = !visible;
      C.choose.hidden = !visible;
      C.chooseText.hidden = !visible;
      C.reroll.hidden = !visible;
      C.rerollText.hidden = !visible;
    }
  };

  const wireButtonClick = (btn: GameObj, handler: () => void) => { btn.onClick(handler); };

  for (const C of cards) {
    wireButtonClick(C.choose, () => {
      const id = (C.card as any).skillId as string;
      if (!id) return;
      gameState.skills.skill1 = id;
      gameState.skills.levels[id] = 1;
      hide();
    });
    wireButtonClick(C.reroll, () => {
      if (C.rerolled) return;
      const thisId = (C.card as any).skillId as string;
      const otherIds = new Set(cards.filter(cc => cc !== C).map(cc => (cc.card as any).skillId as string));
      const pool = skillInfos.filter(s => !otherIds.has(s.id));
      if (pool.length === 0) return;
      let pick = pool[Math.floor(Math.random() * pool.length)];
      if (pool.length > 1 && pick.id === thisId) {
        const alt = pool.filter(p => p.id !== thisId);
        if (alt.length > 0) pick = alt[Math.floor(Math.random() * alt.length)];
      }
      (C.card as any).skillId = pick.id;
      (C.title as any).text = pick.name;
      (C.desc as any).text = wrapText(pick.desc, textWrap);
      const dmgWrapped = wrapText(pick.damage, textWrap);
      (C.meta as any).text = `CD: ${(pick.cooldownMs/1000).toFixed(1)}s\nDano: ${dmgWrapped}`;
      C.rerolled = true;
      C.reroll.outline.width = 1;
      (C.reroll as any).color = k.rgb(50, 50, 50);
      (C.rerollText as any).color = k.rgb(120, 120, 120);
      overlayBg.hidden = false;
      setCardsVisible(true);
    });
  }

  function sample3() {
    const pool = [...skillInfos];
    const chosen = gameState.skills.skill1;
    const out: any[] = [];
    while (out.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const pick = pool.splice(idx, 1)[0];
      if (!chosen || pick.id !== chosen) out.push(pick);
    }
    return out;
  }

  const show = () => {
    overlayBg.hidden = false;
    setCardsVisible(true);
    const options = sample3();
    for (let i = 0; i < 3; i++) {
      const opt = options[i];
      const C = cards[i];
      (C.card as any).skillId = opt.id;
      (C.title as any).text = opt.name;
      (C.desc as any).text = wrapText(opt.desc, textWrap);
      const dmgWrapped = wrapText(opt.damage, textWrap);
      (C.meta as any).text = `CD: ${(opt.cooldownMs/1000).toFixed(1)}s\nDano: ${dmgWrapped}`;
      C.rerolled = false;
      C.reroll.outline.width = 3;
      (C.reroll as any).color = k.rgb(80, 60, 160);
      (C.rerollText as any).color = k.rgb(255, 255, 255);
    }
  };
  const hide = () => { overlayBg.hidden = true; setCardsVisible(false); };

  const update = () => {
    const noWave = (k.get("enemy") as GameObj[]).length === 0;
    const needSkill = !gameState.skills.skill1;
    const shouldOpen = noWave && needSkill && gameState.level >= 2;
    if (shouldOpen && overlayBg.hidden) show();
    if (!shouldOpen && !overlayBg.hidden) hide();
  };

  return { show, hide, update };
}
