/**
 * Sistema de choque desacoplado — pode ser usado por qualquer skill.
 *
 * Acúmulos de choque não fazem nada até atingir o limiar (6 stacks).
 * Ao atingir 6 stacks:
 *   - Causa 3 de dano
 *   - Eletrocuta o inimigo (shake visual por 1s + 0.1s por stack acima de 6)
 *   - Reseta stacks para 0
 * Receber stacks durante eletrocução aumenta o tempo.
 *
 * Uso: addShockStacks(k, enemy, amount)
 */
import type { GameObj, KAPLAYCtx } from "kaplay";

const SHOCK_CONFIG = {
  stacksToTrigger: 6, // stacks necessários para eletrocutar
  triggerDamage: 3, // dano ao eletrocutar
  baseStunDuration: 1.0, // duração base do stun (segundos)
  extraStunPerStack: 0.1, // +0.1s por stack acima do limiar
  shakeIntensity: 3, // intensidade do shake visual
  shakeSpeed: 40, // velocidade do shake
  maxVisualArcs: 6, // máximo de arcos visuais
  arcInterval: 0.15, // intervalo entre arcos durante stun
} as const;

// Rastreia inimigos que já têm o sistema de choque ativo
const shockedEnemies = new WeakSet<GameObj>();

// ===== Callbacks de eletrocução (passiva) =====
type ElectrocutionCallback = (enemy: GameObj) => void;
const electrocutionCallbacks: ElectrocutionCallback[] = [];

/**
 * Registra um callback que é chamado sempre que um inimigo é eletrocutado.
 * Útil para passivas como redução de cooldown.
 */
export function onElectrocution(
  _k: KAPLAYCtx,
  cb: ElectrocutionCallback,
): void {
  electrocutionCallbacks.push(cb);
}

/**
 * Adiciona stacks de choque a um inimigo.
 * Se o inimigo ainda não tem o sistema, inicializa.
 */
export function addShockStacks(
  k: KAPLAYCtx,
  enemy: GameObj,
  stacks: number = 1,
): void {
  const e = enemy as any;
  if (typeof e.shockStacks !== "number") {
    e.shockStacks = 0;
    e.shockStunTimer = 0;
    e.shockStunDuration = 0;
    e.isElectrocuted = false;
  }

  e.shockStacks += stacks;

  // Flash elétrico ao receber stack
  spawnShockFlash(k, enemy);

  // Se está eletrocutado, aumenta o tempo
  if (e.isElectrocuted) {
    e.shockStunDuration += stacks * SHOCK_CONFIG.extraStunPerStack;
    return;
  }

  // Verifica se atingiu o limiar
  if (e.shockStacks >= SHOCK_CONFIG.stacksToTrigger) {
    triggerElectrocution(k, enemy);
  }

  // Inicializa sistema se não existir
  if (!shockedEnemies.has(enemy)) {
    shockedEnemies.add(enemy);
    initShockSystem(k, enemy);
  }
}

/**
 * Retorna os stacks de choque atuais de um inimigo.
 */
export function getShockStacks(enemy: GameObj): number {
  return (enemy as any).shockStacks ?? 0;
}

/**
 * Dispara eletrocução no inimigo.
 */
function triggerElectrocution(k: KAPLAYCtx, enemy: GameObj): void {
  const e = enemy as any;
  const extraStacks = Math.max(0, e.shockStacks - SHOCK_CONFIG.stacksToTrigger);
  const stunDuration =
    SHOCK_CONFIG.baseStunDuration +
    extraStacks * SHOCK_CONFIG.extraStunPerStack;

  // Aplica dano
  if (typeof e.hp === "number") {
    e.hp -= SHOCK_CONFIG.triggerDamage;
    spawnShockDamageNumber(k, enemy, SHOCK_CONFIG.triggerDamage);
    if (e.hp <= 0) {
      enemy.destroy();
      return;
    }
  }

  // Ativa stun
  e.isElectrocuted = true;
  e.shockStunTimer = 0;
  e.shockStunDuration = stunDuration;
  e.shockStacks = 0;

  // Salva posição e velocidade original
  if (typeof e.defaultSpeed === "undefined") {
    e.defaultSpeed = e.speed ?? 100;
  }
  e._preShockSpeed = e.speed;
  e.speed = 0; // Para o inimigo

  // Efeito visual de explosão elétrica
  spawnElectrocutionBurst(k, enemy);

  // Notifica callbacks de eletrocução (passivas)
  for (const cb of electrocutionCallbacks) {
    cb(enemy);
  }
}

// ===== Visuais =====

function spawnShockFlash(k: KAPLAYCtx, enemy: GameObj): void {
  const eSize = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };
  const cx = enemy.pos.x + eSize.width / 2;
  const cy = enemy.pos.y + eSize.height / 2;

  const flash = k.add([
    k.circle(10),
    k.pos(cx, cy),
    k.anchor("center"),
    k.color(255, 255, 100),
    k.opacity(0.7),
    k.z(600),
    { id: "shock-flash", t: 0 },
  ]) as GameObj & { t: number };
  flash.onUpdate(() => {
    flash.t += k.dt();
    flash.opacity = 0.7 * (1 - flash.t / 0.2);
    flash.scale = k.vec2(1 + flash.t * 4);
    if (flash.t >= 0.2) flash.destroy();
  });
}

