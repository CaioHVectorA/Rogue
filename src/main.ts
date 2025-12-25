import kaplay from "kaplay";
import { createPlayer } from "./components/player";
import { createArena } from "./components/walls";

const k = kaplay();

k.loadRoot("./");

// Background preto
k.setBackground(k.rgb(0, 0, 0));

// MAP_STATE: 1..5 (mais alto = mais zoom out e mapa mais largo)
const MAP_STATE = 1;

// Player: a controllable square
const player = createPlayer(k, { size: 36, speed: 360, mapState: MAP_STATE });

// Create arena walls decoupled from player
createArena(k, { center: player.pos.clone(), mapState: MAP_STATE });

// Optional: click to kaboom effect
k.onClick(() => k.addKaboom(k.mousePos()));
