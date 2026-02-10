import type { GameObj, KAPLAYCtx } from "kaplay";
import { registerSkill } from "./registry";
import { gameState } from "../../state/gameState";

const BOOMERANG_CONFIG = {
  maxDistance: 450,
  outSpeed: 340,
  returnSpeed: 420,
  size: 14,                  // raio do bumerangue
  baseDamage: 2,
  returnDamage: 5,
  rotationSpeed: 8,
  catchRadius: 28,
  cooldownReduction: 0.5,
  predictionTime: 0.4,
  trailInterval: 0.03,      // intervalo entre partículas de trail
  trailLife: 0.25,           // duração de cada partícula
} as const;

// Cores do bumerangue por fase
const BOOMERANG_COLORS = {
  out: { body: [255, 240, 80], outline: [255, 255, 180], glow: [255, 220, 40], trail: [255, 230, 100] },
  back: { body: [255, 160, 60], outline: [255, 220, 140], glow: [255, 120, 20], trail: [255, 140, 50] },
} as const;

let activeBoomerang: (GameObj & {
  vel: any;
  phase: "out" | "back";
  traveled: number;
  rotation: number;
  returnTarget: { x: number; y: number } | null;
  forceReturn: () => void;
}) | null = null;

function findNearestEnemy(k: KAPLAYCtx, from: any): GameObj | null {
  const enemies = k.get("enemy") as GameObj[];
  if (!enemies || enemies.length === 0) return null;
  let nearest: GameObj | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const e of enemies) {
    const d = from.dist(e.pos);
    if (d < best) { best = d; nearest = e; }
  }
  return nearest;
}

function getPlayerDirection(k: KAPLAYCtx, player: GameObj): { x: number; y: number } {
  let moveX = 0;
  let moveY = 0;
  if (k.isKeyDown("a") || k.isKeyDown("left")) moveX -= 1;
  if (k.isKeyDown("d") || k.isKeyDown("right")) moveX += 1;
  if (k.isKeyDown("w") || k.isKeyDown("up")) moveY -= 1;
  if (k.isKeyDown("s") || k.isKeyDown("down")) moveY += 1;

  if (moveX !== 0 || moveY !== 0) {
    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    return { x: moveX / len, y: moveY / len };
  }

  const nearestEnemy = findNearestEnemy(k, player.pos);
  if (nearestEnemy) {
    const dir = nearestEnemy.pos.sub(player.pos);
    if (dir.len() > 0) {
      const unit = dir.unit();
      return { x: unit.x, y: unit.y };
    }
  }

  return { x: 1, y: 0 };
}

function getPredictedPlayerPosition(
  k: KAPLAYCtx,
  player: GameObj,
  predictionTime: number,
  playerSpeed: number,
): { x: number; y: number } {
  const currentPos = player.pos;
  let isMoving = false;
  if (k.isKeyDown("a") || k.isKeyDown("left") ||
      k.isKeyDown("d") || k.isKeyDown("right") ||
      k.isKeyDown("w") || k.isKeyDown("up") ||
      k.isKeyDown("s") || k.isKeyDown("down")) {
    isMoving = true;
  }
  if (!isMoving) return { x: currentPos.x, y: currentPos.y };
  const moveDir = getPlayerDirection(k, player);
  return {
    x: currentPos.x + moveDir.x * playerSpeed * predictionTime,
    y: currentPos.y + moveDir.y * playerSpeed * predictionTime,
  };
}

// ===== Visuais do bumerangue =====

