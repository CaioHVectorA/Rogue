export type ControlMode = "floating" | "fixed" | "dpad";
export interface ControlProfile {
  mode: ControlMode;
  size: number;
  sensitivity: number;
  deadzone: number;
}
export const DEFAULT_CONTROLS: ControlProfile = {
  mode: "floating",
  size: 96,
  sensitivity: 1,
  deadzone: 0.12,
};
const bounded = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
export function validateControls(value: unknown): ControlProfile {
  const p =
    value && typeof value === "object"
      ? (value as Partial<ControlProfile>)
      : {};
  return {
    mode: ["floating", "fixed", "dpad"].includes(p.mode ?? "")
      ? p.mode!
      : DEFAULT_CONTROLS.mode,
    size: bounded(p.size, 96, 72, 136),
    sensitivity: bounded(p.sensitivity, 1, 0.6, 1.6),
    deadzone: bounded(p.deadzone, 0.12, 0.05, 0.3),
  };
}
/** Removes the dead zone and maps the rest continuously; maximum speed needs no huge drag. */
export function stickVector(x: number, y: number, profile: ControlProfile) {
  const magnitude = Math.hypot(x, y),
    scaled = magnitude * profile.sensitivity;
  if (scaled <= profile.deadzone || !magnitude) return { x: 0, y: 0 };
  const strength = Math.min(
    1,
    (scaled - profile.deadzone) / (1 - profile.deadzone),
  );
  return { x: (x / magnitude) * strength, y: (y / magnitude) * strength };
}
export class ControlSettings {
  values: ControlProfile = { ...DEFAULT_CONTROLS };
  private listeners = new Set<() => void>();
  constructor() {
    try {
      this.values = validateControls(
        JSON.parse(localStorage.getItem("rogue.controls.v1") ?? "null"),
      );
    } catch {
      /* Optional preference. */
    }
    this.apply();
  }
  subscribe(listener: () => void) {
    this.listeners.add(listener);
  }
  set(key: keyof ControlProfile, value: string | number) {
    this.values = validateControls({ ...this.values, [key]: value });
    this.save();
  }
  reset() {
    this.values = { ...DEFAULT_CONTROLS };
    this.save();
  }
  private save() {
    try {
      localStorage.setItem("rogue.controls.v1", JSON.stringify(this.values));
    } catch {
      /* Optional. */
    }
    this.apply();
    for (const listener of this.listeners) listener();
  }
  private apply() {
    document.documentElement.dataset.controls = this.values.mode;
    document.documentElement.style.setProperty(
      "--control-size",
      `${this.values.size}px`,
    );
  }
}
