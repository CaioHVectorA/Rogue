import type { Game } from "../game/engine";
import { ControlSettings, stickVector } from "./control-settings";

/** A captured movement pointer stays independent from either action thumb. */
export class TouchControls {
  private pointer: number | null = null;
  private origin = { x: 0, y: 0 };
  private stick: HTMLElement;
  private knob: HTMLElement;
  private zone: HTMLElement;
  private pad: HTMLElement;
  private arrows = new Map<number, { x: number; y: number }>();
  constructor(
    root: HTMLElement,
    private game: Game,
    private onAction: () => void,
    private settings: ControlSettings,
  ) {
    this.stick = root.querySelector(".joystick")!;
    this.knob = this.stick.querySelector("span")!;
    this.zone = root.querySelector(".movement-zone")!;
    this.pad = root.querySelector(".direction-pad")!;
    settings.subscribe(() => this.reset());
    this.zone.addEventListener("pointerdown", (event) => {
      if (
        this.pointer !== null ||
        game.phase !== "combat" ||
        event.button !== 0 ||
        settings.values.mode === "dpad"
      )
        return;
      if (
        settings.values.mode === "fixed" &&
        !(event.target as HTMLElement).closest(".joystick")
      )
        return;
      event.preventDefault();
      this.pointer = event.pointerId;
      this.zone.setPointerCapture(event.pointerId);
      if (settings.values.mode === "floating") {
        this.origin = { x: event.clientX, y: event.clientY };
        this.stick.classList.add("is-dragging");
        this.placeStick();
      } else {
        const r = this.stick.getBoundingClientRect();
        this.origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      this.move(event);
    });
    this.zone.addEventListener("pointermove", (event) => {
      if (event.pointerId === this.pointer) {
        event.preventDefault();
        this.move(event);
      }
    });
    for (const type of [
      "pointerup",
      "pointercancel",
      "lostpointercapture",
    ] as const)
      this.zone.addEventListener(type, (event) => {
        if (event.pointerId === this.pointer) this.reset();
      });
    this.pad.addEventListener("pointerdown", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-direction]",
      );
      if (
        !button ||
        game.phase !== "combat" ||
        settings.values.mode !== "dpad" ||
        event.button !== 0
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      this.pad.setPointerCapture(event.pointerId);
      this.arrows.set(event.pointerId, this.arrow(button));
      this.updateArrows();
    });
    this.pad.addEventListener("pointermove", (event) => {
      if (!this.arrows.has(event.pointerId)) return;
      event.preventDefault();
      const b = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-direction]");
      this.arrows.set(
        event.pointerId,
        b && this.pad.contains(b) ? this.arrow(b) : { x: 0, y: 0 },
      );
      this.updateArrows();
    });
    for (const type of [
      "pointerup",
      "pointercancel",
      "lostpointercapture",
    ] as const)
      this.pad.addEventListener(type, (event) => {
        this.arrows.delete(event.pointerId);
        this.updateArrows();
      });
    this.pad.addEventListener("keydown", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-direction]",
      );
      if (
        !button ||
        event.repeat ||
        game.phase !== "combat" ||
        ![" ", "Enter"].includes(event.key)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      this.arrows.set(-1, this.arrow(button));
      this.updateArrows();
    });
    const releaseKeyboard = () => {
      this.arrows.delete(-1);
      this.updateArrows();
    };
    this.pad.addEventListener("keyup", (event) => {
      if ([" ", "Enter"].includes(event.key)) {
        event.preventDefault();
        releaseKeyboard();
      }
    });
    this.pad.addEventListener("focusout", releaseKeyboard);
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
  private arrow(button: HTMLElement) {
    const [x, y] = button.dataset.direction!.split(",").map(Number);
    return { x, y };
  }
  private updateArrows() {
    let x = 0,
      y = 0;
    for (const vector of this.arrows.values()) {
      x += vector.x;
      y += vector.y;
    }
    const length = Math.max(1, Math.hypot(x, y));
    this.game.stick = { x: x / length, y: y / length };
    for (const button of this.pad.querySelectorAll<HTMLElement>(
      "[data-direction]",
    )) {
      const v = this.arrow(button);
      button.setAttribute(
        "aria-pressed",
        String(
          this.arrows.size > 0 && v.x === Math.sign(x) && v.y === Math.sign(y),
        ),
      );
    }
  }
  reset() {
    const captured = this.pointer;
    this.pointer = null;
    const arrows = [...this.arrows.keys()];
    this.arrows.clear();
    for (const id of arrows)
      if (id >= 0 && this.pad.hasPointerCapture(id))
        this.pad.releasePointerCapture(id);
    this.game.stick = { x: 0, y: 0 };
    this.knob.style.transform = "";
    this.stick.classList.remove("is-dragging");
    this.stick.style.removeProperty("left");
    this.stick.style.removeProperty("top");
    if (captured !== null && this.zone.hasPointerCapture(captured))
      this.zone.releasePointerCapture(captured);
    for (const button of this.pad.querySelectorAll<HTMLElement>(
      "[data-direction]",
    ))
      button.setAttribute("aria-pressed", "false");
  }
  private placeStick() {
    const size = this.stick.getBoundingClientRect().width,
      r = size / 2;
    this.stick.style.left = `${Math.max(6, Math.min(innerWidth - size - 6, this.origin.x - r))}px`;
    this.stick.style.top = `${Math.max(6, Math.min(innerHeight - size - 6, this.origin.y - r))}px`;
  }
  private move(event: PointerEvent) {
    const radius = this.stick.getBoundingClientRect().width * 0.32;
    let x = event.clientX - this.origin.x,
      y = event.clientY - this.origin.y;
    const distance = Math.hypot(x, y);
    const travel = radius / this.settings.values.sensitivity;
    if (this.settings.values.mode === "floating" && distance > travel) {
      const shift = distance - travel;
      this.origin.x += (x / distance) * shift;
      this.origin.y += (y / distance) * shift;
      x = event.clientX - this.origin.x;
      y = event.clientY - this.origin.y;
      this.placeStick();
    }
    this.game.stick = stickVector(x / radius, y / radius, this.settings.values);
    this.knob.style.transform = `translate(${this.game.stick.x * radius}px,${this.game.stick.y * radius}px)`;
  }
}
