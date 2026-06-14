import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameState } from "../state/gameState";
import { hasPerk, showLuckyBlockFeedback, checkIntangibilidadeTrigger } from "./perks";

export function applyGreenBehavior(
  k: KAPLAYCtx,
  self: GameObj & {
    speed?: number;
    setSpeed?: (v: number) => void;
    defaultSpeed?: number;
  },
  target: GameObj,
) {
  const data = self as any;
  if (data._greenTimer === undefined) {
    data._greenTimer = 0;
    data._greenShotDone = false;
    data._greenCycleRunning = false;
    data._greenWalking = true;
    data._greenDiagIndex = Math.floor(k.rand(0, 4));
  }

  const defaultSpeed = data.defaultSpeed ?? 110;
  const moveSpeed = Math.max(60, defaultSpeed * 0.6);

  // compute base vectors relative to player
  const toPlayer = target.pos.sub(self.pos).unit();
  const perp = k.vec2(-toPlayer.y, toPlayer.x).unit();
  const perpInv = k.vec2(toPlayer.y, -toPlayer.x).unit();
  // 4 diagonal options: +/-perp blended with +/-towards-player for approaching
  const towards = toPlayer;
  const away = toPlayer.scale(-1);
  const options = [
    perp.scale(0.8).add(towards.scale(0.2)).unit(),
    perpInv.scale(0.8).add(towards.scale(0.2)).unit(),
    perp.scale(0.8).add(away.scale(0.2)).unit(),
    perpInv.scale(0.8).add(away.scale(0.2)).unit(),
  ];

  // initialize cycle if not running: also randomize direction
  if (!data._greenCycleRunning) {
    data._greenCycleRunning = true;
    data._greenTimer = 0;
    data._greenShotDone = false;
    // pick a new random diagonal axis each cycle
    data._greenDiagIndex = Math.floor(k.rand(0, 4));
    const modeMoveFirst = Math.random() < 0.5; // random mode each cycle
    data._greenWalking = modeMoveFirst;
    if (modeMoveFirst) {
      // start moving phase
      if (self.setSpeed) self.setSpeed(moveSpeed);
      else data.speed = moveSpeed;
    } else {
      // start staying phase
      if (self.setSpeed) self.setSpeed(0);
      else data.speed = 0;
    }
  }

  const diag = options[data._greenDiagIndex % options.length];
  data._greenTimer += k.dt();

  // Movement while walking: move diagonally
  if (data._greenWalking) {
    // apply a gentle movement along diagonal direction
    (self as any).move(diag.scale(moveSpeed));
  }

  const phaseDuration = 2.5;
  if (data._greenTimer >= phaseDuration && !data._greenShotDone) {
    const dir = toPlayer;
    const b = k.add([
      k.rect(10, 10),
      k.pos(self.pos.x, self.pos.y),
      k.color(60, 200, 100),
      k.area(),
      { id: "enemy-bullet", damage: 60 },
    ]);
    b.onUpdate(() => {
      if (!b.exists()) return;
      b.move(dir.scale(280));
    });
    b.onCollide("arena-wall", () => { if (b.exists()) b.destroy(); });
    k.wait(8, () => { if (b.exists()) b.destroy(); });
    data._greenShotDone = true;
  }
  if (data._greenTimer >= phaseDuration + 0.05) {
    data._greenCycleRunning = false; // next cycle will randomize mode again
    if (self.setSpeed) self.setSpeed(moveSpeed);
    else data.speed = moveSpeed;
  }
}

export function applyRedBehavior(k: KAPLAYCtx, self: GameObj) {
  const neighbors = (k.get ? k.get("enemy") : []) as (GameObj & {
    enemyType?: string;
  })[];
  const nearbyReds = neighbors.filter(
    (n) => n !== self && n.enemyType === "red" && self.pos.dist(n.pos) < 160,
  );
  if (nearbyReds.length > 0) {
    let cx = 0,
      cy = 0;
    for (const n of nearbyReds) {
      cx += n.pos.x;
      cy += n.pos.y;
    }
    cx /= nearbyReds.length;
    cy /= nearbyReds.length;
    const cohesion = k.vec2(cx, cy).sub(self.pos).unit();
    (self as any).move(cohesion.scale(30));
  }
}