function spawnElectrocutionBurst(k: KAPLAYCtx, enemy: GameObj): void {
  const eSize = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };
  const cx = enemy.pos.x + eSize.width / 2;
  const cy = enemy.pos.y + eSize.height / 2;

  // Anel elétrico expandindo
  const ring = k.add([
    k.circle(30),
    k.pos(cx, cy),
    k.anchor("center"),
    k.color(255, 255, 180),
    k.outline(2, k.rgb(255, 255, 100)),
    k.opacity(0.6),
    k.scale(0.2),
    k.z(800),
    { id: "shock-burst-ring", t: 0 },
  ]) as GameObj & { t: number };
  ring.onUpdate(() => {
    ring.t += k.dt();
    const p = Math.min(ring.t / 0.3, 1);
    ring.scale = k.vec2(0.2 + p * 1.5);
    ring.opacity = 0.6 * (1 - p);
    if (ring.t >= 0.3) ring.destroy();
  });

  // Faíscas saindo do inimigo
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.4;
    const speed = 60 + Math.random() * 100;
    const spark = k.add([
      k.rect(4 + Math.random() * 4, 2),
      k.pos(cx, cy),
      k.anchor("center"),
      k.rotate(k.rad2deg(angle)),
      k.color(255, 255, 140 + Math.random() * 115),
      k.opacity(0.8),
      k.z(801),
      {
        id: "shock-spark",
        t: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      },
    ]) as GameObj & { t: number; vx: number; vy: number };
    spark.onUpdate(() => {
      spark.t += k.dt();
      spark.pos.x += spark.vx * k.dt();
      spark.pos.y += spark.vy * k.dt();
      spark.opacity = 0.8 * (1 - spark.t / 0.25);
      if (spark.t >= 0.25) spark.destroy();
    });
  }

  // Label "⚡ SHOCK!"
  const label = k.add([
    k.text("⚡ SHOCK!", { size: 14 }),
    k.pos(cx, cy - 25),
    k.anchor("center"),
    k.color(255, 255, 100),
    k.outline(2, k.rgb(80, 60, 0)),
    k.opacity(1),
    k.z(850),
    { id: "shock-label", t: 0 },
  ]) as GameObj & { t: number };
  label.scale = k.vec2(1.4);
  label.onUpdate(() => {
    label.t += k.dt();
    label.pos.y -= 30 * k.dt();
    if (label.t < 0.1) {
      label.scale = k.vec2(1.4 - (label.t / 0.1) * 0.4);
    } else {
      label.scale = k.vec2(1);
    }
    if (label.t > 0.5) {
      label.opacity = 1 - (label.t - 0.5) / 0.5;
    }
    if (label.t >= 1.0) label.destroy();
  });
}

/**
 * Arco elétrico visual entre dois pontos no inimigo.
 */
function spawnMiniArc(k: KAPLAYCtx, enemy: GameObj): void {
  const eSize = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };
  const cx = enemy.pos.x + eSize.width / 2;
  const cy = enemy.pos.y + eSize.height / 2;
  const halfW = eSize.width / 2 + 4;
  const halfH = eSize.height / 2 + 4;

  // Dois pontos aleatórios na borda do inimigo
  const a1 = Math.random() * Math.PI * 2;
  const a2 = a1 + Math.PI * (0.5 + Math.random() * 1.0);
  const x1 = cx + Math.cos(a1) * halfW;
  const y1 = cy + Math.sin(a1) * halfH;
  const x2 = cx + Math.cos(a2) * halfW;
  const y2 = cy + Math.sin(a2) * halfH;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const arc = k.add([
    k.rect(dist, 2),
    k.pos(midX, midY),
    k.anchor("center"),
    k.rotate(k.rad2deg(angle)),
    k.color(255, 255, 180 + Math.random() * 75),
    k.outline(1, k.rgb(255, 255, 140)),
    k.opacity(0.7),
    k.z(700),
    { id: "shock-arc", t: 0, baseMx: midX, baseMy: midY, arcAngle: angle },
  ]) as GameObj & {
    t: number;
    baseMx: number;
    baseMy: number;
    arcAngle: number;
  };

  arc.onUpdate(() => {
    arc.t += k.dt();
    // Shake perpendicular
    const shake = (1 - arc.t / 0.12) * 4;
    const perpX = -Math.sin(arc.arcAngle) * (Math.random() - 0.5) * 2 * shake;
    const perpY = Math.cos(arc.arcAngle) * (Math.random() - 0.5) * 2 * shake;
    arc.pos.x = arc.baseMx + perpX;
    arc.pos.y = arc.baseMy + perpY;
    arc.opacity = 0.7 * (1 - arc.t / 0.12);
    if (arc.t >= 0.12) arc.destroy();
  });
}

