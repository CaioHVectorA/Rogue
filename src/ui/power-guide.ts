import { Game } from "../game/engine";
import type { Feedback } from "../game/engine";
import { isUltimate, skillById, weaponById } from "../game/model";
import type { WeaponId } from "../game/model";

const LOCATIONS: Record<string, string> = {
  venom: "NO ALVO MAIS PRÓXIMO",
  volley: "NA DIREÇÃO DO ALVO",
  nova: "AO SEU REDOR · EMPURRA",
  quake: "PERTO DE VOCÊ · CURA AO ACERTAR",
  vortex: "NO ALVO · PUXA A HORDA",
  storm: "NO ALVO · ZONA DE RAIOS",
  turret: "NO SEU CHÃO · ATIRA SOZINHA",
  mine: "NO SEU CHÃO · ATRAIA A HORDA",
  orbit: "ACOMPANHA VOCÊ · CORTA TIROS",
  decoy: "DEIXE A ISCA · REPOSICIONE-SE",
  tempest: "ACOMPANHA VOCÊ POR 5s",
  plague: "DETONA DOSES · PLANTA TRÊS NUVENS",
  cataclysm: "TRÊS IMPACTOS · MESMO CENTRO",
};
export function powerInfo(id: string) {
  const [kind, key] = id.split(":"),
    weapon = kind === "weapon";
  if (weapon) {
    const w = weaponById(key as WeaponId);
    return {
      ...w,
      where:
        w.pattern === "circle"
          ? "AO SEU REDOR · ALCANCE CURTO"
          : w.pattern === "chain"
            ? "SALTA ENTRE INIMIGOS PRÓXIMOS"
            : "NA DIREÇÃO DO ALVO",
      trigger: "AUTOMÁTICO AO PARAR",
      timing: `${w.interval.toFixed(2)}s ENTRE ATAQUES`,
    };
  }
  const s = skillById(key),
    ultimate = isUltimate(key);
  return {
    ...s,
    where: LOCATIONS[key],
    trigger: ultimate ? "ULTIMATE · E" : "HABILIDADE · Q",
    timing: ultimate
      ? "ACERTE ATAQUES PARA CARREGAR · SEM RECARGA PASSIVA"
      : `${s.cooldown}s DE RECARGA BASE`,
  };
}
export function powerDiagram(id: string) {
  const info = powerInfo(id);
  return `<span class="power-preview" style="--preview-color:${info.color}"><canvas class="power-diagram" data-power-preview="${id}" width="800" height="450" aria-hidden="true"></canvas><span class="preview-caption">${info.where}</span></span>`;
}

