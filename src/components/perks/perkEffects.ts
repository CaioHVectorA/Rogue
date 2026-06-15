// ─── Perk Effects ───────────────────────────────────────
// Runtime effect calculations based on acquired perks.

import { hasPerk } from "./perkState";
import { gameState } from "../../state/gameState";
import { addPoisonStacks } from "../skills/poison";

// ══════════════════════════════════════════════════════════
// EXECUÇÃO LIMPA — matar reduz CD de Q em 40%; elite = reset
// ══════════════════════════════════════════════════════════
export function onKillReduceQCooldown(isElite: boolean = false): void {
  if (!hasPerk("execucao-limpa")) return;
  const skillId = gameState.skills.skill1;
  if (!skillId) return;
  const lastUsed = gameState.skills.lastUsedAt[skillId] ?? 0;
  if (lastUsed === 0) return;
  if (isElite) {
    gameState.skills.lastUsedAt[skillId] = 0;
  } else {
    const now = Date.now();
    const elapsed = now - lastUsed;
    gameState.skills.lastUsedAt[skillId] = lastUsed - Math.floor(elapsed * 0.4);
  }
}

// ══════════════════════════════════════════════════════════
// REAÇÃO EM CADEIA — 10% chance de explosão no tiro
// ══════════════════════════════════════════════════════════
export function shouldTriggerChainExplosion(): boolean {
  if (!hasPerk("reacao-em-cadeia")) return false;
  return Math.random() < 0.1;
}

export function spawnChainExplosion(k: any, pos: any, baseDamage: number, isChain = false): void {
  const dmg = isChain ? baseDamage * 0.5 : baseDamage;
  const radius = 70;
  const circle = k.add([
    k.circle(radius),
    k.pos(pos.x, pos.y),
    k.color(255, 120, 30),
    k.opacity(0.7),
    k.z(100),
    { id: "chain-explosion" },
  ]);
  const enemies = k.get("enemy") as any[];
  for (const e of enemies) {
    if (e.pos.dist(pos) <= radius) {
      if (typeof e.hp === "number") {
        e._lastDamageType = "explosion";
        e.hp -= dmg * gameState.buffs.damageMul;
        if (e.hp <= 0) e.destroy();
      }
    }
  }
  if (!isChain) {
    const enemies2 = k.get("enemy") as any[];
    for (const e of enemies2) {
      if (e.exists() && e.pos.dist(pos) <= radius + 20 && Math.random() < 0.1) {
        k.wait(0.1, () => spawnChainExplosion(k, e.pos.clone(), baseDamage, true));
      }
    }
  }
  k.wait(0.25, () => { if (circle.exists()) circle.destroy(); });
}

// ══════════════════════════════════════════════════════════
// IMPACTO SÍSMICO — tiro vira onda circular
//   dano = maxHP * 4%
//   cooldown base 3s, reduz com moveSpeed
// ══════════════════════════════════════════════════════════
let _seismicNextAt = 0;

export function canTriggerSeismic(): boolean {
  if (!hasPerk("impacto-sismico")) return false;
  return Date.now() >= _seismicNextAt;
}

export function triggerSeismic(k: any, pos: any): void {
  if (!canTriggerSeismic()) return;
  const speedRatio = Math.min(2, gameState.moveSpeed / 600);
  const cd = Math.max(0.8, 3.0 / speedRatio) * 1000;
  _seismicNextAt = Date.now() + cd;

  const dmg = gameState.maxHealth * 0.04 * gameState.shotDamage * gameState.buffs.damageMul;
  const maxRadius = 120;
  const ring = k.add([
    k.circle(10),
    k.pos(pos.x, pos.y),
    k.color(200, 140, 60),
    k.opacity(0.8),
    k.z(99),
  ]);
  let elapsed = 0;
  const hitEnemies = new Set<any>();
  ring.onUpdate(() => {
    elapsed += k.dt();
    const t = Math.min(elapsed / 0.35, 1);
    const r = t * maxRadius;
    ring.use(k.circle(r));
    ring.opacity = 0.8 * (1 - t);
    const enemies = k.get("enemy") as any[];
    for (const e of enemies) {
      if (!hitEnemies.has(e) && e.pos.dist(pos) <= r + 20) {
        hitEnemies.add(e);
        if (typeof e.hp === "number") {
          e._lastDamageType = "explosion";
          e.hp -= dmg;
          if (e.hp <= 0) e.destroy();
        }
      }
    }
    if (t >= 1) ring.destroy();
  });
}

