import { Game } from "./game/engine";
import { Renderer } from "./game/renderer";
import { Interface } from "./ui/interface";
import "./ui/style.css";

const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML =
  '<canvas id="arena" aria-label="Arena do Rogue. Mova com WASD ou setas, espaço para esquivar, Q para habilidade. As estatísticas aparecem na interface ao redor."></canvas><div id="interface"></div>';
const game = new Game();
const renderer = new Renderer(document.querySelector("#arena")!, game);
const ui = new Interface(document.querySelector("#interface")!, game);
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
  game.stick = { x: 0, y: 0 };
  if (game.phase === "combat") game.pause();
}
window.addEventListener("blur", suspend);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) suspend();
});
window.addEventListener("beforeunload", (event) => {
  if (game.phase !== "menu" && game.phase !== "result") event.preventDefault();
});
const stick = document.querySelector<HTMLElement>(".joystick")!;
const knob = stick.querySelector<HTMLElement>("span")!;
let pointer: number | null = null;
game.onChange = () => {
  pointer = null;
  knob.style.transform = "";
  ui.render();
};
function moveStick(event: PointerEvent) {
  const bounds = stick.getBoundingClientRect();
  const x = (event.clientX - bounds.left - bounds.width / 2) / 34;
  const y = (event.clientY - bounds.top - bounds.height / 2) / 34;
  const length = Math.max(1, Math.hypot(x, y));
  game.stick = { x: x / length, y: y / length };
  knob.style.transform = `translate(${game.stick.x * 31}px, ${game.stick.y * 31}px)`;
}
stick.addEventListener("pointerdown", (event) => {
  if (pointer !== null || game.phase !== "combat") return;
  pointer = event.pointerId;
  stick.setPointerCapture(pointer);
  moveStick(event);
});
stick.addEventListener("pointermove", (event) => {
  if (event.pointerId === pointer) moveStick(event);
});
function releaseStick(event: PointerEvent) {
  if (event.pointerId !== pointer) return;
  pointer = null;
  game.stick = { x: 0, y: 0 };
  knob.style.transform = "";
}
stick.addEventListener("pointerup", releaseStick);
stick.addEventListener("pointercancel", releaseStick);
stick.addEventListener("lostpointercapture", releaseStick);
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
