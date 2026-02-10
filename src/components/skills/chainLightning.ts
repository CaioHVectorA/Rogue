import type { GameObj, KAPLAYCtx } from "kaplay";
import { registerSkill, addImpactFlash } from "./registry";
import { gameState } from "../../state/gameState";
import { addShockStacks, onElectrocution } from "./shock";

// ===== Tabela de escalamento por nível =====
type ChainLevelData = {
  damage: number;
  initialRadius: number;
  maxChainTargets: number;
  baseShockStacks: number;
  chainShockStacks: number;
  cooldown: number;
  cdReductionPerElectrocute: number; // ms de CD reduzido por eletrocução (passiva)
};

const CHAIN_LEVELS: ChainLevelData[] = [
  // level 1
  { damage: 2, initialRadius: 400, maxChainTargets: 2, baseShockStacks: 3, chainShockStacks: 1, cooldown: 3000, cdReductionPerElectrocute: 600 },
  // level 2
  { damage: 2, initialRadius: 450, maxChainTargets: 3, baseShockStacks: 4, chainShockStacks: 2, cooldown: 2800, cdReductionPerElectrocute: 800 },
  // level 3
  { damage: 3, initialRadius: 500, maxChainTargets: 3, baseShockStacks: 5, chainShockStacks: 2, cooldown: 2600, cdReductionPerElectrocute: 1000 },
  // level 4
  { damage: 3, initialRadius: 550, maxChainTargets: 4, baseShockStacks: 5, chainShockStacks: 3, cooldown: 2400, cdReductionPerElectrocute: 1000 },
  // level 5
  { damage: 4, initialRadius: 600, maxChainTargets: 4, baseShockStacks: 6, chainShockStacks: 3, cooldown: 2200, cdReductionPerElectrocute: 1000 },
];

function getLevelData(): ChainLevelData {
  const lvl = gameState.skills.levels["chain-lightning"] ?? 1;
  return CHAIN_LEVELS[Math.min(lvl, CHAIN_LEVELS.length) - 1];
}

const CHAIN_CONFIG = {
  boltWidth: 4, // largura da linha visual
  boltDuration: 0.8, // duração da linha visual (segundos)
  immunityDuration: 5000, // 5 segundos de imunidade
  projectileSpeed: 560, // velocidade do projétil inicial
  projectileSize: 10,
} as const;

// ===== Passiva: reduz cooldown ao eletrocutar =====
let passiveRegistered = false;
function ensurePassive(k: KAPLAYCtx): void {
  if (passiveRegistered) return;
  passiveRegistered = true;

  onElectrocution(k, (_enemy) => {
    // Só funciona se chain-lightning está equipada
    const skillId = "chain-lightning";
    if (gameState.skills.skill1 !== skillId && gameState.skills.skill2 !== skillId) return;

    const last = gameState.skills.lastUsedAt[skillId] ?? 0;
    if (last <= 0) return; // já disponível

    const { cdReductionPerElectrocute } = getLevelData();
    // Avança o timestamp de último uso, efetivamente reduzindo o cooldown restante
    gameState.skills.lastUsedAt[skillId] = last - cdReductionPerElectrocute;

    // Visual sutil de feedback: flash azul no HUD (via label flutuante no player)
    spawnCooldownReductionLabel(k);
  });
}

function spawnCooldownReductionLabel(k: KAPLAYCtx): void {
  const player = k.get("player")[0];
  if (!player) return;

  const label = k.add([
    k.text("⚡-1s CD", { size: 11 }),
    k.pos(player.pos.x + (Math.random() - 0.5) * 30, player.pos.y - 30),
    k.anchor("center"),
    k.color(120, 200, 255),
    k.outline(1, k.rgb(20, 40, 80)),
    k.opacity(0.9),
    k.z(900),
    { id: "cd-reduce-label", t: 0 },
  ]) as GameObj & { t: number };
  label.onUpdate(() => {
    label.t += k.dt();
    label.pos.y -= 30 * k.dt();
    if (label.t > 0.4) {
      label.opacity = 0.9 * (1 - (label.t - 0.4) / 0.5);
    }
    if (label.t >= 0.9) label.destroy();
  });
}

// Map para rastrear inimigos imunes (enemy -> timestamp de quando a imunidade expira)
const immuneEnemies = new Map<GameObj, number>();

function isImmune(enemy: GameObj): boolean {
  const expireTime = immuneEnemies.get(enemy);
  if (!expireTime) return false;
  if (Date.now() > expireTime) {
    immuneEnemies.delete(enemy);
    return false;
  }
  return true;
}

