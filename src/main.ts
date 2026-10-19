import { Game } from "./game/engine";
import { KaplayRuntime } from "./game/kaplay";
import { Interface } from "./ui/interface";
import { DeviceLayout } from "./ui/device";
import { TouchControls } from "./ui/touch";
import { arenaDimensions } from "./game/viewport";
import "./ui/style.css";
import "./ui/mobile.css";
import "./ui/arcade.css";

const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML =
  '<div id="arena-frame"><canvas id="arena" aria-label="Arena do Rogue. Mova com WASD ou setas, espaço para esquivar, Q para habilidade. As estatísticas aparecem na interface ao redor."></canvas></div><div id="interface"></div>';
const layout = new DeviceLayout();
const game = new Game();
const ui = new Interface(document.querySelector("#interface")!, game, layout);
const runtime = new KaplayRuntime(
  document.querySelector("#arena")!,
  document.querySelector("#arena-frame")!,
  game,
  () => ui.tick(),
);
const touch = new TouchControls(
  document.querySelector("#interface")!,
  game,
  () => ui.tick(),
);
let previousPhase = game.phase;
game.onChange = () => {
  if (previousPhase !== game.phase) touch.reset();
  previousPhase = game.phase;
  ui.render();
};
const canvas = document.querySelector<HTMLCanvasElement>("#arena")!;
function fitArena() {
  runtime.setMobile(layout.mode === "mobile");
  const size = arenaDimensions(
    canvas.clientWidth,
    canvas.clientHeight,
    runtime.mobile,
  );
  game.resizeArena(size.width, size.height);
}
layout.onChange = () => {
  touch.reset();
  if (game.phase === "combat") game.pause();
  ui.render();
  requestAnimationFrame(fitArena);
};
new ResizeObserver(fitArena).observe(canvas);
fitArena();
const gameKeys = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  " ",
  "q",
]);
document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  )
    return;
  if (game.phase !== "combat" || !gameKeys.has(key)) return;
  if (key === " " && event.target instanceof HTMLButtonElement) return;
  event.preventDefault();
  game.keys.add(key);
  if (event.repeat) return;
  if (key === "q") game.skill();
  if (key === " ") game.dash();
});
document.addEventListener("keyup", (event) =>
  game.keys.delete(event.key.toLowerCase()),
);
function suspend() {
  game.keys.clear();
  touch.reset();
  if (game.phase === "combat") game.pause();
}
window.addEventListener("blur", suspend);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) suspend();
});
window.addEventListener("beforeunload", (event) => {
  if (game.phase !== "menu" && game.phase !== "result") event.preventDefault();
});
if (import.meta.env.DEV)
  Object.assign(window, { __rogue: game, __kaplay: runtime.k });
