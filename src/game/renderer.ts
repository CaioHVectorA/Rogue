import { WIDTH, HEIGHT, CLASSES, ACTS } from "./model";
import type { Game } from "./engine";

const TAU = Math.PI * 2;
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private time = 0;
  constructor(
    private canvas: HTMLCanvasElement,
    private game: Game,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
  }
  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.round(this.canvas.clientHeight * dpr);
  }
  draw(dt: number) {
    const g = this.game,
      c = this.ctx;
    if (g.phase !== "paused" && !g.reducedMotion) this.time += dt;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#0b1114";
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const scale = Math.min(
      this.canvas.width / WIDTH,
      this.canvas.height / HEIGHT,
    );
    const ox = (this.canvas.width - WIDTH * scale) / 2;
    const oy = (this.canvas.height - HEIGHT * scale) / 2;
    c.setTransform(scale, 0, 0, scale, ox, oy);
    c.save();
    c.beginPath();
    c.rect(0, 0, WIDTH, HEIGHT);
    c.clip();
    if (!g.reducedMotion && g.phase === "combat" && g.shake)
      c.translate(
        (Math.random() - 0.5) * g.shake,
        (Math.random() - 0.5) * g.shake,
      );
    const accent = ACTS[g.run.act - 1].color;
    const gradient = c.createRadialGradient(600, 370, 50, 600, 370, 700);
    gradient.addColorStop(0, "#162323");
    gradient.addColorStop(1, "#0b1114");
    c.fillStyle = gradient;
    c.fillRect(0, 0, WIDTH, HEIGHT);
    c.lineWidth = 1;
    c.strokeStyle = "#ffffff06";
    c.beginPath();
    for (let x = 0; x <= WIDTH; x += 40) {
      c.moveTo(x, 0);
      c.lineTo(x, HEIGHT);
    }
    for (let y = 0; y <= HEIGHT; y += 40) {
      c.moveTo(0, y);
      c.lineTo(WIDTH, y);
    }
    c.stroke();
    c.strokeStyle = `${accent}10`;
    c.lineWidth = 1;
    for (const radius of [140, 260, 380]) {
      c.beginPath();
      c.arc(WIDTH / 2, HEIGHT / 2, radius, 0, TAU);
      c.stroke();
    }
    c.setLineDash([4, 12]);
    c.beginPath();
    c.moveTo(600, 28);
    c.lineTo(600, HEIGHT - 28);
    c.moveTo(28, 380);
    c.lineTo(WIDTH - 28, 380);
    c.stroke();
    c.setLineDash([]);
    c.strokeStyle = `${accent}38`;
    c.strokeRect(24, 24, WIDTH - 48, HEIGHT - 48);
    c.lineWidth = 3;
    c.strokeStyle = `${accent}90`;
    for (const [x, y, dx, dy] of [
      [24, 24, 1, 1],
      [1176, 24, -1, 1],
      [24, 736, 1, -1],
      [1176, 736, -1, -1],
    ]) {
      c.beginPath();
      c.moveTo(x + dx * 28, y);
      c.lineTo(x, y);
      c.lineTo(x, y + dy * 28);
      c.stroke();
    }
    if (g.phase === "menu") {
      this.menuScene();
      c.restore();
      return;
    }
    for (const spawn of g.spawnQueue)
      if (spawn.at - g.roomTime < 1.2) {
        const pulse = 0.4 + Math.sin(this.time * 8) * 0.2;
        c.strokeStyle = `rgba(255,188,138,${pulse})`;
        c.lineWidth = 2;
        this.circle(spawn.x, spawn.y, spawn.kind === "boss" ? 60 : 25);
        c.stroke();
        c.fillStyle = "#ffbc8a";
        c.font = "18px monospace";
        c.textAlign = "center";
        c.fillText("+", spawn.x, spawn.y + 6);
      }
    for (const hazard of g.hazards) {
      c.fillStyle = hazard.fired ? "#ff8b6870" : "#ff8b6810";
      this.circle(hazard.x, hazard.y, hazard.radius);
      c.fill();
      c.strokeStyle = hazard.fired ? "#ffd0b0" : "#ff8b68";
      c.lineWidth = 2;
      c.setLineDash(hazard.fired ? [] : [8, 5]);
      c.stroke();
      c.setLineDash([]);
      if (!hazard.fired) {
        c.beginPath();
        c.arc(
          hazard.x,
          hazard.y,
          hazard.radius * Math.max(0, 1 - hazard.delay / 1.3),
          0,
          TAU,
        );
        c.strokeStyle = "#ff8b6880";
        c.stroke();
        this.text("!", hazard.x, hazard.y + 7, 22, "#ffbc8a");
      }
    }
    for (const pickup of g.pickups) {
      c.save();
      c.translate(pickup.x, pickup.y);
      c.rotate(Math.PI / 4);
      c.shadowColor = "#eed49f";
      c.shadowBlur = 12;
      c.fillStyle = "#eed49f";
      c.fillRect(-4, -4, 8, 8);
      c.restore();
    }
    for (const enemy of g.enemies) {
      const colors = {
        chaser: "#e99b83",
        runner: "#e9c176",
        shooter: "#baabec",
        guard: "#91bccb",
        boss: accent,
      };
      const color =
        enemy.flash > 0
          ? "#ffffff"
          : enemy.poisoned > 0
            ? "#b1e58b"
            : colors[enemy.kind];
      c.save();
      c.translate(enemy.x, enemy.y);
      c.fillStyle = "#05090c55";
      this.circle(0, 7, enemy.radius + 5);
      c.fill();
      c.strokeStyle = color;
      c.fillStyle = `${color}22`;
      c.lineWidth = 2;
      const sides =
        enemy.kind === "runner"
          ? 3
          : enemy.kind === "shooter"
            ? 4
            : enemy.kind === "boss"
              ? 6
              : enemy.kind === "guard"
                ? 8
                : 5;
      const rotation =
        enemy.kind === "boss"
          ? this.time * 0.2
          : Math.atan2(g.player.y - enemy.y, g.player.x - enemy.x);
      this.polygon(0, 0, enemy.radius, sides, rotation);
      c.fill();
      c.stroke();
      if (enemy.kind === "boss") {
        c.rotate(-this.time * 0.35);
        this.polygon(0, 0, enemy.radius * 0.67, 6, 0);
        c.stroke();
        c.fillStyle = color;
        this.polygon(0, 0, 12, 4, Math.PI / 4);
        c.fill();
        if (enemy.enraged) {
          c.strokeStyle = "#ff8b68";
          this.circle(0, 0, enemy.radius + 9);
          c.stroke();
        }
      } else {
        c.fillStyle = color;
        this.circle(0, 0, enemy.kind === "guard" ? 7 : 4);
        c.fill();
      }
      c.restore();
      if (enemy.kind !== "boss" && enemy.hp < enemy.maxHp) {
        c.fillStyle = "#ffffff12";
        c.fillRect(enemy.x - 17, enemy.y - enemy.radius - 10, 34, 3);
        c.fillStyle = color;
        c.fillRect(
          enemy.x - 17,
          enemy.y - enemy.radius - 10,
          34 * Math.max(0, enemy.hp / enemy.maxHp),
          3,
        );
      }
    }
    for (const bullet of g.bullets) {
      c.fillStyle = bullet.hostile ? "#ffab91" : CLASSES[g.run.classId].color;
      c.strokeStyle = bullet.hostile
        ? "#ffab9138"
        : `${CLASSES[g.run.classId].color}45`;
      c.lineWidth = bullet.radius * 1.4;
      c.beginPath();
      c.moveTo(bullet.x, bullet.y);
      c.lineTo(bullet.x - bullet.vx * 0.025, bullet.y - bullet.vy * 0.025);
      c.stroke();
      this.circle(bullet.x, bullet.y, bullet.radius);
      c.fill();
    }
    const p = g.player,
      color = CLASSES[g.run.classId].color;
    c.save();
    c.translate(p.x, p.y);
    c.globalAlpha =
      p.invulnerable > 0 ? 0.55 + Math.sin(this.time * 35) * 0.25 : 1;
    c.fillStyle = "#070d10";
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.shadowColor = color;
    c.shadowBlur = p.charge >= p.reload ? 16 : 5;
    this.polygon(0, 0, 18, 4, Math.PI / 4);
    c.fill();
    c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = color;
    this.polygon(0, 0, 7, 4, 0);
    c.fill();
    c.lineWidth = 2.5;
    c.strokeStyle = p.moving ? `${color}80` : color;
    c.beginPath();
    c.arc(0, 0, 25, -Math.PI / 2, -Math.PI / 2 + (TAU * p.charge) / p.reload);
    c.stroke();
    if (p.dashTime > 0) {
      c.strokeStyle = "#ffffff";
      this.circle(0, 0, 31);
      c.stroke();
    }
    c.restore();
    for (const particle of g.particles) {
      c.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      c.fillStyle = particle.color;
      this.circle(particle.x, particle.y, particle.radius);
      c.fill();
    }
    c.globalAlpha = 1;
    if (g.intro > 0) {
      c.fillStyle = "#0b111470";
      c.fillRect(300, 298, 600, 135);
      this.text(
        g.run.room % 4 === 0
          ? "ENCONTRO COM GUARDIÃO"
          : `ATO ${g.run.act} · ENCONTRO ${((g.run.room - 1) % 4) + 1}`,
        600,
        340,
        12,
        "#a1b0b1",
      );
      this.text(
        g.run.room % 4 === 0
          ? ACTS[g.run.act - 1].boss
          : ACTS[g.run.act - 1].name,
        600,
        385,
        35,
        "#edf3e9",
      );
      this.text("Encontre espaço. Pare. Dispare.", 600, 416, 14, "#a1b0b1");
    }
    if (g.noticeTime > 0) this.text(g.notice, 600, 100, 18, "#ffbc8a");
    if (g.flash > 0 && !g.reducedMotion) {
      c.fillStyle = `rgba(255,100,70,${g.flash * 0.5})`;
      c.fillRect(0, 0, WIDTH, HEIGHT);
    }
    c.restore();
  }
  private menuScene() {
    const c = this.ctx;
    c.save();
    c.translate(650, 380);
    const color = "#a4f6c1";
    c.rotate(this.time * 0.06);
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = `${color}${["18", "30", "55"][i]}`;
      c.lineWidth = 1.5;
      this.polygon(0, 0, 130 + i * 55, 6, i * 0.22);
      c.stroke();
    }
    c.rotate(-this.time * 0.12);
    c.strokeStyle = color;
    c.fillStyle = "#a4f6c115";
    c.lineWidth = 2;
    this.polygon(0, 0, 68, 4, Math.PI / 4);
    c.fill();
    c.stroke();
    c.shadowColor = color;
    c.shadowBlur = 30;
    c.fillStyle = color;
    this.polygon(0, 0, 24, 4, 0);
    c.fill();
    c.restore();
    this.text("O NÚCLEO AGUARDA", 650, 690, 10, "#66817a");
  }
  private circle(x: number, y: number, radius: number) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, TAU);
  }
  private polygon(
    x: number,
    y: number,
    radius: number,
    sides: number,
    rotation: number,
  ) {
    const c = this.ctx;
    c.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * TAU + rotation;
      if (!i)
        c.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      else c.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    c.closePath();
  }
  private text(
    value: string,
    x: number,
    y: number,
    size: number,
    color: string,
  ) {
    this.ctx.font = `${size < 15 ? "500" : "600"} ${size}px "Trebuchet MS", sans-serif`;
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = color;
    this.ctx.fillText(value, x, y);
  }
}
