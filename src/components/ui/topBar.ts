import type { KAPLAYCtx, GameObj } from "kaplay";

export type TopBarHandles = {
  updateHearts: (count: number) => void,
  updateGold: (amount: number) => void,
  updateWave: (wave: number) => void,
  updateXP: (xp: number, xpToLevel: number, level: number) => void,
  onPlayClick: (handler: () => void) => void,
  setPlayVisible: (visible: boolean) => void,
  shopBtn: GameObj,
};

export function createTopBar(k: KAPLAYCtx): TopBarHandles {
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

  const goldLabel = k.add([
    k.text("0", { size: 28, align: 'right' }),
    k.pos(k.width() - 48, 18),
    k.color(255, 215, 0),
    k.fixed(),
    k.z(1000),
    { id: "ui-gold" },
  ]);
  const positionGoldLabel = () => { goldLabel.pos = k.vec2(-1000, -1000); goldLabel.hidden = true; };
  k.onResize(positionGoldLabel); positionGoldLabel();

  const waveLabel = k.add([
    k.text("Onda 1", { size: 22 }),
    k.pos(24, 18),
    k.color(180, 180, 255),
    k.fixed(),
    k.z(1000),
    { id: "ui-wave" },
  ]);
  const positionWaveLabel = () => { waveLabel.pos = k.vec2(40, k.height() - 100); };
  k.onResize(positionWaveLabel); positionWaveLabel();

  const barX = 16;
  const barY = 16 + heartSize + 8;
  const barW = 220;
  const barH = 12;
  const xpBack = k.add([k.rect(barW, barH), k.pos(barX, barY), k.color(60, 60, 60), k.fixed(), k.z(1000), { id: "ui-xp-back" }]);
  const xpFill = k.add([k.rect(1, barH), k.pos(barX, barY), k.color(60, 120, 255), k.fixed(), k.z(1001), { id: "ui-xp-fill" }]);
  const levelLabel = k.add([k.text("1", { size: 26 }), k.pos(barX + barW + 10, barY - 6), k.color(255, 255, 255), k.fixed(), k.z(1001), { id: "ui-level" }]);

  const playBtn = k.add([k.rect(40, 40), k.pos(k.width() / 2 - 50, 20), k.color(30, 140, 30), k.outline(3, k.rgb(255, 255, 255)), k.area(), k.fixed(), k.z(1100), { id: "ui-play" }]);
  const playIcon = k.add([k.text("▶", { size: 26 }), k.pos(playBtn.pos.x + 10, playBtn.pos.y + 6), k.color(255, 255, 255), k.fixed(), k.z(1101), { id: "ui-play-icon" }]);
  let playHandler: (() => void) | null = null;
  playBtn.onClick(() => { if (playHandler) playHandler(); });

  const shopBtn = k.add([k.rect(40, 40), k.pos(k.width() / 2 + 10, 20), k.color(60, 60, 160), k.outline(3, k.rgb(255, 255, 255)), k.area(), k.fixed(), k.z(1002), { id: "ui-shop" }]);
  const shopIcon = k.add([k.rect(20, 14), k.pos(shopBtn.pos.x + 10, shopBtn.pos.y + 15), k.color(255, 255, 255), k.fixed(), k.z(1003), { id: "ui-shop-icon" }]);
  const positionTopButtons = () => {
    playBtn.pos = k.vec2(k.width() / 2 - 50, 20);
    playIcon.pos = k.vec2(playBtn.pos.x + 10, playBtn.pos.y + 6);
    shopBtn.pos = k.vec2(k.width() / 2 + 10, 20);
    shopIcon.pos = k.vec2(shopBtn.pos.x + 10, shopBtn.pos.y + 15);
  };
  k.onResize(positionTopButtons); positionTopButtons();

  return {
    updateHearts: ensureHearts,
    updateGold: (amount) => { (goldLabel as any).text = String(amount); },
    updateWave: (wave) => { (waveLabel as any).text = `Onda ${wave}`; },
    updateXP: (xp, xpToLevel, level) => { const pct = xpToLevel > 0 ? Math.max(0, Math.min(1, xp / xpToLevel)) : 0; xpFill.width = Math.floor(barW * pct); (levelLabel as any).text = `${level}`; },
    onPlayClick: (handler) => { playHandler = handler; },
    setPlayVisible: (visible) => { playBtn.hidden = !visible; playIcon.hidden = !visible; },
    shopBtn,
  };
}