export function applyPurpleBehavior(
  k: KAPLAYCtx,
  self: GameObj,
  target: GameObj,
) {
  const data = self as any;
  if (data._purpleTimer === undefined) {
    data._purpleTimer = 0;
    data._purpleZigDir = 1; // 1 or -1
    data._purpleDashTimer = 0;
    data._purpleDashing = false;
  }

  const dt = k.dt();
  data._purpleTimer += dt;
  data._purpleDashTimer += dt;

  // Zig-zag: alterna a cada 0.35s
  if (data._purpleTimer >= 0.35) {
    data._purpleTimer = 0;
    data._purpleZigDir *= -1;
  }

  // Occasional dash burst towards player every 2-3s
  if (!data._purpleDashing && data._purpleDashTimer >= 2.5) {
    data._purpleDashing = true;
    data._purpleDashTimer = 0;
    const baseSpeed = data.defaultSpeed ?? 240;
    if (self.setSpeed) (self as any).setSpeed(baseSpeed * 2);
    else data.speed = baseSpeed * 2;
  }
  if (data._purpleDashing && data._purpleDashTimer >= 0.3) {
    data._purpleDashing = false;
    data._purpleDashTimer = 0;
    const baseSpeed = data.defaultSpeed ?? 240;
    if (self.setSpeed) (self as any).setSpeed(baseSpeed);
    else data.speed = baseSpeed;
  }

  // Apply perpendicular zig-zag movement
  const toPlayer = target.pos.sub(self.pos);
  if (toPlayer.len() > 1) {
    const perp = k.vec2(-toPlayer.y, toPlayer.x).unit();
    const zigForce = perp.scale(data._purpleZigDir * 180);
    (self as any).move(zigForce);
  }
}

export function applySmartBehavior(
  k: KAPLAYCtx,
  self: GameObj,
  target: GameObj,
) {
  const data = self as any;
  if (data._smartTimer === undefined) {
    data._smartTimer = 0;
    data._smartDodging = false;
    data._smartDodgeDir = k.vec2(0, 0);
    data._smartDodgeDuration = 0;
    data._smartStrafeDir = 1;
    data._smartStrafeTimer = 0;
  }

  const dt = k.dt();
  data._smartTimer += dt;
  data._smartStrafeTimer += dt;

  // Strafe around player (alterna direção a cada 1.5s)
  if (data._smartStrafeTimer >= 1.5) {
    data._smartStrafeTimer = 0;
    data._smartStrafeDir *= -1;
  }

  const toPlayer = target.pos.sub(self.pos);
  const distToPlayer = toPlayer.len();

  // Detect nearby projectiles and dodge them
  if (!data._smartDodging) {
    const projectiles = k.get("projectile") as GameObj[];
    for (const p of projectiles) {
      const toSelf = self.pos.sub(p.pos);
      const dist = toSelf.len();
      if (dist < 120) {
        // Check if projectile is heading towards us
        const pVel = (p as any).vel;
        if (pVel) {
          const dot = toSelf.unit().dot(pVel.unit());
          if (dot > 0.3) {
            // Projectile is coming towards us — dodge perpendicular
            const dodgePerp = k.vec2(-pVel.y, pVel.x).unit();
            // Pick side away from wall center
            const sign = Number(k.rand()) > 0.5 ? 1 : -1;
            data._smartDodgeDir = dodgePerp.scale(sign);
            data._smartDodging = true;
            data._smartDodgeDuration = 0;
            break;
          }
        }
      }
    }
  }

  // Apply dodge movement
  if (data._smartDodging) {
    data._smartDodgeDuration += dt;
    const dodgeSpeed = (data.defaultSpeed ?? 130) * 2.5;
    (self as any).move(data._smartDodgeDir.scale(dodgeSpeed));
    if (data._smartDodgeDuration >= 0.25) {
      data._smartDodging = false;
    }
  }

  // Strafe around the player at medium range
  if (distToPlayer > 1 && !data._smartDodging) {
    const perp = k.vec2(-toPlayer.y, toPlayer.x).unit();
    const strafeForce = perp.scale(data._smartStrafeDir * 80);
    (self as any).move(strafeForce);
  }

  // Keep preferred distance (tries to stay at ~150px from player)
  if (distToPlayer < 100 && distToPlayer > 1) {
    const away = toPlayer.unit().scale(-60);
    (self as any).move(away);
  }
}

// ─── Spinner Shooter ─────────────────────────────────────────────────────────
// Gira continuamente e dispara em duas direções opostas. Move-se aleatoriamente.
export function applySpinnerBehavior(
  k: KAPLAYCtx,
  self: GameObj,
  damage: number,
) {
  const data = self as any;
  if (data._spinAngle === undefined) {
    data._spinAngle = k.rand(0, Math.PI * 2);
    data._spinFireTimer = 0;
    data._spinMoveTimer = 0;
    data._spinDir = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit();
    data._spinFireRate = 0.55; // segundos entre tiros
  }

  const dt = k.dt();
  data._spinAngle += dt * 3.0; // rotação contínua
  data._spinFireTimer += dt;
  data._spinMoveTimer += dt;

  // Muda direção aleatória a cada ~1.8s
  if (data._spinMoveTimer >= 1.8) {
    data._spinMoveTimer = 0;
    data._spinDir = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit();
  }

  // Move-se na direção aleatória
  const spd = data.defaultSpeed ?? 100;
  (self as any).move(data._spinDir.scale(spd));

  // Dispara em duas extremidades opostas a cada intervalo
  if (data._spinFireTimer >= data._spinFireRate) {
    data._spinFireTimer = 0;
    const angles = [data._spinAngle, data._spinAngle + Math.PI];
    for (const ang of angles) {
      const dir = k.vec2(Math.cos(ang), Math.sin(ang));
      const b = k.add([
        k.rect(8, 8),
        k.pos(self.pos.x, self.pos.y),
        k.color(255, 120, 40),
        k.outline(2, k.rgb(255, 200, 100)),
        k.area(),
        { id: "enemy-bullet", damage },
      ]);
      b.onUpdate(() => {
        if (!b.exists()) return;
        b.move(dir.scale(320));
        if (b.pos.dist(self.pos) > 1400) b.destroy();
      });
      b.onCollide("arena-wall", () => { if (b.exists()) b.destroy(); });
      k.wait(8, () => {
        if (b.exists()) b.destroy();
      });
    }
  }
}

