/**
 * Sistema de veneno desacoplado — pode ser usado por qualquer skill.
 * 
 * Acúmulos de veneno estacam infinitamente.
 * Cada acúmulo causa 1 de dano por tick (a cada 1s).
 * O veneno dura enquanto houver stacks, e decai 1 stack por tick.
 * 
 * Uso: addPoisonStacks(k, enemy, amount)
 */
import type { GameObj, KAPLAYCtx } from "kaplay";

const POISON_CONFIG = {
  tickInterval: 1.0,      // dano a cada 1s
  damagePerStack: 1,       // 1 dano por acúmulo por tick
  stackDecayPerTick: 1,    // perde 1 stack por tick
  maxVisualBubbles: 8,     // máximo de bolhas visuais
} as const;

// Rastreia inimigos que já têm o sistema de veneno ativo
const poisonedEnemies = new WeakSet<GameObj>();

/**
 * Adiciona stacks de veneno a um inimigo.
 * Se o inimigo ainda não tem o sistema, inicializa.
 */
export function addPoisonStacks(k: KAPLAYCtx, enemy: GameObj, stacks: number = 1): void {
  const e = enemy as any;
  if (typeof e.poisonStacks !== "number") {
    e.poisonStacks = 0;
    e.poisonTickTimer = 0;
  }

  e.poisonStacks += stacks;
  e.poisonTickTimer = 0; // reseta timer ao receber novo stack

  // Flash verde ao envenenar
  const flash = k.add([
    k.circle(12),
    k.pos(enemy.pos.x, enemy.pos.y),
    k.anchor("center"),
    k.color(80, 220, 60),
    k.opacity(0.6),
    k.z(600),
    { id: "poison-flash", t: 0 },
  ]) as GameObj & { t: number };
  flash.onUpdate(() => {
    flash.t += k.dt();
    flash.opacity = 0.6 * (1 - flash.t / 0.25);
    flash.scale = k.vec2(1 + flash.t * 3);
    if (flash.t >= 0.25) flash.destroy();
  });

  // Inicializa sistema de tick se não existir
  if (!poisonedEnemies.has(enemy)) {
    poisonedEnemies.add(enemy);
    initPoisonTick(k, enemy);
  }
}

/**
 * Retorna os stacks de veneno atuais de um inimigo.
 */
export function getPoisonStacks(enemy: GameObj): number {
  return (enemy as any).poisonStacks ?? 0;
}

/**
 * Inicializa o sistema de tick de veneno em um inimigo.
 */
function initPoisonTick(k: KAPLAYCtx, enemy: GameObj): void {
  const e = enemy as any;

  // Partículas de veneno (bolhas flutuando)
  const bubbles: GameObj[] = [];

  enemy.onUpdate(() => {
    if (!enemy.exists()) return;
    const stacks = e.poisonStacks ?? 0;
    if (stacks <= 0) {
      // Limpa bolhas
      for (const b of bubbles) {
        if (b.exists()) b.destroy();
      }
      bubbles.length = 0;
      return;
    }

    // Timer de tick
    e.poisonTickTimer += k.dt();
    if (e.poisonTickTimer >= POISON_CONFIG.tickInterval) {
      e.poisonTickTimer -= POISON_CONFIG.tickInterval;

      // Aplica dano
      const dmg = stacks * POISON_CONFIG.damagePerStack;
      if (typeof e.hp === "number") {
        e.hp -= dmg;

        // Número de dano flutuante
        spawnDamageNumber(k, enemy, dmg);

        if (e.hp <= 0) {
          enemy.destroy();
          return;
        }
      }

      // Decai stacks
      e.poisonStacks = Math.max(0, stacks - POISON_CONFIG.stackDecayPerTick);
    }

    // Atualiza bolhas visuais
    updatePoisonBubbles(k, enemy, bubbles);
  });
}

/**
 * Spawna/atualiza bolhas visuais de veneno ao redor do inimigo.
 */
function updatePoisonBubbles(k: KAPLAYCtx, enemy: GameObj, bubbles: GameObj[]): void {
  const e = enemy as any;
  const stacks = e.poisonStacks ?? 0;
  const targetCount = Math.min(stacks, POISON_CONFIG.maxVisualBubbles);

  // Adiciona bolhas faltantes
  while (bubbles.length < targetCount) {
    const angle = Math.random() * Math.PI * 2;
    const size = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };
    const bubble = k.add([
      k.circle(2 + Math.random() * 2),
      k.pos(enemy.pos.x, enemy.pos.y),
      k.anchor("center"),
      k.color(60 + Math.random() * 40, 200 + Math.random() * 55, 40 + Math.random() * 30),
      k.opacity(0.5 + Math.random() * 0.3),
      k.z(502),
      {
        id: "poison-bubble",
        angle,
        floatSpeed: 0.8 + Math.random() * 1.2,
        floatT: Math.random() * 10,
        orbitDist: (size.width / 2) + 4 + Math.random() * 8,
      },
    ]) as GameObj & { angle: number; floatSpeed: number; floatT: number; orbitDist: number };

    bubble.onUpdate(() => {
      if (!enemy.exists()) {
        bubble.destroy();
        return;
      }
      bubble.floatT += k.dt();
      // Bolha flutua ao redor do inimigo
      const eSize = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };
      const cx = enemy.pos.x + eSize.width / 2;
      const cy = enemy.pos.y + eSize.height / 2;
      const bAngle = bubble.angle + bubble.floatT * bubble.floatSpeed;
      const floatY = Math.sin(bubble.floatT * 3) * 4; // sobe e desce
      bubble.pos.x = cx + Math.cos(bAngle) * bubble.orbitDist;
      bubble.pos.y = cy + Math.sin(bAngle) * bubble.orbitDist + floatY;
      // Fade suave
      bubble.opacity = 0.4 + Math.sin(bubble.floatT * 2) * 0.2;
    });

    bubbles.push(bubble);
  }

  // Remove bolhas excedentes
  while (bubbles.length > targetCount) {
    const b = bubbles.pop();
    if (b && b.exists()) b.destroy();
  }
}

/**
 * Número de dano flutuante (verde, sobe e some)
 */
function spawnDamageNumber(k: KAPLAYCtx, enemy: GameObj, dmg: number): void {
  const size = enemy.getSize ? enemy.getSize() : { width: 30, height: 30 };
  const cx = enemy.pos.x + size.width / 2;
  const cy = enemy.pos.y;

  const label = k.add([
    k.text(`${dmg}`, { size: 14 }),
    k.pos(cx + (Math.random() - 0.5) * 20, cy - 10),
    k.anchor("center"),
    k.color(80, 255, 80),
    k.outline(1, k.rgb(0, 60, 0)),
    k.z(700),
    { id: "poison-dmg-number", t: 0 },
  ]) as GameObj & { t: number };

  label.onUpdate(() => {
    label.t += k.dt();
    label.pos.y -= 35 * k.dt();
    label.opacity = 1 - label.t / 0.7;
    if (label.t >= 0.7) label.destroy();
  });
}
