import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../../state/gameState";
import { skillInfos } from "../../state/skillData";
import { centerCardsLayout, wrapText } from "./helpers";

export type SkillOverlayHandles = {
  show: () => void;
  hide: () => void;
  update: () => void;
};

// ─── Elemental skill themes ──────────────────────────────
const SKILL_THEMES: Record<string, { color: [number, number, number]; shape: string }> = {
  "shockwave": { color: [60, 180, 240], shape: "wave" },
  "ricochet-shot": { color: [168, 85, 247], shape: "cross" },
  "cone-shot": { color: [240, 100, 40], shape: "triangle" },
  "chain-lightning": { color: [250, 204, 21], shape: "lightning" },
  "arc-mine": { color: [220, 38, 38], shape: "circle" },
  "poison-pool": { color: [34, 197, 94], shape: "droplet" },
  "boomerang-bolt": { color: [45, 212, 191], shape: "boomerang" },
  "summoned-totem": { color: [249, 115, 2], shape: "totem" },
  "marked-shot": { color: [236, 72, 153], shape: "target" },
  "orbital-orbs": { color: [14, 165, 233], shape: "orbs" },
  "attack-buff": { color: [234, 179, 8], shape: "sword" },
};

export function createSkillOverlay(k: KAPLAYCtx): SkillOverlayHandles {
  const overlayBg = k.add([
    k.rect(k.width(), k.height()),
    k.pos(0, 0),
    k.color(10, 10, 15),
    k.opacity(0.85),
    k.fixed(),
    k.z(3000),
    { id: "ui-skill-overlay" },
  ]);
  overlayBg.hidden = true;

  const cardW = 400;
  const cardH = 680;
  const gap = 32;
  const textWrap = 28;

  type Card = {
    card: GameObj;
    title: GameObj;
    desc: GameObj;
    meta: GameObj;
    choose: GameObj;
    chooseText: GameObj;
    reroll: GameObj;
    rerollText: GameObj;
    iconBg: GameObj;
    iconCircle: GameObj;
    iconDiamond: GameObj;
    iconTriangle: GameObj;
    iconCrossH: GameObj;
    iconCrossV: GameObj;
    rerolled?: boolean;
  };

  function buildCard(x: number, y: number): Card {
    const card = k.add([
      k.rect(cardW, cardH, { radius: 16 }),
      k.pos(x, y),
      k.color(24, 24, 34),
      k.outline(3, k.rgb(255, 255, 255)),
      k.area(),
      k.fixed(),
      k.z(3001),
      { id: "ui-skill-card", skillId: "" },
    ]);

    const title = k.add([
      k.text("Skill", { size: 26 }),
      k.pos(x + 20, y + 24),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(3002),
      { id: "ui-skill-title" },
    ]);

    const desc = k.add([
      k.text("", { size: 16 }),
      k.pos(x + 20, y + 210),
      k.color(200, 200, 220),
      k.fixed(),
      k.z(3002),
      { id: "ui-skill-desc" },
    ]);

    const meta = k.add([
      k.text("", { size: 14 }),
      k.pos(x + 20, y + cardH - 220),
      k.color(160, 160, 180),
      k.fixed(),
      k.z(3002),
      { id: "ui-skill-meta" },
    ]);

    const choose = k.add([
      k.rect(cardW - 40, 48, { radius: 10 }),
      k.pos(x + 20, y + cardH - 116),
      k.color(22, 163, 74), // Green 600
      k.outline(2, k.rgb(74, 222, 128)),
      k.area(),
      k.fixed(),
      k.z(3002),
      { id: "ui-skill-choose" },
    ]);

    const chooseText = k.add([
      k.text("ESCOLHER", { size: 16 }),
      k.pos(choose.pos.x + Math.floor((cardW - 40) / 2), choose.pos.y + 24),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(3003),
      { id: "ui-skill-choose-text" },
    ]);

    const reroll = k.add([
      k.rect(cardW - 40, 44, { radius: 8 }),
      k.pos(x + 20, y + cardH - 60),
      k.color(79, 70, 229), // Indigo 600
      k.outline(2, k.rgb(129, 140, 248)),
      k.area(),
      k.fixed(),
      k.z(3002),
      { id: "ui-skill-reroll" },
    ]);

    const rerollText = k.add([
      k.text("🔀 TROCAR", { size: 14 }),
      k.pos(reroll.pos.x + Math.floor((cardW - 40) / 2), reroll.pos.y + 22),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(3003),
      { id: "ui-skill-reroll-text" },
    ]);

    // Emblem visual containers
    const cx = x + cardW / 2;
    const cy = y + 120;

    const iconBg = k.add([
      k.circle(36),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(16, 16, 24),
      k.outline(2, k.rgb(100, 100, 100)),
      k.fixed(),
      k.z(3002),
    ]);

    const iconCircle = k.add([
      k.circle(18),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(3003),
    ]);

    const iconDiamond = k.add([
      k.rect(26, 26),
      k.pos(cx, cy),
      k.anchor("center"),
      k.rotate(45),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(3003),
    ]);

    const iconTriangle = k.add([
      k.polygon([k.vec2(-16, 12), k.vec2(0, -18), k.vec2(16, 12)]),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(3003),
    ]);

    const iconCrossH = k.add([
      k.rect(30, 6),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(3003),
    ]);

    const iconCrossV = k.add([
      k.rect(6, 30),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(3003),
    ]);

    return {
      card,
      title,
      desc,
      meta,
      choose,
      chooseText,
      reroll,
      rerollText,
      iconBg,
      iconCircle,
      iconDiamond,
      iconTriangle,
      iconCrossH,
      iconCrossV,
      rerolled: false,
    };
  }

  let cards = centerCardsLayout(k, cardW, cardH, gap).map((p) =>
    buildCard(p.x, p.y),
  );

  function positionCards() {
    const positions = centerCardsLayout(k, cardW, cardH, gap);
    for (let i = 0; i < cards.length; i++) {
      const C = cards[i];
      const p = positions[i];
      C.card.pos = p;
      C.title.pos = p.add(k.vec2(20, 24));
      
      const icx = p.x + cardW / 2;
      const icy = p.y + 120;
      C.iconBg.pos = k.vec2(icx, icy);
      C.iconCircle.pos = k.vec2(icx, icy);
      C.iconDiamond.pos = k.vec2(icx, icy);
      C.iconTriangle.pos = k.vec2(icx, icy);
      C.iconCrossH.pos = k.vec2(icx, icy);
      C.iconCrossV.pos = k.vec2(icx, icy);

      C.desc.pos = p.add(k.vec2(20, 210));
      C.meta.pos = p.add(k.vec2(20, cardH - 220));
      C.choose.pos = p.add(k.vec2(20, cardH - 116));
      C.chooseText.pos = C.choose.pos.add(
        k.vec2(Math.floor((cardW - 40) / 2), 24),
      );
      C.reroll.pos = p.add(k.vec2(20, cardH - 60));
      C.rerollText.pos = C.reroll.pos.add(
        k.vec2(Math.floor((cardW - 40) / 2), 22),
      );
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
      C.iconBg.hidden = !visible;

      // Hide all shape variables. Correct shape is shown inside updateCardTheme
      C.iconCircle.hidden = true;
      C.iconDiamond.hidden = true;
      C.iconTriangle.hidden = true;
      C.iconCrossH.hidden = true;
      C.iconCrossV.hidden = true;
    }
  };

  setCardsVisible(false);

  function showSkillShape(C: Card, shape: string, color: any) {
    C.iconCircle.hidden = true;
    C.iconDiamond.hidden = true;
    C.iconTriangle.hidden = true;
    C.iconCrossH.hidden = true;
    C.iconCrossV.hidden = true;

    const activeShape = (shape === "circle" || shape === "orbs") ? C.iconCircle
                      : (shape === "triangle" || shape === "boomerang") ? C.iconTriangle
                      : (shape === "cross" || shape === "sword") ? C.iconCrossH
                      : C.iconDiamond;

    if (shape === "cross" || shape === "sword" || shape === "totem") {
      C.iconCrossH.hidden = false;
      C.iconCrossV.hidden = false;
      C.iconCrossH.color = color;
      C.iconCrossV.color = color;
    } else {
      activeShape.hidden = false;
      activeShape.color = color;
    }
  }

  function updateCardTheme(C: Card, opt: any) {
    const theme = SKILL_THEMES[opt.id] ?? { color: [150, 150, 150], shape: "diamond" };
    const col = k.rgb(theme.color[0], theme.color[1], theme.color[2]);
    
    C.card.outline.color = col;
    C.title.color = col;
    C.iconBg.outline.color = col;
    
    showSkillShape(C, theme.shape, col);
  }

  k.onMousePress("left", () => {
    if (overlayBg.hidden) return;
    const mp = k.mousePos();

    const isHovering = (btn: GameObj, w: number, h: number) => {
      if (btn.hidden) return false;
      const bx = btn.pos.x;
      const by = btn.pos.y;
      return mp.x >= bx && mp.x <= bx + w && mp.y >= by && mp.y <= by + h;
    };

    for (const C of cards) {
      // Choose button click
      if (isHovering(C.choose, cardW - 40, 48)) {
        if (gameState.skills.skill1) return;
        const id = (C.card as any).skillId as string;
        if (!id) return;
        gameState.skills.skill1 = id;
        gameState.skills.levels[id] = 1;
        hide();
        return;
      }

      // Reroll button click
      if (isHovering(C.reroll, cardW - 40, 44)) {
        if (C.rerolled) return;
        const thisId = (C.card as any).skillId as string;
        const otherIds = new Set(
          cards
            .filter((cc) => cc !== C)
            .map((cc) => (cc.card as any).skillId as string),
        );
        const pool = skillInfos.filter((s) => !otherIds.has(s.id));
        if (pool.length === 0) return;
        let pick = pool[Math.floor(Math.random() * pool.length)];
        if (pool.length > 1 && pick.id === thisId) {
          const alt = pool.filter((p) => p.id !== thisId);
          if (alt.length > 0) pick = alt[Math.floor(Math.random() * alt.length)];
        }
        (C.card as any).skillId = pick.id;
        (C.title as any).text = pick.name;
        (C.desc as any).text = wrapText(pick.desc, textWrap);
        const dmgWrapped = wrapText(pick.damage, textWrap);
        (C.meta as any).text =
          `Cooldown inicial: ${(pick.cooldownMs / 1000).toFixed(1)}s\n${dmgWrapped}`;
        C.rerolled = true;
        C.reroll.outline.width = 1.5;
        (C.reroll as any).color = k.rgb(30, 30, 40);
        (C.rerollText as any).color = k.rgb(100, 100, 100);
        
        updateCardTheme(C, pick);
        return;
      }
    }
  });

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
      (C.meta as any).text =
        `Cooldown inicial: ${(opt.cooldownMs / 1000).toFixed(1)}s\n${dmgWrapped}`;
      C.rerolled = false;
      C.reroll.outline.width = 2;
      (C.reroll as any).color = k.rgb(79, 70, 229);
      (C.rerollText as any).color = k.rgb(255, 255, 255);

      updateCardTheme(C, opt);
    }
  };

  const hide = () => {
    overlayBg.hidden = true;
    setCardsVisible(false);
  };

  const update = () => {
    const noWave = (k.get("enemy") as GameObj[]).length === 0;
    const needSkill = !gameState.skills.skill1;
    const shouldOpen = noWave && needSkill && gameState.level >= 2;
    if (shouldOpen && overlayBg.hidden) show();
    if (!shouldOpen && !overlayBg.hidden) hide();
  };

  // Hover animations inside update loop
  k.onUpdate(() => {
    if (overlayBg.hidden) return;
    const mp = k.mousePos();
    const isHovering = (obj: GameObj, w: number, h: number) => {
      if (obj.hidden) return false;
      const bx = obj.pos.x;
      const by = obj.pos.y;
      return mp.x >= bx && mp.x <= bx + w && mp.y >= by && mp.y <= by + h;
    };

    for (const C of cards) {
      // Choose button hover style
      const chooseHover = isHovering(C.choose, cardW - 40, 48);
      C.choose.color = chooseHover ? k.rgb(34, 197, 94) : k.rgb(22, 163, 74);
      C.choose.outline.color = chooseHover ? k.rgb(255, 255, 255) : k.rgb(74, 222, 128);
      C.choose.outline.width = chooseHover ? 3.5 : 2;

      // Reroll button hover style
      if (!C.rerolled) {
        const rerollHover = isHovering(C.reroll, cardW - 40, 44);
        C.reroll.color = rerollHover ? k.rgb(99, 102, 241) : k.rgb(79, 70, 229);
        C.reroll.outline.color = rerollHover ? k.rgb(255, 255, 255) : k.rgb(129, 140, 248);
        C.reroll.outline.width = rerollHover ? 3.5 : 2;
      }
    }
  });

  return { show, hide, update };
}