// ══════════════════════════════════════════════════════════
// LIGEIRINHO — acerto = +4% vel (até 5x); erro = reset
// ══════════════════════════════════════════════════════════
let _ligeirinhoStacks = 0;
const LIGEIRINHO_MAX = 5;

export function onShotHitLigeirinho(): void {
  if (!hasPerk("ligeirinho")) return;
  _ligeirinhoStacks = Math.min(_ligeirinhoStacks + 1, LIGEIRINHO_MAX);
}

export function onShotMissLigeirinho(): void {
  if (!hasPerk("ligeirinho")) return;
  _ligeirinhoStacks = 0;
}

export function getLigeirinhoSpeedBonus(): number {
  if (!hasPerk("ligeirinho")) return 0;
  return _ligeirinhoStacks * 0.04;
}

export function getLigeirinhoReloadBonus(): number {
  if (!hasPerk("ligeirinho")) return 0;
  return getLigeirinhoSpeedBonus() * 0.1;
}

// ══════════════════════════════════════════════════════════
// ZONA DE PERIGO — +5% dano por inimigo próximo (raio 200)
//                  +3% dano recebido por inimigo próximo
// ══════════════════════════════════════════════════════════
export function getZonaDePerigoAttackMul(k: any, playerPos: any): number {
  if (!hasPerk("zona-de-perigo")) return 1.0;
  const nearby = (k.get("enemy") as any[]).filter(
    (e) => e.pos.dist(playerPos) < 200
  ).length;
  return 1.0 + nearby * 0.05;
}

export function getZonaDePerigoDefenseMul(k: any, playerPos: any): number {
  if (!hasPerk("zona-de-perigo")) return 1.0;
  const nearby = (k.get("enemy") as any[]).filter(
    (e) => e.pos.dist(playerPos) < 200
  ).length;
  return 1.0 + nearby * 0.03;
}

// ══════════════════════════════════════════════════════════
// SOBRECARGA ELÉTRICA — +5% dano por stack de choque; 10 = explosão
// ══════════════════════════════════════════════════════════
export function getShockDamageBonus(shockStacks: number): number {
  if (!hasPerk("sobrecarga-eletrica")) return 1.0;
  return 1.0 + shockStacks * 0.05;
}

export function shouldShockExplode(shockStacks: number): boolean {
  if (!hasPerk("sobrecarga-eletrica")) return false;
  return shockStacks >= 10;
}

export function triggerShockExplosion(k: any, pos: any): void {
  const radius = 80;
  const dmg = 3 * gameState.shotDamage * gameState.buffs.damageMul;
  const circle = k.add([
    k.circle(radius),
    k.pos(pos.x, pos.y),
    k.color(80, 180, 255),
    k.opacity(0.75),
    k.z(100),
  ]);
  const enemies = k.get("enemy") as any[];
  for (const e of enemies) {
    if (e.pos.dist(pos) <= radius) {
      if (typeof e.hp === "number") {
        e._lastDamageType = "shock";
        e.hp -= dmg;
        if (e.hp <= 0) e.destroy();
      }
      if (e.shockStacks !== undefined) e.shockStacks = 0;
    }
  }
  k.wait(0.3, () => { if (circle.exists()) circle.destroy(); });
}

// ══════════════════════════════════════════════════════════
// IMÃ MAGNÉTICO — dobra raio imã, +0.3 sorte (1x na aquisição)
// ══════════════════════════════════════════════════════════
export function applyImaMagneticoEffect(): void {
  if (!hasPerk("ima-magnetico") && !hasPerk("super-ima")) return;
  gameState.luck = Number((gameState.luck + 0.3).toFixed(2));
}

// ══════════════════════════════════════════════════════════
// ENGENHARIA RÚNICA — +1 totem ativo; totens herdam 30% dano/vel
// ══════════════════════════════════════════════════════════
export function getEngenhariaRunicaBonusSlots(): number {
  return hasPerk("engenharia-runica") ? 1 : 0;
}

export function getEngenhariaRunicaDamageBonus(): number {
  return hasPerk("engenharia-runica") ? 0.3 : 0;
}

