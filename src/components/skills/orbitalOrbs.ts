import type { GameObj, KAPLAYCtx } from "kaplay";
import { registerSkill } from "./registry";
import { gameState } from "../../state/gameState";

const ORB_CONFIG = {
  baseOrbCount: 2, // orbes iniciais
  orbsPerLevel: 1, // +1 orbe por level (a partir do 2)
  maxOrbs: 6, // máximo de orbes
  orbRadius: 9, // tamanho visual do orbe
  orbitDistance: 85, // distância do centro do player
  baseSpeed: 2.0, // velocidade de rotação base (rad/s)
  speedPerLevel: 0.05, // +5% velocidade passiva por nível
  boostMultiplierPerStack: 1.8, // multiplicador de velocidade POR STACK
  boostDuration: 3.0, // duração do boost (segundos) — reseta ao empilhar
  maxStacks: 10, // máximo de stacks de boost (infinito com CDR)
  baseDamage: 1, // dano base por colisão
  damagePerLevel: 0.5, // +0.5 dano por level
  hitCooldown: 0.5, // cooldown de dano por inimigo (segundos)
  trailCount: 3, // quantas sombras de trail por orbe
  trailFadeFactor: 0.25, // fator de opacidade do trail
  glowRadius: 16, // tamanho do glow atrás do orbe
  chargesAtLevel: 4, // nível em que ganha cargas (2 cargas)
  extraChargeAtLevel: 5, // nível em que ganha carga extra (3 cargas)
} as const;

function getOrbCount(level: number): number {
  const count = ORB_CONFIG.baseOrbCount + (level - 1) * ORB_CONFIG.orbsPerLevel;
  return Math.min(count, ORB_CONFIG.maxOrbs);
}

function getOrbDamage(level: number): number {
  return ORB_CONFIG.baseDamage + (level - 1) * ORB_CONFIG.damagePerLevel;
}

function getBaseSpeed(level: number): number {
  return ORB_CONFIG.baseSpeed * (1 + (level - 1) * ORB_CONFIG.speedPerLevel);
}

// Cores dos orbes — cada orbe tem uma cor diferente para visual bonito
const ORB_COLORS: [number, number, number][] = [
  [100, 180, 255], // azul claro
  [160, 120, 255], // roxo
  [80, 220, 220], // ciano
  [255, 160, 220], // rosa
  [120, 255, 180], // verde menta
  [255, 200, 100], // dourado
];

const ORB_GLOW_COLORS: [number, number, number][] = [
  [60, 120, 255],
  [120, 70, 255],
  [40, 180, 200],
  [255, 100, 180],
  [60, 220, 140],
  [255, 160, 50],
];

type OrbData = GameObj & {
  orbAngle: number;
  orbSpeed: number;
  baseSpeed: number;
  orbIndex: number;
  pulseT: number;
};

// Estado global dos orbes (para persistir entre ativações)
let orbsSpawned = false;
let orbs: OrbData[] = [];
let orbGlows: GameObj[] = [];
let orbTrails: GameObj[][] = [];
let probes: GameObj[] = [];
let boostStacks = 0; // quantos stacks de boost ativos
let boostTimer: number | null = null; // referência ao timer de expiração

function getPlayerCenter(
  k: KAPLAYCtx,
  player: GameObj,
): { x: number; y: number } {
  const size = player.getSize ? player.getSize() : { width: 60, height: 60 };
  return {
    x: player.pos.x + size.width / 2,
    y: player.pos.y + size.height / 2,
  };
}

function cleanupOrbs() {
  for (const orb of orbs) {
    if (orb.exists()) orb.destroy();
  }
  for (const glow of orbGlows) {
    if (glow.exists()) glow.destroy();
  }
  for (const trailGroup of orbTrails) {
    for (const t of trailGroup) {
      if (t.exists()) t.destroy();
    }
  }
  for (const probe of probes) {
    if (probe.exists()) probe.destroy();
  }
  orbs = [];
  orbGlows = [];
  orbTrails = [];
  probes = [];
  orbsSpawned = false;
}

