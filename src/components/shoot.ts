import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { gameState } from "../state/gameState";
import { addMark } from "./skills/markedShot";
import { debug } from "../state/debug";
import {
  shouldTriggerChainExplosion,
  spawnChainExplosion,
  canTriggerSeismic,
  triggerSeismic,
  onShotHitLigeirinho,
  onShotMissLigeirinho,
  getLigeirinhoSpeedBonus,
  getLigeirinhoReloadBonus,
  getZonaDePerigoAttackMul,
} from "./perks";

export type ShootOptions = {
  chargeTime?: number;
  outlineSize: number;
  projectileSpeed?: number;
  projectileSize?: number;
  projectileColor?: [number, number, number];
};

export function shoot(k: KAPLAYCtx, opts: ShootOptions = { outlineSize: 4 }) {
  const chargeTime = opts.chargeTime ?? 1.0; // seconds to charge
  // const projSpeed = opts.projectileSpeed ?? 500; // do not cache; read at fire time
  const projSize = opts.projectileSize ?? 8;
  const projColor = opts.projectileColor ?? [255, 255, 0];

  let lastPos: Vec2 | null = null;
  let channeling = false;
  let charge = 0;
  let topLine: GameObj | null = null;
  let rightLine: GameObj | null = null;
  let bottomLine: GameObj | null = null;
  let leftLine: GameObj | null = null;
  const lineThickness = opts.outlineSize ?? 4;

  function isStationary(self: GameObj) {
    if (!lastPos) return false;
    const delta = self.pos.sub(lastPos);
    return Math.abs(delta.x) < 0.5 && Math.abs(delta.y) < 0.5;
  }

  function findNearestEnemy(from: Vec2): GameObj | null {
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

  function fire(self: GameObj) {
    const target = findNearestEnemy(self.pos);
    if (!target) return;
    const dir = target.pos.sub(self.pos).unit();
    // Read projectile speed at fire time to reflect upgrades
    const gs = debug.GAME_SPEED ?? 1.0;
    const speed =
      typeof opts.projectileSpeed === "number"
        ? opts.projectileSpeed * gs
        : gameState.projectileSpeed * gs;

    // If projectileSpeed upgrade is maxed, make projectiles extremely fast
    const projSpeedUpgrade = (gameState.upgrades as any).projectileSpeed ?? 0;
    const effectiveSpeed =
      projSpeedUpgrade >= 10 ? Math.max(1600, speed) : speed;

    // --- Juice: Recoil, Muzzle Flash and Screen Shake ---
    let recoilTime = 0.05;
    const recoilDir = dir.scale(-1);
    const recoilSpeed = 300;
    const cancelRecoil = self.onUpdate(() => {
      recoilTime -= k.dt();
      if (recoilTime <= 0) {
        cancelRecoil.cancel();
        return;
      }
      self.move(recoilDir.scale(recoilSpeed));
    });

    const muzzleDist = self.getSize().width / 2 + 5;
    const muzzlePos = self.pos.add(k.vec2(self.getSize().width / 2, self.getSize().height / 2)).add(dir.scale(muzzleDist));
    const muzzle = k.add([
      k.circle(12),
      k.pos(muzzlePos.x, muzzlePos.y),
      k.anchor("center"),
      k.color(255, 255, 200),
      k.opacity(0.8),
      k.z(550),
      k.lifespan(0.08, { fade: 0.06 }),
    ]);
    muzzle.scale = k.vec2(0.5);
    muzzle.onUpdate(() => {
      if (muzzle.exists()) {
        muzzle.scale = k.vec2(0.5 + (1 - muzzle.opacity) * 1.5);
      }
    });

    k.shake(0.8);

    const spawnProjectile = (offsetAngle = 0) => {
      const ang = Math.atan2(dir.y, dir.x) + offsetAngle;
      const d = k.vec2(Math.cos(ang), Math.sin(ang));
      const p = k.add([
        k.rect(projSize, projSize),
        k.pos(self.pos.x, self.pos.y),
        k.color(projColor[0], projColor[1], projColor[2]),
        k.outline(2, k.rgb(255, 255, 255)),
        k.area(),
        { id: "projectile", vel: d.scale(effectiveSpeed) },
      ]);
      p.onUpdate(() => {
        p.move(p.vel);
        // remove if too far from camera
        if (p.pos.dist(self.pos) > k.width() * 2) p.destroy();
      });
      // hit enemy
      p.onCollide("enemy", (e: GameObj & { hp?: number }) => {
        // Apply damage: reduce HP and destroy on 0
        if (typeof e.hp === "number") {
          const baseDamage = 1 * gameState.shotDamage;
          // Zona de Perigo: +5% dano por inimigo próximo
          const zonaMul = getZonaDePerigoAttackMul(k, self.pos);
          const damage = baseDamage * gameState.buffs.damageMul * zonaMul;
          (e as any)._lastDamageType = "normal";
          e.hp -= damage;
          if (e.hp <= 0) e.destroy();
          // Reação em Cadeia: 10% de explosão
          if (shouldTriggerChainExplosion()) {
            spawnChainExplosion(k, e.pos ? e.pos.clone() : p.pos.clone(), damage);
          }
        }
        // Impacto Sísmico: substitui o tiro por onda circular
        if (canTriggerSeismic()) {
          triggerSeismic(k, p.pos.clone());
        }
        // Ligeirinho: acerto acumula velocidade
        onShotHitLigeirinho();
        // Adicionar marca se buff do markedShot está ativo
        if (gameState.buffs.markedShot.active && e.exists()) {
          addMark(k, e);
        }
        p.destroy();
      });
      // hit walls
      p.onCollide("arena-wall", () => {
        // Ligeirinho: errar (bater na parede) reseta stacks
        onShotMissLigeirinho();
        p.destroy();
      });
    };

    // If reloadSpeed upgrade is maxed, fire double projectiles (slightly spread)
    const reloadUpgrade = (gameState.upgrades as any).reloadSpeed ?? 0;
    if (reloadUpgrade >= 10) {
      spawnProjectile(-0.03);
      spawnProjectile(0.03);
    } else {
      spawnProjectile(0);
    }
  }

  return {
    id: "shoot",
    require: ["pos"],
    add(this: GameObj) {
      lastPos = this.pos.clone();

      // Create persistent line objects once
      const w = this.getSize().width;
      const h = this.getSize().height;
      if (!topLine) {
        topLine = this.add([
          k.rect(1, lineThickness),
          k.pos(0, opts.outlineSize / -2),
          k.color(0, 255, 0),
          k.scale(0, 1), // start with zero length on X
          { id: "charge-indicator-top" },
        ]);
      }
      if (!rightLine) {
        rightLine = this.add([
          k.rect(lineThickness, 1),
          k.pos(w - opts.outlineSize / 2, 0),
          k.color(0, 255, 0),
          k.scale(1, 0), // start with zero length on Y
          { id: "charge-indicator-right" },
        ]);
      }
      if (!bottomLine) {
        bottomLine = this.add([
          k.rect(1, lineThickness),
          k.pos(0, h - opts.outlineSize / 2),
          k.color(0, 255, 0),
          k.scale(0, 1), // start with zero length on X
          { id: "charge-indicator-bottom" },
        ]);
      }
      if (!leftLine) {
        leftLine = this.add([
          k.rect(lineThickness, 1),
          k.pos(-(opts.outlineSize / 2), 0),
          k.color(0, 255, 0),
          k.scale(1, 0), // start with zero length on Y
          { id: "charge-indicator-left" },
        ]);
      }

      k.onUpdate(() => {
        const still = isStationary(this);
        // charge even while moving (slower when moving)
        // Interpret reloadSpeed as reload time (seconds). Convert to a rate.
        // Apply buff multiplier to reload speed + GAME_SPEED + Ligeirinho
        const gs = debug.GAME_SPEED ?? 1.0;
        const ligeirinhoReload = 1 + getLigeirinhoReloadBonus();
        const baseReloadTime = Math.max(0.0001, gameState.reloadSpeed / (gs * ligeirinhoReload));
        const reloadTime = baseReloadTime / gameState.buffs.reloadSpeedMul; // Buff diminui o tempo
        const base = 1 / reloadTime; // higher when reload time is lower
        const movePenalty = gameState.reloadMovePenalty; // e.g., 0.5

        // Se o buff está ativo, não há penalidade por movimento
        const buffActive = gameState.buffs.activeUntil > Date.now();
        const rate = still || buffActive ? base : base * movePenalty;

        channeling = true;
        charge += k.dt() * rate;
        const percentToShoot = Math.min(1, charge / chargeTime) * 100; // 0-100

        const sizeSquare = this.getSize().width / 100;

        // Grow line lengths based on charge percent without spawning new squares
        // Top edge: 0% - 25%
        if (topLine) {
          const pct = Math.min(percentToShoot, 25);
          const len = Math.max(0, pct * 4 * sizeSquare + opts.outlineSize);
          topLine.scale = k.vec2(len, 1);
          topLine.pos = k.vec2(-(opts.outlineSize / 2), -opts.outlineSize / 2);
        }
        // Right edge: 25% - 50%
        if (rightLine) {
          const pct = Math.max(0, Math.min(percentToShoot - 25, 25));
          const len = Math.max(0, pct * 4 * sizeSquare + opts.outlineSize);
          rightLine.scale = k.vec2(1, len);
          rightLine.pos = k.vec2(
            this.getSize().width - opts.outlineSize / 2,
            -(opts.outlineSize / 2),
          );
        }
        // Bottom edge: 50% - 75%
        if (bottomLine) {
          const pct = Math.max(0, Math.min(percentToShoot - 50, 25));
          const len = Math.max(0, pct * 4 * sizeSquare);
          bottomLine.scale = k.vec2(len, 1);
          const startX = this.getSize().width - opts.outlineSize / 2 - len;
          bottomLine.pos = k.vec2(
            startX,
            this.getSize().height - opts.outlineSize / 2,
          );
        }
        // Left edge: 75% - 100%
        if (leftLine) {
          const pct = Math.max(0, Math.min(percentToShoot - 75, 25));
          const len = Math.max(0, pct * 4 * sizeSquare);
          leftLine.scale = k.vec2(1, len);
          const startY = this.getSize().height - opts.outlineSize / 2 - len;
          leftLine.pos = k.vec2(-(opts.outlineSize / 2), startY);
        }

        // When moving, optionally dim color to indicate slower charge
        const col = still ? k.rgb(0, 255, 0) : k.rgb(0, 180, 0);
        if (topLine) topLine.color = col;
        if (rightLine) rightLine.color = col;
        if (bottomLine) bottomLine.color = col;
        if (leftLine) leftLine.color = col;

        const wasReady = (this as any)._reloadReadyPlayed ?? false;
        const isReady = charge >= chargeTime;
        
        if (isReady && !wasReady) {
          (this as any)._reloadReadyPlayed = true;
          
          const outlineFlash = (line: GameObj) => {
            const origColor = line.color;
            line.color = k.rgb(255, 255, 255);
            k.wait(0.12, () => {
              if (line.exists()) {
                line.color = origColor;
              }
            });
          };
          if (topLine) outlineFlash(topLine);
          if (rightLine) outlineFlash(rightLine);
          if (bottomLine) outlineFlash(bottomLine);
          if (leftLine) outlineFlash(leftLine);

          const origScale = this.scale || k.vec2(1);
          let pulseTime = 0.12;
          const cancelPulse = this.onUpdate(() => {
            pulseTime -= k.dt();
            if (pulseTime <= 0) {
              cancelPulse.cancel();
              if (this.exists()) this.scale = origScale;
              return;
            }
            const p = pulseTime / 0.12;
            this.scale = k.vec2(1 + p * 0.12);
          });
        }
        
        if (!isReady) {
          (this as any)._reloadReadyPlayed = false;
        }

        if (charge >= chargeTime) {
          if (still) {
            channeling = false;
            charge = 0;
            fire(this);
            // reset visuals
            if (topLine) topLine.scale = k.vec2(0, 1);
            if (rightLine) rightLine.scale = k.vec2(1, 0);
            if (bottomLine) bottomLine.scale = k.vec2(0, 1);
            if (leftLine) leftLine.scale = k.vec2(1, 0);
          } else {
            // keep charged while moving, but don’t fire
            charge = chargeTime;
          }
        }

        // Track last pos for next frame
        lastPos = this.pos.clone();
      });
    },
  } as const;
}