// ══════════════════════════════════════════════════════════
// RASTRO NOCIVO — rastro tóxico ao correr
// ══════════════════════════════════════════════════════════
let _rastroTimer = 0;
export function updateRastroNocivo(k: any, player: any): void {
  if (!player || !player.exists() || !hasPerk("rastro-nocivo")) return;

  const vel = player.pos.sub(player._lastPos ?? player.pos);
  player._lastPos = player.pos.clone();
  const isMoving = vel.len() > 1;

  if (!isMoving) return;

  _rastroTimer += k.dt();
  if (_rastroTimer >= 0.15) {
    _rastroTimer = 0;
    const center = player.pos.add(18, 18);
    const trail = k.add([
      k.circle(24),
      k.pos(center.x, center.y),
      k.color(180, 50, 255),
      k.opacity(0.4),
      k.area({ collisionIgnore: ["player"] }),
      k.z(-1),
      { id: "poison-trail", t: 0 },
    ]);

    trail.onUpdate(() => {
      trail.t += k.dt();
      trail.opacity = 0.4 * (1 - trail.t / 1.5);
      if (trail.t >= 1.5) {
        trail.destroy();
      }
    });

    trail.onCollide("enemy", (e: any) => {
      if (typeof e.hp === "number") {
        e.hp -= 0.6 * gameState.castPower * gameState.buffs.damageMul;
        if (e.hp <= 0) e.destroy();
      }
    });
  }
}

// ══════════════════════════════════════════════════════════
// ONDA DE CHOQUE — ao sofrer dano ou a cada 3s em combate
// ══════════════════════════════════════════════════════════
let _shockwaveTimer = 0;

export function triggerOndaDeChoquePerk(k: any, player: any): void {
  if (!player || !player.exists()) return;
  const center = player.pos.add(18, 18);
  const radius = 100;
  const dmg = Math.max(2, Math.round(gameState.maxHealth * 0.08));

  // Visual pulse ring
  const wave = k.add([
    k.circle(10),
    k.pos(center.x, center.y),
    k.color(255, 140, 60),
    k.opacity(0.6),
    k.z(-1),
    { t: 0 },
  ]);
  wave.onUpdate(() => {
    const t = wave.t ?? 0;
    wave.t = t + k.dt();
    const progress = Math.min(wave.t / 0.3, 1);
    wave.use(k.circle(10 + progress * (radius - 10)));
    wave.opacity = 0.6 * (1 - progress);
    if (progress >= 1) wave.destroy();
  });

  // Damage and push enemies
  const enemies = k.get("enemy") as any[];
  for (const e of enemies) {
    if (e.pos.dist(center) <= radius) {
      if (typeof e.hp === "number") {
        e.hp -= dmg * gameState.buffs.damageMul;
        if (e.hp <= 0) e.destroy();
      }
      // Push enemy back
      const dir = e.pos.sub(center).unit();
      e.pos.x += dir.x * 20;
      e.pos.y += dir.y * 20;
    }
  }
}

export function updateOndaDeChoquePerk(k: any, player: any): void {
  if (!player || !player.exists() || !hasPerk("onda-de-choque")) return;

  const enemies = k.get("enemy") as any[];
  if (enemies.length === 0) {
    _shockwaveTimer = 0;
    return;
  }

  _shockwaveTimer += k.dt();
  if (_shockwaveTimer >= 3.0) {
    _shockwaveTimer = 0;
    triggerOndaDeChoquePerk(k, player);
  }
}

// ══════════════════════════════════════════════════════════
// AURA FLAMEJANTE — aura de fogo constante ao redor do player
// ══════════════════════════════════════════════════════════
let _fireAuraObj: any = null;
let _fireAuraTimer = 0;