/** These canvases teach attacks using Game's actual simulation; the playable arena stays in Kaplay. */
class PreviewScene {
  game: Game;
  time = 0;
  cast = false;
  effects: (Feedback & { age: number })[] = [];
  private ctx: CanvasRenderingContext2D;
  constructor(readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.game = Game.demonstration(canvas.dataset.powerPreview!);
    this.reset();
  }
  reset() {
    this.game = Game.demonstration(this.canvas.dataset.powerPreview!);
    this.time = 0;
    this.cast = false;
    this.effects = [];
    this.game.onFeedback = (event) => {
      if (this.effects.length < 90) this.effects.push({ ...event, age: 0 });
    };
  }
  step(dt: number) {
    this.time += dt;
    if (this.time > 5.6) this.reset();
    const g = this.game,
      id = this.canvas.dataset.powerPreview!.split(":")[1];
    if (
      this.time > 0.75 &&
      !this.cast &&
      !this.canvas.dataset.powerPreview!.startsWith("weapon:")
    ) {
      g.skill(isUltimate(id) ? 1 : 0);
      this.cast = true;
    }
    // Retreat demonstrates planted objects; moving demonstrates following effects.
    g.stick.x =
      this.cast && this.time < 2.1 && ["mine", "decoy", "turret"].includes(id)
        ? -0.45
        : this.cast && this.time < 2.1 && ["orbit", "tempest"].includes(id)
          ? 0.3
          : 0;
    // No gunfire before the action cue in weapon demonstrations.
    if (
      this.canvas.dataset.powerPreview!.startsWith("weapon:") &&
      this.time < 0.75
    )
      g.player.charge = 0;
    g.update(dt);
    for (const effect of this.effects) effect.age += dt;
    this.effects = this.effects.filter(
      (e) => e.age < (e.type === "kill" ? 0.6 : 0.4),
    );
  }
  draw() {
    const c = this.ctx,
      g = this.game,
      color = powerInfo(this.canvas.dataset.powerPreview!).color;
    c.clearRect(0, 0, 800, 450);
    c.fillStyle = "#0b1421";
    c.fillRect(0, 0, 800, 450);
    c.strokeStyle = "#26344b";
    c.lineWidth = 1;
    for (let x = 0; x < 800; x += 50) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, 450);
      c.stroke();
    }
    for (let y = 0; y < 450; y += 50) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(800, y);
      c.stroke();
    }
    const circle = (
      x: number,
      y: number,
      r: number,
      stroke: string,
      fill?: string,
    ) => {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      if (fill) {
        c.fillStyle = fill;
        c.fill();
      }
      c.strokeStyle = stroke;
      c.stroke();
    };
    for (const f of g.fields) {
      const tint =
        f.kind === "toxin"
          ? "#b8ff62"
          : f.kind === "storm"
            ? "#85d8ef"
            : f.kind === "vortex"
              ? "#c5afff"
              : color;
      c.lineWidth = 3;
      circle(f.x, f.y, f.radius, tint + "99", tint + "18");
      if (f.kind === "vortex")
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.arc(
            f.x,
            f.y,
            25 + ((this.time * 50 + i * 40) % 140),
            this.time + i * 2,
            this.time + i * 2 + 2,
          );
          c.stroke();
        }
      if (f.kind === "storm")
        for (let i = 0; i < 4; i++) {
          const x =
              f.x +
              Math.sin(i * 9 + Math.floor(this.time * 7)) * f.radius * 0.6,
            y = f.y + Math.cos(i * 7) * f.radius * 0.5;
          c.beginPath();
          c.moveTo(x - 5, y - 24);
          c.lineTo(x + 5, y - 4);
          c.lineTo(x - 6, y - 4);
          c.lineTo(x + 7, y + 20);
          c.stroke();
        }
      if (f.kind === "toxin")
        for (let i = 0; i < 5; i++)
          circle(
            f.x + Math.sin(i * 7 + this.time * 0.3) * f.radius * 0.65,
            f.y + Math.cos(i * 4 + this.time * 0.4) * f.radius * 0.65,
            8 + Math.sin(this.time * 3 + i) * 3,
            tint + "77",
            tint + "22",
          );
      if (f.kind === "orbit")
        for (let i = 0; i < 3; i++) {
          const a = this.time * 5 + (i * Math.PI * 2) / 3;
          circle(
            f.x + Math.cos(a) * 85,
            f.y + Math.sin(a) * 85,
            10,
            tint,
            tint + "88",
          );
        }
      if (f.kind === "turret") {
        c.fillStyle = "#2c6252";
        c.fillRect(f.x - 20, f.y - 20, 40, 40);
        c.strokeRect(f.x - 20, f.y - 20, 40, 40);
        c.fillStyle = tint;
        c.fillRect(f.x, f.y - 5, 35, 10);
      }
      if (f.kind === "mine") {
        circle(f.x, f.y, 18, tint, tint + "66");
        circle(f.x, f.y, 5, "#fff", tint);
      }
      if (f.kind === "decoy") {
        c.setLineDash([5, 5]);
        circle(f.x, f.y, 21, "#85d8ef", "#85d8ef44");
        c.setLineDash([]);
      }
    }
    for (const e of g.enemies) {
      c.lineWidth = 3;
      c.fillStyle = e.flash > 0 ? "#fff3cd" : "#7b2e48";
      c.strokeStyle = "#ff798a";
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const x = e.x + Math.cos(a) * 20,
          y = e.y + Math.sin(a) * 20;
        if (i) c.lineTo(x, y);
        else c.moveTo(x, y);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#241b2b";
      c.fillRect(e.x - 23, e.y - 32, 46, 5);
      c.fillStyle = "#ff798a";
      c.fillRect(e.x - 23, e.y - 32, 46 * Math.max(0, e.hp / e.maxHp), 5);
      for (let i = 0; i < e.venom; i++)
        circle(e.x - 12 + i * 8, e.y + 30, 3, "#b8ff62", "#b8ff62");
      for (let i = 0; i < e.shock; i++)
        circle(e.x - 12 + i * 8, e.y + 39, 3, "#85d8ef", "#85d8ef");
    }
    for (const b of g.bullets) {
      c.lineWidth = b.hostile ? 5 : 7;
      c.strokeStyle = b.hostile ? "#ff798a" : (b.color ?? color);
      c.beginPath();
      const m = Math.hypot(b.vx, b.vy) || 1;
      c.moveTo(b.x - (b.vx / m) * 15, b.y - (b.vy / m) * 15);
      c.lineTo(b.x, b.y);
      c.stroke();
    }
    const p = g.player,
      target = g.enemies.find((e) => e.hp > 0),
      a = target ? Math.atan2(target.y - p.y, target.x - p.x) : 0;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(a);
    c.fillStyle = "#254c45";
    c.strokeStyle = "#a4f6c1";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(19, 0);
    c.lineTo(9, -18);
    c.lineTo(-15, -18);
    c.lineTo(-22, 0);
    c.lineTo(-15, 18);
    c.lineTo(9, 18);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#a4f6c1";
    c.fillRect(6, -5, 27, 10);
    c.fillStyle = "#d4ffe4";
    c.fillRect(-6, -9, 9, 18);
    c.restore();
    c.font = "bold 17px monospace";
    c.textAlign = "center";
    c.fillStyle = "#a4f6c1";
    c.fillText("VOCÊ", p.x, p.y + 52);
    for (const e of this.effects) {
      c.globalAlpha = Math.max(0, 1 - e.age / 0.45);
      c.strokeStyle = e.color ?? color;
      c.fillStyle = e.color ?? color;
      if (e.type === "skill") {
        c.lineWidth = 6;
        circle(
          e.x,
          e.y,
          (e.radius ?? 100) * Math.min(1, e.age / 0.2),
          e.color ?? color,
        );
      }
      if (e.type === "beam" && e.toX !== undefined) {
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(e.x, e.y);
        c.lineTo((e.x + e.toX) / 2 + 12, (e.y + e.toY!) / 2 - 14);
        c.lineTo(e.toX, e.toY!);
        c.stroke();
      }
      if (e.type === "burst" || e.type === "kill")
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + e.x;
          c.fillRect(
            e.x + Math.cos(a) * e.age * 130,
            e.y + Math.sin(a) * e.age * 130,
            5,
            5,
          );
        }
    }
    c.globalAlpha = 1;
    c.textAlign = "left";
    c.font = "bold 16px monospace";
    c.fillStyle = "#d2dbe7";
    c.fillText(
      this.time < 0.75
        ? "PREPARE…"
        : this.canvas.dataset.powerPreview!.startsWith("weapon:")
          ? "PAROU → DISPAROU"
          : isUltimate(this.canvas.dataset.powerPreview!.split(":")[1])
            ? "E → ULTIMATE"
            : "Q → ATIVAR",
      22,
      32,
    );
  }
}

