import type { GameObj } from "kaplay";
import { registerSkill } from "./registry";
import { gameState } from "../../state/gameState";

const BOOMERANG_CONFIG = {
  maxDistance: 450,
  outSpeed: 340,
  returnSpeed: 420, // Velocidade de volta mais lenta
  width: 28, // Mais largo
  height: 10,
  baseDamage: 2,
  returnDamage: 5, // Dano muito maior na volta
  rotationSpeed: 8, // Velocidade de rotação (rotações por segundo) - mais lento
  catchRadius: 24, // Raio para apanhar o bumerangue (difícil)
  cooldownReduction: 0.5, // Reduz 50% do cooldown se apanhar
  predictionTime: 0.4, // Segundos de predição para onde o player está indo
} as const;

// Estado global do bumerangue ativo (para permitir recall)
let activeBoomerang:
  | (GameObj & {
      vel: any;
      phase: "out" | "back";
      traveled: number;
      rotation: number;
      returnTarget: { x: number; y: number } | null; // Posição fixa para onde retorna
      forceReturn: () => void;
    })
  | null = null;

function findNearestEnemy(k: any, from: any): GameObj | null {
  const enemies = k.get("enemy") as GameObj[];
  if (!enemies || enemies.length === 0) return null;
  let nearest: GameObj | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const e of enemies) {
    const d = from.dist(e.pos);
    if (d < best) {
      best = d;
      nearest = e;
    }
  }
  return nearest;
}

function getPlayerDirection(k: any, player: GameObj): { x: number; y: number } {
  // Verifica se o player está se movendo
  const vel = (player as any).lastMoveDir ?? null;

  // Tenta detectar movimento pelas teclas
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

  // Se parado, vai na direção do inimigo mais próximo
  const nearestEnemy = findNearestEnemy(k, player.pos);
  if (nearestEnemy) {
    const dir = nearestEnemy.pos.sub(player.pos);
    if (dir.len() > 0) {
      const unit = dir.unit();
      return { x: unit.x, y: unit.y };
    }
  }

  // Fallback: direção para direita
  return { x: 1, y: 0 };
}

// Calcula a posição predita do player baseado na direção de movimento atual
function getPredictedPlayerPosition(
  k: any,
  player: GameObj,
  predictionTime: number,
  playerSpeed: number,
): { x: number; y: number } {
  const currentPos = player.pos;
  const moveDir = getPlayerDirection(k, player);

  // Se não está se movendo (direção veio do inimigo mais próximo), retorna posição atual
  let isMoving = false;
  if (
    k.isKeyDown("a") ||
    k.isKeyDown("left") ||
    k.isKeyDown("d") ||
    k.isKeyDown("right") ||
    k.isKeyDown("w") ||
    k.isKeyDown("up") ||
    k.isKeyDown("s") ||
    k.isKeyDown("down")
  ) {
    isMoving = true;
  }

  if (!isMoving) {
    return { x: currentPos.x, y: currentPos.y };
  }

  // Prediz posição futura
  const predictedX = currentPos.x + moveDir.x * playerSpeed * predictionTime;
  const predictedY = currentPos.y + moveDir.y * playerSpeed * predictionTime;

  return { x: predictedX, y: predictedY };
}

registerSkill({
  id: "boomerang-bolt",
  getCooldown: () => 4000,
  // Permite usar a skill mesmo em cooldown se há bumerangue ativo (para recall)
  canAlwaysUse: () => activeBoomerang !== null && activeBoomerang.exists(),
  use: ({ k, player }) => {
    // Se já tem um bumerangue ativo, força o retorno (recall)
    if (activeBoomerang && activeBoomerang.exists()) {
      activeBoomerang.forceReturn();
      // Não atualiza lastUsedAt - mantém bloqueado até bumerangue sumir
      return;
    }

    const origin = player.pos.clone();
    const {
      maxDistance,
      outSpeed,
      returnSpeed,
      width,
      height,
      baseDamage,
      returnDamage,
      rotationSpeed,
      catchRadius,
      cooldownReduction,
      predictionTime,
    } = BOOMERANG_CONFIG;

    // Pega velocidade do player do gameState
    const playerSpeed = gameState.moveSpeed;

    // Direção baseada no movimento do player ou inimigo mais próximo
    const dir = getPlayerDirection(k, player);
    const unit = k.vec2(dir.x, dir.y);

    const proj = k.add([
      k.rect(width, height),
      k.pos(origin.x, origin.y),
      k.color(255, 255, 100),
      k.outline(2, k.rgb(255, 255, 255)),
      k.area(),
      k.anchor("center"),
      k.rotate(0),
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

    // Função auxiliar para iniciar retorno com predição
    const startReturn = () => {
      if (proj!.phase === "out") {
        proj!.phase = "back";
        // Prediz para onde o player está indo
        const predicted = getPredictedPlayerPosition(
          k,
          player,
          predictionTime,
          playerSpeed,
        );
        proj!.returnTarget = predicted;
        const back = k
          .vec2(
            proj!.returnTarget.x - proj!.pos.x,
            proj!.returnTarget.y - proj!.pos.y,
          )
          .unit();
        proj!.vel = back.scale(returnSpeed);
      }
    };

    // Função para forçar retorno
    proj!.forceReturn = startReturn;

    activeBoomerang = proj;

    proj!.onUpdate(() => {
      // Rotação contínua (rotações por segundo * 360 graus)
      proj!.rotation += rotationSpeed * k.dt() * 360;
      proj!.angle = proj!.rotation;

      const step = proj!.vel.scale(k.dt());
      proj!.pos.x += step.x;
      proj!.pos.y += step.y;
      proj!.traveled += step.len();

      // Fase de ida: verifica distância máxima
      if (proj!.phase === "out" && proj!.traveled >= maxDistance) {
        startReturn();
      }

      // Fase de volta: NÃO atualiza direção - vai em linha reta para returnTarget
      if (proj!.phase === "back" && proj!.returnTarget) {
        // Verifica se o player apanhou o bumerangue (player precisa estar perto)
        const distToPlayer = proj!.pos.dist(player.pos);
        if (distToPlayer < catchRadius) {
          // Apanhou! Cooldown começa agora com redução
          const skillId = "boomerang-bolt";
          const fullCd = 4000; // cooldown base
          const reduction = fullCd * cooldownReduction;
          gameState.skills.lastUsedAt[skillId] = Date.now() - reduction;

          activeBoomerang = null;
          proj!.destroy();
          return;
        }
        // Bumerangue continua infinitamente até colidir com parede ou ser apanhado
      }
    });

    proj!.onCollide("enemy", (e: any) => {
      if (typeof e.hp === "number") {
        const damage = proj!.phase === "back" ? returnDamage : baseDamage;
        e.hp -= damage;
        if (e.hp <= 0) e.destroy();
      }
    });

    proj!.onCollide("arena-wall", () => {
      // Bumerangue é destruído ao bater na parede
      gameState.skills.lastUsedAt["boomerang-bolt"] = Date.now();
      activeBoomerang = null;
      proj!.destroy();
    });

    // Cleanup quando destruído
    proj!.onDestroy(() => {
      if (activeBoomerang === proj) {
        activeBoomerang = null;
      }
    });
  },
});