function spawnCatchEffect(k: KAPLAYCtx, pos: { x: number; y: number }): void {
  // Anel dourado de catch
  const ring = k.add([
    k.circle(20),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(255, 220, 60),
    k.outline(2, k.rgb(255, 255, 180)),
    k.opacity(0.7),
    k.scale(0.3),
    k.z(800),
    { id: "boom-catch-ring", t: 0 },
  ]) as GameObj & { t: number };
  ring.onUpdate(() => {
    ring.t += k.dt();
    const p = Math.min(ring.t / 0.25, 1);
    ring.scale = k.vec2(0.3 + p * 2.0);
    ring.opacity = 0.7 * (1 - p);
    if (ring.t >= 0.25) ring.destroy();
  });

  // Label "CATCH!"
  const label = k.add([
    k.text("CATCH!", { size: 14 }),
    k.pos(pos.x, pos.y - 20),
    k.anchor("center"),
    k.color(255, 255, 100),
    k.outline(2, k.rgb(100, 70, 0)),
    k.opacity(1),
    k.z(850),
    { id: "boom-catch-label", t: 0 },
  ]) as GameObj & { t: number };
  label.scale = k.vec2(1.3);
  label.onUpdate(() => {
    label.t += k.dt();
    label.pos.y -= 40 * k.dt();
    if (label.t < 0.1) {
      label.scale = k.vec2(1.3 - (label.t / 0.1) * 0.3);
    }
    if (label.t > 0.4) {
      label.opacity = 1 - (label.t - 0.4) / 0.4;
    }
    if (label.t >= 0.8) label.destroy();
  });

  // Partículas douradas
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    const sp = k.add([
      k.circle(3),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(255, 230, 80),
      k.opacity(0.7),
      k.z(801),
      { id: "boom-catch-p", t: 0, vx: Math.cos(angle) * 80, vy: Math.sin(angle) * 80 },
    ]) as GameObj & { t: number; vx: number; vy: number };
    sp.onUpdate(() => {
      sp.t += k.dt();
      sp.pos.x += sp.vx * k.dt();
      sp.pos.y += sp.vy * k.dt();
      sp.opacity = 0.7 * (1 - sp.t / 0.3);
      if (sp.t >= 0.3) sp.destroy();
    });
  }
}