function markImmune(enemy: GameObj): void {
  immuneEnemies.set(enemy, Date.now() + CHAIN_CONFIG.immunityDuration);
}

function getPlayerDirection(
  k: KAPLAYCtx,
  player: GameObj,
): { x: number; y: number } {
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

  const enemies = k.get("enemy") as GameObj[];
  if (enemies.length > 0) {
    let nearest: GameObj | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const e of enemies) {
      const d = player.pos.dist(e.pos);
      if (d < best) {
        best = d;
        nearest = e;
      }
    }
    if (nearest) {
      const dir = nearest.pos.sub(player.pos);
      if (dir.len() > 0) {
        const unit = dir.unit();
        return { x: unit.x, y: unit.y };
      }
    }
  }

  return { x: 1, y: 0 };
}

function findNearbyEnemies(
  k: KAPLAYCtx,
  from: { x: number; y: number },
  radius: number,
  maxCount: number,
): GameObj[] {
  const enemies = k.get("enemy") as GameObj[];
  const nearby: Array<{ enemy: GameObj; dist: number }> = [];

  for (const enemy of enemies) {
    if (isImmune(enemy)) continue;
    const dist = Math.hypot(enemy.pos.x - from.x, enemy.pos.y - from.y);
    if (dist <= radius && dist > 10) {
      nearby.push({ enemy, dist });
    }
  }

  nearby.sort((a, b) => a.dist - b.dist);
  return nearby.slice(0, maxCount).map((n) => n.enemy);
}

/**
 * Desenha uma linha instantânea (aresta do grafo) entre dois pontos.
 * A linha aparece, pisca e desaparece com fade-out.
 */
function drawLightningEdge(
  k: KAPLAYCtx,
  from: { x: number; y: number },
  to: { x: number; y: number },
  depth: number = 0,
): void {
  const { boltWidth, boltDuration } = CHAIN_CONFIG;
  // Cada nível de profundidade fica mais transparente
  const maxOpacity = Math.max(0.2, 1 - depth * 0.25);

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  // Centro do segmento
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2;

  // Ângulo base em graus
  const baseDeg = k.rad2deg(angle);

  const edge = k.add([
    k.rect(dist, boltWidth),
    k.pos(cx, cy),
    k.anchor("center"),
    k.rotate(baseDeg),
    k.color(255, 255, 180),
    k.outline(1, k.rgb(255, 255, 140)),
    k.opacity(maxOpacity),
    k.z(999),
    {
      id: "chain-lightning-edge",
      t: 0,
      duration: boltDuration,
      baseOpacity: maxOpacity,
      baseCx: cx,
      baseCy: cy,
      baseDeg: baseDeg,
    },
  ]) as GameObj & {
    t: number;
    duration: number;
    baseOpacity: number;
    baseCx: number;
    baseCy: number;
    baseDeg: number;
  };

  edge.onUpdate(() => {
    edge.t += k.dt();
    const progress = Math.min(edge.t / edge.duration, 1);

    // --- Efeito de tremor elétrico ---
    // Amplitude do shake diminui com o tempo
    const shakeIntensity = 3 * (1 - progress);
    // Offset perpendicular aleatório (simula corrente elétrica)
    const shakeOffset = (Math.random() - 0.5) * 2 * shakeIntensity;
    // Aplica offset perpendicular ao ângulo da linha
    const perpX = -Math.sin(angle) * shakeOffset;
    const perpY = Math.cos(angle) * shakeOffset;
    edge.pos.x = edge.baseCx + perpX;
    edge.pos.y = edge.baseCy + perpY;
    // Leve variação de rotação
    edge.angle = edge.baseDeg + (Math.random() - 0.5) * shakeIntensity * 0.8;

    // --- Cores amarelo-claro com flicker ---
    if (progress < 0.15) {
      // Flash quase branco
      edge.color = k.rgb(255, 255, 240);
      edge.opacity = edge.baseOpacity;
    } else if (progress < 0.3) {
      // Amarelo claro com flicker
      const flicker = Math.random() > 0.5 ? 255 : 240;
      edge.color = k.rgb(flicker, flicker, flicker * 0.7);
      edge.opacity = edge.baseOpacity;
    } else {
      // Amarelo claro → branco-amarelado, fade out
      const fade = 1 - (progress - 0.3) / 0.7;
      edge.color = k.rgb(255 * fade + 60, 255 * fade + 60, 160 * fade + 40);
      edge.opacity = edge.baseOpacity * fade;
    }

    if (edge.t >= edge.duration) {
      edge.destroy();
    }
  });
}

