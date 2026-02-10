import type { GameObj, KAPLAYCtx } from "kaplay";
import { registerSkill, addImpactFlash } from "./registry";
import { gameState } from "../../state/gameState";

const MARKED_CONFIG = {
  baseDuration: 8000,        // 8 segundos
  durationPerLevel: 500,     // +0.5s por level
  marksToExplode: 5,         // marcas necessárias para explodir
  explosionDamage: 3,        // dano da explosão
  explosionRadius: 150,      // raio da explosão
  explosionMarksApplied: 2,  // marcas aplicadas aos inimigos atingidos pela explosão
} as const;

function getDuration(level: number): number {
  return MARKED_CONFIG.baseDuration + (level - 1) * MARKED_CONFIG.durationPerLevel;
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
  if (e.marks >= MARKED_CONFIG.marksToExplode) {
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
  const { explosionDamage, explosionRadius, explosionMarksApplied } = MARKED_CONFIG;
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
        if (e.marks >= MARKED_CONFIG.marksToExplode) {
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