function spawnShockDamageNumber(
  k: KAPLAYCtx,
  enemy: GameObj,
  dmg: number,
): void {
  const eSize = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };
  const cx = enemy.pos.x + eSize.width / 2;
  const cy = enemy.pos.y;

  const label = k.add([
    k.text(`⚡${dmg}`, { size: 15 }),
    k.pos(cx + (Math.random() - 0.5) * 20, cy - 10),
    k.anchor("center"),
    k.color(255, 255, 100),
    k.outline(1, k.rgb(80, 60, 0)),
    k.z(700),
    { id: "shock-dmg-number", t: 0 },
  ]) as GameObj & { t: number };

  label.onUpdate(() => {
    label.t += k.dt();
    label.pos.y -= 35 * k.dt();
    label.opacity = 1 - label.t / 0.7;
    if (label.t >= 0.7) label.destroy();
  });
}

// ===== Stack counter visual =====

function updateShockCounter(
  k: KAPLAYCtx,
  enemy: GameObj,
  counter: GameObj | null,
): GameObj | null {
  const e = enemy as any;
  const stacks = e.shockStacks ?? 0;

  if (stacks <= 0 && !e.isElectrocuted) {
    if (counter && counter.exists()) counter.destroy();
    return null;
  }

  const eSize = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };
  const cx = enemy.pos.x + eSize.width / 2;
  const cy = enemy.pos.y - 4;

  if (!counter || !counter.exists()) {
    counter = k.add([
      k.text("", { size: 10 }),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(255, 255, 100),
      k.outline(1, k.rgb(40, 30, 0)),
      k.z(650),
      { id: "shock-counter" },
    ]);
  }

  const label = e.isElectrocuted ? "⚡" : `⚡${stacks}`;
  (counter as any).text = label;
  counter.pos.x = cx;
  counter.pos.y = cy;

  // Intensidade da cor com base nos stacks
  const intensity = Math.min(stacks / SHOCK_CONFIG.stacksToTrigger, 1);
  counter.color = k.rgb(255, 255 - intensity * 100, 100 - intensity * 60);

  return counter;
}

/**
 * Inicializa o sistema de choque num inimigo.
 */
function initShockSystem(k: KAPLAYCtx, enemy: GameObj): void {
  const e = enemy as any;
  let counter: GameObj | null = null;
  let arcTimer = 0;
  let savedPos: { x: number; y: number } | null = null;

  enemy.onUpdate(() => {
    if (!enemy.exists()) return;

    // Atualiza counter visual
    counter = updateShockCounter(k, enemy, counter);

    // Se está eletrocutado
    if (e.isElectrocuted) {
      e.shockStunTimer += k.dt();

      // Salva posição no primeiro frame do stun
      if (!savedPos) {
        savedPos = { x: enemy.pos.x, y: enemy.pos.y };
      }

      // Shake visual
      const intensity = SHOCK_CONFIG.shakeIntensity;
      const spd = SHOCK_CONFIG.shakeSpeed;
      const shakeX = Math.sin(k.time() * spd) * intensity;
      const shakeY = Math.cos(k.time() * spd * 1.3) * intensity;
      enemy.pos.x = savedPos.x + shakeX;
      enemy.pos.y = savedPos.y + shakeY;

      // Flash de cor elétrica (amarelo/branco flicker)
      if (Math.random() > 0.7) {
        enemy.color = k.rgb(255, 255, 180);
      } else {
        enemy.color = k.rgb(255, 240, 100);
      }

      // Mini arcos elétricos periódicos
      arcTimer += k.dt();
      if (arcTimer >= SHOCK_CONFIG.arcInterval) {
        arcTimer -= SHOCK_CONFIG.arcInterval;
        spawnMiniArc(k, enemy);
      }

      // Verifica fim do stun
      if (e.shockStunTimer >= e.shockStunDuration) {
        e.isElectrocuted = false;
        e.shockStunTimer = 0;
        e.shockStunDuration = 0;
        savedPos = null;
        arcTimer = 0;

        // Restaura velocidade
        if (typeof e._preShockSpeed === "number") {
          e.speed = e._preShockSpeed;
          delete e._preShockSpeed;
        } else if (typeof e.defaultSpeed === "number") {
          e.speed = e.defaultSpeed;
        }

        // Restaura cor original
        const preset = e.enemyType;
        // Tenta restaurar cor baseada no tipo
        const colorMap: Record<string, [number, number, number]> = {
          red: [255, 60, 60],
          blue: [60, 120, 255],
          yellow: [240, 200, 40],
          green: [60, 200, 100],
          stone: [140, 110, 80],
        };
        const origColor = colorMap[preset] ?? [255, 60, 60];
        enemy.color = k.rgb(origColor[0], origColor[1], origColor[2]);
      }
    }
  });
}