function spawnOrbs(k: KAPLAYCtx, player: GameObj) {
  const level = gameState.skills.levels["orbital-orbs"] ?? 1;
  const count = getOrbCount(level);

  // Limpa orbes antigos se mudou de quantidade
  if (orbsSpawned && orbs.length !== count) {
    cleanupOrbs();
  }

  if (orbsSpawned) return;

  const {
    orbRadius,
    orbitDistance,
    hitCooldown,
    trailCount,
    glowRadius,
    trailFadeFactor,
  } = ORB_CONFIG;
  const baseSpeed = getBaseSpeed(level);

  for (let i = 0; i < count; i++) {
    // Distribui uniformemente no círculo
    const startAngle = (Math.PI * 2 * i) / count;
    const color = ORB_COLORS[i % ORB_COLORS.length];
    const glowColor = ORB_GLOW_COLORS[i % ORB_GLOW_COLORS.length];

    // ===== Glow (halo atrás do orbe) =====
    const glow = k.add([
      k.circle(glowRadius),
      k.pos(player.pos.x, player.pos.y),
      k.anchor("center"),
      k.color(glowColor[0], glowColor[1], glowColor[2]),
      k.opacity(0.18),
      k.z(498),
      { id: "orbital-glow" },
    ]);
    orbGlows.push(glow);

    // ===== Trail (sombras que seguem) =====
    const trails: GameObj[] = [];
    for (let t = 0; t < trailCount; t++) {
      const trailOpacity = trailFadeFactor * (1 - t / trailCount);
      const trailSize = orbRadius * (1 - t * 0.15);
      const trail = k.add([
        k.circle(trailSize),
        k.pos(player.pos.x, player.pos.y),
        k.anchor("center"),
        k.color(color[0], color[1], color[2]),
        k.opacity(trailOpacity),
        k.z(499),
        {
          id: "orbital-trail",
          trailAngle: startAngle, // será atualizado com delay
        },
      ]) as GameObj & { trailAngle: number };
      trails.push(trail);
    }
    orbTrails.push(trails);

    // ===== Orbe principal =====
    const orb = k.add([
      k.circle(orbRadius),
      k.pos(player.pos.x, player.pos.y),
      k.anchor("center"),
      k.color(color[0], color[1], color[2]),
      k.outline(2, k.rgb(255, 255, 255)),
      k.z(500),
      {
        id: "orbital-orb",
        orbAngle: startAngle,
        orbSpeed: baseSpeed,
        baseSpeed: baseSpeed,
        orbIndex: i,
        pulseT: i * 1.5, // offset para cada orbe pulsar diferente
      },
    ]) as OrbData;

    // Update: orbitar ao redor do centro do player
    orb.onUpdate(() => {
      const dt = k.dt();
      orb.orbAngle += orb.orbSpeed * dt;
      orb.pulseT += dt;
      const center = getPlayerCenter(k, player);

      // Pulso sutil no raio de órbita
      const pulseMag = 3;
      const pulse = Math.sin(orb.pulseT * 3) * pulseMag;
      const dist = orbitDistance + pulse;

      const ox = Math.cos(orb.orbAngle) * dist;
      const oy = Math.sin(orb.orbAngle) * dist;
      orb.pos.x = center.x + ox;
      orb.pos.y = center.y + oy;

      // Pulso de tamanho (orbe "respira")
      const scalePulse = 1 + Math.sin(orb.pulseT * 4) * 0.08;
      orb.scale = k.vec2(scalePulse);

      // Glow segue o orbe
      const g = orbGlows[orb.orbIndex];
      if (g && g.exists()) {
        g.pos.x = orb.pos.x;
        g.pos.y = orb.pos.y;
        // Glow pulsa junto (mais suave)
        const glowPulse = 0.15 + Math.sin(orb.pulseT * 2.5) * 0.06;
        g.opacity = boostStacks > 0 ? glowPulse + 0.1 * boostStacks : glowPulse;
        const glowScale = 1 + Math.sin(orb.pulseT * 2) * 0.15;
        g.scale = k.vec2(glowScale);
      }

      // Trails seguem com delay angular
      const trailGroup = orbTrails[orb.orbIndex];
      if (trailGroup) {
        for (let t = 0; t < trailGroup.length; t++) {
          const trail = trailGroup[t] as GameObj & { trailAngle: number };
          if (!trail.exists()) continue;
          // Trail fica atrasado em ângulo proporcional
          const angleDelay = (t + 1) * 0.12 * (orb.orbSpeed / baseSpeed);
          const tAngle = orb.orbAngle - angleDelay;
          const tDist =
            orbitDistance + Math.sin(orb.pulseT * 3 - (t + 1) * 0.3) * pulseMag;
          trail.pos.x = center.x + Math.cos(tAngle) * tDist;
          trail.pos.y = center.y + Math.sin(tAngle) * tDist;
        }
      }
    });

    // Probe de colisão invisível (orbe visual é circle, precisa de area)
    const probe = k.add([
      k.circle(orbRadius + 4),
      k.pos(orb.pos.x, orb.pos.y),
      k.anchor("center"),
      k.opacity(0),
      k.area(),
      k.z(501),
      {
        id: "orbital-probe",
        hitTimers: new Map<GameObj, number>(),
      },
    ]) as GameObj & { hitTimers: Map<GameObj, number> };

    probe.onUpdate(() => {
      probe.pos.x = orb.pos.x;
      probe.pos.y = orb.pos.y;
    });

    probe.onCollide("enemy", (enemy: any) => {
      // Cooldown por inimigo para não dar dano todo frame
      const now = Date.now();
      const lastHit = probe.hitTimers.get(enemy) ?? 0;
      if (now - lastHit < hitCooldown * 1000) return;
      probe.hitTimers.set(enemy, now);

      if (typeof enemy.hp === "number") {
        // Flash de impacto no inimigo
        const flashColor = ORB_COLORS[orb.orbIndex % ORB_COLORS.length];
        const flash = k.add([
          k.circle(14),
          k.pos(enemy.pos.x, enemy.pos.y),
          k.anchor("center"),
          k.color(flashColor[0], flashColor[1], flashColor[2]),
          k.opacity(0.7),
          k.z(600),
          { id: "orb-hit-flash", t: 0 },
        ]) as GameObj & { t: number };
        flash.onUpdate(() => {
          flash.t += k.dt();
          flash.opacity = 0.7 * (1 - flash.t / 0.2);
          flash.scale = k.vec2(1 + flash.t * 4);
          if (flash.t >= 0.2) flash.destroy();
        });

        const dmg = getOrbDamage(gameState.skills.levels["orbital-orbs"] ?? 1);
        enemy.hp -= dmg;
        if (enemy.hp <= 0) enemy.destroy();
      }
    });

    orbs.push(orb);
    probes.push(probe);
  }

  orbsSpawned = true;
}

