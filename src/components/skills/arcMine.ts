import type { GameObj, KAPLAYCtx } from "kaplay";
import { registerSkill } from "./registry";
import { gameState } from "../../state/gameState";

const MINE_CONFIG = {
  radius: 60,
  lifetime: 6,
  damage: 3,
  warningDelay: 200,
  explosionDelay: 200,
  explosionDuration: 0.35,
  shakeIntensity: 2,
  shakeSpeed: 50,
  baseCooldown: 3000,
} as const;

function getMaxChargesForLevel(level: number): number {
  return level + 1;
}

type MineState = "idle" | "warning" | "danger" | "exploding";

// Rastreia minas ativas para encadeamento
const activeMines: Array<{
  mine: GameObj & { t: number; state: MineState };
  triggerArea: GameObj;
  glow: GameObj;
  rangeRing: GameObj;
  pos: { x: number; y: number };
  startExplosionSequence: (chainDepth?: number) => void;
}> = [];

// Contador de cadeia para UI especial
let currentChainCount = 0;
let chainResetTimer: ReturnType<typeof setTimeout> | null = null;

// Cores por profundidade de cadeia (mais quente a cada elo)
const CHAIN_COLORS: [number, number, number][] = [
  [120, 160, 255], // azul (explosão normal)
  [200, 200, 255], // branco-azulado (chain 1)
  [255, 220, 100], // dourado (chain 2)
  [255, 160, 50],  // laranja (chain 3)
  [255, 80, 40],   // vermelho-fogo (chain 4+)
];

function getChainColor(depth: number): [number, number, number] {
  const idx = Math.min(depth, CHAIN_COLORS.length - 1);
  return CHAIN_COLORS[idx];
}

// ===== Efeitos visuais de explosão =====

function spawnExplosionVisuals(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  explosionRadius: number,
  chainDepth: number,
): void {
  const color = getChainColor(chainDepth);
  const isChain = chainDepth > 0;

  // --- Anel de onda de choque (expande rápido) ---
  const shockwave = k.add([
    k.circle(explosionRadius),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(color[0], color[1], color[2]),
    k.outline(3, k.rgb(255, 255, 255)),
    k.opacity(0.5),
    k.scale(0.05),
    k.z(900),
    { id: "mine-shockwave", t: 0 },
  ]) as GameObj & { t: number };
  shockwave.onUpdate(() => {
    shockwave.t += k.dt();
    const p = Math.min(shockwave.t / 0.25, 1);
    const ease = 1 - Math.pow(1 - p, 3); // ease out cubic
    shockwave.scale = k.vec2(0.05 + ease * 1.1);
    shockwave.opacity = 0.5 * (1 - p);
    if (shockwave.t >= 0.25) shockwave.destroy();
  });

  // --- Círculo de flash central (branco intenso → cor) ---
  const flashSize = isChain ? explosionRadius * 0.6 : explosionRadius * 0.45;
  const flash = k.add([
    k.circle(flashSize),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.opacity(0.9),
    k.scale(0.1),
    k.z(902),
    { id: "mine-flash", t: 0 },
  ]) as GameObj & { t: number };
  flash.onUpdate(() => {
    flash.t += k.dt();
    const p = Math.min(flash.t / 0.15, 1);
    flash.scale = k.vec2(0.1 + p * 1.2);
    if (p < 0.5) {
      flash.color = k.rgb(255, 255, 255);
      flash.opacity = 0.9;
    } else {
      const fade = (p - 0.5) / 0.5;
      flash.color = k.rgb(
        255 - fade * (255 - color[0]),
        255 - fade * (255 - color[1]),
        255 - fade * (255 - color[2]),
      );
      flash.opacity = 0.9 * (1 - fade);
    }
    if (flash.t >= 0.15) flash.destroy();
  });

  // --- Segundo anel (mais lento, com glow) ---
  const ring2 = k.add([
    k.circle(explosionRadius * 0.8),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(color[0], color[1], color[2]),
    k.outline(2, k.rgb(color[0], color[1], color[2])),
    k.opacity(0.3),
    k.scale(0.15),
    k.z(899),
    { id: "mine-ring2", t: 0 },
  ]) as GameObj & { t: number };
  ring2.onUpdate(() => {
    ring2.t += k.dt();
    const p = Math.min(ring2.t / 0.4, 1);
    const ease = 1 - Math.pow(1 - p, 2);
    ring2.scale = k.vec2(0.15 + ease * 1.0);
    ring2.opacity = 0.3 * (1 - p * p);
    if (ring2.t >= 0.4) ring2.destroy();
  });

  // --- Partículas/sparks voando pra fora ---
  const sparkCount = isChain ? 14 : 10;
  for (let i = 0; i < sparkCount; i++) {
    const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.3;
    const speed = 80 + Math.random() * 160;
    const sparkSize = 2 + Math.random() * 3;
    const life = 0.3 + Math.random() * 0.4;
    const sparkColor = isChain
      ? [
          color[0] + Math.random() * 40,
          color[1] + Math.random() * 30,
          Math.min(255, color[2] + Math.random() * 60),
        ]
      : [
          160 + Math.random() * 95,
          160 + Math.random() * 95,
          200 + Math.random() * 55,
        ];

    const spark = k.add([
      k.circle(sparkSize),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(sparkColor[0], sparkColor[1], sparkColor[2]),
      k.opacity(0.8),
      k.z(901),
      { id: "mine-spark", t: 0, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life },
    ]) as GameObj & { t: number; vx: number; vy: number; life: number };
    spark.onUpdate(() => {
      spark.t += k.dt();
      spark.pos.x += spark.vx * k.dt();
      spark.pos.y += spark.vy * k.dt();
      // Desaceleração
      spark.vx *= 0.96;
      spark.vy *= 0.96;
      const p = spark.t / spark.life;
      spark.opacity = 0.8 * (1 - p);
      spark.scale = k.vec2(1 - p * 0.5);
      if (spark.t >= spark.life) spark.destroy();
    });
  }

  // --- Glow residual (fica um momento no chão) ---
  const residue = k.add([
    k.circle(explosionRadius * 0.5),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(color[0], color[1], color[2]),
    k.opacity(0.15),
    k.z(94),
    { id: "mine-residue", t: 0 },
  ]) as GameObj & { t: number };
  residue.onUpdate(() => {
    residue.t += k.dt();
    const p = Math.min(residue.t / 0.8, 1);
    residue.opacity = 0.15 * (1 - p);
    residue.scale = k.vec2(1 + p * 0.3);
    if (residue.t >= 0.8) residue.destroy();
  });
}

