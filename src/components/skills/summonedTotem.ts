import type { GameObj, KAPLAYCtx } from "kaplay";
import { registerSkill } from "./registry";
import { gameState } from "../../state/gameState";

// ===== Tabela de escalamento por nível =====
type TotemLevelData = {
  hp: number;
  lifetime: number; // segundos
  fireRate: number; // tiros por segundo
  damage: number; // dano por tiro
  bulletSpeed: number; // velocidade do projétil
  range: number; // alcance de detecção
  cooldown: number; // cooldown da skill (ms)
};

const TOTEM_LEVELS: TotemLevelData[] = [
  // nível 1 — básico, lento
  {
    hp: 4,
    lifetime: 6,
    fireRate: 1.2,
    damage: 1,
    bulletSpeed: 380,
    range: 350,
    cooldown: 14000,
  },
  // nível 2 — mais resistente, atira um pouco mais rápido
  {
    hp: 5,
    lifetime: 8,
    fireRate: 1.6,
    damage: 1,
    bulletSpeed: 400,
    range: 400,
    cooldown: 13000,
  },
  // nível 3 — mais dano, mais tempo
  {
    hp: 6,
    lifetime: 10,
    fireRate: 2.0,
    damage: 2,
    bulletSpeed: 420,
    range: 450,
    cooldown: 12000,
  },
  // nível 4 — cadência alta
  {
    hp: 7,
    lifetime: 12,
    fireRate: 2.8,
    damage: 2,
    bulletSpeed: 440,
    range: 500,
    cooldown: 11000,
  },
  // nível 5 — metralhadora rúnica
  {
    hp: 8,
    lifetime: 15,
    fireRate: 3.5,
    damage: 2,
    bulletSpeed: 460,
    range: 550,
    cooldown: 10000,
  },
];

function getLevelData(): TotemLevelData {
  const lvl = gameState.skills.levels["summoned-totem"] ?? 1;
  return TOTEM_LEVELS[Math.min(lvl, TOTEM_LEVELS.length) - 1];
}

// ===== Cores do totem =====
const TOTEM_COLORS = {
  body: [50, 40, 30] as [number, number, number],
  accent: [220, 180, 60] as [number, number, number],
  rune: [255, 220, 80] as [number, number, number],
  glow: [255, 200, 40] as [number, number, number],
  bullet: [255, 230, 100] as [number, number, number],
  bulletGlow: [255, 200, 50] as [number, number, number],
  healthBar: [80, 220, 80] as [number, number, number],
  healthBarBg: [40, 40, 40] as [number, number, number],
  dying: [255, 80, 40] as [number, number, number],
};

// ===== Helpers =====

function nearestEnemy(
  k: KAPLAYCtx,
  from: { x: number; y: number },
  range: number,
): GameObj | null {
  const enemies = k.get("enemy") as GameObj[];
  if (!enemies || enemies.length === 0) return null;
  let nearest: GameObj | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const e of enemies) {
    const d = Math.hypot(e.pos.x - from.x, e.pos.y - from.y);
    if (d < best && d <= range) {
      best = d;
      nearest = e;
    }
  }
  return nearest;
}

// ===== Efeitos visuais =====