// ─── Summoner ────────────────────────────────────────────────────────────────
// Conjura novos inimigos periodicamente até um limite.
export function applySummonerBehavior(
  k: KAPLAYCtx,
  self: GameObj,
  target: GameObj,
  arenaBounds?: { x: number; y: number; w: number; h: number },
) {
  const data = self as any;
  if (data._summonTimer === undefined) {
    data._summonTimer = 3.5; // primeira invocação rápida
    data._summonCooldown = 5.0;
    data._summonCount = 0;
    data._summonMax = 6;
    data._summonCasting = false;
    data._summonCastTimer = 0;
  }

  const dt = k.dt();
  data._summonTimer += dt;

  // Fase de cast: fica parado enquanto invoca
  if (data._summonCasting) {
    data._summonCastTimer += dt;
    if (data.setSpeed) data.setSpeed(0);
    else data.speed = 0;
    if (data._summonCastTimer >= 0.6) {
      data._summonCasting = false;
      // Restaura movimento
      const baseSpd = data.defaultSpeed ?? 80;
      if (data.setSpeed) data.setSpeed(baseSpd);
      else data.speed = baseSpd;
      // Invoca 2 minions perto de si
      const margin = 48;
      const arena = arenaBounds;
      for (let i = 0; i < 2; i++) {
        if (data._summonCount >= data._summonMax) break;
        data._summonCount++;
        const offset = k.vec2(k.rand(-60, 60), k.rand(-60, 60));
        let spawnPos = self.pos.add(offset);
        if (arena) {
          spawnPos.x = k.clamp(
            spawnPos.x,
            arena.x + margin,
            arena.x + arena.w - margin,
          );
          spawnPos.y = k.clamp(
            spawnPos.y,
            arena.y + margin,
            arena.y + arena.h - margin,
          );
        }
        // Cria um minion vermelho básico diretamente
        const minion = k.add([
          k.rect(22, 22),
          k.pos(spawnPos.x, spawnPos.y),
          k.color(200, 80, 255),
          k.outline(2, k.rgb(255, 200, 80)),
          k.area(),
          k.body(),
          {
            id: "enemy",
            enemyType: "summoned_minion",
            hp: 3,
            maxHp: 3,
            marks: 0,
            marksDecayTimer: 0,
            poisonStacks: 0,
            poisonTickTimer: 0,
            damage: 30,
            lastDamageTime: 0,
            defaultSpeed: 160,
            speed: 160,
            _minionTarget: target,
            update(this: GameObj) {
              const t = (this as any)._minionTarget;
              if (t && t.exists()) {
                const dir = t.pos.sub(this.pos).unit();
                (this as any).move(dir.scale(160));
              }
            },
          },
        ]);
        minion.onDestroy(() => {
          if (data._summonCount > 0) data._summonCount--;
        });
        // Flash visual de invocação
        const flash = k.add([
          k.rect(22, 22),
          k.pos(spawnPos.x, spawnPos.y),
          k.color(255, 220, 80),
          k.opacity(0.8),
          k.z(200),
        ]);
        k.wait(0.25, () => {
          if (flash.exists()) flash.destroy();
        });
      }
    }
    return;
  }

  // Quando o timer bate e ainda pode invocar, inicia cast
  if (
    data._summonTimer >= data._summonCooldown &&
    data._summonCount < data._summonMax
  ) {
    data._summonTimer = 0;
    data._summonCasting = true;
    data._summonCastTimer = 0;
    // Efeito visual: pisca
    (self as any).color = k.rgb(255, 220, 80);
    k.wait(0.3, () => {
      if ((self as any).exists()) (self as any).color = k.rgb(150, 40, 220);
    });
  }
}

// ─── Regenerador ─────────────────────────────────────────────────────────────
// Se regenera quando fica tempo sem tomar dano.
export function applyRegenBehavior(k: KAPLAYCtx, self: GameObj) {
  const data = self as any;
  if (data._regenTimer === undefined) {
    data._regenTimer = 0;
    data._regenDelay = 3.5; // segundos sem dano para começar a regen
    data._regenRate = 0.4; // HP/s de regen (em ticks de 0.5s)
    data._regenTickTimer = 0;
  }

  const dt = k.dt();
  const now = k.time ? k.time() : Date.now() / 1000;
  const timeSinceDmg = now - (data.lastDamageTime ?? 0);

  if (timeSinceDmg >= data._regenDelay) {
    data._regenTickTimer += dt;
    if (data._regenTickTimer >= 0.5) {
      data._regenTickTimer = 0;
      const healAmt = Math.ceil(data.maxHp * 0.04); // 4% do HP max a cada 0.5s
      data.hp = Math.min(data.maxHp, (data.hp ?? 0) + healAmt);
      // Flash verde de cura
      const prevColor = (self as any).color;
      (self as any).color = k.rgb(80, 255, 120);
      k.wait(0.12, () => {
        if ((self as any).exists()) (self as any).color = prevColor;
      });
    }
  } else {
    data._regenTickTimer = 0;
  }
}

