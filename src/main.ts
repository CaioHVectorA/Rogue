import kaplay from "kaplay";
import { createPlayer } from "./components/player";
import { createArena, getMapStateForWave } from "./components/walls";
import type { ArenaResult } from "./components/walls";
import { createEnemy } from "./components/enemy";
import { setupUI } from "./components/ui";
import { setupShop } from "./components/shop";
import { gameState } from "./state/gameState";
import { useSkill, initCharges } from "./components/skills";
// Register skills
import "./components/skills/coneShot";
import "./components/skills/ricochetShot";
import "./components/skills/shockwave";
import "./components/skills/chainLightning";
import "./components/skills/arcMine";
import "./components/skills/poisonPool";
import "./components/skills/boomerangBolt";
import "./components/skills/summonedTotem";
import "./components/skills/markedShot";
import "./components/skills/orbitalOrbs";
import "./components/skills/attackBuff";
import { skillsName } from "./state/skillData";
import { spawnOrbs } from "./components/skills/orbitalOrbs";

// ── XP rewards per enemy type ──
const ENEMY_XP_REWARDS: Record<string, number> = {
  red: 2,
  blue: 3,
  green: 2,
  stone: 5,
  purple: 2,
  smart: 3,
  red_elite: 5,
  blue_elite: 6,
  green_elite: 5,
  stone_elite: 10,
  purple_elite: 5,
  smart_elite: 6,
};

const k = kaplay();

k.loadRoot("./");

k.setBackground(k.rgb(0, 0, 0));

// ── Mapa dinâmico ──
// O mapState inicial pode vir do debug ou ser calculado pela wave atual.
const initialMapState = gameState.mapState;

const player = createPlayer(k, {
  size: 60,
  speed: gameState.moveSpeed,
  mapState: initialMapState,
  hp: gameState.maxHealth,
});

// Arena mutável — referência atualizada quando o mapa cresce
let arena: ArenaResult = createArena(k, {
  center: player.pos.clone(),
  mapState: initialMapState,
});

/**
 * Reconstrói a arena para um novo mapState.
 * Destrói paredes antigas, cria novas, reposiciona jogador e ajusta câmera.
 */
function rebuildArena(newMapState: number) {
  // Destruir paredes antigas
  arena.walls.forEach((w) => w.destroy());

  gameState.mapState = newMapState;

  // Recalcular centro (usar centro da tela)
  const center = k.vec2(k.width() / 2, k.height() / 2);

  // Criar nova arena
  arena = createArena(k, {
    center,
    mapState: newMapState,
  });

  // Ajustar câmera conforme novo mapState
  let camScaleVal: number;
  switch (newMapState) {
    case 1:
      camScaleVal = 1.15;
      break;
    case 2:
      camScaleVal = 1.0;
      break;
    case 3:
      camScaleVal = 0.8;
      break;
    case 4:
      camScaleVal = 0.72;
      break;
    case 5:
      camScaleVal = 0.82;
      break;
    default:
      camScaleVal = 1.0;
  }
  k.camScale(k.vec2(camScaleVal));

  // Reposicionar jogador no centro se ficou fora dos limites
  const margin = 60;
  if (
    player.pos.x < arena.x + margin ||
    player.pos.x > arena.x + arena.w - margin ||
    player.pos.y < arena.y + margin ||
    player.pos.y > arena.y + arena.h - margin
  ) {
    player.pos = center.clone();
  }

  // Câmera segue jogador somente no mapState 5
  if (newMapState !== 5) {
    k.camPos(center);
  }
}

// UI
const ui = setupUI(k);
ui.updateHearts((player as any).hp ?? gameState.maxHealth);
ui.updateGold(gameState.gold);
ui.updateXP(gameState.xp, gameState.xpToLevel, gameState.level);
ui.updateWave(gameState.wave);
ui.setPlayVisible(true);