function spawnSummonEffect(k: KAPLAYCtx, pos: { x: number; y: number }): void {
  // Anel rúnico de invocação
  const ring = k.add([
    k.circle(35),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(TOTEM_COLORS.rune[0], TOTEM_COLORS.rune[1], TOTEM_COLORS.rune[2]),
    k.outline(2, k.rgb(255, 255, 200)),
    k.opacity(0.5),
    k.scale(0.1),
    k.z(95),
    { id: "totem-summon-ring", t: 0 },
  ]) as GameObj & { t: number };
  ring.onUpdate(() => {
    ring.t += k.dt();
    const p = Math.min(ring.t / 0.35, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    ring.scale = k.vec2(0.1 + ease * 1.8);
    ring.opacity = 0.5 * (1 - p);
    if (ring.t >= 0.35) ring.destroy();
  });

  // Flash central
  const flash = k.add([
    k.circle(15),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(255, 255, 220),
    k.opacity(0.8),
    k.scale(0.2),
    k.z(200),
    { id: "totem-summon-flash", t: 0 },
  ]) as GameObj & { t: number };
  flash.onUpdate(() => {
    flash.t += k.dt();
    const p = Math.min(flash.t / 0.2, 1);
    flash.scale = k.vec2(0.2 + p * 2);
    flash.opacity = 0.8 * (1 - p);
    if (flash.t >= 0.2) flash.destroy();
  });

  // Partículas rúnicas subindo
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
    const dist = 15 + Math.random() * 20;
    const sp = k.add([
      k.rect(3, 3),
      k.pos(pos.x + Math.cos(angle) * dist, pos.y + Math.sin(angle) * dist),
      k.anchor("center"),
      k.rotate(Math.random() * 360),
      k.color(TOTEM_COLORS.rune[0], TOTEM_COLORS.rune[1], TOTEM_COLORS.rune[2]),
      k.opacity(0.7),
      k.z(201),
      { id: "totem-summon-p", t: 0 },
    ]) as GameObj & { t: number };
    sp.onUpdate(() => {
      sp.t += k.dt();
      sp.pos.y -= 50 * k.dt();
      sp.opacity = 0.7 * (1 - sp.t / 0.5);
      sp.angle += 180 * k.dt();
      if (sp.t >= 0.5) sp.destroy();
    });
  }
}

function spawnMuzzleFlash(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  dir: { x: number; y: number },
): void {
  const flash = k.add([
    k.circle(5),
    k.pos(pos.x + dir.x * 14, pos.y + dir.y * 14),
    k.anchor("center"),
    k.color(255, 240, 120),
    k.opacity(0.7),
    k.scale(0.4),
    k.z(300),
    { id: "totem-muzzle", t: 0 },
  ]) as GameObj & { t: number };
  flash.onUpdate(() => {
    flash.t += k.dt();
    const p = Math.min(flash.t / 0.08, 1);
    flash.scale = k.vec2(0.4 + p * 1.2);
    flash.opacity = 0.7 * (1 - p);
    if (flash.t >= 0.08) flash.destroy();
  });
}

function spawnBulletHitEffect(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
): void {
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sp = k.add([
      k.circle(2),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(255, 220, 80),
      k.opacity(0.6),
      k.z(301),
      {
        id: "totem-hit-p",
        t: 0,
        vx: Math.cos(angle) * 50,
        vy: Math.sin(angle) * 50,
      },
    ]) as GameObj & { t: number; vx: number; vy: number };
    sp.onUpdate(() => {
      sp.t += k.dt();
      sp.pos.x += sp.vx * k.dt();
      sp.pos.y += sp.vy * k.dt();
      sp.opacity = 0.6 * (1 - sp.t / 0.2);
      if (sp.t >= 0.2) sp.destroy();
    });
  }
}

