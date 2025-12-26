import kaplay from "kaplay";
import { createPlayer } from "./components/player";
import { createArena } from "./components/walls";
import { createEnemy } from "./components/enemy";

const k = kaplay();

k.loadRoot("./");

// Background preto
k.setBackground(k.rgb(0, 0, 0));

// MAP_STATE: 1..5 (mais alto = mais zoom out e mapa mais largo)
const MAP_STATE = 1;

// Player: a controllable square
const player = createPlayer(k, { size: 60, speed: 360, mapState: MAP_STATE });

// Create arena walls decoupled from player
const arena = createArena(k, { center: player.pos.clone(), mapState: MAP_STATE });

// Spawn a few simple enemies that chase the player, inside arena
for (let i = 0; i < 7; i++) {
    createEnemy(k, { target: player, arenaBounds: arena, hp: 3 });
}

// Optional: click to kaboom effect
k.onClick(() => k.addKaboom(k.mousePos()));
