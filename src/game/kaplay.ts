import kaplay from "kaplay";
import type { GameObj, KAPLAYCtx } from "kaplay";
import type { Game, Feedback } from "./engine";
import { ACTS, CLASSES } from "./model";
import type { Enemy, Bullet, Hazard, Pickup, Player, Point } from "./model";

type Entity = Enemy | Bullet | Hazard | Pickup | Player;
const TAU = Math.PI * 2;
const COLORS = {
  chaser: "#ff7964",
  runner: "#ffc452",
  shooter: "#c295ff",
  guard: "#69d6ff",
};

/** Kaplay owns scene lifecycle, WebGL rendering, collision broad phase, audio and effects. */
export class KaplayRuntime {
  readonly k: KAPLAYCtx;
  mobile = false;
  private nodes = new Map<Entity, GameObj>();
  private fxRoot!: GameObj;
  private time = 0;
  private accumulator = 0;
  private sceneSession = -1;
  private fxCount = 0;
  private lastSound = new Map<string, number>();
  private hudElapsed = 0;
  private sceneReady = false;
  constructor(
    canvas: HTMLCanvasElement,
    root: HTMLElement,
    private game: Game,
    private updateHud: () => void,
  ) {
    const k = (this.k = kaplay({
      canvas,
      root,
      global: false,
      debug: import.meta.env.DEV,
      focus: false,
      background: "#090d19",
      pixelDensity: Math.min(devicePixelRatio || 1, 1.5),
      font: "monospace",
      hashGridSize: 96,
      touchToMouse: false,
    }));
    game.engineCollisions = true;
    game.onFeedback = (event) => this.feedback(event);
    game.resumeSound = () => {
      void k.audioCtx.resume().catch(() => {});
    };
    for (const name of ["shot", "kill", "pickup", "skill", "hurt", "boss"]) {
      k.loadSound(name, `${import.meta.env.BASE_URL}sfx/${name}.wav`);
    }
    game.onSound = (frequency, volume) => {
      if (!this.sceneReady) return;
      const name =
        frequency <= 100
          ? "hurt"
          : frequency < 200
            ? "skill"
            : frequency < 300
              ? "shot"
              : frequency < 450
                ? "shot"
                : frequency < 600
                  ? "kill"
                  : frequency > 850
                    ? "pickup"
                    : "skill";
      const now = performance.now();
      if (now - (this.lastSound.get(name) ?? 0) < (name === "pickup" ? 45 : 30))
        return;
      this.lastSound.set(name, now);
      k.play(name, {
        volume: Math.min(0.35, volume * 2.5),
        detune: Math.random() * 120 - 60,
      });
    };
    k.scene("arena", () => this.createScene());
    k.onLoad(() => k.go("arena"));
  }
  setMobile(value: boolean) {
    this.mobile = value;
  }
  private createScene() {
    const k = this.k,
      g = this.game;
    this.nodes.clear();
    this.fxCount = 0;
    this.accumulator = 0;
    this.sceneSession = g.session;
    this.sceneReady = true;
    this.fxRoot = k.add([k.pos(0), k.z(30), "effects"]);
    k.add([k.z(-100), { draw: () => this.drawFloor() }]);
    k.add([k.z(80), { draw: () => this.drawSignals() }]);
    k.onCollideUpdate("pilot", "foe", (_player, enemy) =>
      g.contactEnemy(enemy.model as Enemy),
    );
    k.onCollideUpdate("friendly-shot", "foe", (bullet, enemy) =>
      g.contactBullet(bullet.model as Bullet, enemy.model as Enemy),
    );
    k.onCollideUpdate("hostile-shot", "pilot", (bullet) =>
      g.contactBullet(bullet.model as Bullet),
    );
    k.onCollideUpdate("danger", "pilot", (hazard) =>
      g.contactHazard(hazard.model as Hazard),
    );
    k.onCollideUpdate("loot", "pilot", (loot) =>
      g.contactPickup(loot.model as Pickup),
    );
    k.onUpdate(() => {
      if (this.sceneSession !== g.session) {
        this.sceneReady = false;
        k.go("arena");
        return;
      }
      const dt = Math.min(k.dt(), 0.1);
      if (g.phase !== "paused" && !g.reducedMotion) this.time += dt;
      if (g.phase === "combat") {
        if (g.hitStop > 0 && !g.reducedMotion)
          g.hitStop = Math.max(0, g.hitStop - dt);
        else {
          this.accumulator += dt * (g.run.practice ? g.labSpeed : 1);
          while (this.accumulator >= 1 / 120 && g.phase === "combat") {
            g.update(1 / 120);
            this.accumulator -= 1 / 120;
          }
        }
      } else this.accumulator = 0;
      this.fxRoot.paused = g.phase === "paused";
      this.sync();
      const scale = Math.min(k.width() / g.width, k.height() / g.height);
      k.camScale(scale);
      const shake =
        !g.reducedMotion && g.phase === "combat" ? Math.min(9, g.shake) : 0;
      k.camPos(
        g.width / 2 + (Math.random() - 0.5) * shake,
        g.height / 2 + (Math.random() - 0.5) * shake,
      );
      this.hudElapsed += dt;
      if (this.hudElapsed >= 0.08) {
        this.updateHud();
        this.hudElapsed = 0;
      }
    });
  }
  private polygon(radius: number, sides: number, rotation = 0) {
    return Array.from({ length: sides }, (_, i) =>
      this.k.vec2(
        Math.cos((i / sides) * TAU + rotation) * radius,
        Math.sin((i / sides) * TAU + rotation) * radius,
      ),
    );
  }
  private ring(
    p: Point,
    radius: number,
    color: string,
    opacity = 1,
    width = 2,
    end = 360,
  ) {
    this.k.drawCircle({
      pos: this.k.vec2(p.x, p.y),
      radius,
      fill: false,
      color: this.k.Color.fromHex(color),
      opacity,
      outline: { color: this.k.Color.fromHex(color), width },
      start: -90,
      end: end - 90,
      anchor: "center",
      resolution: 0.5,
    });
  }
  private poly(
    p: Point,
    radius: number,
    sides: number,
    color: string,
    opacity = 1,
    angle = 0,
    fill = true,
    width = 2,
  ) {
    this.k.drawPolygon({
      pos: this.k.vec2(p.x, p.y),
      pts: this.polygon(radius, sides, angle),
      color: this.k.Color.fromHex(color),
      opacity,
      fill,
      outline: { color: this.k.Color.fromHex(color), width },
    });
  }
  private sync() {
    const g = this.game,
      k = this.k;
    const entries: [Entity, string, number, number][] =
      g.phase === "menu"
        ? []
        : [
            [g.player, "pilot", 14, 20],
            ...g.enemies
              .filter((e) => e.hp > 0)
              .map(
                (e) =>
                  [e, "foe", e.radius, 10] as [Entity, string, number, number],
              ),
            ...g.bullets
              .filter((b) => b.life > 0)
              .map(
                (b) =>
                  [
                    b,
                    b.hostile ? "hostile-shot" : "friendly-shot",
                    b.radius,
                    15,
                  ] as [Entity, string, number, number],
              ),
            ...g.hazards.map(
              (h) =>
                [h, "danger", h.radius, 1] as [Entity, string, number, number],
            ),
            ...g.pickups
              .filter((p) => p.value > 0)
              .map(
                (p) => [p, "loot", 9, 5] as [Entity, string, number, number],
              ),
          ];
    const live = new Set(entries.map(([model]) => model));
    for (const [model, node] of this.nodes)
      if (!live.has(model)) {
        node.destroy();
        this.nodes.delete(model);
      }
    for (const [model, tag, radius, z] of entries) {
      let node = this.nodes.get(model);
      if (!node) {
        node = k.add([
          k.pos(model.x, model.y),
          k.z(z),
          k.area({
            shape: new k.Polygon(this.polygon(radius, 8)),
            collisionIgnore: this.ignoreTags(tag),
          }),
          tag,
          { model, draw: () => this.drawEntity(model, tag) },
        ]);
        this.nodes.set(model, node);
      }
      if (tag.includes("shot")) {
        const bullet = model as Bullet;
        const velocity = Math.hypot(bullet.vx, bullet.vy) || 1;
        const ux = bullet.vx / velocity,
          uy = bullet.vy / velocity;
        // Kaplay tests a swept convex area, so low-FPS phones do not tunnel through targets.
        const span = Math.min(
          150,
          Math.max(
            Math.hypot(node.pos.x - model.x, node.pos.y - model.y),
            velocity * Math.min(k.dt(), 0.1),
          ),
        );
        const r = bullet.radius;
        node.area.shape = new k.Polygon([
          k.vec2(ux * r - uy * r, uy * r + ux * r),
          k.vec2(ux * r + uy * r, uy * r - ux * r),
          k.vec2(-ux * span + uy * r, -uy * span - ux * r),
          k.vec2(-ux * span - uy * r, -uy * span + ux * r),
        ]);
      }
      node.pos = k.vec2(model.x, model.y);
    }
  }
  private ignoreTags(tag: string) {
    const tags = [
      "pilot",
      "foe",
      "friendly-shot",
      "hostile-shot",
      "danger",
      "loot",
    ];
    const pairs: Record<string, string[]> = {
      pilot: ["foe", "hostile-shot", "danger", "loot"],
      foe: ["pilot", "friendly-shot"],
      "friendly-shot": ["foe"],
      "hostile-shot": ["pilot"],
      danger: ["pilot"],
      loot: ["pilot"],
    };
    return tags.filter((other) => !pairs[tag].includes(other));
  }
  private drawEntity(model: Entity, tag: string) {
    const k = this.k,
      g = this.game,
      zero = { x: 0, y: 0 };
    if (tag === "pilot") {
      const p = model as Player,
        color = CLASSES[g.run.classId].color;
      const target = g.enemies.reduce<Enemy | null>(
        (best, e) =>
          !best ||
          Math.hypot(e.x - p.x, e.y - p.y) <
            Math.hypot(best.x - p.x, best.y - p.y)
            ? e
            : best,
        null,
      );
      const angle = target
        ? Math.atan2(target.y - p.y, target.x - p.x)
        : Math.atan2(g.aim.y, g.aim.x);
      const opacity =
        p.invulnerable > 0 && !g.reducedMotion
          ? 0.7 + Math.sin(this.time * 30) * 0.25
          : 1;
      this.poly(zero, 27, 6, color, 0.08, angle);
      this.poly(
        zero,
        19 + (p.dashTime > 0 ? 4 : 0),
        6,
        "#101d30",
        opacity,
        angle,
      );
      this.poly(zero, 18, 6, color, opacity, angle, false, 2.5);
      this.poly(zero, 9, 3, "#ffffff", opacity, angle);
      // Shoulder plates and forward cannon make the pilot read as a combat unit.
      for (const side of [-1, 1])
        this.poly(
          {
            x: Math.cos(angle + side * 1.8) * 19,
            y: Math.sin(angle + side * 1.8) * 19,
          },
          7,
          4,
          color,
          opacity,
          angle + Math.PI / 4,
        );
      k.drawLine({
        p1: k.vec2(Math.cos(angle) * 15, Math.sin(angle) * 15),
        p2: k.vec2(Math.cos(angle) * 29, Math.sin(angle) * 29),
        width: 6,
        color: k.Color.fromHex(color),
      });
      this.ring(zero, 30, color, 0.7, 3, (p.charge / p.reload) * 359.9);
    } else if (tag === "foe") {
      const e = model as Enemy;
      const color =
        e.flash > 0
          ? "#ffffff"
          : e.poisoned > 0
            ? "#b8ff62"
            : e.kind === "boss"
              ? ACTS[g.run.act - 1].color
              : COLORS[e.kind];
      const angle = Math.atan2(g.player.y - e.y, g.player.x - e.x);
      const sides =
        e.kind === "runner"
          ? 3
          : e.kind === "shooter"
            ? 4
            : e.kind === "guard"
              ? 8
              : e.kind === "boss"
                ? 6
                : 5;
      this.poly({ x: 0, y: 6 }, e.radius + 5, sides, "#000000", 0.35, angle);
      this.poly(zero, e.radius + 6, sides, color, 0.07, angle);
      this.poly(zero, e.radius, sides, "#1d1829", 1, angle);
      this.poly(
        zero,
        e.radius,
        sides,
        color,
        1,
        angle,
        false,
        e.kind === "boss" ? 4 : 2,
      );
      if (e.kind === "boss") {
        this.poly(
          zero,
          e.radius * 0.72,
          6,
          color,
          0.7,
          -this.time * 0.4,
          false,
          3,
        );
        this.poly(zero, e.radius * 0.4, 3, color, 0.9, this.time * 0.6);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + this.time * 0.12;
          this.poly(
            { x: Math.cos(a) * 85, y: Math.sin(a) * 85 },
            11,
            4,
            color,
            0.8,
            a,
          );
        }
        if (e.enraged)
          this.ring(
            zero,
            88 + e.phase * 4,
            "#ff5676",
            0.45 + e.phase * 0.1,
            e.phase,
          );
        if (e.transition > 0)
          this.ring(zero, 110 + e.transition * 40, "#ffda8a", 0.9, 4);
      } else {
        this.poly(
          { x: Math.cos(angle) * 3, y: Math.sin(angle) * 3 },
          e.kind === "guard" ? 11 : 5,
          e.kind === "runner" ? 3 : 4,
          color,
          1,
          angle,
        );
        if (e.kind === "shooter")
          this.ring(zero, e.radius + 6, color, 0.6, 1.5);
      }
      if (e.hp < e.maxHp && e.kind !== "boss") {
        k.drawRect({
          pos: k.vec2(-15, -e.radius - 9),
          width: 30,
          height: 3,
          color: k.rgb(50, 35, 55),
        });
        k.drawRect({
          pos: k.vec2(-15, -e.radius - 9),
          width: 30 * Math.max(0, e.hp / e.maxHp),
          height: 3,
          color: k.Color.fromHex(color),
        });
      }
    } else if (tag.includes("shot")) {
      const b = model as Bullet;
      const color = b.hostile ? "#ff6b88" : CLASSES[g.run.classId].color;
      k.drawLine({
        p1: k.vec2(-b.vx * 0.035, -b.vy * 0.035),
        p2: k.vec2(0),
        width: b.hostile ? 5 : 7,
        color: k.Color.fromHex(color),
        opacity: 0.3,
      });
      this.poly(zero, b.radius + 3, 4, color, 0.18, Math.PI / 4);
      this.poly(
        zero,
        b.radius,
        4,
        b.hostile ? color : "#ffffff",
        1,
        Math.PI / 4,
      );
    } else if (tag === "danger") {
      const h = model as Hazard;
      k.drawCircle({
        pos: k.vec2(0),
        radius: h.radius,
        color: k.rgb(255, 65, 105),
        opacity: h.fired ? 0.45 : 0.08,
        anchor: "center",
        resolution: 0.5,
      });
      this.ring(zero, h.radius, "#ff5676", h.fired ? 1 : 0.8, h.fired ? 5 : 2);
      if (!h.fired) {
        this.ring(
          zero,
          h.radius * Math.max(0.1, 1 - h.delay / 1.3),
          "#ffb45b",
          0.8,
          2,
        );
        k.drawText({
          text: "!",
          pos: k.vec2(0),
          anchor: "center",
          size: 23,
          color: k.rgb(255, 190, 100),
        });
      }
    } else {
      this.poly(zero, 10, 4, "#ffcc64", 0.09, this.time);
      this.poly(zero, 5, 4, "#ffdb86", 1, Math.PI / 4 + this.time * 0.5);
    }
  }
  private drawFloor() {
    const k = this.k,
      g = this.game,
      color = ACTS[g.run.act - 1].color;
    k.drawRect({
      pos: k.vec2(0),
      width: g.width,
      height: g.height,
      color: k.rgb(9, 14, 25),
    });
    for (let x = 40; x < g.width; x += 80)
      for (let y = 40; y < g.height; y += 80) {
        k.drawRect({
          pos: k.vec2(x, y),
          width: 2,
          height: 2,
          color: k.rgb(46, 68, 89),
          opacity: 0.55,
        });
      }
    for (const r of [150, 300, 450])
      this.ring({ x: g.width / 2, y: g.height / 2 }, r, color, 0.045, 1);
    k.drawRect({
      pos: k.vec2(24),
      width: g.width - 48,
      height: g.height - 48,
      fill: false,
      outline: { color: k.rgb(50, 77, 97), width: 2 },
    });
    for (const [x, y, dx, dy] of [
      [24, 24, 1, 1],
      [g.width - 24, 24, -1, 1],
      [24, g.height - 24, 1, -1],
      [g.width - 24, g.height - 24, -1, -1],
    ]) {
      k.drawLine({
        p1: k.vec2(x, y + dy * 36),
        p2: k.vec2(x, y),
        width: 4,
        color: k.Color.fromHex(color),
        opacity: 0.7,
      });
      k.drawLine({
        p1: k.vec2(x, y),
        p2: k.vec2(x + dx * 36, y),
        width: 4,
        color: k.Color.fromHex(color),
        opacity: 0.7,
      });
    }
    if (g.phase === "menu") {
      const center = { x: g.width / 2, y: g.height / 2 };
      for (let i = 0; i < 4; i++)
        this.poly(
          center,
          130 + i * 95,
          6,
          i % 2 ? "#c49bff" : color,
          0.07,
          this.time * 0.03 * (i % 2 ? 1 : -1),
          false,
        );
      for (let i = 0; i < 26; i++) {
        const x = (i * 137.7) % g.width,
          y = g.height - ((this.time * (7 + (i % 5)) + i * 97) % g.height);
        this.poly({ x, y }, 1.5 + (i % 2), 4, color, 0.25, this.time);
      }
    }
  }
  private drawSignals() {
    const k = this.k,
      g = this.game;
    for (const field of g.fields) {
      const color =
        field.kind === "vortex"
          ? "#c5afff"
          : field.kind === "mine"
            ? "#ffbc8a"
            : "#85d8ef";
      this.ring(field, field.radius, color, 0.22, 2);
      this.ring(
        field,
        field.kind === "vortex" ? 15 + ((this.time * 85) % field.radius) : 18,
        color,
        0.7,
        2,
      );
      if (field.kind === "orbit")
        for (let i = 0; i < 3; i++) {
          const angle = this.time * 4 + (i * TAU) / 3;
          this.poly(
            {
              x: field.x + Math.cos(angle) * 85,
              y: field.y + Math.sin(angle) * 85,
            },
            13,
            3,
            "#ffda8a",
            1,
            angle,
          );
        }
      if (field.kind === "storm")
        for (let i = 0; i < 3; i++) {
          const a = this.time * 3 + (i * TAU) / 3;
          k.drawLine({
            p1: k.vec2(field.x, field.y),
            p2: k.vec2(
              field.x + Math.cos(a) * field.radius,
              field.y + Math.sin(a) * field.radius,
            ),
            color: k.Color.fromHex(color),
            width: 2,
            opacity: g.reducedMotion ? 0.3 : 0.7,
          });
        }
      if (field.kind === "turret") this.poly(field, 22, 6, color, 1, this.time);
      if (field.kind === "mine")
        this.poly(field, 16, 4, color, 0.8, Math.PI / 4);
      if (field.kind === "decoy") {
        this.poly(field, 20, 6, color, 0.45, this.time * 0.3);
        this.ring(field, 45, color, 0.3, 1);
      }
    }
    if (g.run.rewards.armor && g.player.shieldCd <= 0 && g.phase === "combat")
      this.ring(g.player, 29, "#85d8ef", 0.6, 2);
    if (
      g.run.rewards.anchor &&
      g.player.stationary >= 1 &&
      g.phase === "combat"
    )
      this.ring(g.player, 34, "#ffda8a", 0.8, 3);
    if (g.run.practice && g.phase === "combat")
      k.drawText({
        text: `LAB · ${g.labGod ? "GOD · " : ""}${g.labSpeed}x`,
        pos: k.vec2(35, g.height - 35),
        size: 14,
        color: k.Color.fromHex("#85d8ef"),
        opacity: 0.7,
      });
    if (g.noticeTime > 0 && g.phase === "combat")
      k.drawText({
        text: g.notice,
        pos: k.vec2(g.width / 2, 80),
        size: 25,
        anchor: "center",
        color: k.Color.fromHex("#ffbc8a"),
        opacity: Math.min(1, g.noticeTime),
      });
    for (const spawn of g.spawnQueue)
      if (spawn.at - g.roomTime < 0.9 && g.phase === "combat") {
        this.ring(
          spawn,
          spawn.kind === "boss" ? 90 : 23,
          "#ffba66",
          0.3 + Math.sin(this.time * 10) * 0.15,
          2,
        );
      }
    if (g.phase === "combat" && g.intro > 0) {
      k.drawText({
        text:
          g.run.room % 4 === 0
            ? "GUARDIAN"
            : `WAVE ${g.run.room.toString().padStart(2, "0")}`,
        pos: k.vec2(g.width / 2, g.height / 2 - 50),
        size: 46,
        anchor: "center",
        color: k.rgb(231, 241, 255),
        opacity: Math.min(1, g.intro * 2),
      });
    }
  }
  private feedback(event: Feedback) {
    if (!this.sceneReady) return;
    const k = this.k,
      g = this.game;
    if (event.type === "burst") {
      this.sparks(
        event,
        event.color ?? "#a4f6c1",
        event.count ?? 10,
        event.speed ?? 100,
      );
      return;
    }
    if (event.type === "hit") {
      if (!g.reducedMotion && this.fxCount < (this.mobile ? 180 : 420)) {
        const node = this.fxRoot.add([
          k.pos(event.x + (Math.random() - 0.5) * 18, event.y - 25),
          k.text(String(event.value), {
            size: event.value! > 35 ? 22 : 15,
            font: "monospace",
          }),
          k.anchor("center"),
          k.color(k.Color.fromHex(event.color ?? "#ffffff")),
          k.opacity(1),
          k.z(50),
          k.move(k.vec2((Math.random() - 0.5) * 0.4, -1), 75),
          k.lifespan(0.48, { fade: 0.3 }),
          "feedback",
        ]);
        this.trackFx(node);
      }
    } else if (event.type === "kill") {
      this.ripple(
        event,
        event.boss ? "#ffc65d" : "#ffb477",
        event.boss ? 300 : 40,
        event.boss ? 0.8 : 0.25,
      );
      if (event.boss) {
        this.sparks(event, "#ffda78", 110, 400);
        if (!g.muted) k.play("boss", { volume: 0.3 });
      }
    } else if (event.type === "skill") {
      this.ripple(event, event.color!, event.radius!, 0.36);
      this.sparks(event, event.color!, 40, 260);
    } else if (event.type === "dash")
      this.ripple(event, event.color!, 45, 0.22);
    else if (event.type === "pickup") this.sparks(event, "#ffdb86", 3, 45);
    else if (event.type === "clear") {
      this.ripple(event, "#b2ff9f", 500, 0.65);
      this.sparks(event, "#ffce6d", event.boss ? 95 : 55, 230);
    } else if (event.type === "shot")
      this.ripple(event, event.color!, 25, 0.12);
  }
  private trackFx(node: GameObj) {
    this.fxCount++;
    node.onDestroy(() => {
      this.fxCount = Math.max(0, this.fxCount - 1);
    });
  }
  private sparks(origin: Point, color: string, count: number, speed: number) {
    const k = this.k,
      reduced = this.game.reducedMotion;
    const cap = reduced ? 45 : this.mobile ? 240 : 650;
    count = reduced ? Math.min(3, count) : count;
    for (let i = 0; i < count && this.fxCount < cap; i++) {
      const angle = Math.random() * TAU,
        size = 1.5 + Math.random() * 3;
      const node = this.fxRoot.add([
        k.pos(origin.x, origin.y),
        k.rect(size * (i % 4 === 0 ? 3 : 1), size),
        k.anchor("center"),
        k.rotate((angle * 180) / Math.PI),
        k.color(k.Color.fromHex(color)),
        k.opacity(0.9),
        k.move(
          k.vec2(Math.cos(angle), Math.sin(angle)),
          (0.3 + Math.random() * 0.7) * speed,
        ),
        k.lifespan(0.22 + Math.random() * 0.38, { fade: 0.22 }),
        "feedback",
      ]);
      this.trackFx(node);
    }
  }
  private ripple(
    origin: Point,
    color: string,
    radius: number,
    duration: number,
  ) {
    if (this.fxCount >= (this.mobile ? 260 : 680) || this.game.reducedMotion)
      return;
    const k = this.k;
    const node = this.fxRoot.add([
      k.pos(origin.x, origin.y),
      k.scale(0.1),
      k.opacity(0.8),
      k.circle(radius, { fill: false }),
      k.anchor("center"),
      k.outline(3, k.Color.fromHex(color)),
      k.lifespan(duration, { fade: duration * 0.8 }),
      {
        update(this: GameObj) {
          this.scale = this.scale.add(k.dt() / duration);
        },
      },
      "feedback",
    ]);
    this.trackFx(node);
  }
}
