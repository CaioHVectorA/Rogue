import type { GameObj, KAPLAYCtx } from "kaplay";
import { registerSkill, addImpactFlash } from "./registry";
import { gameState } from "../../state/gameState";

const MARKED_CONFIG = {
  baseDuration: 10000, // 10s base (buffed)
  durationPerLevel: 1200, // +1.2s por level (buffed)
  baseDamage: 4, // dano base da explosão (buffed)
  damagePerLevel: 1.5, // +1.5 por level (buffed)
  baseRadius: 180, // raio base da explosão (buffed)
  radiusPerLevel: 20, // +20 por level (buffed)
  baseMarksToExplode: 5, // marcas necessárias base
  marksReduceAtLevel: 3, // nível em que reduz pra 4 marcas (easier)
  baseExplosionMarks: 3, // marcas aplicadas pela explosão base (buffed)
  extraMarksAtLevel: 3, // nível em que sobe pra 4 marcas na explosão
} as const;

function getLevel(): number {
  return gameState.skills.levels["marked-shot"] ?? 1;
}

function getDuration(level: number): number {
  return (
    MARKED_CONFIG.baseDuration + (level - 1) * MARKED_CONFIG.durationPerLevel
  );
}

function getExplosionDamage(level: number): number {
  return MARKED_CONFIG.baseDamage + (level - 1) * MARKED_CONFIG.damagePerLevel;
}

function getExplosionRadius(level: number): number {
  return MARKED_CONFIG.baseRadius + (level - 1) * MARKED_CONFIG.radiusPerLevel;
}

export function getMarksToExplode(level: number): number {
  return level >= MARKED_CONFIG.marksReduceAtLevel
    ? MARKED_CONFIG.baseMarksToExplode - 1
    : MARKED_CONFIG.baseMarksToExplode;
}

function getExplosionMarks(level: number): number {
  return level >= MARKED_CONFIG.extraMarksAtLevel
    ? MARKED_CONFIG.baseExplosionMarks + 1
    : MARKED_CONFIG.baseExplosionMarks;
}

/**
 * Adiciona uma marca a um inimigo. Se chegar em 5, explode.
 */
export function addMark(k: KAPLAYCtx, enemy: GameObj): void {
  const e = enemy as any;
  if (typeof e.marks !== "number") return;

  e.marks += 1;
  e.marksDecayTimer = 0; // Reseta timer de expiração ao estacar

  // Flash rosa ao marcar
  addImpactFlash(k, enemy.pos.clone(), [255, 80, 100], {
    target: enemy,
    size: 10,
    duration: 0.15,
  });

  // Se atingiu o limite, explode
  if (e.marks >= getMarksToExplode(getLevel())) {
    triggerMarkExplosion(k, enemy);
  }
}

/**
 * Explosão ao atingir 5 marcas:
 * - Reseta marcas do inimigo que explodiu
 * - Causa dano em área
 * - Aplica 2 marcas nos inimigos atingidos
 */
function triggerMarkExplosion(k: KAPLAYCtx, source: GameObj): void {
  const level = getLevel();
  const explosionDamage = getExplosionDamage(level);
  const explosionRadius = getExplosionRadius(level);
  const explosionMarksApplied = getExplosionMarks(level);
  const marksToExplode = getMarksToExplode(level);
  const sourceEnemy = source as any;

  // Reseta marcas do inimigo que explodiu
  sourceEnemy.marks = 0;

  const center = source.pos.clone();

  // Visual da explosão — anel rosa expandindo
  const ring = k.add([
    k.rect(explosionRadius * 2, explosionRadius * 2),
    k.pos(center.x, center.y),
    k.anchor("center"),
    k.color(255, 80, 100),
    k.opacity(0.5),
    k.outline(3, k.rgb(255, 150, 170)),
    k.z(998),
    {
      id: "mark-explosion",
      t: 0,
      maxScale: 1,
    },
  ]) as GameObj & { t: number; maxScale: number };

  // Começa pequeno e expande
  ring.scale = k.vec2(0.1);

  ring.onUpdate(() => {
    ring.t += k.dt();
    const progress = Math.min(ring.t / 0.3, 1);

    // Expande rapidamente
    const scl = 0.1 + progress * 0.9;
    ring.scale = k.vec2(scl);
    ring.opacity = 0.5 * (1 - progress);

    if (ring.t >= 0.3) {
      ring.destroy();
    }
  });

  // Flash no centro
  addImpactFlash(k, center, [255, 100, 120], {
    size: 32,
    duration: 0.35,
  });

  // Encontrar inimigos no raio da explosão
  const enemies = k.get("enemy") as GameObj[];
  for (const enemy of enemies) {
    if (enemy === source) continue;
    if (!enemy.exists()) continue;

    const dist = enemy.pos.dist(center);
    if (dist <= explosionRadius) {
      const e = enemy as any;

      // Aplica dano
      if (typeof e.hp === "number") {
        e.hp -= explosionDamage;
        if (e.hp <= 0) {
          e.destroy();
          continue;
        }
      }

      // Aplica marcas da explosão
      if (typeof e.marks === "number") {
        e.marks += explosionMarksApplied;
        e.marksDecayTimer = 0; // Reseta timer de expiração
        // Se o inimigo atingido também chegou em 5, explode em cadeia
        if (e.marks >= marksToExplode) {
          // Pequeno delay para não ser tudo no mesmo frame
          k.wait(0.08, () => {
            if (enemy.exists()) {
              triggerMarkExplosion(k, enemy);
            }
          });
        }
      }

      // Flash nos atingidos
      addImpactFlash(k, enemy.pos.clone(), [255, 80, 100], {
        target: enemy,
        size: 16,
        duration: 0.2,
      });
    }
  }
}

registerSkill({
  id: "marked-shot",
  getCooldown: () => 10000,
  use: ({ k, player }) => {
    const level = gameState.skills.levels["marked-shot"] ?? 1;
    const duration = getDuration(level);

    // Ativar buff no gameState
    gameState.buffs.markedShot.active = true;
    gameState.buffs.markedShot.activeUntil = Date.now() + duration;

    // Efeito visual no player (brilho vermelho/rosa)
    const originalColor = player.color?.clone?.() ?? k.rgb(255, 255, 255);
    player.color = k.rgb(255, 100, 120);

    // Timer para remover o buff
    k.wait(duration / 1000, () => {
      gameState.buffs.markedShot.active = false;
      gameState.buffs.markedShot.activeUntil = 0;
      player.color = originalColor;
    });
  },
});
