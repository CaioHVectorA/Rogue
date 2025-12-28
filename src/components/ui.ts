import type { GameObj, KAPLAYCtx } from "kaplay";

export type UIHandles = {
    updateHearts: (count: number) => void,
    updateGold: (amount: number) => void,
    updateXP: (xp: number, xpToLevel: number, level: number) => void,
    updateWave: (wave: number) => void,
    onPlayClick: (handler: () => void) => void,
    setPlayVisible: (visible: boolean) => void,
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
        k.text("0", { size: 28 }),
        k.pos(k.width() - 24, 18),
        k.color(255, 215, 0),
        k.fixed(),
        k.z(1000),
        { id: "ui-gold" },
    ]);
    function positionGoldLabel() {
        goldLabel.pos = k.vec2(k.width() - 24, 18);
    }
    k.onResize(() => positionGoldLabel());
    positionGoldLabel();

    // Wave label under gold
    const waveLabel = k.add([
        k.text("Onda 1", { size: 22 }),
        k.pos(k.width() - 24, 18 + 30),
        k.color(180, 180, 255),
        k.fixed(),
        k.z(1000),
        { id: "ui-wave" },
    ]);
    function positionWaveLabel() {
        waveLabel.pos = k.vec2(k.width() - 96, 48);
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
    const levelLabel = k.add([
        k.text("Lv 1", { size: 22 }),
        k.pos(barX + barW + 10, barY - 6),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(1001),
        { id: "ui-level" },
    ]);

    // Play button
    const playBtn = k.add([
        k.rect(120, 36),
        k.pos(k.width() / 2 - 60, 20),
        k.color(40, 160, 40),
        k.outline(3, k.rgb(255, 255, 255)),
        k.area(),
        k.fixed(),
        k.z(1002),
        { id: "ui-play" },
    ]);
    const playText = k.add([
        k.text("Play", { size: 22 }),
        k.pos(playBtn.pos.x + 30, playBtn.pos.y + 6),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(1003),
        { id: "ui-play-text" },
    ]);
    function positionPlay() {
        playBtn.pos = k.vec2(k.width() / 2 - 60, 20);
        playText.pos = k.vec2(playBtn.pos.x + 30, playBtn.pos.y + 6);
    }
    k.onResize(() => positionPlay());
    positionPlay();

    let playHandler: (() => void) | null = null;
    playBtn.onClick(() => { if (playHandler) playHandler(); });

    return {
        updateHearts: (count: number) => ensureHearts(count),
        updateGold: (amount: number) => { (goldLabel as any).text = String(amount); },
        updateXP: (xp: number, xpToLevel: number, level: number) => {
            const pct = xpToLevel > 0 ? Math.max(0, Math.min(1, xp / xpToLevel)) : 0;
            xpFill.width = Math.floor(barW * pct);
            (levelLabel as any).text = `Lv ${level}`;
        },
        updateWave: (wave: number) => { (waveLabel as any).text = `Onda ${wave}`; },
        onPlayClick: (handler: () => void) => { playHandler = handler; },
        setPlayVisible: (visible: boolean) => { playBtn.hidden = !visible; playText.hidden = !visible; },
    };
}