/** One capped loop for visible cards; all observers and animation frames die on screen change. */
export class PowerPreviews {
  private frame = 0;
  private observer: IntersectionObserver | null = null;
  private scenes: PreviewScene[] = [];
  private visible = new Set<HTMLCanvasElement>();
  private last = 0;
  private motion = false;
  private visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    } else this.start();
  };
  mount(root: HTMLElement, reduced: boolean) {
    this.motion = !reduced;
    this.scenes = Array.from(
      root.querySelectorAll<HTMLCanvasElement>("[data-power-preview]"),
    ).map((canvas) => new PreviewScene(canvas));
    for (const scene of this.scenes) {
      if (reduced) for (let i = 0; i < 150; i++) scene.step(1 / 120);
      scene.draw();
    }
    if (!this.scenes.length || reduced) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            this.visible.add(entry.target as HTMLCanvasElement);
          else this.visible.delete(entry.target as HTMLCanvasElement);
        }
        this.start();
      },
      { root, threshold: 0.05 },
    );
    for (const scene of this.scenes) this.observer.observe(scene.canvas);
    document.addEventListener("visibilitychange", this.visibility);
  }
  private start() {
    if (!this.frame && this.motion && !document.hidden && this.visible.size) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.loop);
    }
  }
  private loop = (now: number) => {
    this.frame = 0;
    if (document.hidden || !this.visible.size) return;
    if (now - this.last >= 1000 / 24) {
      const dt = Math.min(0.08, (now - this.last) / 1000);
      this.last = now;
      const steps = Math.ceil(dt * 120);
      for (const scene of this.scenes)
        if (this.visible.has(scene.canvas)) {
          for (let i = 0; i < steps; i++) scene.step(dt / steps);
          scene.draw();
        }
    }
    this.frame = requestAnimationFrame(this.loop);
  };
  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.observer?.disconnect();
    this.observer = null;
    this.visible.clear();
    this.scenes = [];
    document.removeEventListener("visibilitychange", this.visibility);
  }
}
