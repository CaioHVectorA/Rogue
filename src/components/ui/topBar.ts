import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../../state/gameState";

export type TopBarHandles = {
  updateHearts: (count: number) => void;
  updateGold: (amount: number) => void;
  updateWave: (wave: number) => void;
  updateXP: (xp: number, xpToLevel: number, level: number) => void;
  onPlayClick: (handler: () => void) => void;
  setPlayVisible: (visible: boolean) => void;
  shopBtn: GameObj;
};

export function createTopBar(k: KAPLAYCtx): TopBarHandles {
  // ============================================================
  // Modern HP Bar — replaces hearts
  // ============================================================
  const hpBarW = 200;
  const hpBarH = 22;
  const hpBarX = 16;
  const hpBarY = 16;
  const hpBarRadius = 6;

  // Background (dark, outline)
  const hpBarBg = k.add([
    k.rect(hpBarW, hpBarH, { radius: hpBarRadius }),
    k.pos(hpBarX, hpBarY),
    k.color(30, 30, 35),
    k.outline(2, k.rgb(80, 80, 90)),
    k.fixed(),
    k.z(1000),
    { id: "ui-hp-bar-bg" },
  ]);

  // Fill (green → yellow → red based on %)
  const hpBarFill = k.add([
    k.rect(hpBarW - 4, hpBarH - 4, { radius: hpBarRadius - 2 }),
    k.pos(hpBarX + 2, hpBarY + 2),
    k.color(60, 220, 80),
    k.fixed(),
    k.z(1001),
    { id: "ui-hp-bar-fill" },
  ]);

  // Glow overlay (brighter stripe on top half for "shiny" look)
  const hpBarGlow = k.add([
    k.rect(hpBarW - 8, Math.floor(hpBarH / 3), { radius: 3 }),
    k.pos(hpBarX + 4, hpBarY + 3),
    k.color(255, 255, 255),
    k.opacity(0.18),
    k.fixed(),
    k.z(1002),
    { id: "ui-hp-bar-glow" },
  ]);

  // HP text: "500 / 500"
  const hpLabel = k.add([
    k.text("500 / 500", { size: 13 }),
    k.pos(hpBarX + hpBarW / 2, hpBarY + 3),
    k.color(255, 255, 255),
    k.anchor("top"),
    k.fixed(),
    k.z(1003),
    { id: "ui-hp-label" },
  ]);

  // Heart icon left of bar
  const hpIcon = k.add([
    k.text("❤", { size: 22 }),
    k.pos(hpBarX + hpBarW + 6, hpBarY - 1),
    k.color(255, 80, 100),
    k.fixed(),
    k.z(1003),
    { id: "ui-hp-icon" },
  ]);

  let lastHp = -1;

  function updateHP(currentHP: number) {
    const maxHP = gameState.maxHealth;
    const hp = Math.max(0, Math.min(currentHP, maxHP));
    const ratio = maxHP > 0 ? hp / maxHP : 0;

    // Fill width
    const fillW = Math.max(0, (hpBarW - 4) * ratio);
    (hpBarFill as any).width = fillW;
    // Glow width tracks fill
    (hpBarGlow as any).width = Math.max(0, fillW - 4);

    // Color: green → yellow → orange → red
    if (ratio > 0.6) {
      hpBarFill.color = k.rgb(60, 220, 80); // green
    } else if (ratio > 0.35) {
      hpBarFill.color = k.rgb(240, 200, 40); // yellow
    } else if (ratio > 0.15) {
      hpBarFill.color = k.rgb(240, 130, 30); // orange
    } else {
      hpBarFill.color = k.rgb(220, 50, 50); // red
    }

    // Label
    (hpLabel as any).text = `${hp} / ${maxHP}`;

    // Flash effect on damage
    if (lastHp > hp && lastHp >= 0) {
      // Quick red flash on the bar
      hpBarBg.color = k.rgb(180, 40, 40);
      const flashTimer = { t: 0 };
      const cancel = k.onUpdate(() => {
        flashTimer.t += k.dt();
        if (flashTimer.t >= 0.15) {
          hpBarBg.color = k.rgb(30, 30, 35);
          cancel.cancel();
        }
      });
    }
    lastHp = hp;
  }

  // Initial render
  updateHP(gameState.maxHealth);

  const goldLabel = k.add([
    k.text("0", { size: 28, align: "right" }),
    k.pos(k.width() - 48, 18),
    k.color(255, 215, 0),
    k.fixed(),
    k.z(1000),
    { id: "ui-gold" },
  ]);
  const positionGoldLabel = () => {
    goldLabel.pos = k.vec2(-1000, -1000);
    goldLabel.hidden = true;
  };
  k.onResize(positionGoldLabel);
  positionGoldLabel();

  const waveLabel = k.add([
    k.text("Onda 1", { size: 22 }),
    k.pos(24, 18),
    k.color(180, 180, 255),
    k.fixed(),
    k.z(1000),
    { id: "ui-wave" },
  ]);
  const positionWaveLabel = () => {
    waveLabel.pos = k.vec2(40, k.height() - 100);
  };
  k.onResize(positionWaveLabel);
  positionWaveLabel();

  const barX = hpBarX;
  const barY = hpBarY + hpBarH + 8;
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
    k.color(60, 120, 255),
    k.fixed(),
    k.z(1001),
    { id: "ui-xp-fill" },
  ]);
  const levelLabel = k.add([
    k.text("1", { size: 26 }),
    k.pos(barX + barW + 10, barY - 6),
    k.color(255, 255, 255),
    k.fixed(),
    k.z(1001),
    { id: "ui-level" },
  ]);

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
  const playIcon = k.add([
    k.text("▶", { size: 26 }),
    k.pos(playBtn.pos.x + 10, playBtn.pos.y + 6),
    k.color(255, 255, 255),
    k.fixed(),
    k.z(1101),
    { id: "ui-play-icon" },
  ]);
  let playHandler: (() => void) | null = null;
  playBtn.onClick(() => {
    if (playBtn.hidden) return; // guard: button not visible
    if (playHandler) playHandler();
  });

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
    k.rect(20, 14),
    k.pos(shopBtn.pos.x + 10, shopBtn.pos.y + 15),
    k.color(255, 255, 255),
    k.fixed(),
    k.z(1003),
    { id: "ui-shop-icon" },
  ]);
  const positionTopButtons = () => {
    playBtn.pos = k.vec2(k.width() / 2 - 50, 20);
    playIcon.pos = k.vec2(playBtn.pos.x + 10, playBtn.pos.y + 6);
    shopBtn.pos = k.vec2(k.width() / 2 + 10, 20);
    shopIcon.pos = k.vec2(shopBtn.pos.x + 10, shopBtn.pos.y + 15);
  };
  k.onResize(positionTopButtons);
  positionTopButtons();

  return {
    updateHearts: updateHP,
    updateGold: (amount) => {
      (goldLabel as any).text = String(amount);
    },
    updateWave: (wave) => {
      (waveLabel as any).text = `Onda ${wave}`;
    },
    updateXP: (xp, xpToLevel, level) => {
      const pct = xpToLevel > 0 ? Math.max(0, Math.min(1, xp / xpToLevel)) : 0;
      xpFill.width = Math.floor(barW * pct);
      (levelLabel as any).text = `${level}`;
    },
    onPlayClick: (handler) => {
      playHandler = handler;
    },
    setPlayVisible: (visible) => {
      playBtn.hidden = !visible;
      playIcon.hidden = !visible;
    },
    shopBtn,
  };
}
