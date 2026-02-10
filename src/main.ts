import kaplay from "kaplay";
import { createPlayer } from "./components/player";
import { createArena } from "./components/walls";
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

const k = kaplay();

k.loadRoot("./");

k.setBackground(k.rgb(0, 0, 0));

const MAP_STATE = 1;

const player = createPlayer(k, {
  size: 60,
  speed: gameState.moveSpeed,
  mapState: MAP_STATE,
  hp: gameState.maxHealth,
});
const arena = createArena(k, {
  center: player.pos.clone(),
  mapState: MAP_STATE,
});

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
        // XP increases when enemy dies (not on pick-up)
        gameState.xp += 1;
        if (gameState.xp >= gameState.xpToLevel) {
          gameState.xp -= gameState.xpToLevel;
          gameState.level += 1;
          gameState.xpToLevel = Math.floor(gameState.xpToLevel * 1.3);
        }
        ui.updateXP(gameState.xp, gameState.xpToLevel, gameState.level);

        // If wave finished, show Play to start next and advance wave
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
  (p as any).hp = Math.max(0, (p as any).hp - 30);
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
