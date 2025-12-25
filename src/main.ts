import kaplay from "kaplay";
import { createPlayer } from "./components/player";

const k = kaplay();

k.loadRoot("./");

// Player: a controllable square
const player = createPlayer(k, { size: 36, speed: 220 });

// Optional: click to kaboom effect
k.onClick(() => k.addKaboom(k.mousePos()));