// ─── Colossus ────────────────────────────────────────────────────────────────
// Grande e lento; inimigos próximos tendem a se aproximar dele como proteção.
export function applyColossusBehavior(
  k: KAPLAYCtx,
  self: GameObj,
  target: GameObj,
) {
  const data = self as any;
  if (data._colossusTimer === undefined) {
    data._colossusTimer = 0;
    data._colossusShieldRadius = 120;
  }

  const dt = k.dt();
  data._colossusTimer += dt;

  // Inimigos ao redor ficam no campo de proteção (se aproximam do colosso)
  if (data._colossusTimer >= 0.3) {
    data._colossusTimer = 0;
    const allies = k.get("enemy") as GameObj[];
    for (const ally of allies) {
      if (ally === self) continue;
      const dist = ally.pos.dist(self.pos);
      if (dist < data._colossusShieldRadius && dist > 20) {
        // Puxa suavemente os aliados para trás do colosso (entre o colosso e o player)
        const toColossus = self.pos.sub(ally.pos).unit();
        (ally as any).move(toColossus.scale(40));
      }
    }
  }

  // Slam: causa dano em área perto de si periodicamente
  if (data._slamTimer === undefined) {
    data._slamTimer = 0;
    data._slamCooldown = 4.0;
    data._slamDamage = (data.damage ?? 80) * 1.5;
  }
  data._slamTimer += dt;
  if (data._slamTimer >= data._slamCooldown) {
    data._slamTimer = 0;
    const distToPlayer = self.pos.dist(target.pos);
    if (distToPlayer < 100) {
      // Dano de slam — aplica dano direto ao player
      const players = k.get("player") as GameObj[];
      for (const p of players) {
        if (p.pos.dist(self.pos) < 100) {
          (p as any).hp = Math.max(0, ((p as any).hp ?? 0) - data._slamDamage);
        }
      }
      // Efeito visual
      const shockCircle = k.add([
        k.circle(80),
        k.pos(self.pos.x, self.pos.y),
        k.color(180, 120, 50),
        k.opacity(0.5),
        k.z(50),
      ]);
      k.wait(0.3, () => {
        if (shockCircle.exists()) shockCircle.destroy();
      });
    }
  }
}

// ─── Cone Shooter ────────────────────────────────────────────────────────────
// Dispara um cone de projéteis em direção ao player.
export function applyConeShooterBehavior(
  k: KAPLAYCtx,
  self: GameObj,
  target: GameObj,
  damage: number,
) {
  const data = self as any;
  if (data._coneTimer === undefined) {
    data._coneTimer = k.rand(1.0, 2.0); // offset inicial aleatório
    data._coneCooldown = 2.2;
    data._coneBullets = 5;
    data._coneSpread = Math.PI / 4; // 45 graus total
  }

  const dt = k.dt();
  data._coneTimer += dt;

  if (data._coneTimer >= data._coneCooldown) {
    data._coneTimer = 0;
    const toPlayer = target.pos.sub(self.pos);
    if (toPlayer.len() < 1) return;
    const baseAngle = Math.atan2(toPlayer.y, toPlayer.x);
    const n = data._coneBullets;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const ang = baseAngle + t * data._coneSpread;
      const dir = k.vec2(Math.cos(ang), Math.sin(ang));
      const b = k.add([
        k.rect(9, 9),
        k.pos(self.pos.x, self.pos.y),
        k.color(255, 60, 200),
        k.outline(2, k.rgb(255, 180, 255)),
        k.area(),
        { id: "enemy-bullet", damage },
      ]);
      b.onUpdate(() => {
        if (!b.exists()) return;
        b.move(dir.scale(300));
        if (b.pos.dist(self.pos) > 1200) b.destroy();
      });
      b.onCollide("arena-wall", () => { if (b.exists()) b.destroy(); });
      k.wait(7, () => {
        if (b.exists()) b.destroy();
      });
    }
    // Flash visual
    const prevColor = (self as any).color;
    (self as any).color = k.rgb(255, 200, 255);
    k.wait(0.1, () => {
      if ((self as any).exists()) (self as any).color = prevColor;
    });
  }
}

