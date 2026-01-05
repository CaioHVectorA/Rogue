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
  // store timers on the object to persist between updates
  const data = self as any;
  if (data._greenTimer === undefined) {
    data._greenTimer = 0;
    data._greenWalking = true;
    data._greenShotCooldown = 0;
  }
  data._greenTimer += k.dt();
  data._greenShotCooldown = Math.max(0, data._greenShotCooldown - k.dt());

  if (data._greenWalking && data._greenTimer >= 0.1) {
    data._greenWalking = false;
    data._greenTimer = 0;
    if (self.setSpeed) self.setSpeed(0);
    else data.speed = 0;
  } else if (!data._greenWalking && data._greenTimer >= 1.2) {
    data._greenWalking = true;
    data._greenTimer = 0;
    // restore some default speed if available (fallback 110)
    const defaultSpeed = data.defaultSpeed ?? 110;
    if (self.setSpeed) self.setSpeed(defaultSpeed);
    else data.speed = defaultSpeed;
  }

  // shoot once when entering stop phase
  if (
    !data._greenWalking &&
    data._greenTimer < 0.05 &&
    data._greenShotCooldown <= 0
  ) {
    data._greenShotCooldown = 0.6;
    const dir = target.pos.sub(self.pos).unit();
    const b = k.add([
      k.rect(8, 8),
      k.pos(self.pos.x, self.pos.y),
      k.color(60, 200, 100),
      k.area(),
      { id: "enemy-bullet" },
    ]);
    b.onUpdate(() => b.move(dir.scale(400)));
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