// Cores por stack de boost (mais stacks = mais quente/brilhante)
const STACK_COLORS: {
  orb: [number, number, number];
  glow: [number, number, number];
  trail: [number, number, number];
  outline: [number, number, number];
}[] = [
  {
    orb: [255, 230, 130],
    glow: [255, 200, 60],
    trail: [255, 220, 100],
    outline: [255, 255, 200],
  }, // stack 1: dourado
  {
    orb: [255, 200, 100],
    glow: [255, 170, 50],
    trail: [255, 190, 80],
    outline: [255, 240, 170],
  }, // stack 2: dourado quente
  {
    orb: [255, 180, 80],
    glow: [255, 140, 30],
    trail: [255, 160, 60],
    outline: [255, 220, 150],
  }, // stack 3: laranja
  {
    orb: [255, 150, 60],
    glow: [255, 110, 25],
    trail: [255, 130, 50],
    outline: [255, 200, 130],
  }, // stack 4: laranja forte
  {
    orb: [255, 120, 50],
    glow: [255, 90, 20],
    trail: [255, 110, 40],
    outline: [255, 180, 120],
  }, // stack 5: vermelho-laranja
  {
    orb: [255, 100, 50],
    glow: [255, 70, 20],
    trail: [255, 90, 40],
    outline: [255, 160, 110],
  }, // stack 6: vermelho
  {
    orb: [255, 80, 60],
    glow: [255, 50, 30],
    trail: [255, 70, 50],
    outline: [255, 140, 100],
  }, // stack 7: vermelho intenso
  {
    orb: [255, 60, 80],
    glow: [255, 30, 50],
    trail: [255, 50, 70],
    outline: [255, 120, 120],
  }, // stack 8: carmesim
  {
    orb: [255, 40, 120],
    glow: [255, 20, 80],
    trail: [255, 30, 100],
    outline: [255, 100, 160],
  }, // stack 9: magenta
  {
    orb: [255, 255, 255],
    glow: [255, 220, 255],
    trail: [255, 240, 255],
    outline: [255, 255, 255],
  }, // stack 10: branco puro (overdrive)
];

function getMaxCharges(level: number): number {
  if (level >= ORB_CONFIG.extraChargeAtLevel) return 3;
  if (level >= ORB_CONFIG.chargesAtLevel) return 2;
  return 1;
}

function applyBoostVisuals(k: KAPLAYCtx) {
  if (boostStacks <= 0) return;
  const stackIdx = Math.min(boostStacks, STACK_COLORS.length) - 1;
  const sc = STACK_COLORS[stackIdx];

  for (const orb of orbs) {
    if (!orb.exists()) continue;
    orb.color = k.rgb(sc.orb[0], sc.orb[1], sc.orb[2]);
    orb.outline.color = k.rgb(sc.outline[0], sc.outline[1], sc.outline[2]);
  }
  for (const glow of orbGlows) {
    if (glow.exists()) glow.color = k.rgb(sc.glow[0], sc.glow[1], sc.glow[2]);
  }
  for (const trailGroup of orbTrails) {
    for (const t of trailGroup) {
      if (t.exists()) t.color = k.rgb(sc.trail[0], sc.trail[1], sc.trail[2]);
    }
  }
}

