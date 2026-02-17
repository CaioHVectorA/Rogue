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
    b.onUpdate(() => b.move(dir.scale(280)));
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