function spawnDestroyEffect(k: KAPLAYCtx, pos: { x: number; y: number }): void {
  // Explosão de fragmentos
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.4;
    const speed = 50 + Math.random() * 120;
    const size = 2 + Math.random() * 4;
    const isRune = Math.random() > 0.5;
    const color = isRune ? TOTEM_COLORS.rune : TOTEM_COLORS.body;
    const sp = k.add([
      k.rect(size, size * 0.6),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.rotate(Math.random() * 360),
      k.color(color[0], color[1], color[2]),
      k.opacity(0.8),
      k.z(500),
      {
        id: "totem-frag",
        t: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
      },
    ]) as GameObj & { t: number; vx: number; vy: number; life: number };
    sp.onUpdate(() => {
      sp.t += k.dt();
      sp.pos.x += sp.vx * k.dt();
      sp.pos.y += sp.vy * k.dt();
      sp.vy += 80 * k.dt(); // gravidade
      sp.angle += 200 * k.dt();
      sp.opacity = 0.8 * (1 - sp.t / sp.life);
      if (sp.t >= sp.life) sp.destroy();
    });
  }

  // Flash de explosão
  const flash = k.add([
    k.circle(25),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(255, 200, 80),
    k.opacity(0.6),
    k.scale(0.3),
    k.z(501),
    { id: "totem-destroy-flash", t: 0 },
  ]) as GameObj & { t: number };
  flash.onUpdate(() => {
    flash.t += k.dt();
    const p = Math.min(flash.t / 0.2, 1);
    flash.scale = k.vec2(0.3 + p * 1.5);
    flash.opacity = 0.6 * (1 - p);
    if (flash.t >= 0.2) flash.destroy();
  });

  // Label "💥"
  const label = k.add([
    k.text("💥", { size: 18 }),
    k.pos(pos.x, pos.y - 15),
    k.anchor("center"),
    k.opacity(1),
    k.z(550),
    { id: "totem-destroy-label", t: 0 },
  ]) as GameObj & { t: number };
  label.onUpdate(() => {
    label.t += k.dt();
    label.pos.y -= 25 * k.dt();
    if (label.t > 0.4) label.opacity = 1 - (label.t - 0.4) / 0.4;
    if (label.t >= 0.8) label.destroy();
  });
}

// ===== Skill principal =====

