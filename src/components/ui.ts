import type { GameObj, KAPLAYCtx } from "kaplay";
import { skillsRegistry } from "./skills";
import { gameState } from "../state/gameState";

export type UIHandles = {
    updateHearts: (count: number) => void,
    updateGold: (amount: number) => void,
    updateXP: (xp: number, xpToLevel: number, level: number) => void,
    updateWave: (wave: number) => void,
    onPlayClick: (handler: () => void) => void,
    setPlayVisible: (visible: boolean) => void,
    onShopToggle: (open: boolean) => void,
    setShopVisible: (visible: boolean) => void,
    setUpgradeHandlers: (handlers: { onMoveSpeed: () => void, onHealth: () => void, onReload: () => void, onLuck: () => void, onProjectile?: () => void }) => void,
    setQuickHealHandler: (handler: () => void) => void,
    refreshShopStats: (stats: { moveSpeed: number, maxHealth: number, reloadSpeed: number, luck: number, gold: number, projectileSpeed?: number }) => void,
};

export function setupUI(k: KAPLAYCtx): UIHandles {
    // Hearts top-left
    const heartSize = 32;
    const heartSpacing = 10;
    const hearts: GameObj[] = [];
    function ensureHearts(count: number) {
        const startX = 16;
        const startY = 16;
        while (hearts.length < count) {
            const i = hearts.length;
            const heart = k.add([
                k.text("❤", { size: heartSize }),
                k.pos(startX + i * (heartSize + heartSpacing), startY),
                k.color(255, 60, 80),
                k.fixed(),
                k.z(1000),
                { id: "ui-heart" },
            ]);
            hearts.push(heart);
        }
        for (let i = 0; i < hearts.length; i++) {
            hearts[i].hidden = i >= count;
        }
    }

    // Gold top-right
    const goldLabel = k.add([
        k.text("0", { size: 28, align: 'right' }),
        k.pos(k.width() - 48, 18),
        k.color(255, 215, 0),
        k.fixed(),
        k.z(1000),
        { id: "ui-gold" },
    ]);
    function positionGoldLabel() {
        // hide top-right label by moving off-screen
        goldLabel.pos = k.vec2(-1000, -1000);
        goldLabel.hidden = true;
    }
    k.onResize(() => positionGoldLabel());
    positionGoldLabel();

    // Wave label under gold
    const waveLabel = k.add([
        k.text("Onda 1", { size: 22 }),
        k.pos(24, 18),
        k.color(180, 180, 255),
        k.fixed(),
        k.z(1000),
        { id: "ui-wave" },
    ]);
    function positionWaveLabel() {
        // place above sidebar gold indicator
        waveLabel.pos = k.vec2(40, k.height() - 100);
    }
    k.onResize(() => positionWaveLabel());
    positionWaveLabel();

    // XP bar under hearts, with level number
    const barX = 16;
    const barY = 16 + heartSize + 8; // under hearts
    const barW = 220;
    const barH = 12;
    const xpBack = k.add([
        k.rect(barW, barH),
        k.pos(barX, barY),
        k.color(60, 60, 60),
        k.fixed(),
        k.z(1000),
        { id: "ui-xp-back" },
    ]);
    const xpFill = k.add([
        k.rect(1, barH),
        k.pos(barX, barY),
        k.color(60, 120, 255), // blue fill
        k.fixed(),
        k.z(1001),
        { id: "ui-xp-fill" },
    ]);
    // Level label bigger
    const levelLabel = k.add([
        k.text("1", { size: 26 }),
        k.pos(barX + barW + 10, barY - 6),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(1001),
        { id: "ui-level" },
    ]);

    // Play button (icon-only)
    const playBtn = k.add([
        k.rect(40, 40),
        k.pos(k.width() / 2 - 50, 20),
        k.color(30, 140, 30),
        k.outline(3, k.rgb(255, 255, 255)),
        k.area(),
        k.fixed(),
        k.z(1100),
        { id: "ui-play" },
    ]);
    // Replace triangle icon with text glyph '▶' for compatibility
    const playIcon = k.add([
        k.text("▶", { size: 26 }),
        k.pos(playBtn.pos.x + 10, playBtn.pos.y + 6),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(1101),
        { id: "ui-play-icon" },
    ]);
    // Ensure click uses stored handler
    let playHandler: (() => void) | null = null;
    playBtn.onClick(() => { if (playHandler) playHandler(); });

    // Shop button next to play
    const shopBtn = k.add([
        k.rect(40, 40),
        k.pos(k.width() / 2 + 10, 20),
        k.color(60, 60, 160),
        k.outline(3, k.rgb(255, 255, 255)),
        k.area(),
        k.fixed(),
        k.z(1002),
        { id: "ui-shop" },
    ]);
    const shopIcon = k.add([
        k.rect(20, 14), // a simple "bag" icon
        k.pos(shopBtn.pos.x + 10, shopBtn.pos.y + 15),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(1003),
        { id: "ui-shop-icon" },
    ]);

    function positionTopButtons() {
        playBtn.pos = k.vec2(k.width() / 2 - 50, 20);
        playIcon.pos = k.vec2(playBtn.pos.x + 10, playBtn.pos.y + 6);
        shopBtn.pos = k.vec2(k.width() / 2 + 10, 20);
        shopIcon.pos = k.vec2(shopBtn.pos.x + 10, shopBtn.pos.y + 15);
    }
    k.onResize(() => positionTopButtons());
    positionTopButtons();

    // Remove duplicate declarations; use existing variables defined earlier
    // let playHandler: (() => void) | null = null;
    // let upgradeHandlers: { onMoveSpeed: () => void, onHealth: () => void, onReload: () => void, onLuck: () => void } | null = null;
    // let quickHealHandler: (() => void) | null = null;

    // Shop panel (lateral sidebar)
    const panelW = 520;
    const panelH = k.height() - 40;
    const shopPanel = k.add([
        k.rect(panelW, panelH),
        k.pos(20, 20),
        k.color(20, 20, 24),
        k.outline(4, k.rgb(255, 255, 255)),
        k.area(),
        k.fixed(),
        k.z(1005),
        { id: "ui-shop-panel" },
    ]);
    const title = k.add([
        k.text("Loja", { size: 32 }),
        k.pos(shopPanel.pos.x + 16, shopPanel.pos.y + 16),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(1006),
        { id: "ui-shop-title" },
    ]);
    const closeBtn = k.add([
        k.rect(32, 32),
        k.pos(shopPanel.pos.x + panelW - 48, shopPanel.pos.y + 12),
        k.color(80, 30, 30),
        k.outline(3, k.rgb(255, 255, 255)),
        k.area(),
        k.fixed(),
        k.z(1006),
        { id: "ui-shop-close" },
    ]);
    const closeTxt = k.add([
        k.text("✕", { size: 20 }),
        k.pos(closeBtn.pos.x + 8, closeBtn.pos.y + 4),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(1007),
        { id: "ui-shop-close-txt" },
    ]);
    closeBtn.onClick(() => setShopVisibleInternal(false));

    const subtitle = k.add([
        k.text("Aprimorar (10x) • Até 3 atributos", { size: 18 }),
        k.pos(shopPanel.pos.x + 16, shopPanel.pos.y + 54),
        k.color(180, 180, 200),
        k.fixed(),
        k.z(1006),
        { id: "ui-shop-subtitle" },
    ]);

    // Icon rows for upgrades (big and spaced)
    const rowGap = 84;
    const baseY = shopPanel.pos.y + 100;
    const labelColor = k.rgb(220, 220, 220);

    // Level labels left of icons
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

    // Projectile Speed row (icon: ➲)
    const lvProjLbl = k.add([k.text("0", { size: 22 }), k.pos(shopPanel.pos.x + 8, baseY + rowGap * 4 + 6), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-lv-proj" }]);
    const iconProj = k.add([k.text("➲", { size: 36 }), k.pos(shopPanel.pos.x + 40, baseY + rowGap * 4), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-icon-proj" }]);
    const statProj = k.add([k.text("0", { size: 22 }), k.pos(shopPanel.pos.x + 90, baseY + rowGap * 4 + 4), k.color(labelColor), k.fixed(), k.z(1006), { id: "ui-shop-proj" }]);
    const btnProj = k.add([k.rect(160, 44), k.pos(shopPanel.pos.x + panelW - 180, baseY + rowGap * 4 - 6), k.color(80, 80, 200), k.outline(3), k.area(), k.fixed(), k.z(1007), { id: "ui-up-proj" }]);
    const btnProjText = k.add([k.text("Aprimorar", { size: 22 }), k.pos(btnProj.pos.x + 20, btnProj.pos.y + 6), k.color(255, 255, 255), k.fixed(), k.z(1008), { id: "ui-up-proj-text" }]);

    // Tooltip label (hover)
    const tooltip = k.add([
        k.text("", { size: 18 }),
        k.pos(0, 0),
        k.color(k.rgb(255, 255, 255)),
        k.fixed(),
        k.z(2000),
        { id: "ui-tooltip" },
    ]);
    tooltip.hidden = true;
    const showTip = (text: string, near: GameObj) => { (tooltip as any).text = text; tooltip.pos = k.vec2(near.pos.x + 16, near.pos.y - 24); tooltip.hidden = false; };
    const hideTip = () => { tooltip.hidden = true; };
    // add hover via area on icons
    const iconHoverTargets = [
        { icon: iconMove, text: "Velocidade de movimento" },
        { icon: iconHP, text: "Vida máxima" },
        { icon: iconRel, text: "Velocidade de recarga" },
        { icon: iconLuck, text: "Sorte" },
        { icon: iconProj, text: "Velocidade do projétil" },
    ];
    for (const { icon, text } of iconHoverTargets) {
        icon.use(k.area());
    }
    k.onUpdate(() => {
        let shown = false;
        for (const { icon, text } of iconHoverTargets) {
            if ((icon as any).isHovering && (icon as any).isHovering()) {
                showTip(text, icon);
                shown = true;
                break;
            }
        }
        if (!shown) hideTip();
    });

    // Gold indicator at bottom
    const statGold = k.add([k.text("⎔ 0", { size: 22 }), k.pos(shopPanel.pos.x + 20, shopPanel.pos.y + panelH - 48), k.color(k.rgb(255, 215, 0)), k.fixed(), k.z(1006), { id: "ui-shop-gold" }]);

    // Quick buy button (heal)
    const quickBtn = k.add([
        k.rect(220, 44),
        k.pos(shopPanel.pos.x + panelW - 240, shopPanel.pos.y + panelH - 60),
        k.color(200, 160, 40),
        k.outline(3),
        k.area(),
        k.fixed(),
        k.z(1007),
        { id: "ui-quick-heal" },
    ]);
    const quickBtnText = k.add([
        k.text("❤ Curar (20)", { size: 22 }),
        k.pos(quickBtn.pos.x + 24, quickBtn.pos.y + 6),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(1008),
        { id: "ui-quick-heal-text" },
    ]);

    // Bottom-right skill cooldown indicator (for current skill1)
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
    function positionSkillUI() {
        const x = k.width() - skillSize - 20;
        const y = k.height() - skillSize - 20;
        skillBg.pos = k.vec2(x, y);
        cdMask.pos = k.vec2(x, y);
        skillKey.pos = k.vec2(x + skillSize / 2 - 8, y + skillSize - 34);
        cdText.pos = k.vec2(x + 10, y + 10);
    }
    k.onResize(() => positionSkillUI());
    positionSkillUI();

    k.onUpdate(() => {
        const skillId = gameState.skills.skill1;
        if (!skillId || !skillsRegistry[skillId]) {
            skillBg.hidden = true;
            skillKey.hidden = true;
            cdText.hidden = true;
            cdMask.hidden = true;
            return;
        }
        skillBg.hidden = false;
        skillKey.hidden = false;
        const lvl = gameState.skills.levels[skillId] ?? 1;
        const cd = skillsRegistry[skillId].getCooldown ? skillsRegistry[skillId].getCooldown!(lvl) : 3000;
        const last = gameState.skills.lastUsedAt[skillId] ?? 0;
        const elapsed = Date.now() - last;
        const remaining = Math.max(0, cd - elapsed);
        const ratio = remaining / cd;
        if (remaining > 0) {
            (cdText as any).text = (remaining / 1000).toFixed(1) + "s";
            cdText.hidden = false;
            cdMask.hidden = false;
            // Adjust mask height from bottom to top proportionally
            (cdMask as any).width = skillSize;
            (cdMask as any).height = Math.floor(skillSize * ratio);
            cdMask.pos = k.vec2(skillBg.pos.x, skillBg.pos.y + (skillSize - (cdMask as any).height));
        } else {
            cdText.hidden = true;
            cdMask.hidden = true;
        }
    });

    // Skill selection overlay
    const overlayBg = k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.6),
      k.fixed(),
      k.z(3000),
      { id: "ui-skill-overlay" },
    ]);
    overlayBg.hidden = true;

    function wrapText(text: string, max: number = 28): string {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        if ((line + (line ? " " : "") + w).length > max) {
          if (line) lines.push(line);
          line = w;
        } else {
          line = line ? line + " " + w : w;
        }
      }
      if (line) lines.push(line);
      return lines.join("\n");
    }

    function makeCard(x: number, y: number, w: number, h: number) {
      const card = k.add([k.rect(w, h), k.pos(x, y), k.color(32, 32, 40), k.outline(4, k.rgb(255,255,255)), k.area(), k.fixed(), k.z(3001), { id: "ui-skill-card", skillId: "", desc: "" }]);
      const title = k.add([k.text("Skill", { size: 28 }), k.pos(x + 20, y + 20), k.color(255, 255, 255), k.fixed(), k.z(3002), { id: "ui-skill-title" }]);
      const desc = k.add([k.text("", { size: 20 }), k.pos(x + 20, y + 60), k.color(200, 200, 220), k.fixed(), k.z(3002), { id: "ui-skill-desc" }]);
      // Choose button
      const choose = k.add([k.rect(160, 44), k.pos(x + 20, y + h - 120), k.color(30, 140, 30), k.outline(3), k.area(), k.fixed(), k.z(3002), { id: "ui-skill-choose" }]);
      const chooseText = k.add([k.text("Escolher", { size: 22 }), k.pos(choose.pos.x + 24, choose.pos.y + 6), k.color(255,255,255), k.fixed(), k.z(3003), { id: "ui-skill-choose-text" }]);
      // Reroll button
      const reroll = k.add([k.rect(120, 40), k.pos(x + w - 140, y + h - 60), k.color(80, 60, 160), k.outline(3), k.area(), k.fixed(), k.z(3002), { id: "ui-skill-reroll" }]);
      const rerollText = k.add([k.text("Reroll", { size: 22 }), k.pos(reroll.pos.x + 14, reroll.pos.y + 6), k.color(255,255,255), k.fixed(), k.z(3003), { id: "ui-skill-reroll-text" }]);
      return { card, title, desc, choose, chooseText, reroll, rerollText };
    }

    const cardW = 320; const cardH = 420;
    const gap = 40;
    let cards = [
      makeCard(Math.floor(k.width()/2 - cardW*1.5 - gap), Math.floor(60), cardW, cardH),
      makeCard(Math.floor(k.width()/2 - cardW/2), Math.floor(60), cardW, cardH),
      makeCard(Math.floor(k.width()/2 + cardW/2 + gap), Math.floor(60), cardW, cardH),
    ];
    function positionCards() {
      cards[0].card.pos = k.vec2(Math.floor(k.width()/2 - cardW*1.5 - gap), 60);
      cards[0].title.pos = cards[0].card.pos.add(k.vec2(20, 20));
      cards[0].desc.pos = cards[0].card.pos.add(k.vec2(20, 60));
      cards[0].choose.pos = cards[0].card.pos.add(k.vec2(20, cardH - 120));
      cards[0].chooseText.pos = cards[0].choose.pos.add(k.vec2(24, 6));
      cards[0].reroll.pos = cards[0].card.pos.add(k.vec2(cardW - 140, cardH - 60));
      cards[0].rerollText.pos = cards[0].reroll.pos.add(k.vec2(14, 6));
      cards[1].card.pos = k.vec2(Math.floor(k.width()/2 - cardW/2), 60);
      cards[1].title.pos = cards[1].card.pos.add(k.vec2(20, 20));
      cards[1].desc.pos = cards[1].card.pos.add(k.vec2(20, 60));
      cards[1].choose.pos = cards[1].card.pos.add(k.vec2(20, cardH - 120));
      cards[1].chooseText.pos = cards[1].choose.pos.add(k.vec2(24, 6));
      cards[1].reroll.pos = cards[1].card.pos.add(k.vec2(cardW - 140, cardH - 60));
      cards[1].rerollText.pos = cards[1].reroll.pos.add(k.vec2(14, 6));
      cards[2].card.pos = k.vec2(Math.floor(k.width()/2 + cardW/2 + gap), 60);
      cards[2].title.pos = cards[2].card.pos.add(k.vec2(20, 20));
      cards[2].desc.pos = cards[2].card.pos.add(k.vec2(20, 60));
      cards[2].choose.pos = cards[2].card.pos.add(k.vec2(20, cardH - 120));
      cards[2].chooseText.pos = cards[2].choose.pos.add(k.vec2(24, 6));
      cards[2].reroll.pos = cards[2].card.pos.add(k.vec2(cardW - 140, cardH - 60));
      cards[2].rerollText.pos = cards[2].reroll.pos.add(k.vec2(14, 6));
    }
    k.onResize(() => positionCards());
    positionCards();

    const skillInfos: { id: string; name: string; desc: string }[] = [
      { id: "shockwave", name: "Shockwave", desc: "Onda que empurra inimigos ao ficar parado e disparar." },
      { id: "ricochet-shot", name: "Ricochet", desc: "Projétil quica e busca novos alvos próximos." },
      { id: "cone-shot", name: "Cone Shot", desc: "Vários projéteis em cone seguindo a mira." },
      { id: "chain-lightning", name: "Chain Lightning", desc: "Raio elétrico salta entre inimigos próximos." },
      { id: "arc-mine", name: "Arc Mine", desc: "Minas que explodem ao aproximar inimigos." },
      { id: "poison-pool", name: "Poison Pool", desc: "Poças estáticas aplicam veneno por tempo." },
      { id: "boomerang-bolt", name: "Boomerang Bolt", desc: "Projétil vai e retorna, causando dano duplo." },
      { id: "summoned-totem", name: "Summoned Totem", desc: "Totem atira automaticamente em inimigos." },
      { id: "marked-shot", name: "Marked Shot", desc: "Acertos marcam inimigos; levam dano extra." },
      { id: "orbital-orbs", name: "Orbital Orbs", desc: "Orbes orbitam e colidem; ativação acelera." },
      { id: "attack-buff", name: "Buff de Ataque", desc: "Buff temporário no ataque básico." },
    ];

    function sample3(): { id: string; name: string; desc: string }[] {
      const pool = [...skillInfos];
      // exclude if already chosen
      const chosen = gameState.skills.skill1;
      const out: any[] = [];
      while (out.length < 3 && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        const pick = pool.splice(idx, 1)[0];
        if (!chosen || pick.id !== chosen) out.push(pick);
      }
      return out;
    }

    function setOverlayVisible(visible: boolean) {
      overlayBg.hidden = !visible;
      for (const C of cards) {
        C.card.hidden = !visible;
        C.title.hidden = !visible;
        C.desc.hidden = !visible;
        C.choose.hidden = !visible;
        C.chooseText.hidden = !visible;
        C.reroll.hidden = !visible;
        C.rerollText.hidden = !visible;
      }
    }
    setOverlayVisible(false);

    function showSkillOverlay() {
      setOverlayVisible(true);
      setShopVisibleInternal(false);
      const options = sample3();
      for (let i = 0; i < 3; i++) {
        const opt = options[i];
        (cards[i].card as any).skillId = opt.id;
        (cards[i].title as any).text = opt.name;
        (cards[i].desc as any).text = wrapText(opt.desc, 30);
      }
    }
    function hideSkillOverlay() { setOverlayVisible(false); }

    let overlayOpen = false;
    k.onUpdate(() => {
      const noWave = (k.get("enemy") as GameObj[]).length === 0;
      const needSkill = !gameState.skills.skill1;
      const shouldOpen = noWave && needSkill && gameState.level >= 2;
      if (shouldOpen && !overlayOpen) { overlayOpen = true; showSkillOverlay(); }
      if (!shouldOpen && overlayOpen) { overlayOpen = false; hideSkillOverlay(); }
    });

    // Helpers
    const costForLevel = (n: number) => 5 + (n - 1) * (n - 1) + n;
    const setButtonEnabled = (btn: GameObj, label: GameObj, enabled: boolean) => {
        const bright = k.rgb(255, 255, 255);
        const dimText = k.rgb(120, 120, 120);
        (label as any).color = enabled ? bright : dimText;
        btn.outline.width = enabled ? 3 : 1;
        // stronger dimming effect: darken button base color
        const base = enabled ? k.rgb(90, 180, 90) : k.rgb(50, 50, 50);
        (btn as any).color = base;
    };

    // visibility control
    let shopVisible = false;
    function setShopVisibleInternal(visible: boolean) {
        shopVisible = visible;
        shopPanel.hidden = !visible;
        title.hidden = !visible;
        closeBtn.hidden = !visible;
        closeTxt.hidden = !visible;
        subtitle.hidden = !visible;
        lvMoveLbl.hidden = !visible;
        iconMove.hidden = !visible;
        statMove.hidden = !visible;
        btnMove.hidden = !visible;
        btnMoveText.hidden = !visible;
        lvHPLbl.hidden = !visible;
        iconHP.hidden = !visible;
        statHP.hidden = !visible;
        btnHP.hidden = !visible;
        btnHPText.hidden = !visible;
        lvRelLbl.hidden = !visible;
        iconRel.hidden = !visible;
        statRel.hidden = !visible;
        btnRel.hidden = !visible;
        btnRelText.hidden = !visible;
        lvLuckLbl.hidden = !visible;
        iconLuck.hidden = !visible;
        statLuck.hidden = !visible;
        btnLuck.hidden = !visible;
        btnLuckText.hidden = !visible;
        // projectile
        lvProjLbl.hidden = !visible;
        iconProj.hidden = !visible;
        statProj.hidden = !visible;
        btnProj.hidden = !visible;
        btnProjText.hidden = !visible;
        // quick heal button
        quickBtn.hidden = !visible;
        quickBtnText.hidden = !visible;
        tooltip.hidden = true;
    }
    setShopVisibleInternal(false);

    let upgradeHandlers: { onMoveSpeed: () => void, onHealth: () => void, onReload: () => void, onLuck: () => void, onProjectile?: () => void } | null = null;
    let quickHealHandler: (() => void) | null = null;

    const toggleShop = () => setShopVisibleInternal(!shopVisible);
    // shopBtn is defined earlier in top buttons area
    shopBtn.onClick(() => toggleShop());

    // Quick heal button
    quickBtn.onClick(() => { if (quickHealHandler) quickHealHandler(); });

    // Upgrade button click wiring
    btnMove.onClick(() => { if (upgradeHandlers) upgradeHandlers.onMoveSpeed(); });
    btnHP.onClick(() => { if (upgradeHandlers) upgradeHandlers.onHealth(); });
    btnRel.onClick(() => { if (upgradeHandlers) upgradeHandlers.onReload(); });
    btnLuck.onClick(() => { if (upgradeHandlers) upgradeHandlers.onLuck(); });
    btnProj.onClick(() => { if (upgradeHandlers?.onProjectile) upgradeHandlers.onProjectile(); });

    function wireButtonClick(btn: GameObj, handler: () => void) {
      // Keep standard onClick
      btn.onClick(handler);
      // Fallback: fire on mouse release when hovering (some setups miss onClick on fixed UI)
      k.onMouseRelease(() => {
        const isH = (btn as any).isHovering && (btn as any).isHovering();
        if (!overlayBg.hidden && !btn.hidden && isH) handler();
      });
    }

    // Rewire buttons using hover-based fallback
    for (const C of cards) {
      // ensure buttons have area (already set in creation)
      wireButtonClick(C.card, () => {
        const id = (C.card as any).skillId as string;
        if (!id) return;
        gameState.skills.skill1 = id;
        gameState.skills.levels[id] = 1;
        hideSkillOverlay();
      });
      wireButtonClick(C.choose, () => {
        const id = (C.card as any).skillId as string;
        if (!id) return;
        gameState.skills.skill1 = id;
        gameState.skills.levels[id] = 1;
        hideSkillOverlay();
      });
      wireButtonClick(C.reroll, () => {
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
        (C.desc as any).text = wrapText(pick.desc, 30);
      });
    }

    return {
        updateHearts: (count: number) => ensureHearts(count),
        updateGold: (amount: number) => {
            (goldLabel as any).text = String(amount);
            if (typeof statGold !== "undefined") { (statGold as any).text = `⎔ ${amount}`; }
        },
        updateXP: (xp: number, xpToLevel: number, level: number) => {
            const pct = xpToLevel > 0 ? Math.max(0, Math.min(1, xp / xpToLevel)) : 0;
            xpFill.width = Math.floor(barW * pct);
            (levelLabel as any).text = `${level}`;
        },
        updateWave: (wave: number) => { (waveLabel as any).text = `Onda ${wave}`; },
        onPlayClick: (handler: () => void) => { playHandler = handler; },
        setPlayVisible: (visible: boolean) => { playBtn.hidden = !visible; playIcon.hidden = !visible; },
        onShopToggle: (open: boolean) => { setShopVisibleInternal(open); },
        setShopVisible: (visible: boolean) => { setShopVisibleInternal(visible); },
        setUpgradeHandlers: (handlers) => { upgradeHandlers = handlers; },
        setQuickHealHandler: (handler: () => void) => { quickHealHandler = handler; },
        refreshShopStats: (stats) => {
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
        },
    };
}
