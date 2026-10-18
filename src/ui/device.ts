export type InterfaceMode = "mobile" | "desktop";
export type InterfacePreference = InterfaceMode | "auto";
const STORAGE_KEY = "rogue.interface.v1";

export function detectInterface(width: number, coarse: boolean): InterfaceMode {
  return width <= 700 || (coarse && width <= 1280) ? "mobile" : "desktop";
}

/** Detect capabilities rather than user-agent strings; hybrids can override it. */
export class DeviceLayout {
  preference: InterfacePreference = "auto";
  mode: InterfaceMode = "desktop";
  landscape = false;
  onChange: () => void = () => {};
  private coarse = window.matchMedia("(pointer: coarse)");
  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "mobile" || saved === "desktop") this.preference = saved;
    } catch {
      /* Optional preference. */
    }
    this.refresh();
    window.addEventListener("resize", () => this.refresh());
    this.coarse.addEventListener("change", () => this.refresh());
  }
  setPreference(value: string) {
    if (value !== "auto" && value !== "mobile" && value !== "desktop") return;
    this.preference = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* Optional. */
    }
    this.refresh(true);
  }
  private refresh(force = false) {
    const next =
      this.preference === "auto"
        ? detectInterface(innerWidth, this.coarse.matches)
        : this.preference;
    const landscape = innerWidth > innerHeight;
    const changed = next !== this.mode || landscape !== this.landscape;
    this.mode = next;
    this.landscape = landscape;
    document.documentElement.dataset.ui = this.mode;
    document.documentElement.dataset.orientation = landscape
      ? "landscape"
      : "portrait";
    if (changed || force) this.onChange();
  }
}