function removeBoostVisuals(k: KAPLAYCtx) {
  for (let i = 0; i < orbs.length; i++) {
    const orb = orbs[i];
    if (!orb.exists()) continue;
    const color = ORB_COLORS[i % ORB_COLORS.length];
    const glowColor = ORB_GLOW_COLORS[i % ORB_GLOW_COLORS.length];
    orb.color = k.rgb(color[0], color[1], color[2]);
    orb.outline.color = k.rgb(255, 255, 255);

    const g = orbGlows[i];
    if (g && g.exists())
      g.color = k.rgb(glowColor[0], glowColor[1], glowColor[2]);

    const trailGroup = orbTrails[i];
    if (trailGroup) {
      for (const t of trailGroup) {
        if (t.exists()) t.color = k.rgb(color[0], color[1], color[2]);
      }
    }
  }
}

function updateOrbSpeeds() {
  const level = gameState.skills.levels["orbital-orbs"] ?? 1;
  const base = getBaseSpeed(level);
  const speed =
    boostStacks > 0
      ? base * Math.pow(ORB_CONFIG.boostMultiplierPerStack, boostStacks)
      : base;
  for (const orb of orbs) {
    if (orb.exists()) {
      orb.orbSpeed = speed;
      orb.baseSpeed = base;
    }
  }
}

// Timer de expiração do boost (com tracking para cancelar ao re-empilhar)
let boostExpireCancel: (() => void) | null = null;

function scheduleBoostExpiry(k: KAPLAYCtx) {
  // Cancela timer anterior se existir
  if (boostExpireCancel) boostExpireCancel();

  let cancelled = false;
  boostExpireCancel = () => {
    cancelled = true;
  };

  k.wait(ORB_CONFIG.boostDuration, () => {
    if (cancelled) return;

    // Remove um stack
    boostStacks = Math.max(0, boostStacks - 1);
    updateOrbSpeeds();

    if (boostStacks > 0) {
      // Ainda tem stacks, atualiza visual e agenda próxima expiração
      applyBoostVisuals(k);
      scheduleBoostExpiry(k);
    } else {
      // Sem stacks, restaura visual normal
      removeBoostVisuals(k);
      boostExpireCancel = null;
    }
  });
}

registerSkill({
  id: "orbital-orbs",
  getCooldown: () => 4000,
  getMaxCharges: (level: number) => getMaxCharges(level),
  use: ({ k, player }) => {
    // Garante que os orbes existem
    spawnOrbs(k, player);

    // Adiciona stack (até o máximo)
    if (boostStacks >= ORB_CONFIG.maxStacks) return;
    boostStacks++;

    // Atualiza velocidade com base nos stacks acumulados
    updateOrbSpeeds();

    // Atualiza visual dos orbes com base no stack atual
    applyBoostVisuals(k);

    // Anel visual de ativação expandindo do player
    const center = getPlayerCenter(k, player);
    const stackIdx = Math.min(boostStacks, STACK_COLORS.length) - 1;
    const sc = STACK_COLORS[stackIdx];
    const activationRing = k.add([
      k.circle(ORB_CONFIG.orbitDistance),
      k.pos(center.x, center.y),
      k.anchor("center"),
      k.color(sc.orb[0], sc.orb[1], sc.orb[2]),
      k.outline(3, k.rgb(sc.outline[0], sc.outline[1], sc.outline[2])),
      k.opacity(0.4),
      k.z(497),
      { id: "orb-activation-ring", t: 0 },
    ]) as GameObj & { t: number };
    activationRing.scale = k.vec2(0.3);
    activationRing.onUpdate(() => {
      activationRing.t += k.dt();
      const p = Math.min(activationRing.t / 0.35, 1);
      activationRing.scale = k.vec2(0.3 + p * 0.8);
      activationRing.opacity = 0.4 * (1 - p);
      if (activationRing.t >= 0.35) activationRing.destroy();
    });

    // Indicador de stacks (número flutuante acima do player)
    if (boostStacks > 1) {
      const stackLabel = k.add([
        k.text(`x${boostStacks}`, { size: 20 }),
        k.pos(center.x, center.y - 50),
        k.anchor("center"),
        k.color(sc.orb[0], sc.orb[1], sc.orb[2]),
        k.outline(2, k.rgb(0, 0, 0)),
        k.z(700),
        { id: "stack-label", t: 0 },
      ]) as GameObj & { t: number };
      stackLabel.onUpdate(() => {
        stackLabel.t += k.dt();
        stackLabel.pos.y -= 30 * k.dt();
        stackLabel.opacity = 1 - stackLabel.t / 0.8;
        if (stackLabel.t >= 0.8) stackLabel.destroy();
      });
    }

    // Reseta timer de expiração (duração reseta ao empilhar)
    scheduleBoostExpiry(k);
  },
});

// Exporta spawnOrbs para ser chamado quando a skill é equipada
export { spawnOrbs, cleanupOrbs };
