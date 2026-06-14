import kaplay from "kaplay";
import { createPlayer } from "./components/player";
import { createArena, getMapStateForWave } from "./components/walls";
import type { ArenaResult } from "./components/walls";
import { createEnemy } from "./components/enemy";
import { setupUI } from "./components/ui";
import { setupShop } from "./components/shop";
import { gameState } from "./state/gameState";
import { useSkill, initCharges } from "./components/skills";
import {
  onKillReduceQCooldown,
  getZonaDePerigoDefenseMul,
  updateFireAuraPerk,
  updateRastroNocivo,
  updateOndaDeChoquePerk,
  triggerOndaDeChoquePerk,
  hasPerk,
  checkIntangibilidadeTrigger,
  showLuckyBlockFeedback,
} from "./components/perks";
// Register skills
import "./components/skills/coneShot";
import "./components/skills/ricochetShot";
// shockwave skill temporarily disabled
import "./components/skills/chainLightning";
import "./components/skills/arcMine";
import "./components/skills/poisonPool";
// boomerang skill temporarily disabled
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

// Interpolated camera scale targets
let targetCamScale = 1.15;
k.onUpdate(() => {
  const current = k.camScale();
  const diff = targetCamScale - current.x;
  if (Math.abs(diff) > 0.001) {
    const newVal = k.lerp(current.x, targetCamScale, k.dt() * 3);
    k.camScale(k.vec2(newVal));
  }
  if (player && player.exists()) {
    updateFireAuraPerk(k, player);
    updateRastroNocivo(k, player);
    updateOndaDeChoquePerk(k, player);
  }
});

/**
 * Reconstrói a arena para um novo mapState.
 * Destrói paredes antigas, cria novas, reposiciona jogador e ajusta câmera.
 */