export function updateFireAuraPerk(k: any, player: any): void {
  if (!player || !player.exists() || !hasPerk("aura-flamejante")) {
    if (_fireAuraObj && _fireAuraObj.exists()) {
      _fireAuraObj.destroy();
      _fireAuraObj = null;
    }
    return;
  }

  const radius = 100;
  const pSize = player.getSize ? player.getSize() : { width: 36, height: 36 };
  const center = player.pos.add(pSize.width / 2, pSize.height / 2);

  // Se o objeto visual não existe, cria ele
  if (!_fireAuraObj || !_fireAuraObj.exists()) {
    _fireAuraObj = k.add([
      k.circle(radius),
      k.pos(center.x, center.y),
      k.anchor("center"),
      k.color(240, 80, 30),
      k.opacity(0.12),
      k.outline(1.5, k.rgb(255, 120, 30)),
      k.z(-2), // below player and enemies
      { id: "fire-aura-visual" }
    ]);
  } else {
    // Mantém atualizado no centro do player
    _fireAuraObj.pos = center;
  }

  // Pulso de dano a cada 1.0s
  _fireAuraTimer += k.dt();
  if (_fireAuraTimer >= 1.0) {
    _fireAuraTimer = 0;

    // Onda de calor se expandindo (visual pulse effect)
    const pulse = k.add([
      k.circle(10),
      k.pos(center.x, center.y),
      k.anchor("center"),
      k.color(255, 100, 30),
      k.opacity(0.4),
      k.z(-2),
      { t: 0 }
    ]);
    pulse.onUpdate(() => {
      pulse.t += k.dt();
      const progress = Math.min(pulse.t / 0.45, 1);
      pulse.use(k.circle(10 + progress * (radius - 10)));
      pulse.opacity = 0.4 * (1 - progress);
      if (progress >= 1) pulse.destroy();
    });

    // Causa dano nos inimigos dentro do raio
    const dmg = 2.0 * gameState.castPower * gameState.buffs.damageMul;
    const enemies = k.get("enemy") as any[];
    for (const e of enemies) {
      if (e.pos.dist(center) <= radius) {
        if (typeof e.hp === "number") {
          e._lastDamageType = "fire";
          e.hp -= dmg;
          if (e.hp <= 0) e.destroy();
        }
      }
    }
  }
}

// ══════════════════════════════════════════════════════════
// PASSIVAS ADICIONADAS POSTERIORMENTE
// ══════════════════════════════════════════════════════════

let _passoEspiritualUntil = 0;

export function triggerPassoEspiritual(): void {
  if (hasPerk("passo-espiritual")) {
    _passoEspiritualUntil = Date.now() + 2000;
  }
}

export function getPlayerSpeedMultiplier(player: any): number {
  let mul = 1.0;
  mul += getLigeirinhoSpeedBonus();
  
  if (hasPerk("sobrevida-veloz") && player && player.exists()) {
    const maxHP = gameState.maxHealth;
    const currentHP = player.hp ?? maxHP;
    if (currentHP / maxHP <= 0.3) {
      mul += 0.35;
    }
  }
  
  if (hasPerk("passo-espiritual") && Date.now() < _passoEspiritualUntil) {
    mul += 0.20;
  }
  
  return mul;
}

export function applySoproGeladoSlow(k: any, enemy: any): void {
  if (!enemy || !enemy.exists()) return;
  const originalSpeed = enemy.defaultSpeed ?? enemy.speed ?? 100;
  enemy.speed = originalSpeed * 0.6; // 40% slow
  
  const prevColor = enemy._originalColor || enemy.color || k.rgb(255, 255, 255);
  enemy.color = k.rgb(100, 180, 255);
  
  if (enemy._slowTimeout) clearTimeout(enemy._slowTimeout);
  enemy._slowTimeout = setTimeout(() => {
    if (enemy.exists()) {
      enemy.speed = originalSpeed;
      enemy.color = prevColor;
    }
  }, 2500);
}

export function showLuckyBlockFeedback(k: any, pos: any): void {
  k.add([
    k.text("🍀 BLOQUEADO!", { size: 14 }),
    k.pos(pos.x, pos.y - 30),
    k.anchor("center"),
    k.color(120, 255, 200),
    k.outline(2, k.rgb(0, 50, 0)),
    k.opacity(1),
    k.lifespan(0.8, { fade: 0.4 }),
    k.z(1000)
  ]);
}