export function applyBerserkerBehavior(k: KAPLAYCtx, self: GameObj, target: GameObj) {
  const data = self as any;
  const maxHp = data.maxHp ?? 5;
  const currentHp = data.hp ?? maxHp;
  const missingHpRatio = 1 - currentHp / maxHp;
  const speedBoost = 1.0 + missingHpRatio * 1.0; // up to 2x speed when almost dead
  const baseSpeed = data.defaultSpeed ?? 110;

  if (self.setSpeed) (self as any).setSpeed(baseSpeed * speedBoost);
  else data.speed = baseSpeed * speedBoost;
}

export function applyShieldGuardBehavior(k: KAPLAYCtx, self: GameObj, target: GameObj) {
  // Shield Guard moves slow and blocks projectiles.
  // The block logic is fully implemented in shoot.ts using direction checks.
  // Chasing is handled by the default movimentable component.
}

export function applyChargerBehavior(k: KAPLAYCtx, self: GameObj, target: GameObj) {
  const data = self as any;
  if (data._chargerState === undefined) {
    data._chargerState = "walk";
    data._chargerTimer = 0;
    data._chargerDir = k.vec2(0, 0);
  }

  data._chargerTimer += k.dt();
  const baseSpeed = data.defaultSpeed ?? 140;

  if (data._chargerState === "walk") {
    const toPlayer = target.pos.sub(self.pos);
    const dist = toPlayer.len();
    
    if (dist < 260 && data._chargerTimer > 2.0) {
      data._chargerState = "telegraph";
      data._chargerTimer = 0;
      data._chargerDir = toPlayer.unit();
      if (self.setSpeed) self.setSpeed(0);
      else data.speed = 0;
    } else {
      if (self.setSpeed) self.setSpeed(baseSpeed);
      else data.speed = baseSpeed;
      self.move(toPlayer.unit().scale(baseSpeed));
    }
  } 
  else if (data._chargerState === "telegraph") {
    const colorVal = Math.floor(k.time() * 20) % 2 === 0 ? k.rgb(255, 50, 50) : k.rgb(255, 200, 50);
    self.color = colorVal;
    
    k.drawLine({
      p1: self.pos.add(14, 14),
      p2: self.pos.add(14, 14).add(data._chargerDir.scale(300)),
      color: k.rgb(255, 0, 0),
      width: 2,
    });

    if (data._chargerTimer >= 0.8) {
      data._chargerState = "dash";
      data._chargerTimer = 0;
      self.color = data._originalColor || k.rgb(255, 100, 100);
    }
  } 
  else if (data._chargerState === "dash") {
    const dashSpeed = baseSpeed * 3.5;
    self.move(data._chargerDir.scale(dashSpeed));

    if (data._chargerTimer >= 0.4) {
      data._chargerState = "cooldown";
      data._chargerTimer = 0;
      if (self.setSpeed) self.setSpeed(0);
      else data.speed = 0;
    }
  } 
  else if (data._chargerState === "cooldown") {
    self.color = k.rgb(150, 150, 200);
    if (data._chargerTimer >= 0.8) {
      data._chargerState = "walk";
      data._chargerTimer = 0;
      self.color = data._originalColor || k.rgb(255, 100, 100);
    }
  }
}

export function applyPhantomBehavior(k: KAPLAYCtx, self: GameObj, target: GameObj) {
  const data = self as any;
  if (data._phantomTimer === undefined) {
    data._phantomTimer = 0;
  }

  data._phantomTimer += k.dt();
  const toPlayer = target.pos.sub(self.pos);
  const baseSpeed = data.defaultSpeed ?? 110;
  self.move(toPlayer.unit().scale(baseSpeed));

  if (data._phantomTimer >= 4.0) {
    data._phantomTimer = 0;
    
    for (let i = 0; i < 4; i++) {
      k.add([
        k.circle(k.rand(8, 14)),
        k.pos(self.pos.x + k.rand(-10, 10), self.pos.y + k.rand(-10, 10)),
        k.color(140, 60, 200),
        k.opacity(0.6),
        k.lifespan(0.4, { fade: 0.25 }),
        k.z(100)
      ]);
    }
    
    const angle = k.rand(0, Math.PI * 2);
    const offset = k.vec2(Math.cos(angle), Math.sin(angle)).scale(150);
    self.pos = target.pos.add(offset);
    
    for (let i = 0; i < 4; i++) {
      k.add([
        k.circle(k.rand(8, 14)),
        k.pos(self.pos.x + k.rand(-10, 10), self.pos.y + k.rand(-10, 10)),
        k.color(140, 60, 200),
        k.opacity(0.6),
        k.lifespan(0.4, { fade: 0.25 }),
        k.z(100)
      ]);
    }

    const dir = target.pos.sub(self.pos).unit();
    const scythe = k.add([
      k.circle(10),
      k.pos(self.pos.x, self.pos.y),
      k.color(200, 50, 255),
      k.outline(1.5, k.rgb(255, 255, 255)),
      k.area(),
      k.z(150),
      { id: "enemy-bullet", damage: data.damage ?? 40 }
    ]);
    scythe.onUpdate(() => {
      if (!scythe.exists()) return;
      scythe.move(dir.scale(320));
      scythe.scale = k.vec2(1.0 + Math.sin(k.time() * 12) * 0.2);
    });
    scythe.onCollide("arena-wall", () => {
      if (scythe.exists()) scythe.destroy();
    });
    k.wait(6, () => {
      if (scythe.exists()) scythe.destroy();
    });
  }
}

