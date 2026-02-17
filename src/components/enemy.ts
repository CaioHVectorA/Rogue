import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { speed } from "./speed";
import { movimentable } from "./movimentable";
import { spawnGoldDrop } from "./gold";
import { Enemies, ENEMY_PRESETS } from "./enemies";
import {
  applyGreenBehavior,
  applyRedBehavior,
  applyPurpleBehavior,
  applySmartBehavior,
} from "./behaviors";
import { gameState } from "../state/gameState";
import {
  getGoldWeightsByLuck,
  pickGoldTier,
  getGoldColor,
  getGoldScale,
} from "../state/luck";
import { getMarksToExplode } from "./skills/markedShot";

export type EnemyOptions = {
  pos?: Vec2;
  size?: number;
  color?: [number, number, number];
  speed?: number;
  target: GameObj;
  arenaBounds?: { x: number; y: number; w: number; h: number };
  margin?: number;
  hp?: number;
  type?: Enemies;
  damage?: number;
};

export function createEnemy(k: KAPLAYCtx, opts: EnemyOptions): GameObj {
  const type = opts.type ?? "red";
  const preset = ENEMY_PRESETS[type];
  const s = opts.size ?? preset.size;
  const spd = opts.speed ?? preset.speed; // default based on type
  const margin = opts.margin ?? 32; // avoid spawning inside walls
  const arena = opts.arenaBounds;
  const playerPos = opts.target.pos.clone();
  const minSpawnDist = 180; // minimum distance from player
  let startPos =
    opts.pos ??
    (arena
      ? k.vec2(
          k.rand(arena.x + margin, arena.x + arena.w - margin),
          k.rand(arena.y + margin, arena.y + arena.h - margin),
        )
      : k.vec2(k.rand(0, k.width()), k.rand(0, k.height())));
  // Reposition if too close to player
  if (startPos.dist(playerPos) < minSpawnDist) {
    const dir = playerPos
      .sub(k.vec2(k.rand(0, k.width()), k.rand(0, k.height())))
      .unit();
    startPos = playerPos.add(dir.scale(minSpawnDist));
  }
  const color = opts.color ?? preset.color;
  const maxHP = opts.hp ?? preset.hp;
  const dmg = opts.damage ?? preset.damage;

  const isElite = type.endsWith("_elite");
  const outlineColor = isElite ? k.rgb(255, 215, 0) : k.rgb(0, 0, 0);
  const outlineThick = isElite ? 4 : 3;

  const enemy = k.add([
    k.rect(s, s),
    k.pos(startPos.x, startPos.y),
    k.color(color[0], color[1], color[2]),
    k.outline(outlineThick, outlineColor),
    k.area(),
    k.body(), // enable physics collisions with walls and other enemies
    speed({ value: spd }),
    movimentable(k, {
      getDirection: (self) => {
        // Chase the target based on current position
        return opts.target.pos.sub(self.pos);
      },
    }),
    {
      id: "enemy",
      enemyType: type,
      name: preset.name,
      hp: maxHP,
      maxHp: maxHP,
      marks: 0,
      marksDecayTimer: 0, // tempo desde última marca (reseta ao estacar)
      poisonStacks: 0, // acúmulos de veneno (sistema desacoplado)
      poisonTickTimer: 0, // timer interno do sistema de veneno
      damage: dmg,
      lastDamageTime: 0,
      defaultSpeed: spd,
      update(this: GameObj & { hp: number; maxHp: number }) {
        // keep inside arena bounds by nudging back if beyond
        if (arena) {
          const minX = arena.x + margin;
          const maxX = arena.x + arena.w - margin;
          const minY = arena.y + margin;
          const maxY = arena.y + arena.h - margin;
          this.pos.x = k.clamp(this.pos.x, minX, maxX);
          this.pos.y = k.clamp(this.pos.y, minY, maxY);
        }
        // Red-specific schooling: tend to group with nearby reds
        if (this.enemyType === "red" || this.enemyType === "red_elite") {
          applyRedBehavior(k, this as any);
        }
        if (this.enemyType === "green" || this.enemyType === "green_elite") {
          applyGreenBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "purple" || this.enemyType === "purple_elite") {
          applyPurpleBehavior(k, this as any, opts.target);
        }
        if (this.enemyType === "smart" || this.enemyType === "smart_elite") {
          applySmartBehavior(k, this as any, opts.target);
        }
      },
    },
  ]) as GameObj & {
    hp: number;
    maxHp: number;
    marks: number;
    marksDecayTimer: number;
    speed?: number;
    damage: number;
    lastDamageTime: number;
    enemyType: "red" | "blue";
  };

  // Collide with walls: body handles resolution; add small bounce feedback
  enemy.onCollide("arena-wall", () => {
    const away = enemy.pos.sub(opts.target.pos).unit();
    enemy.move(away.scale(enemy.speed ?? spd));
  });

  // --- Borda de vida (4 linhas percorrendo o perímetro) ---
  const outlineWidth = 3;
  const halfOut = outlineWidth / 2;
  const fullLen = s + outlineWidth;

  // Top: cresce da esquerda → direita, ancorado no topleft
  const hpTop = enemy.add([
    k.rect(1, outlineWidth),
    k.pos(-halfOut, -halfOut),
    k.color(255, 255, 255),
    k.scale(fullLen, 1),
    k.z(10),
    { id: "hp-border-top" },
  ]);
  // Right: some de cima → baixo, ancorado embaixo
  const hpRight = enemy.add([
    k.rect(outlineWidth, 1),
    k.pos(s - halfOut, s + halfOut),
    k.color(255, 255, 255),
    k.scale(1, fullLen),
    k.anchor("botleft"),
    k.z(10),
    { id: "hp-border-right" },
  ]);
  // Bottom: some da direita → esquerda, ancorado na esquerda
  const hpBottom = enemy.add([
    k.rect(1, outlineWidth),
    k.pos(-halfOut, s - halfOut),
    k.color(255, 255, 255),
    k.scale(fullLen, 1),
    k.z(10),
    { id: "hp-border-bottom" },
  ]);
  // Left: some de baixo → cima, ancorado no topo
  const hpLeft = enemy.add([
    k.rect(outlineWidth, 1),
    k.pos(-halfOut, -halfOut),
    k.color(255, 255, 255),
    k.scale(1, fullLen),
    k.z(10),
    { id: "hp-border-left" },
  ]);

  // --- Indicadores visuais de marcas (marked shot) ---
  const MAX_MARKS = 5;
  const markSize = 4;
  const markGap = 2;
  const totalMarksWidth = MAX_MARKS * markSize + (MAX_MARKS - 1) * markGap;
  const marksStartX = (s - totalMarksWidth) / 2;

  const markDots: GameObj[] = [];
  for (let i = 0; i < MAX_MARKS; i++) {
    const dot = enemy.add([
      k.rect(markSize, markSize),
      k.pos(marksStartX + i * (markSize + markGap), -markSize - 10),
      k.color(60, 60, 60),
      k.z(11),
      { id: "mark-dot" },
    ]);
    dot.hidden = true;
    markDots.push(dot);
  }

  // --- Indicador visual de veneno (ícone + contador) ---
  const poisonLabel = enemy.add([
    k.text("", { size: 10 }),
    k.pos(s + 4, -2),
    k.color(80, 230, 60),
    k.z(12),
    { id: "poison-label" },
  ]);
  poisonLabel.hidden = true;

  enemy.onUpdate(() => {
    const ratio = Math.max(0, (enemy as any).hp / (enemy as any).maxHp);
    // Sentido horário de preenchimento:
    //   75-100% → top       (esq→dir)  — última a esvaziar
    //   50-75%  → right     (cima→baixo)
    //   25-50%  → bottom    (dir→esq)
    //   0-25%   → left      (baixo→cima) — primeira a esvaziar
    const pct = ratio * 100;

    // Top: preenche de 75-100% (última a sumir)
    {
      const seg = Math.max(0, Math.min(pct - 75, 25)) / 25;
      hpTop.scale = k.vec2(seg * fullLen, 1);
    }
    // Right: preenche de 50-75%
    {
      const seg = Math.max(0, Math.min(pct - 50, 25)) / 25;
      hpRight.scale = k.vec2(1, seg * fullLen);
    }
    // Bottom: preenche de 25-50%
    {
      const seg = Math.max(0, Math.min(pct - 25, 25)) / 25;
      hpBottom.scale = k.vec2(seg * fullLen, 1);
    }
    // Left: preenche de 0-25% (primeira a sumir)
    {
      const seg = Math.max(0, Math.min(pct, 25)) / 25;
      hpLeft.scale = k.vec2(1, seg * fullLen);
    }

    // --- Atualizar visual das marcas + expiração ---
    const e = enemy as any;
    const currentMarks = e.marks ?? 0;

    // Timer de expiração: se tem marcas, incrementa timer
    if (currentMarks > 0) {
      e.marksDecayTimer += k.dt();
      // Após 3s sem receber nova marca, marcas expiram
      if (e.marksDecayTimer >= 3) {
        e.marks = 0;
        e.marksDecayTimer = 0;
      }
    }

    const hasMarks = (e.marks ?? 0) > 0;
    const activeMaxMarks = getMarksToExplode(
      gameState.skills.levels["marked-shot"] ?? 1,
    );
    for (let i = 0; i < MAX_MARKS; i++) {
      // Esconde dots acima do limite atual
      if (i >= activeMaxMarks) {
        markDots[i].hidden = true;
        continue;
      }
      markDots[i].hidden = !hasMarks;
      if (hasMarks) {
        if (i < (e.marks ?? 0)) {
          // Marca ativa: vermelho/rosa
          markDots[i].color = k.rgb(255, 80, 100);
        } else {
          // Marca vazia: cinza escuro
          markDots[i].color = k.rgb(60, 60, 60);
        }
      }
    }

    // --- Atualizar indicador de veneno ---
    const pStacks = e.poisonStacks ?? 0;
    if (pStacks > 0) {
      poisonLabel.hidden = false;
      (poisonLabel as any).text = `☠${pStacks}`;
      // Cor fica mais intensa com mais stacks
      const intensity = Math.min(pStacks / 10, 1);
      poisonLabel.color = k.rgb(
        60 + intensity * 40,
        180 + intensity * 75,
        40 + intensity * 20,
      );
    } else {
      poisonLabel.hidden = true;
    }
  });

  // Collide with other enemies to avoid overlapping
  enemy.onCollide("enemy", (other: GameObj) => {
    const push = enemy.pos.sub(other.pos).unit();
    enemy.move(push.scale(20));
  });

  enemy.onDestroy(() => {
    // Compute gold drop based on luck table
    const luck = gameState.luck;
    const weights = getGoldWeightsByLuck(luck);
    const tier = pickGoldTier(weights, k.rand);
    const amount = tier;
    const drop = spawnGoldDrop(k, enemy.pos.clone(), amount);
    // Apply color and scale based on tier
    const [r, g, b] = getGoldColor(tier);
    drop.color = k.rgb(r, g, b);
    drop.scale = k.vec2(getGoldScale(tier), getGoldScale(tier));

    // Rare chance to drop an elevation point (luck makes it more likely)
    // Base chance: 1.5%, scales with luck up to ~7.5% at luck 3.0
    const elevChance = 0.015 * luck;
    if (Math.random() < elevChance) {
      // Spawn a visual elevation point drop (star)
      const starSize = 14;
      const star = k.add([
        k.rect(starSize, starSize),
        k.pos(enemy.pos.x - starSize / 2 + 12, enemy.pos.y - starSize / 2),
        k.color(180, 140, 255),
        k.outline(2, k.rgb(255, 220, 100)),
        k.area(),
        k.opacity(1),
        k.z(55),
        {
          id: "elevation-drop",
          age: 0,
          blinkT: 0,
        },
      ]);
      // Animate the star
      star.onUpdate(() => {
        if (!star.exists()) return;
        (star as any).age += k.dt();
        // Expires after 20s
        if ((star as any).age >= 20) { star.destroy(); return; }
        // Blink after 15s
        if ((star as any).age >= 15) {
          (star as any).blinkT += k.dt();
          const remaining = 20 - (star as any).age;
          const blinkRate = remaining < 2 ? 0.08 : remaining < 3 ? 0.12 : 0.2;
          star.opacity = Math.sin((star as any).blinkT / blinkRate * Math.PI) > 0 ? 1 : 0.2;
        }
        // Magnetism toward player (same as gold)
        const players = k.get("player");
        if (players.length > 0) {
          const player = players[0];
          const dist = star.pos.dist(player.pos);
          if (dist < 120 && dist > 2) {
            const dir = player.pos.sub(star.pos).unit();
            star.move(dir.scale(400 * (1 + (1 - dist / 120) * 2)));
          }
        }
      });
    }
  });

  return enemy;
}