// ===== Linha de conexão de cadeia =====

function spawnChainConnector(
  k: KAPLAYCtx,
  from: { x: number; y: number },
  to: { x: number; y: number },
  chainDepth: number,
): void {
  const color = getChainColor(chainDepth);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2;

  // Linha principal
  const line = k.add([
    k.rect(dist, 3),
    k.pos(cx, cy),
    k.anchor("center"),
    k.rotate(k.rad2deg(angle)),
    k.color(color[0], color[1], color[2]),
    k.outline(1, k.rgb(255, 255, 255)),
    k.opacity(0.8),
    k.z(910),
    { id: "chain-line", t: 0 },
  ]) as GameObj & { t: number };
  line.onUpdate(() => {
    line.t += k.dt();
    const p = Math.min(line.t / 0.4, 1);
    // Shake elétrico
    const shake = (1 - p) * 3;
    const perpX = -Math.sin(angle) * (Math.random() - 0.5) * 2 * shake;
    const perpY = Math.cos(angle) * (Math.random() - 0.5) * 2 * shake;
    line.pos.x = cx + perpX;
    line.pos.y = cy + perpY;
    line.opacity = 0.8 * (1 - p);
    if (line.t >= 0.4) line.destroy();
  });

  // Glow atrás da linha
  const lineGlow = k.add([
    k.rect(dist, 8),
    k.pos(cx, cy),
    k.anchor("center"),
    k.rotate(k.rad2deg(angle)),
    k.color(color[0], color[1], color[2]),
    k.opacity(0.2),
    k.z(909),
    { id: "chain-glow", t: 0 },
  ]) as GameObj & { t: number };
  lineGlow.onUpdate(() => {
    lineGlow.t += k.dt();
    lineGlow.opacity = 0.2 * (1 - Math.min(lineGlow.t / 0.35, 1));
    if (lineGlow.t >= 0.35) lineGlow.destroy();
  });

  // Faísca viajando ao longo da linha
  const travelSpark = k.add([
    k.circle(4),
    k.pos(from.x, from.y),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.opacity(0.9),
    k.z(911),
    { id: "chain-spark", t: 0 },
  ]) as GameObj & { t: number };
  travelSpark.onUpdate(() => {
    travelSpark.t += k.dt();
    const p = Math.min(travelSpark.t / 0.12, 1);
    travelSpark.pos.x = from.x + dx * p;
    travelSpark.pos.y = from.y + dy * p;
    travelSpark.opacity = 0.9 * (1 - p * 0.5);
    travelSpark.scale = k.vec2(1 + p * 1.5);
    if (travelSpark.t >= 0.12) travelSpark.destroy();
  });
}

// ===== Label flutuante de cadeia =====