export function applyNinjaBehavior(k: KAPLAYCtx, self: GameObj, target: GameObj) {
  const data = self as any;
  if (data._ninjaTimer === undefined) {
    data._ninjaTimer = 0;
    data._ninjaDodgeTimer = 0;
    data._ninjaDirSign = Math.random() < 0.5 ? 1 : -1;
  }

  data._ninjaTimer += k.dt();
  data._ninjaDodgeTimer += k.dt();

  const toPlayer = target.pos.sub(self.pos);
  const perp = k.vec2(-toPlayer.y, toPlayer.x).unit();
  
  const dir = toPlayer.unit().scale(0.3).add(perp.scale(0.7 * data._ninjaDirSign)).unit();
  const baseSpeed = data.defaultSpeed ?? 210;
  
  if (data._ninjaDodgeTimer >= 1.8) {
    data._ninjaDodgeTimer = 0;
    const dodgeDir = perp.scale(data._ninjaDirSign);
    const dodgeSpeed = baseSpeed * 3.0;
    
    for (let i = 0; i < 3; i++) {
      k.add([
        k.rect(20, 20),
        k.pos(self.pos.x, self.pos.y),
        k.color(50, 50, 50),
        k.opacity(0.4),
        k.lifespan(0.3, { fade: 0.15 }),
        k.z(90)
      ]);
    }
    
    self.move(dodgeDir.scale(dodgeSpeed));
    if (Math.random() < 0.5) data._ninjaDirSign *= -1;
  } else {
    self.move(dir.scale(baseSpeed));
  }

  if (data._ninjaTimer >= 2.5) {
    data._ninjaTimer = 0;
    const baseDir = toPlayer.unit();
    const angles = [-0.2, 0, 0.2];
    
    for (const ang of angles) {
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      const shotDir = k.vec2(
        baseDir.x * cos - baseDir.y * sin,
        baseDir.x * sin + baseDir.y * cos
      ).unit();
      
      const shuriken = k.add([
        k.rect(10, 10),
        k.pos(self.pos.x, self.pos.y),
        k.color(150, 150, 150),
        k.outline(1, k.rgb(0, 0, 0)),
        k.rotate(0),
        k.anchor("center"),
        k.area(),
        k.z(150),
        { id: "enemy-bullet", damage: Math.round((data.damage ?? 35) * 0.7) }
      ]);
      shuriken.onUpdate(() => {
        if (!shuriken.exists()) return;
        shuriken.move(shotDir.scale(380));
        shuriken.angle += 360 * k.dt() * 2;
      });
      shuriken.onCollide("arena-wall", () => {
        if (shuriken.exists()) shuriken.destroy();
      });
      k.wait(5, () => {
        if (shuriken.exists()) shuriken.destroy();
      });
    }
  }
}

export function applyDetonatorBehavior(k: KAPLAYCtx, self: GameObj, target: GameObj) {
  const data = self as any;
  if (data._detonatorExploding === undefined) {
    data._detonatorExploding = false;
    data._detonatorTimer = 0;
  }

  if (data._detonatorExploding) {
    data._detonatorTimer += k.dt();
    const pct = data._detonatorTimer / 1.2;
    const isRed = Math.floor(data._detonatorTimer * 15) % 2 === 0;
    self.color = isRed ? k.rgb(255, 0, 0) : k.rgb(255, 150, 0);
    self.scale = k.vec2(1.0 + pct * 0.5);
    
    if (data._detonatorTimer >= 1.2) {
      triggerDetonatorExplosion(k, self.pos.clone(), data.damage ?? 60);
      self.destroy();
    }
    return;
  }

  const toPlayer = target.pos.sub(self.pos);
  const dist = toPlayer.len();
  const baseSpeed = data.defaultSpeed ?? 80;
  self.move(toPlayer.unit().scale(baseSpeed));

  if (dist < 80) {
    data._detonatorExploding = true;
    data._detonatorTimer = 0;
    if (self.setSpeed) self.setSpeed(0);
    else data.speed = 0;
  }
}