export function triggerRetaliacaoSombria(k: any, pos: any): void {
  if (!hasPerk("retaliacao-sombria")) return;
  const numDaggers = 8;
  const angleStep = (Math.PI * 2) / numDaggers;
  const baseDmg = 8 * gameState.castPower;
  
  for (let i = 0; i < numDaggers; i++) {
    const angle = i * angleStep;
    const dir = k.vec2(Math.cos(angle), Math.sin(angle));
    
    const dagger = k.add([
      k.rect(14, 6),
      k.pos(pos.x, pos.y),
      k.color(180, 50, 255),
      k.outline(1.5, k.rgb(0, 0, 0)),
      k.rotate(k.rad2deg(angle)),
      k.anchor("center"),
      k.area(),
      k.z(200),
      { id: "poison-dagger", damage: baseDmg }
    ]);
    
    dagger.onUpdate(() => {
      if (!dagger.exists()) return;
      dagger.move(dir.scale(450));
    });
    
    dagger.onCollide("enemy", (e: any) => {
      if (typeof e.hp === "number") {
        e._lastDamageType = "poison";
        e.hp -= baseDmg * gameState.buffs.damageMul;
        if (e.hp <= 0) e.destroy();
        addPoisonStacks(k, e, 2);
      }
      dagger.destroy();
    });
    
    dagger.onCollide("arena-wall", () => {
      if (dagger.exists()) dagger.destroy();
    });
    
    k.wait(5, () => {
      if (dagger.exists()) dagger.destroy();
    });
  }
}

export function checkIntangibilidadeTrigger(k: any, player: any): void {
  if (!player || !player.exists()) return;
  if (!hasPerk("intangibilidade")) return;
  if (gameState.intangibleUsedThisWave) return;
  
  const currentHP = player.hp ?? gameState.maxHealth;
  if (currentHP > 0 && currentHP / gameState.maxHealth <= 0.25) {
    gameState.intangibleUsedThisWave = true;
    gameState.intangibleUntil = Date.now() + 3000;
    
    const origOpacity = player.opacity ?? 1.0;
    const interval = setInterval(() => {
      if (player.exists() && Date.now() < gameState.intangibleUntil) {
        player.opacity = player.opacity === 0.3 ? 0.8 : 0.3;
      } else {
        clearInterval(interval);
        if (player.exists()) player.opacity = origOpacity;
      }
    }, 150);

    const barrier = k.add([
      k.circle(48),
      k.pos(player.pos.x + 30, player.pos.y + 30),
      k.anchor("center"),
      k.color(200, 200, 255),
      k.opacity(0.25),
      k.outline(2.5, k.rgb(255, 255, 255)),
      k.z(100)
    ]);
    
    barrier.onUpdate(() => {
      if (!player.exists() || Date.now() >= gameState.intangibleUntil) {
        barrier.destroy();
      } else {
        barrier.pos = player.pos.add(30, 30);
        barrier.scale = k.vec2(1.0 + Math.sin(k.time() * 8) * 0.1);
      }
    });

    if (hasPerk("retaliacao-sombria")) {
      triggerRetaliacaoSombria(k, player.pos.add(30, 30));
    }
  }
}

export function triggerToxinaExplosivaExplosion(k: any, pos: any, stacks: number): void {
  const radius = 80;
  const baseDmg = (4 + stacks * 1.5) * gameState.castPower;
  
  const circle = k.add([
    k.circle(radius),
    k.pos(pos.x, pos.y),
    k.color(140, 60, 255),
    k.opacity(0.6),
    k.z(100),
  ]);
  
  for (let i = 0; i < 8; i++) {
    const angle = k.rand(0, Math.PI * 2);
    const spd = k.rand(80, 160);
    const p = k.add([
      k.circle(k.rand(3, 6)),
      k.pos(pos.x, pos.y),
      k.color(180, 50, 255),
      k.opacity(0.8),
      k.z(110),
      k.lifespan(0.4, { fade: 0.2 }),
      { vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd }
    ]);
    p.onUpdate(() => {
      p.pos.x += p.vx * k.dt();
      p.pos.y += p.vy * k.dt();
    });
  }

  const enemies = k.get("enemy") as any[];
  for (const e of enemies) {
    if (e.pos.dist(pos) <= radius) {
      if (typeof e.hp === "number") {
        e._lastDamageType = "poison";
        e.hp -= baseDmg * gameState.buffs.damageMul;
        if (e.hp <= 0) e.destroy();
        addPoisonStacks(k, e, 2);
      }
    }
  }

  k.wait(0.25, () => {
    if (circle.exists()) circle.destroy();
  });
}

