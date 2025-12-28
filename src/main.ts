import kaplay from "kaplay";
import { createPlayer } from "./components/player";
import { createArena } from "./components/walls";
import { createEnemy } from "./components/enemy";
import { setupUI } from "./components/ui";
import { gameState } from "./state/gameState";

const k = kaplay();

k.loadRoot("./");

k.setBackground(k.rgb(0, 0, 0));

const MAP_STATE = 1;

const player = createPlayer(k, { size: 60, speed: gameState.moveSpeed, mapState: MAP_STATE, hp: gameState.maxHealth });
const arena = createArena(k, { center: player.pos.clone(), mapState: MAP_STATE });

// UI
const ui = setupUI(k);
ui.updateHearts((player as any).hp ?? 0);
ui.updateGold(gameState.gold);
ui.updateXP(gameState.xp, gameState.xpToLevel, gameState.level);
ui.updateWave(gameState.wave);

// Collect gold drops on overlap with player
k.onCollide("player", "gold-drop", (p: any, drop: any) => {
    gameState.gold += drop.value ?? 1;
    ui.updateGold(gameState.gold);
    drop.destroy();
});

// Spawn enemies inside arena
for (let i = 0; i < 7; i++) {
    const e = createEnemy(k, { target: player, arenaBounds: arena, hp: 3 });
    e.onDestroy(() => {
        // XP increases when enemy dies (not on pick-up)
        gameState.xp += 1;
        if (gameState.xp >= gameState.xpToLevel) {
            gameState.xp -= gameState.xpToLevel;
            gameState.level += 1;
            gameState.xpToLevel = Math.floor(gameState.xpToLevel * 1.3);
        }
        ui.updateXP(gameState.xp, gameState.xpToLevel, gameState.level);
    });
}

k.onClick(() => k.addKaboom(k.mousePos()));
