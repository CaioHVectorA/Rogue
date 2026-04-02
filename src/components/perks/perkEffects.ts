// ─── Perk Effects ───────────────────────────────────────
// Runtime effect calculations based on acquired perks.

import { hasPerk } from "./perkState";
import { gameState } from "../../state/gameState";

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
  if (!hasPerk("ima-magnetico")) return;
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
