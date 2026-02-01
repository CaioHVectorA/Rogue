import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";
import { gameState } from "../../state/gameState";

const MINE_CONFIG = {
  radius: 60,
  lifetime: 6,
  damage: 3,
  warningDelay: 200, // tempo para ficar amarelo → vermelho (ms)
  explosionDelay: 200, // tempo para ficar vermelho → explosão (ms)
  explosionDuration: 0.2,
  shakeIntensity: 2, // intensidade do tremor
  shakeSpeed: 50, // velocidade do tremor
  baseCooldown: 3000, // cooldown base para regenerar uma carga
} as const;

// Cargas máximas por level
function getMaxChargesForLevel(level: number): number {
  return level + 1; // Level 1 = 2 cargas, Level 2 = 3 cargas, etc.
}

const MINE_COLORS = {
  idle: { r: 120, g: 120, b: 255 },
  warning: { r: 255, g: 220, b: 0 }, // amarelo
  danger: { r: 255, g: 0, b: 0 }, // vermelho
  explosion: { r: 200, g: 200, b: 255 },
} as const;

type MineState = "idle" | "warning" | "danger" | "exploding";

// Array global para rastrear todas as minas ativas (para encadeamento de explosões)
const activeMines: Array<{
  mine: GameObj & { t: number; state: MineState };
  triggerArea: GameObj;
  pos: { x: number; y: number };
  startExplosionSequence: () => void;
}> = [];

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
      explosionDuration,
      shakeIntensity,
      shakeSpeed,
    } = MINE_CONFIG;

    const mineSize = radius / 9;
    const explosionRadius = radius * 1.5;

    // A mina sempre aparece na posição atual do player
    const pos = player.pos.clone();

    const mine = k.add([
      k.circle(mineSize),
      k.pos(pos.x, pos.y),
      k.color(MINE_COLORS.idle.r, MINE_COLORS.idle.g, MINE_COLORS.idle.b),
      k.outline(2, k.rgb(255, 255, 255)),
      k.area(),
      { id: "skill-arc-mine", t: 0, state: "idle" as MineState },
    ]) as GameObj & { t: number; state: MineState };

    const triggerArea = k.add([
      k.circle(radius),
      k.pos(pos.x, pos.y),
      k.color(255, 255, 255),
      k.opacity(0.06),
      k.area(),
      { id: "skill-arc-mine-area" },
    ]);

    let mineEntry: (typeof activeMines)[number];

    const triggerExplosion = () => {
      const explosionPos = { x: pos.x, y: pos.y };

      const explosion = k.add([
        k.circle(explosionRadius),
        k.pos(explosionPos.x, explosionPos.y),
        k.color(
          MINE_COLORS.explosion.r,
          MINE_COLORS.explosion.g,
          MINE_COLORS.explosion.b,
        ),
        k.outline(3, k.rgb(255, 255, 255)),
        k.area(),
        { id: "skill-arc-mine-explosion", life: explosionDuration },
      ]) as GameObj & { life: number };

      explosion.onUpdate(() => {
        explosion.life -= k.dt();
        if (explosion.life <= 0) explosion.destroy();
      });

      explosion.onCollide("enemy", (enemy: any) => {
        if (typeof enemy.hp === "number") {
          enemy.hp -= damage;
          if (enemy.hp <= 0) enemy.destroy();
        }
      });

      // Encadear explosões de outras minas próximas
      for (const other of activeMines) {
        if (other.mine === mine) continue;
        if (other.mine.state === "exploding" || !other.mine.exists()) continue;

        const dist = Math.hypot(
          other.pos.x - explosionPos.x,
          other.pos.y - explosionPos.y,
        );

        // Se a outra mina está dentro do raio de explosão, encadeia
        if (dist <= explosionRadius) {
          other.startExplosionSequence();
        }
      }

      // Remover esta mina do array de minas ativas
      const idx = activeMines.indexOf(mineEntry);
      if (idx !== -1) activeMines.splice(idx, 1);

      mine.destroy();
      triggerArea.destroy();
    };

    const startExplosionSequence = () => {
      if (mine.state !== "idle") return;

      // Fase 1: Amarelo (warning)
      mine.state = "warning";
      mine.color = k.rgb(
        MINE_COLORS.warning.r,
        MINE_COLORS.warning.g,
        MINE_COLORS.warning.b,
      );

      setTimeout(() => {
        if (!mine.exists()) return;

        // Fase 2: Vermelho (danger)
        mine.state = "danger";
        mine.color = k.rgb(
          MINE_COLORS.danger.r,
          MINE_COLORS.danger.g,
          MINE_COLORS.danger.b,
        );

        setTimeout(() => {
          if (!mine.exists()) return;

          // Fase 3: Explosão
          mine.state = "exploding";
          triggerExplosion();
        }, explosionDelay);
      }, warningDelay);
    };

    triggerArea.onCollide("enemy", () => {
      startExplosionSequence();
    });

    // Adicionar mina ao array de minas ativas
    mineEntry = {
      mine,
      triggerArea,
      pos: { x: pos.x, y: pos.y },
      startExplosionSequence,
    };
    activeMines.push(mineEntry);

    mine.onUpdate(() => {
      mine.t += k.dt();

      // Efeito de shake quando está no estado warning ou danger
      if (mine.state === "warning" || mine.state === "danger") {
        const shakeX = Math.sin(k.time() * shakeSpeed) * shakeIntensity;
        const shakeY = Math.cos(k.time() * shakeSpeed * 1.3) * shakeIntensity;
        mine.pos = k.vec2(pos.x + shakeX, pos.y + shakeY);
      }

      if (mine.t >= lifetime) {
        // Remover do array ao expirar
        const idx = activeMines.indexOf(mineEntry);
        if (idx !== -1) activeMines.splice(idx, 1);

        mine.destroy();
        triggerArea.destroy();
      }
    });
  },
});