registerSkill({
  id: "summoned-totem",
  getCooldown: (level) =>
    TOTEM_LEVELS[Math.min(level, TOTEM_LEVELS.length) - 1].cooldown,
  use: ({ k, player }) => {
    const data = getLevelData();
    const cx = player.pos.x + (Math.random() - 0.5) * 60;
    const cy = player.pos.y + (Math.random() - 0.5) * 60;
    const totemCenter = { x: cx, y: cy };

    // Efeito de invocação
    spawnSummonEffect(k, totemCenter);

    // Dimensões do totem
    const bodyW = 18;
    const bodyH = 30;

    // ===== Glow pulsante atrás do totem =====
    const glow = k.add([
      k.circle(bodyW + 10),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(TOTEM_COLORS.glow[0], TOTEM_COLORS.glow[1], TOTEM_COLORS.glow[2]),
      k.opacity(0),
      k.scale(1),
      k.z(97),
      { id: "totem-glow", t: 0 },
    ]) as GameObj & { t: number };

    // ===== Corpo do totem (retângulo escuro com contorno dourado) =====
    const body = k.add([
      k.rect(bodyW, bodyH),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(TOTEM_COLORS.body[0], TOTEM_COLORS.body[1], TOTEM_COLORS.body[2]),
      k.outline(
        2,
        k.rgb(
          TOTEM_COLORS.accent[0],
          TOTEM_COLORS.accent[1],
          TOTEM_COLORS.accent[2],
        ),
      ),
      k.area(),
      k.scale(1),
      k.z(100),
      {
        id: "skill-totem",
        t: 0,
        hp: data.hp,
        maxHp: data.hp,
        nextFire: 0.5, // delay inicial antes de começar a atirar
      },
    ]) as GameObj & { t: number; hp: number; maxHp: number; nextFire: number };

    // ===== Detalhe rúnico central (quadradinho brilhante) =====
    const runeEye = k.add([
      k.rect(6, 6),
      k.pos(cx, cy - 2),
      k.anchor("center"),
      k.color(TOTEM_COLORS.rune[0], TOTEM_COLORS.rune[1], TOTEM_COLORS.rune[2]),
      k.outline(1, k.rgb(255, 255, 200)),
      k.opacity(0.8),
      k.scale(1),
      k.z(101),
      { id: "totem-rune", t: 0 },
    ]) as GameObj & { t: number };

    // ===== Chapéuzinho triangular no topo =====
    const hat = k.add([
      k.rect(10, 10),
      k.pos(cx, cy - bodyH / 2 - 3),
      k.anchor("center"),
      k.rotate(45),
      k.color(
        TOTEM_COLORS.accent[0],
        TOTEM_COLORS.accent[1],
        TOTEM_COLORS.accent[2],
      ),
      k.outline(1, k.rgb(255, 255, 200)),
      k.opacity(1),
      k.scale(1),
      k.z(102),
      { id: "totem-hat" },
    ]);

    // ===== Barra de vida =====
    const hpBarW = bodyW + 8;
    const hpBarH = 3;
    const hpBarBg = k.add([
      k.rect(hpBarW, hpBarH),
      k.pos(cx - hpBarW / 2, cy + bodyH / 2 + 5),
      k.color(
        TOTEM_COLORS.healthBarBg[0],
        TOTEM_COLORS.healthBarBg[1],
        TOTEM_COLORS.healthBarBg[2],
      ),
      k.outline(1, k.rgb(0, 0, 0)),
      k.opacity(0.6),
      k.z(103),
      { id: "totem-hp-bg" },
    ]);
    const hpBar = k.add([
      k.rect(hpBarW, hpBarH),
      k.pos(cx - hpBarW / 2, cy + bodyH / 2 + 5),
      k.color(
        TOTEM_COLORS.healthBar[0],
        TOTEM_COLORS.healthBar[1],
        TOTEM_COLORS.healthBar[2],
      ),
      k.opacity(0.8),
      k.z(104),
      { id: "totem-hp-fill" },
    ]);

    // ===== Timer bar (tempo de vida restante) =====
    const timerBarW = bodyW + 8;
    const timerBarH = 2;
    const timerBar = k.add([
      k.rect(timerBarW, timerBarH),
      k.pos(cx - timerBarW / 2, cy + bodyH / 2 + 10),
      k.color(TOTEM_COLORS.rune[0], TOTEM_COLORS.rune[1], TOTEM_COLORS.rune[2]),
      k.opacity(0.5),
      k.z(104),
      { id: "totem-timer-bar" },
    ]);

    // ===== Anel de alcance (muito sutil) =====
    const rangeRing = k.add([
      k.circle(data.range),
      k.pos(cx, cy),
      k.anchor("center"),
      k.outline(
        1,
        k.rgb(TOTEM_COLORS.rune[0], TOTEM_COLORS.rune[1], TOTEM_COLORS.rune[2]),
      ),
      k.color(0, 0, 0),
      k.opacity(0),
      k.z(94),
      { id: "totem-range" },
    ]);

    const allParts = [
      glow,
      body,
      runeEye,
      hat,
      hpBarBg,
      hpBar,
      timerBar,
      rangeRing,
    ];

    let destroyed = false;

    function destroyAll(): void {
      if (destroyed) return;
      destroyed = true;
      const pos = { x: body.pos.x, y: body.pos.y };
      spawnDestroyEffect(k, pos);
      for (const part of allParts) {
        if (part.exists()) part.destroy();
      }
    }

    // ===== Dano ao totem por inimigos =====
    body.onCollide("enemy", (enemy: any) => {
      if (destroyed) return;
      const dmg = enemy.damage ?? 1;
      body.hp -= dmg;

      // Flash vermelho ao tomar dano
      body.color = k.rgb(255, 100, 80);
      runeEye.color = k.rgb(255, 100, 80);

      setTimeout(() => {
        if (body.exists()) {
          body.color = k.rgb(
            TOTEM_COLORS.body[0],
            TOTEM_COLORS.body[1],
            TOTEM_COLORS.body[2],
          );
          runeEye.color = k.rgb(
            TOTEM_COLORS.rune[0],
            TOTEM_COLORS.rune[1],
            TOTEM_COLORS.rune[2],
          );
        }
      }, 100);

      if (body.hp <= 0) {
        destroyAll();
      }
    });

    // ===== Update principal =====
    body.onUpdate(() => {
      if (destroyed || !body.exists()) return;
      const dt = k.dt();
      body.t += dt;

      const lifetime = data.lifetime;
      const timeLeft = lifetime - body.t;

      // --- Fade in (0.3s) ---
      if (body.t < 0.3) {
        const f = body.t / 0.3;
        body.opacity = f;
        glow.opacity = 0.1 * f;
        runeEye.opacity = 0.8 * f;
        hat.opacity = f;
        hpBarBg.opacity = 0.6 * f;
        hpBar.opacity = 0.8 * f;
        timerBar.opacity = 0.5 * f;
        rangeRing.opacity = 0.03 * f;
      }

      // --- Glow pulsante ---
      glow.t += dt;
      const glowPulse = 0.08 + Math.sin(glow.t * 2.5) * 0.04;
      glow.opacity = glowPulse;
      const gs = 1 + Math.sin(glow.t * 2) * 0.08;
      glow.scale = k.vec2(gs);

      // --- Runa pisca suavemente ---
      runeEye.t += dt;
      const runePulse = 0.7 + Math.sin(runeEye.t * 3) * 0.2;
      runeEye.opacity = runePulse;
      const runeScale = 1 + Math.sin(runeEye.t * 2.5) * 0.1;
      runeEye.scale = k.vec2(runeScale);

      // --- Anel de alcance muito sutil ---
      rangeRing.opacity = 0.025 + Math.sin(body.t * 1.2) * 0.01;

      // --- Barra de vida ---
      const hpRatio = Math.max(0, body.hp / body.maxHp);
      hpBar.width = hpBarW * hpRatio;
      if (hpRatio < 0.35) {
        hpBar.color = k.rgb(
          TOTEM_COLORS.dying[0],
          TOTEM_COLORS.dying[1],
          TOTEM_COLORS.dying[2],
        );
      } else {
        hpBar.color = k.rgb(
          TOTEM_COLORS.healthBar[0],
          TOTEM_COLORS.healthBar[1],
          TOTEM_COLORS.healthBar[2],
        );
      }

      // --- Timer bar ---
      const timeRatio = Math.max(0, timeLeft / lifetime);
      timerBar.width = timerBarW * timeRatio;
      if (timeRatio < 0.2) {
        timerBar.color = k.rgb(
          TOTEM_COLORS.dying[0],
          TOTEM_COLORS.dying[1],
          TOTEM_COLORS.dying[2],
        );
      }

      // --- Últimos 2s: shake e pisca de urgência ---
      if (timeLeft < 2 && timeLeft > 0) {
        const urgency = 1 - timeLeft / 2;
        const shake = Math.sin(k.time() * 25) * urgency * 2;
        body.pos.x = cx + shake;
        runeEye.pos.x = cx + shake;
        hat.pos.x = cx + shake;
        glow.pos.x = cx + shake;

        // Pisca o contorno
        if (Math.sin(k.time() * 15) > 0) {
          body.outline.color = k.rgb(255, 80, 40);
        } else {
          body.outline.color = k.rgb(
            TOTEM_COLORS.accent[0],
            TOTEM_COLORS.accent[1],
            TOTEM_COLORS.accent[2],
          );
        }

        // Fade out gradual
        const fadeF = Math.max(0, timeLeft / 2);
        body.opacity = fadeF;
        glow.opacity = glowPulse * fadeF;
        runeEye.opacity = runePulse * fadeF;
        hat.opacity = fadeF;
        hpBarBg.opacity = 0.6 * fadeF;
        hpBar.opacity = 0.8 * fadeF;
        timerBar.opacity = 0.5 * fadeF;
      }

      // --- Expiração ---
      if (body.t >= lifetime) {
        destroyAll();
        return;
      }

      // --- Disparo automático ---
      body.nextFire -= dt;
      if (body.nextFire <= 0) {
        const fireInterval = 1 / data.fireRate;
        body.nextFire = fireInterval;

        const target = nearestEnemy(k, totemCenter, data.range);
        if (target) {
          const dirVec = k.vec2(target.pos.x - cx, target.pos.y - cy).unit();
          const dir = { x: dirVec.x, y: dirVec.y };

          // Muzzle flash
          spawnMuzzleFlash(k, totemCenter, dir);

          // Projétil
          const bulletSize = 5;
          const bulletGlow = k.add([
            k.circle(bulletSize + 3),
            k.pos(cx + dir.x * 14, cy + dir.y * 14),
            k.anchor("center"),
            k.color(
              TOTEM_COLORS.bulletGlow[0],
              TOTEM_COLORS.bulletGlow[1],
              TOTEM_COLORS.bulletGlow[2],
            ),
            k.opacity(0.25),
            k.z(149),
            { id: "totem-bullet-glow", t: 0 },
          ]) as GameObj & { t: number };

          const bullet = k.add([
            k.rect(bulletSize * 1.6, bulletSize * 0.7),
            k.pos(cx + dir.x * 14, cy + dir.y * 14),
            k.anchor("center"),
            k.rotate(k.rad2deg(Math.atan2(dir.y, dir.x))),
            k.color(
              TOTEM_COLORS.bullet[0],
              TOTEM_COLORS.bullet[1],
              TOTEM_COLORS.bullet[2],
            ),
            k.outline(1, k.rgb(255, 255, 200)),
            k.area(),
            k.z(150),
            {
              id: "skill-totem-bullet",
              vel: dirVec.scale(data.bulletSpeed),
              dist: 0,
              trailT: 0,
            },
          ]) as GameObj & { vel: any; dist: number; trailT: number };

          bullet.onUpdate(() => {
            const step = bullet.vel.scale(k.dt());
            bullet.pos.x += step.x;
            bullet.pos.y += step.y;
            bullet.dist += step.len();

            // Glow segue
            bulletGlow.pos.x = bullet.pos.x;
            bulletGlow.pos.y = bullet.pos.y;
            bulletGlow.t += k.dt();
            bulletGlow.opacity = 0.2 + Math.sin(bulletGlow.t * 10) * 0.08;

            // Trail
            bullet.trailT += k.dt();
            if (bullet.trailT >= 0.04) {
              bullet.trailT -= 0.04;
              const trail = k.add([
                k.rect(3, 2),
                k.pos(bullet.pos.x, bullet.pos.y),
                k.anchor("center"),
                k.rotate(bullet.angle),
                k.color(
                  TOTEM_COLORS.bullet[0],
                  TOTEM_COLORS.bullet[1],
                  TOTEM_COLORS.bullet[2],
                ),
                k.opacity(0.3),
                k.z(148),
                { id: "totem-trail", t: 0 },
              ]) as GameObj & { t: number };
              trail.onUpdate(() => {
                trail.t += k.dt();
                trail.opacity = 0.3 * (1 - trail.t / 0.12);
                if (trail.t >= 0.12) trail.destroy();
              });
            }

            // Alcance máximo
            if (bullet.dist > data.range + 100) {
              bulletGlow.destroy();
              bullet.destroy();
            }
          });

          bullet.onCollide("enemy", (enemy: any) => {
            if (typeof enemy.hp === "number") {
              enemy.hp -= data.damage;
              spawnBulletHitEffect(k, { x: bullet.pos.x, y: bullet.pos.y });
              if (enemy.hp <= 0) enemy.destroy();
            }
            bulletGlow.destroy();
            bullet.destroy();
          });

          bullet.onCollide("arena-wall", () => {
            bulletGlow.destroy();
            bullet.destroy();
          });

          bullet.onDestroy(() => {
            if (bulletGlow.exists()) bulletGlow.destroy();
          });
        }
      }
    });
  },
});