function spawnChainLabel(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  chainCount: number,
): void {
  const color = getChainColor(Math.min(chainCount, CHAIN_COLORS.length - 1));
  const label = k.add([
    k.text(`⚡ CHAIN x${chainCount}!`, { size: chainCount >= 3 ? 18 : 15 }),
    k.pos(pos.x, pos.y - 30),
    k.anchor("center"),
    k.color(color[0], color[1], color[2]),
    k.outline(2, k.rgb(0, 0, 0)),
    k.opacity(1),
    k.z(950),
    { id: "chain-label", t: 0 },
  ]) as GameObj & { t: number };
  // Começa grande e fica normal
  label.scale = k.vec2(1.8);
  label.onUpdate(() => {
    label.t += k.dt();
    label.pos.y -= 35 * k.dt();
    const p = Math.min(label.t / 1.2, 1);
    // Scale: punch in then settle
    if (label.t < 0.15) {
      label.scale = k.vec2(1.8 - (label.t / 0.15) * 0.8);
    } else {
      label.scale = k.vec2(1);
    }
    // Fade out no final
    if (p > 0.6) {
      label.opacity = 1 - (p - 0.6) / 0.4;
    }
    if (label.t >= 1.2) label.destroy();
  });
}

// ===== Skill principal =====

registerSkill({
  id: "arc-mine",
  getCooldown: () => MINE_CONFIG.baseCooldown,
  getMaxCharges: (level) => getMaxChargesForLevel(level),
  use: ({ k, player }) => {
    const {
      radius,
      lifetime,
      damage,
      warningDelay,
      explosionDelay,
      shakeIntensity,
      shakeSpeed,
    } = MINE_CONFIG;

    const mineSize = radius / 9;
    const explosionRadius = radius * 1.5;
    const pos = player.pos.clone();

    // ===== Glow pulsante atrás da mina =====
    const glow = k.add([
      k.circle(mineSize + 8),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(100, 100, 255),
      k.opacity(0.12),
      k.z(98),
      { id: "mine-glow", t: 0 },
    ]) as GameObj & { t: number };

    // ===== Anel de alcance (sutil) =====
    const rangeRing = k.add([
      k.circle(radius),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.outline(1, k.rgb(120, 120, 255)),
      k.color(0, 0, 0),
      k.opacity(0),
      k.z(97),
      { id: "mine-range" },
    ]);

    // ===== Mina principal =====
    const mine = k.add([
      k.circle(mineSize),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(120, 120, 255),
      k.outline(2, k.rgb(200, 200, 255)),
      k.z(100),
      { id: "skill-arc-mine", t: 0, state: "idle" as MineState },
    ]) as GameObj & { t: number; state: MineState };

    // ===== Área de trigger (invisível com colisão) =====
    const triggerArea = k.add([
      k.circle(radius),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.opacity(0),
      k.area(),
      { id: "skill-arc-mine-area" },
    ]);

    // Partículas de spawn
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const sp = k.add([
        k.circle(2),
        k.pos(pos.x, pos.y),
        k.anchor("center"),
        k.color(160, 160, 255),
        k.opacity(0.6),
        k.z(101),
        { id: "mine-spawn-p", t: 0, vx: Math.cos(angle) * 40, vy: Math.sin(angle) * 40 },
      ]) as GameObj & { t: number; vx: number; vy: number };
      sp.onUpdate(() => {
        sp.t += k.dt();
        sp.pos.x += sp.vx * k.dt();
        sp.pos.y += sp.vy * k.dt();
        sp.opacity = 0.6 * (1 - sp.t / 0.3);
        if (sp.t >= 0.3) sp.destroy();
      });
    }

    let mineEntry: (typeof activeMines)[number];

    const triggerExplosion = (chainDepth: number = 0) => {
      const explosionPos = { x: pos.x, y: pos.y };

      // Visuais de explosão (qualidade depende da cadeia)
      spawnExplosionVisuals(k, explosionPos, explosionRadius, chainDepth);

      // Área de dano temporária
      const explosionArea = k.add([
        k.circle(explosionRadius),
        k.pos(explosionPos.x, explosionPos.y),
        k.anchor("center"),
        k.opacity(0),
        k.area(),
        k.z(895),
        { id: "mine-dmg-area", life: 0.15 },
      ]) as GameObj & { life: number };

      explosionArea.onUpdate(() => {
        explosionArea.life -= k.dt();
        if (explosionArea.life <= 0) explosionArea.destroy();
      });

      explosionArea.onCollide("enemy", (enemy: any) => {
        if (typeof enemy.hp === "number") {
          enemy.hp -= damage;
          if (enemy.hp <= 0) enemy.destroy();
        }
      });

      // Chain tracking
      if (chainDepth > 0) {
        currentChainCount++;
        spawnChainLabel(k, explosionPos, currentChainCount);

        // Reseta contador depois de um tempo sem cadeia
        if (chainResetTimer) clearTimeout(chainResetTimer);
        chainResetTimer = setTimeout(() => {
          currentChainCount = 0;
          chainResetTimer = null;
        }, 800);
      } else {
        // Primeira explosão de uma cadeia potencial
        currentChainCount = 0;
      }

      // Encadear explosões de outras minas próximas
      for (const other of activeMines) {
        if (other.mine === mine) continue;
        if (other.mine.state === "exploding" || !other.mine.exists()) continue;

        const dist = Math.hypot(
          other.pos.x - explosionPos.x,
          other.pos.y - explosionPos.y,
        );

        if (dist <= explosionRadius) {
          // Linha conectora visual
          spawnChainConnector(k, explosionPos, other.pos, chainDepth + 1);
          // Encadeia com profundidade incrementada
          other.startExplosionSequence(chainDepth + 1);
        }
      }

      // Remover esta mina
      const idx = activeMines.indexOf(mineEntry);
      if (idx !== -1) activeMines.splice(idx, 1);

      mine.destroy();
      glow.destroy();
      rangeRing.destroy();
      triggerArea.destroy();
    };

    const startExplosionSequence = (chainDepth: number = 0) => {
      if (mine.state !== "idle") return;

      // Fase 1: Warning (amarelo)
      mine.state = "warning";
      mine.color = k.rgb(255, 220, 0);
      mine.outline.color = k.rgb(255, 255, 150);
      glow.color = k.rgb(255, 200, 0);
      glow.opacity = 0.25;
      rangeRing.outline.color = k.rgb(255, 220, 0);
      rangeRing.opacity = 0.12;

      setTimeout(() => {
        if (!mine.exists()) return;

        // Fase 2: Danger (vermelho)
        mine.state = "danger";
        mine.color = k.rgb(255, 30, 0);
        mine.outline.color = k.rgb(255, 120, 80);
        glow.color = k.rgb(255, 40, 0);
        glow.opacity = 0.35;
        rangeRing.outline.color = k.rgb(255, 60, 30);
        rangeRing.opacity = 0.18;

        setTimeout(() => {
          if (!mine.exists()) return;

          // Fase 3: Explosão
          mine.state = "exploding";
          triggerExplosion(chainDepth);
        }, explosionDelay);
      }, warningDelay);
    };

    triggerArea.onCollide("enemy", () => {
      startExplosionSequence(0);
    });

    // Registrar no array global
    mineEntry = {
      mine,
      triggerArea,
      glow,
      rangeRing,
      pos: { x: pos.x, y: pos.y },
      startExplosionSequence,
    };
    activeMines.push(mineEntry);

    // ===== Update loop =====
    mine.onUpdate(() => {
      mine.t += k.dt();

      if (mine.state === "idle") {
        // Pulso suave do glow
        glow.t += k.dt();
        const pulse = 0.10 + Math.sin(glow.t * 2.5) * 0.05;
        glow.opacity = pulse;
        const glowScale = 1 + Math.sin(glow.t * 2) * 0.1;
        glow.scale = k.vec2(glowScale);

        // Pulso suave da mina
        const minePulse = 1 + Math.sin(glow.t * 3) * 0.04;
        mine.scale = k.vec2(minePulse);

        // Anel de range muito sutil
        rangeRing.opacity = 0.04 + Math.sin(glow.t * 1.5) * 0.02;
      }

      // Shake em warning/danger
      if (mine.state === "warning" || mine.state === "danger") {
        const intensity = mine.state === "danger" ? shakeIntensity * 1.8 : shakeIntensity;
        const spd = mine.state === "danger" ? shakeSpeed * 1.5 : shakeSpeed;
        const shakeX = Math.sin(k.time() * spd) * intensity;
        const shakeY = Math.cos(k.time() * spd * 1.3) * intensity;
        mine.pos = k.vec2(pos.x + shakeX, pos.y + shakeY);
        glow.pos = k.vec2(pos.x + shakeX, pos.y + shakeY);

        // Glow pulsa mais rápido em danger
        if (mine.state === "danger") {
          const dPulse = 0.3 + Math.sin(k.time() * 15) * 0.15;
          glow.opacity = dPulse;
          const gs = 1 + Math.sin(k.time() * 12) * 0.15;
          glow.scale = k.vec2(gs);
        }
      }

      // Expiração
      if (mine.t >= lifetime) {
        const idx = activeMines.indexOf(mineEntry);
        if (idx !== -1) activeMines.splice(idx, 1);

        // Fade out suave antes de destruir
        mine.destroy();
        glow.destroy();
        rangeRing.destroy();
        triggerArea.destroy();
      }
    });
  },
});
