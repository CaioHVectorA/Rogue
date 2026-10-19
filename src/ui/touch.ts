import type { Game } from "../game/engine";

/** Separate pointer ownership lets either thumb act without releasing the other. */
export class TouchControls {
  private pointer: number | null = null;
  private stick: HTMLElement;
  private knob: HTMLElement;
  constructor(
    root: HTMLElement,
    private game: Game,
    private onAction: () => void,
  ) {
    this.stick = root.querySelector(".joystick")!;
    this.knob = this.stick.querySelector("span")!;
    this.stick.addEventListener("pointerdown", (event) => {
      if (
        this.pointer !== null ||
        game.phase !== "combat" ||
        event.button !== 0
      )
        return;
      event.preventDefault();
      this.pointer = event.pointerId;
      this.stick.setPointerCapture(event.pointerId);
      this.move(event);
    });
    this.stick.addEventListener("pointermove", (event) => {
      if (event.pointerId === this.pointer) {
        event.preventDefault();
        this.move(event);
      }
    });
    for (const type of [
      "pointerup",
      "pointercancel",
      "lostpointercapture",
    ] as const) {
      this.stick.addEventListener(type, (event) => {
        if (event.pointerId === this.pointer) this.reset();
      });
    }
    for (const action of ["dash", "skill", "skill2"] as const) {
      const button = root.querySelector<HTMLButtonElement>(
        `.touch-actions [data-action="${action}"]`,
      )!;
      const trigger = () => {
        if (button.disabled || game.phase !== "combat") return;
        if (action === "dash") game.dash();
        else game.skill(action === "skill2" ? 1 : 0);
        onAction();
      };
      button.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        trigger();
      });
      button.addEventListener("keydown", (event) => {
        if ((event.key === " " || event.key === "Enter") && !event.repeat) {
          event.preventDefault();
          event.stopPropagation();
          trigger();
        }
      });
    }
  }
  reset() {
    const captured = this.pointer;
    this.pointer = null;
    this.game.stick = { x: 0, y: 0 };
    this.knob.style.transform = "";
    if (captured !== null && this.stick.hasPointerCapture(captured))
      this.stick.releasePointerCapture(captured);
  }
  private move(event: PointerEvent) {
    const bounds = this.stick.getBoundingClientRect();
    const radius = bounds.width * 0.32;
    const x = (event.clientX - bounds.left - bounds.width / 2) / radius;
    const y = (event.clientY - bounds.top - bounds.height / 2) / radius;
    const magnitude = Math.hypot(x, y);
    this.game.stick =
      magnitude < 0.16
        ? { x: 0, y: 0 }
        : { x: x / Math.max(1, magnitude), y: y / Math.max(1, magnitude) };
    this.knob.style.transform = `translate(${this.game.stick.x * radius}px, ${this.game.stick.y * radius}px)`;
  }
}