function rebuildArena(newMapState: number) {
  const oldX = arena.x;
  const oldY = arena.y;
  const oldW = arena.w;
  const oldH = arena.h;

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

  const newX = arena.x;
  const newY = arena.y;
  const newW = arena.w;
  const newH = arena.h;

  // Visual expanding blue ring/border animation
  const ring = k.add([
    k.rect(oldW, oldH),
    k.pos(oldX, oldY),
    k.color(0, 191, 255), // Deep sky blue
    k.outline(5, k.rgb(0, 255, 255)),
    k.opacity(0.85),
    k.z(100),
  ]);

  // Temporarily dim the new walls and make them color match the ring
  arena.walls.forEach((w) => {
    w.opacity = 0.25;
    w.color = k.rgb(0, 191, 255);
  });

  let t = 0;
  const duration = 0.8;
  const cancelRing = k.onUpdate(() => {
    t += k.dt();
    const pct = Math.min(1, t / duration);
    // Ease out quad
    const ease = 1 - (1 - pct) * (1 - pct);

    const curX = k.lerp(oldX, newX, ease);
    const curY = k.lerp(oldY, newY, ease);
    const curW = k.lerp(oldW, newW, ease);
    const curH = k.lerp(oldH, newH, ease);

    ring.pos = k.vec2(curX, curY);
    (ring as any).width = curW;
    (ring as any).height = curH;
    ring.opacity = 0.85 * (1 - ease);

    if (pct >= 1) {
      ring.destroy();
      // Restore wall opacity and correct color
      arena.walls.forEach((w) => {
        w.opacity = 1;
        w.color = k.rgb(40, 40, 60);
      });
      // Small camera shake to celebrate map expansion impact
      k.shake(2.0);
      cancelRing.cancel();
    }
  });

  // Ajustar câmera conforme novo mapState (smooth zoom transition)
  let camScaleVal: number;
  switch (newMapState) {
    case 1:
      camScaleVal = 1.15;
      break;
    case 2:
      camScaleVal = 1.00;
      break;
    case 3:
      camScaleVal = 0.85;
      break;
    case 4:
      camScaleVal = 0.72;
      break;
    case 5:
      camScaleVal = 0.62;
      break;
    default:
      camScaleVal = 1.0;
  }
  // Update target camera scale for smooth zoom-out
  targetCamScale = camScaleVal;

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

// Check if player has pending perk choices at milestones, then resume/advance wave
function checkMilestonePerksAndResume() {
  const level = gameState.level;
  const acquiredCount = gameState.perks.acquired.length;
  let needsPerk = false;
  if (level >= 5 && acquiredCount < 1) {
    needsPerk = true;
  } else if (level >= 10 && acquiredCount < 2) {
    needsPerk = true;
  }

  if (needsPerk) {
    ui.showPerkSelection();
    const checkTimer = k.onUpdate(() => {
      if (!ui.isPerkSelectionVisible()) {
        checkTimer.cancel();
        checkMilestonePerksAndResume();
      }
    });
  } else {
    gameState.wave += 1;
    ui.updateWave(gameState.wave);
    ui.setPlayVisible(true);
  }
}

// Track enemies left in current wave
let enemiesLeft = 0;
function spawnWave(waveIndex: number) {
  gameState.intangibleUsedThisWave = false;
  const waveDef = gameState.waves[waveIndex - 1];
  if (!waveDef) return;

  let totalCount = 0;
  for (const entry of waveDef) {
    totalCount += entry.count;
  }
  enemiesLeft = totalCount;

  const handleEnemyDeath = (e: any) => {
    enemiesLeft -= 1;
    // XP varies per enemy type
    const xpReward = ENEMY_XP_REWARDS[(e as any).enemyType] ?? 1;
    gameState.xp += xpReward;
    if (gameState.xp >= gameState.xpToLevel) {
      gameState.xp -= gameState.xpToLevel;
      gameState.level += 1;
      gameState.elevationPoints += 3;
      gameState.xpToLevel = Math.floor(gameState.xpToLevel * 1.3);
    }
    ui.updateXP(gameState.xp, gameState.xpToLevel, gameState.level);

    // Execução Limpa: matar reduz CD da skill Q
    const isElite = ((e as any).enemyType ?? "").endsWith("_elite");
    onKillReduceQCooldown(isElite);

    // Vampirism: heal player on kill
    try {
      const vampLv = (gameState.upgrades as any).vampirism ?? 0;
      if (vampLv > 0) {
        const players = k.get("player");
        if (players.length > 0) {
          const p = players[0] as any;
          const missing = Math.max(
            0,
            gameState.maxHealth - (p.hp ?? gameState.maxHealth),
          );
          const fixedHeal = vampLv * 2;
          const pct = Math.min(0.5, 0.03 * vampLv); // 3% per level up to 50%
          const heal = fixedHeal + Math.round(missing * pct);
          p.hp = Math.min(
            gameState.maxHealth,
            (p.hp ?? gameState.maxHealth) + heal,
          );
          gameState.playerHealth = p.hp;
          ui.updateHearts(p.hp);
        }
      }
    } catch (err) {
      // ignore if UI/player not available
    }

    // Escudo de Cura (escudo-vital): curar ao matar elite com Q
    const killedBySkill = (e as any)._lastDamageType && (e as any)._lastDamageType !== "normal";
    if (isElite && killedBySkill && hasPerk("escudo-vital")) {
      const players = k.get("player");
      if (players.length > 0) {
        const p = players[0] as any;
        const heal = Math.round(gameState.maxHealth * 0.08);
        p.hp = Math.min(
          gameState.maxHealth,
          (p.hp ?? gameState.maxHealth) + heal,
        );
        gameState.playerHealth = p.hp;
        ui.updateHearts(p.hp);
        
        k.add([
          k.text(`+${heal} HP`, { size: 16 }),
          k.pos(p.pos.x + 30, p.pos.y - 20),
          k.anchor("center"),
          k.color(100, 255, 150),
          k.outline(2, k.rgb(0, 50, 0)),
          k.lifespan(1.0, { fade: 0.5 }),
          k.z(1000)
        ]);
      }
    }

    // If wave finished, advance wave
    if (enemiesLeft <= 0) {
      collectAllDropsOnArena(k, player);

      k.wait(1.5, () => {
        checkMilestonePerksAndResume();
      });
    }
  };

  // spawn based on array of types
  if (waveIndex >= 9) {
    for (const entry of waveDef) {
      for (let i = 0; i < entry.count; i++) {
        const delay = Math.random() * 3.5;
        k.wait(delay, () => {
          if (!player.exists()) return;
          const e = createEnemy(k, {
            target: player,
            arenaBounds: arena,
            type: entry.type,
          });
          e.onDestroy(() => handleEnemyDeath(e));
        });
      }
    }
  } else {
    for (const entry of waveDef) {
      for (let i = 0; i < entry.count; i++) {
        const e = createEnemy(k, {
          target: player,
          arenaBounds: arena,
          type: entry.type,
        });
        e.onDestroy(() => handleEnemyDeath(e));
      }
    }
  }
}

// Auto-collect all gold and elevation drops at wave end
function collectAllDropsOnArena(k: any, player: any) {
  const drops = k.get("gold-drop").concat(k.get("elevation-drop"));
  for (const drop of drops) {
    if (drop._isCollecting) continue;
    drop._isCollecting = true;

    drop.onUpdate(() => {
      if (!player.exists() || !drop.exists()) return;
      const dir = player.pos.sub(drop.pos).unit();
      const dist = player.pos.dist(drop.pos);
      const speed = Math.max(400, 1200 - dist * 1.5);
      drop.move(dir.scale(speed));

      if (dist < 24) {
        if (drop.is("gold-drop")) {
          gameState.gold += drop.value ?? 1;
          ui.updateGold(gameState.gold);
          ui.refreshShopStats();
        } else if (drop.is("elevation-drop")) {
          gameState.elevationPoints += 1;
          ui.refreshShopStats();
        }
        drop.destroy();
      }
    });
  }
}

const startNextWave = () => {
  // Close the shop panel so the player can see
  ui.setShopVisible(false);

  // Verificar se o mapa precisa crescer antes da nova wave
  const targetMapState = getMapStateForWave(gameState.wave);
  if (targetMapState > gameState.mapState) {
    rebuildArena(targetMapState);
  }

  // hide button during wave
  ui.setPlayVisible(false);
  // start or advance wave
  spawnWave(gameState.wave);
};

// Start wave when pressing Play
ui.onPlayClick(startNextWave);

// Keybind to start wave: Space or Enter
k.onKeyPress("space", () => {
  if (k.get("ui-skill-overlay").some((o) => !o.hidden)) return;
  if (k.get("perk-overlay-bg").some((o) => !o.hidden)) return;
  if (k.get("shop-bg").some((o) => !o.hidden)) return;
  const playBtn = k.get("ui-play")[0];
  if (playBtn && !playBtn.hidden) {
    startNextWave();
  }
});
k.onKeyPress("enter", () => {
  if (k.get("ui-skill-overlay").some((o) => !o.hidden)) return;
  if (k.get("perk-overlay-bg").some((o) => !o.hidden)) return;
  if (k.get("shop-bg").some((o) => !o.hidden)) return;
  const playBtn = k.get("ui-play")[0];
  if (playBtn && !playBtn.hidden) {
    startNextWave();
  }
});

// Keybind to toggle shop: E, B, or I
const toggleShop = () => {
  if (k.get("ui-skill-overlay").some((o) => !o.hidden)) return;
  if (k.get("perk-overlay-bg").some((o) => !o.hidden)) return;
  const shopBg = k.get("shop-bg")[0];
  if (shopBg) {
    ui.setShopVisible(shopBg.hidden);
  }
};
k.onKeyPress("e", toggleShop);
k.onKeyPress("b", toggleShop);
k.onKeyPress("i", toggleShop);

// Player damage on enemy collision with per-enemy cooldown
k.onCollide("player", "enemy", (p: any, e: any) => {
  if (gameState.intangibleUntil > Date.now()) return;

  const now = Date.now();
  if ((e.lastDamageTime ?? 0) + gameState.enemyDamageCooldownMs > now) return;
  e.lastDamageTime = now;
  const dmg = e.damage ?? 1;
  // Zona de Perigo: +3% dano recebido por inimigo próximo
  const zonaDef = getZonaDePerigoDefenseMul(k, p.pos);
  let finalDmg = dmg * zonaDef;
  if (hasPerk("casca-grossa")) {
    finalDmg -= Math.floor(gameState.maxHealth / 150);
  }
  if (hasPerk("estacao-de-defesa") && (gameState.stationaryTimer ?? 0) >= 0.5) {
    finalDmg *= 0.9;
  }
  finalDmg = Math.max(0, Math.round(finalDmg));

  if (finalDmg > 0) {
    if (hasPerk("imunidade-critica") && Math.random() < 0.5 * gameState.luck) {
      showLuckyBlockFeedback(k, p.pos.clone());
      return;
    }
  }

  (p as any).hp = Math.max(0, ((p as any).hp ?? gameState.maxHealth) - finalDmg);
  gameState.playerHealth = (p as any).hp;
  ui.updateHearts((p as any).hp);

  if (hasPerk("onda-de-choque") && finalDmg > 0) {
    triggerOndaDeChoquePerk(k, p);
  }

  checkIntangibilidadeTrigger(k, p);

  if ((p as any).hp <= 0) {
    k.addKaboom(p.pos.clone());
  }
});
k.onCollide("player", "enemy-bullet", (p: any, bb: any) => {
  if (gameState.intangibleUntil > Date.now()) {
    bb.destroy();
    return;
  }

  bb.destroy();
  const bulletDmg = bb.damage ?? 30;
  const zonaDef = getZonaDePerigoDefenseMul(k, p.pos);
  let finalDmg = bulletDmg * zonaDef;
  if (hasPerk("casca-grossa")) {
    finalDmg -= Math.floor(gameState.maxHealth / 150);
  }
  if (hasPerk("estacao-de-defesa") && (gameState.stationaryTimer ?? 0) >= 0.5) {
    finalDmg *= 0.9;
  }
  finalDmg = Math.max(0, Math.round(finalDmg));

  if (finalDmg > 0) {
    if (hasPerk("imunidade-critica") && Math.random() < 0.5 * gameState.luck) {
      showLuckyBlockFeedback(k, p.pos.clone());
      return;
    }
  }

  (p as any).hp = Math.max(0, (p as any).hp - finalDmg);
  gameState.playerHealth = (p as any).hp;
  ui.updateHearts((p as any).hp);

  if (hasPerk("onda-de-choque") && finalDmg > 0) {
    triggerOndaDeChoquePerk(k, p);
  }

  checkIntangibilidadeTrigger(k, p);

  if ((p as any).hp <= 0) {
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
  if (k.get("ui-skill-overlay").some((o) => !o.hidden)) return;
  if (k.get("perk-overlay-bg").some((o) => !o.hidden)) return;
  if (k.get("shop-bg").some((o) => !o.hidden)) return;
  const id = gameState.skills.skill1;
  if (!id) return;
  useSkill(id, k, player);
});

(window as any).gameState = gameState;
(window as any).player = player;
(window as any).k = k;
(window as any).ui = ui;

