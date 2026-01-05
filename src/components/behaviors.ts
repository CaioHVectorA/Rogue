import type { GameObj, KAPLAYCtx } from "kaplay";

export function applyGreenBehavior(
  k: KAPLAYCtx,
  self: GameObj & {
    speed?: number;
    setSpeed?: (v: number) => void;
    defaultSpeed?: number;
  },
  target: GameObj
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
    const b = k.add([ k.rect(8, 8), k.pos(self.pos.x, self.pos.y), k.color(60, 200, 100), k.area(), { id: "enemy-bullet" } ]);
    b.onUpdate(() => b.move(dir.scale(280)));
    data._greenShotDone = true;
  }
  if (data._greenTimer >= phaseDuration + 0.05) {
    data._greenCycleRunning = false; // next cycle will randomize mode again
    if (self.setSpeed) self.setSpeed(moveSpeed); else data.speed = moveSpeed;
  }
}

export function applyRedBehavior(k: KAPLAYCtx, self: GameObj) {
  const neighbors = (k.get ? k.get("enemy") : []) as (GameObj & {
    enemyType?: string;
  })[];
  const nearbyReds = neighbors.filter(
    (n) => n !== self && n.enemyType === "red" && self.pos.dist(n.pos) < 160
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