/**
 * Encadeia o raio recursivamente como um grafo instantâneo:
 * - Dano + imunidade em cada inimigo atingido
 * - Aplica stacks de choque
 * - Desenha arestas (linhas) entre os nós (inimigos)
 * - Reduz o raio a cada nível de profundidade
 */
function chainFromEnemy(
  k: KAPLAYCtx,
  source: { x: number; y: number },
  enemy: GameObj,
  radius: number,
  depth: number = 0,
): void {
  const { damage, maxChainTargets, chainShockStacks } = getLevelData();

  // Se o inimigo já é imune ou não existe, não faz nada
  if (!enemy.exists() || isImmune(enemy)) return;

  // Aplica dano
  const e = enemy as any;
  if (typeof e.hp === "number") {
    e.hp -= damage;
    if (e.hp <= 0) e.destroy();
  }

  // Marca como imune
  markImmune(enemy);

  // Aplica stacks de choque (mais stacks quanto mais perto da fonte)
  const shockAmount = Math.max(1, chainShockStacks - Math.floor(depth / 2));
  if (enemy.exists()) {
    addShockStacks(k, enemy, shockAmount);
  }

  // Desenha a aresta (linha) do source até este inimigo
  drawLightningEdge(k, source, { x: enemy.pos.x, y: enemy.pos.y }, depth);

  // Flash visual no inimigo
  addImpactFlash(k, enemy.pos.clone(), [255, 255, 170], {
    target: enemy,
    size: 18,
    duration: 0.25,
  });

  // Recursão: procura vizinhos com raio reduzido
  const newRadius = radius / 2;
  if (newRadius >= 50 && enemy.exists()) {
    const nextTargets = findNearbyEnemies(
      k,
      { x: enemy.pos.x, y: enemy.pos.y },
      newRadius,
      maxChainTargets,
    );

    for (const nextTarget of nextTargets) {
      // Encadeia instantaneamente (sem delay, sem projétil)
      chainFromEnemy(
        k,
        { x: enemy.pos.x, y: enemy.pos.y },
        nextTarget,
        newRadius,
        depth + 1,
      );
    }
  }
}

registerSkill({
  id: "chain-lightning",
  getCooldown: (level) => CHAIN_LEVELS[Math.min(level, CHAIN_LEVELS.length) - 1].cooldown,
  use: ({ k, player }) => {
    // Registra passiva na primeira utilização
    ensurePassive(k);

    const levelData = getLevelData();
    const { damage, initialRadius, maxChainTargets, baseShockStacks } = levelData;
    const { projectileSpeed, projectileSize } = CHAIN_CONFIG;

    const origin = player.pos.clone();
    const dir = getPlayerDirection(k, player);
    const unit = k.vec2(dir.x, dir.y);

    // Cria projétil inicial (viaja até atingir o primeiro inimigo)
    const proj = k.add([
      k.rect(projectileSize, projectileSize),
      k.pos(origin.x, origin.y),
      k.color(255, 255, 180),
      k.outline(2, k.rgb(255, 255, 140)),
      k.area(),
      k.anchor("center"),
      {
        id: "chain-lightning-proj",
        vel: unit.scale(projectileSpeed),
      },
    ]) as GameObj & { vel: any };

    proj.onUpdate(() => {
      const step = proj.vel.scale(k.dt());
      proj.pos.x += step.x;
      proj.pos.y += step.y;

      if (proj.pos.dist(origin) > 1500) {
        proj.destroy();
      }
    });

    proj.onCollide("enemy", (enemy: any) => {
      const hitPos = { x: proj.pos.x, y: proj.pos.y };

      // Aplica dano ao primeiro inimigo
      if (typeof enemy.hp === "number") {
        enemy.hp -= damage;
        if (enemy.hp <= 0) enemy.destroy();
      }

      // Marca como imune
      markImmune(enemy);

      // Aplica stacks de choque no primeiro alvo (mais forte)
      if (enemy.exists()) {
        addShockStacks(k, enemy, baseShockStacks);
      }

      // Flash visual no primeiro inimigo
      addImpactFlash(k, proj.pos.clone(), [255, 255, 170], {
        target: enemy,
        size: 24,
        duration: 0.3,
      });

      // Encadeia instantaneamente (grafo) — linhas visuais + dano imediato
      const targets = findNearbyEnemies(
        k,
        hitPos,
        initialRadius,
        maxChainTargets,
      );

      for (const target of targets) {
        chainFromEnemy(k, hitPos, target, initialRadius);
      }

      proj.destroy();
    });

    proj.onCollide("arena-wall", () => proj.destroy());
  },
});