export function triggerDetonatorExplosion(k: any, pos: any, dmg: number) {
  const radius = 115;
  const expCircle = k.add([
    k.circle(radius),
    k.pos(pos.x, pos.y),
    k.color(255, 100, 20),
    k.opacity(0.65),
    k.z(100),
  ]);
  
  k.shake(4.0);
  
  for (let i = 0; i < 12; i++) {
    const angle = k.rand(0, Math.PI * 2);
    const spd = k.rand(120, 250);
    const p = k.add([
      k.circle(k.rand(4, 9)),
      k.pos(pos.x, pos.y),
      k.color(255, k.rand(100, 200), 20),
      k.opacity(0.95),
      k.lifespan(0.4, { fade: 0.25 }),
      k.z(110),
      { vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd }
    ]);
    p.onUpdate(() => {
      p.pos.x += p.vx * k.dt();
      p.pos.y += p.vy * k.dt();
    });
  }

  const players = k.get("player");
  if (players.length > 0) {
    const p = players[0] as any;
    if (gameState.intangibleUntil <= Date.now() && p.pos.dist(pos) <= radius + 20) {
      if (hasPerk("imunidade-critica") && Math.random() < 0.5 * gameState.luck) {
        showLuckyBlockFeedback(k, p.pos.clone());
      } else {
        p.hp = Math.max(0, (p.hp ?? gameState.maxHealth) - dmg);
        gameState.playerHealth = p.hp;
        if ((window as any).ui) {
          (window as any).ui.updateHearts(p.hp);
        }
        checkIntangibilidadeTrigger(k, p);
        if (p.hp <= 0) k.addKaboom(p.pos.clone());
      }
    }
  }

  const enemies = k.get("enemy") as any[];
  for (const e of enemies) {
    if (e.pos.dist(pos) <= radius && e.hp !== undefined) {
      e._lastDamageType = "explosion";
      e.hp -= dmg * 2.0;
      if (e.hp <= 0) e.destroy();
    }
  }

  k.wait(0.3, () => {
    if (expCircle.exists()) expCircle.destroy();
  });
}

export function applyVampireBehavior(k: KAPLAYCtx, self: GameObj, target: GameObj) {
  const data = self as any;
  if (data._vampireTimer === undefined) {
    data._vampireTimer = 0;
  }
  
  data._vampireTimer += k.dt();
  const toPlayer = target.pos.sub(self.pos);
  const dist = toPlayer.len();
  const baseSpeed = data.defaultSpeed ?? 90;
  self.move(toPlayer.unit().scale(baseSpeed));

  if (dist < 160) {
    const centerSelf = self.pos.add(14, 14);
    const centerPlayer = target.pos.add(30, 30);
    
    k.drawLine({
      p1: centerSelf,
      p2: centerPlayer,
      color: k.rgb(220, 20, 60),
      width: 1.5 + Math.sin(k.time() * 20) * 0.5,
    });
    
    if (Math.random() < 0.25) {
      const angle = k.rand(0, Math.PI * 2);
      const startP = centerPlayer.add(k.vec2(Math.cos(angle), Math.sin(angle)).scale(15));
      const spark = k.add([
        k.circle(3),
        k.pos(startP.x, startP.y),
        k.color(255, 0, 50),
        k.opacity(0.85),
        k.z(160),
        k.lifespan(0.4),
      ]);
      spark.onUpdate(() => {
        if (!spark.exists() || !self.exists()) return;
        const dirSelf = self.pos.add(14, 14).sub(spark.pos).unit();
        spark.move(dirSelf.scale(350));
      });
    }

    if (data._vampireTimer >= 0.5) {
      data._vampireTimer = 0;
      const dmg = 2;
      
      if (gameState.intangibleUntil <= Date.now()) {
        const hasBlocked = hasPerk("imunidade-critica") && Math.random() < 0.5 * gameState.luck;
        if (hasBlocked) {
          showLuckyBlockFeedback(k, target.pos.clone());
        } else {
          target.hp = Math.max(0, (target.hp ?? gameState.maxHealth) - dmg);
          gameState.playerHealth = target.hp;
          if ((window as any).ui) (window as any).ui.updateHearts(target.hp);
          
          self.hp = Math.min(self.maxHp ?? 12, (self.hp ?? 12) + 2);
          
          checkIntangibilidadeTrigger(k, target);
          if (target.hp <= 0) k.addKaboom(target.pos.clone());
        }
      }
    }
  }
}

