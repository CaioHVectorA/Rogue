import { Game } from "./game/engine";
import { Renderer } from "./game/renderer";
import { Interface } from "./ui/interface";
import { DeviceLayout } from "./ui/device";
import { TouchControls } from "./ui/touch";
import { arenaDimensions } from "./game/viewport";
import "./ui/style.css";
import "./ui/mobile.css";

const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML =
  '<canvas id="arena" aria-label="Arena do Rogue. Mova com WASD ou setas, espaço para esquivar, Q para habilidade. As estatísticas aparecem na interface ao redor."></canvas><div id="interface"></div>';
const layout = new DeviceLayout();
const game = new Game();
const renderer = new Renderer(document.querySelector("#arena")!, game);
const ui = new Interface(document.querySelector("#interface")!, game, layout);
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
  renderer.setMobile(layout.mode === "mobile");
  const size = arenaDimensions(
    canvas.clientWidth,
    canvas.clientHeight,
    renderer.mobile,
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
let lastTime = performance.now(),
  accumulator = 0,
  hudElapsed = 0;
function frame(now: number) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  if (game.phase === "combat") {
    accumulator += dt;
    while (accumulator >= 1 / 120 && game.phase === "combat") {
      game.update(1 / 120);
      accumulator -= 1 / 120;
    }
  } else accumulator = 0;
  renderer.draw(dt);
  hudElapsed += dt;
  if (hudElapsed > 0.1) {
    ui.tick();
    hudElapsed = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (import.meta.env.DEV) Object.assign(window, { __rogue: game });
