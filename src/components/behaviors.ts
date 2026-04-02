import type { GameObj, KAPLAYCtx } from "kaplay";

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