// Shop setup
setupShop(k, ui, player);
ui.refreshShopStats();

// Collect gold drops on overlap with player
k.onCollide("player", "gold-drop", (p: any, drop: any) => {
  gameState.gold += drop.value ?? 1;
  ui.updateGold(gameState.gold);
  ui.refreshShopStats();
  drop.destroy();
});

// Collect elevation point drops
k.onCollide("player", "elevation-drop", (p: any, drop: any) => {
  gameState.elevationPoints += 1;
  ui.refreshShopStats();
  drop.destroy();
});

// Track enemies left in current wave
let enemiesLeft = 0;
function spawnWave(waveIndex: number) {
  const waveDef = gameState.waves[waveIndex - 1];
  if (!waveDef) return;
  enemiesLeft = 0;

  // spawn based on array of types
  for (const entry of waveDef) {
    for (let i = 0; i < entry.count; i++) {
      const e = createEnemy(k, {
        target: player,
        arenaBounds: arena,
        type: entry.type,
      });
      enemiesLeft += 1;
      e.onDestroy(() => {
        enemiesLeft -= 1;
        // XP varies per enemy type
        const xpReward = ENEMY_XP_REWARDS[(e as any).enemyType] ?? 1;
        gameState.xp += xpReward;
        if (gameState.xp >= gameState.xpToLevel) {
          gameState.xp -= gameState.xpToLevel;
          gameState.level += 1;
          gameState.elevationPoints += 3; // +3 elevation points per level up
          gameState.xpToLevel = Math.floor(gameState.xpToLevel * 1.3);
        }
        ui.updateXP(gameState.xp, gameState.xpToLevel, gameState.level);

        // If wave finished, advance wave
        if (enemiesLeft <= 0) {
          gameState.wave += 1;
          ui.updateWave(gameState.wave);
          ui.setPlayVisible(true);
        }
      });
    }
  }
}

// Start wave when pressing Play
ui.onPlayClick(() => {
  // Verificar se o mapa precisa crescer antes da nova wave
  const targetMapState = getMapStateForWave(gameState.wave);
  if (targetMapState > gameState.mapState) {
    rebuildArena(targetMapState);
  }

  // hide button during wave
  ui.setPlayVisible(false);
  // start or advance wave
  spawnWave(gameState.wave);
});

// Player damage on enemy collision with per-enemy cooldown
k.onCollide("player", "enemy", (p: any, e: any) => {
  const now = Date.now();
  if ((e.lastDamageTime ?? 0) + gameState.enemyDamageCooldownMs > now) return;
  e.lastDamageTime = now;
  const dmg = e.damage ?? 1;
  (p as any).hp = Math.max(0, ((p as any).hp ?? gameState.maxHealth) - dmg);
  ui.updateHearts((p as any).hp);
  if ((p as any).hp <= 0) {
    // simple kaboom on death
    k.addKaboom(p.pos.clone());
  }
});
k.onCollide("player", "enemy-bullet", (p: any, bb: any) => {
  bb.destroy();
  const bulletDmg = bb.damage ?? 30;
  (p as any).hp = Math.max(0, (p as any).hp - bulletDmg);
  ui.updateHearts((p as any).hp);
  if ((p as any).hp <= 0) {
    // simple kaboom on death
    k.addKaboom(p.pos.clone());
  }
});

// Remove forcing empty skill; rely on UI overlay gating
gameState.skills.skill1 = gameState.skills.skill1 || ("" as skillsName | "");

// Auto-spawn orbital orbs se a skill está equipada
if (gameState.skills.skill1 === "orbital-orbs") {
  spawnOrbs(k, player);
}

// Inicializa cargas da skill equipada (se tiver sistema de cargas)
if (gameState.skills.skill1) {
  initCharges(gameState.skills.skill1);
}

k.onKeyPress("q", () => {
  const id = gameState.skills.skill1;
  if (!id) return;
  useSkill(id, k, player);
});