function spawnHitEffect(k: KAPLAYCtx, pos: { x: number; y: number }, isReturn: boolean): void {
  const color = isReturn ? [255, 160, 60] : [255, 240, 80];
  const size = isReturn ? 18 : 14;

  const flash = k.add([
    k.circle(size),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(color[0], color[1], color[2]),
    k.opacity(0.8),
    k.scale(0.5),
    k.z(700),
    { id: "boom-hit-flash", t: 0 },
  ]) as GameObj & { t: number };
  flash.onUpdate(() => {
    flash.t += k.dt();
    const p = Math.min(flash.t / 0.15, 1);
    flash.scale = k.vec2(0.5 + p * 1.5);
    flash.opacity = 0.8 * (1 - p);
    if (flash.t >= 0.15) flash.destroy();
  });

  // Faíscas
  for (let i = 0; i < 4; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sp = k.add([
      k.circle(2),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(255, 255, 180),
      k.opacity(0.6),
      k.z(701),
      { id: "boom-hit-spark", t: 0, vx: Math.cos(angle) * 60, vy: Math.sin(angle) * 60 },
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

function spawnWallBreakEffect(k: KAPLAYCtx, pos: { x: number; y: number }): void {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sp = k.add([
      k.rect(3 + Math.random() * 4, 2),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.rotate(Math.random() * 360),
      k.color(200, 180, 100),
      k.opacity(0.6),
      k.z(700),
      { id: "boom-wall-p", t: 0, vx: Math.cos(angle) * 70, vy: Math.sin(angle) * 70 },
    ]) as GameObj & { t: number; vx: number; vy: number };
    sp.onUpdate(() => {
      sp.t += k.dt();
      sp.pos.x += sp.vx * k.dt();
      sp.pos.y += sp.vy * k.dt();
      sp.opacity = 0.6 * (1 - sp.t / 0.3);
      if (sp.t >= 0.3) sp.destroy();
    });
  }
}

// ===== Skill =====

registerSkill({
  id: "boomerang-bolt",
  getCooldown: () => 4000,
  canAlwaysUse: () => activeBoomerang !== null && activeBoomerang.exists(),
  use: ({ k, player }) => {
    // Recall se já tem bumerangue ativo
    if (activeBoomerang && activeBoomerang.exists()) {
      activeBoomerang.forceReturn();
      return;
    }

    const origin = player.pos.clone();
    const {
      maxDistance, outSpeed, returnSpeed, size,
      baseDamage, returnDamage, rotationSpeed,
      catchRadius, cooldownReduction, predictionTime,
      trailInterval, trailLife,
    } = BOOMERANG_CONFIG;

    const playerSpeed = gameState.moveSpeed;
    const dir = getPlayerDirection(k, player);
    const unit = k.vec2(dir.x, dir.y);

    // ===== Anel de lançamento =====
    const castRing = k.add([
      k.circle(15),
      k.pos(origin.x, origin.y),
      k.anchor("center"),
      k.color(255, 230, 80),
      k.outline(2, k.rgb(255, 255, 180)),
      k.opacity(0.5),
      k.scale(0.4),
      k.z(200),
      { id: "boom-cast", t: 0 },
    ]) as GameObj & { t: number };
    castRing.onUpdate(() => {
      castRing.t += k.dt();
      const p = Math.min(castRing.t / 0.2, 1);
      castRing.scale = k.vec2(0.4 + p * 2.5);
      castRing.opacity = 0.5 * (1 - p);
      if (castRing.t >= 0.2) castRing.destroy();
    });

    // ===== Glow atrás do bumerangue =====
    const glow = k.add([
      k.circle(size + 6),
      k.pos(origin.x, origin.y),
      k.anchor("center"),
      k.color(BOOMERANG_COLORS.out.glow[0], BOOMERANG_COLORS.out.glow[1], BOOMERANG_COLORS.out.glow[2]),
      k.opacity(0.2),
      k.scale(1),
      k.z(498),
      { id: "boom-glow" },
    ]);

    // ===== Bumerangue (forma de losango rotacionando) =====
    const proj = k.add([
      k.rect(size * 2, size * 0.6),
      k.pos(origin.x, origin.y),
      k.anchor("center"),
      k.color(BOOMERANG_COLORS.out.body[0], BOOMERANG_COLORS.out.body[1], BOOMERANG_COLORS.out.body[2]),
      k.outline(2, k.rgb(BOOMERANG_COLORS.out.outline[0], BOOMERANG_COLORS.out.outline[1], BOOMERANG_COLORS.out.outline[2])),
      k.area(),
      k.rotate(0),
      k.z(500),
      {
        id: "skill-boomerang",
        vel: unit.scale(outSpeed),
        phase: "out" as "out" | "back",
        traveled: 0,
        rotation: 0,
        returnTarget: null as { x: number; y: number } | null,
        forceReturn: () => {},
      },
    ]) as typeof activeBoomerang;

    let trailT = 0;

    const startReturn = () => {
      if (proj!.phase === "out") {
        proj!.phase = "back";
        const predicted = getPredictedPlayerPosition(k, player, predictionTime, playerSpeed);
        proj!.returnTarget = predicted;
        const back = k.vec2(
          proj!.returnTarget.x - proj!.pos.x,
          proj!.returnTarget.y - proj!.pos.y,
        ).unit();
        proj!.vel = back.scale(returnSpeed);

        // Muda cores para fase de volta
        proj!.color = k.rgb(BOOMERANG_COLORS.back.body[0], BOOMERANG_COLORS.back.body[1], BOOMERANG_COLORS.back.body[2]);
        proj!.outline.color = k.rgb(BOOMERANG_COLORS.back.outline[0], BOOMERANG_COLORS.back.outline[1], BOOMERANG_COLORS.back.outline[2]);
        glow.color = k.rgb(BOOMERANG_COLORS.back.glow[0], BOOMERANG_COLORS.back.glow[1], BOOMERANG_COLORS.back.glow[2]);

        // Flash de inversão
        const turnFlash = k.add([
          k.circle(12),
          k.pos(proj!.pos.x, proj!.pos.y),
          k.anchor("center"),
          k.color(255, 200, 80),
          k.opacity(0.6),
          k.z(600),
          { id: "boom-turn", t: 0 },
        ]) as GameObj & { t: number };
        turnFlash.onUpdate(() => {
          turnFlash.t += k.dt();
          turnFlash.scale = k.vec2(1 + turnFlash.t * 5);
          turnFlash.opacity = 0.6 * (1 - turnFlash.t / 0.2);
          if (turnFlash.t >= 0.2) turnFlash.destroy();
        });
      }
    };

    proj!.forceReturn = startReturn;
    activeBoomerang = proj;

    // ===== Update =====
    proj!.onUpdate(() => {
      const dt = k.dt();

      // Rotação contínua
      proj!.rotation += rotationSpeed * dt * 360;
      proj!.angle = proj!.rotation;

      // Movimento
      const step = proj!.vel.scale(dt);
      proj!.pos.x += step.x;
      proj!.pos.y += step.y;
      proj!.traveled += step.len();

      // Glow segue
      glow.pos.x = proj!.pos.x;
      glow.pos.y = proj!.pos.y;
      const glowPulse = 0.18 + Math.sin(k.time() * 6) * 0.06;
      glow.opacity = glowPulse;
      const glowScale = 1 + Math.sin(k.time() * 4) * 0.15;
      glow.scale = k.vec2(glowScale);

      // Trail
      trailT += dt;
      if (trailT >= trailInterval) {
        trailT -= trailInterval;
        const colors = proj!.phase === "out" ? BOOMERANG_COLORS.out.trail : BOOMERANG_COLORS.back.trail;
        const trail = k.add([
          k.rect(size * 1.2, size * 0.3),
          k.pos(proj!.pos.x, proj!.pos.y),
          k.anchor("center"),
          k.rotate(proj!.rotation),
          k.color(colors[0], colors[1], colors[2]),
          k.opacity(0.35),
          k.z(499),
          { id: "boom-trail", t: 0 },
        ]) as GameObj & { t: number };
        trail.onUpdate(() => {
          trail.t += dt;
          const p = trail.t / trailLife;
          trail.opacity = 0.35 * (1 - p);
          trail.scale = k.vec2(1 - p * 0.4);
          if (trail.t >= trailLife) trail.destroy();
        });
      }

      // Fase de ida
      if (proj!.phase === "out" && proj!.traveled >= maxDistance) {
        startReturn();
      }

      // Fase de volta — catch
      if (proj!.phase === "back") {
        const distToPlayer = proj!.pos.dist(player.pos);

        // Indicador visual de proximidade (quanto mais perto, mais brilhante o glow)
        if (distToPlayer < catchRadius * 3) {
          const proximity = 1 - (distToPlayer / (catchRadius * 3));
          glow.opacity = 0.2 + proximity * 0.4;
          glow.scale = k.vec2(1 + proximity * 0.5);
        }

        if (distToPlayer < catchRadius) {
          // Apanhou!
          spawnCatchEffect(k, { x: player.pos.x, y: player.pos.y });

          const skillId = "boomerang-bolt";
          const fullCd = 4000;
          const reduction = fullCd * cooldownReduction;
          gameState.skills.lastUsedAt[skillId] = Date.now() - reduction;

          activeBoomerang = null;
          glow.destroy();
          proj!.destroy();
          return;
        }
      }
    });

    // Colisão com inimigo (atravessa!)
    const hitEnemies = new Set<GameObj>();
    proj!.onCollide("enemy", (e: any) => {
      // Não acerta o mesmo inimigo duas vezes na mesma fase
      if (hitEnemies.has(e)) return;
      hitEnemies.add(e);

      if (typeof e.hp === "number") {
        const damage = proj!.phase === "back" ? returnDamage : baseDamage;
        e.hp -= damage;

        spawnHitEffect(k, { x: e.pos.x, y: e.pos.y }, proj!.phase === "back");

        if (e.hp <= 0) e.destroy();
      }
    });

    // Ao mudar de fase, limpa o set de inimigos atingidos
    // (permite acertar os mesmos na volta)
    const originalStartReturn = startReturn;
    proj!.forceReturn = () => {
      hitEnemies.clear();
      originalStartReturn();
    };

    // Override startReturn para limpar hitEnemies
    const patchedUpdate = proj!.onUpdate;

    proj!.onCollide("arena-wall", () => {
      spawnWallBreakEffect(k, { x: proj!.pos.x, y: proj!.pos.y });
      gameState.skills.lastUsedAt["boomerang-bolt"] = Date.now();
      activeBoomerang = null;
      glow.destroy();
      proj!.destroy();
    });

    proj!.onDestroy(() => {
      if (activeBoomerang === proj) {
        activeBoomerang = null;
      }
      if (glow.exists()) glow.destroy();
    });
  },
});