export function applyIllusionistBehavior(k: KAPLAYCtx, self: GameObj, target: GameObj) {
  const data = self as any;
  if (data._illusTimer === undefined) {
    data._illusTimer = 0;
    data._illusPrevHp = data.hp ?? 7;
    data._illusClonesCount = 0;
    data._illusAngleOffset = k.rand(-1, 1);
  }

  data._illusTimer += k.dt();
  const toPlayer = target.pos.sub(self.pos);
  const perp = k.vec2(-toPlayer.y, toPlayer.x).unit();
  const dir = toPlayer.unit().add(perp.scale(Math.sin(k.time() * 4) * 0.6 + data._illusAngleOffset)).unit();
  
  const baseSpeed = data.defaultSpeed ?? 120;
  self.move(dir.scale(baseSpeed));

  const currentHp = data.hp ?? 0;
  if (currentHp < data._illusPrevHp && currentHp > 0) {
    data._illusPrevHp = currentHp;
    
    if (!data.isClone && data._illusClonesCount < 2) {
      data._illusClonesCount += 1;
      const cloneOffset = k.vec2(k.rand(-40, 40), k.rand(-40, 40));
      const clonePos = self.pos.add(cloneOffset);
      const s = data.width ?? 26;
      
      const clone = k.add([
        k.rect(s, s),
        k.pos(clonePos.x, clonePos.y),
        k.color(20, 184, 166),
        k.opacity(0.75),
        k.outline(2, k.rgb(255, 255, 255)),
        k.area(),
        k.body(),
        speed({ value: baseSpeed }),
        movimentable(k, { getDirection: (self) => target.pos.sub(self.pos) }),
        {
          id: "enemy",
          enemyType: "illusionist",
          name: "Ilusão",
          hp: 1,
          maxHp: 1,
          damage: Math.round(data.damage * 0.4),
          defaultSpeed: baseSpeed,
          isClone: true,
          update(this: GameObj) {
            const toP = target.pos.sub(this.pos);
            this.move(toP.unit().scale(baseSpeed));
          }
        }
      ]);
      
      clone.onDestroy(() => {
        if (self.exists()) {
          data._illusClonesCount = Math.max(0, data._illusClonesCount - 1);
        }
      });
      
      for (let i = 0; i < 3; i++) {
        k.add([
          k.circle(k.rand(6, 10)),
          k.pos(clonePos.x + 13, clonePos.y + 13),
          k.color(20, 200, 180),
          k.opacity(0.5),
          k.lifespan(0.3, { fade: 0.15 }),
        ]);
      }
    }
  }

  if (data._illusTimer >= 3.0) {
    data._illusTimer = 0;
    const shotDir = toPlayer.unit();
    const bolt = k.add([
      k.circle(8),
      k.pos(self.pos.x + 13, self.pos.y + 13),
      k.color(100, 255, 220),
      k.outline(1, k.rgb(0, 0, 0)),
      k.area(),
      k.z(150),
      { id: "enemy-bullet", damage: data.damage ?? 30 }
    ]);
    bolt.onUpdate(() => {
      if (!bolt.exists()) return;
      bolt.move(shotDir.scale(270));
    });
    bolt.onCollide("arena-wall", () => {
      if (bolt.exists()) bolt.destroy();
    });
    k.wait(5, () => {
      if (bolt.exists()) bolt.destroy();
    });
  }
}

export function applyTrapperBehavior(k: KAPLAYCtx, self: GameObj, target: GameObj) {
  const data = self as any;
  if (data._trapperTimer === undefined) {
    data._trapperTimer = 0;
  }

  data._trapperTimer += k.dt();
  const toPlayer = target.pos.sub(self.pos);
  const dist = toPlayer.len();
  const baseSpeed = data.defaultSpeed ?? 95;

  if (dist < 200) {
    self.move(toPlayer.unit().scale(-baseSpeed));
  } else if (dist > 350) {
    self.move(toPlayer.unit().scale(baseSpeed));
  } else {
    const perp = k.vec2(-toPlayer.y, toPlayer.x).unit();
    self.move(perp.scale(baseSpeed * 0.5));
  }

  if (data._trapperTimer >= 3.5) {
    data._trapperTimer = 0;
    const trapPos = target.pos.clone().add(k.rand(-40, 40), k.rand(-40, 40));
    
    const trap = k.add([
      k.circle(16),
      k.pos(trapPos.x + 30, trapPos.y + 30),
      k.anchor("center"),
      k.color(80, 80, 80),
      k.outline(1.5, k.rgb(255, 50, 50)),
      k.area(),
      k.z(40),
      { id: "steel-trap", active: true }
    ]);
    
    trap.onCollide("player", (p: any) => {
      if (!trap.active) return;
      trap.active = false;
      
      const origSpeed = p.speed ?? 600;
      p.speed = 0;
      p.color = k.rgb(255, 100, 100);
      
      trap.color = k.rgb(40, 40, 40);
      trap.outline.color = k.rgb(0, 0, 0);
      
      k.wait(1.0, () => {
        if (p.exists()) {
          p.speed = origSpeed;
          p.color = k.rgb(0, 180, 255);
        }
        trap.destroy();
      });
      
      k.wait(0.2, () => {
        if (self.exists() && p.exists()) {
          const arrowDir = p.pos.sub(self.pos).unit();
          const arrow = k.add([
            k.rect(18, 5),
            k.pos(self.pos.x + 14, self.pos.y + 14),
            k.anchor("center"),
            k.rotate(k.rad2deg(Math.atan2(arrowDir.y, arrowDir.x))),
            k.color(255, 50, 50),
            k.outline(1, k.rgb(0,0,0)),
            k.area(),
            k.z(150),
            { id: "enemy-bullet", damage: Math.round((data.damage ?? 35) * 1.5) }
          ]);
          arrow.onUpdate(() => {
            if (!arrow.exists()) return;
            arrow.move(arrowDir.scale(550));
          });
          arrow.onCollide("arena-wall", () => {
            if (arrow.exists()) arrow.destroy();
          });
          k.wait(5, () => {
            if (arrow.exists()) arrow.destroy();
          });
        }
      });
    });

    k.wait(7.0, () => {
      if (trap.exists()) trap.destroy();
    });
  }
}

