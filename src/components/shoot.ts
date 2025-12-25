import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";

export type ShootOptions = {
    chargeTime?: number,
    projectileSpeed?: number,
    projectileSize?: number,
    projectileColor?: [number, number, number],
};

export function shoot(k: KAPLAYCtx, opts: ShootOptions = {}) {
    const chargeTime = opts.chargeTime ?? 1.0; // seconds to charge
    const projSpeed = opts.projectileSpeed ?? 500;
    const projSize = opts.projectileSize ?? 8;
    const projColor = opts.projectileColor ?? [255, 255, 0];

    let lastPos: Vec2 | null = null;
    let channeling = false;
    let charge = 0;
    let topLine: GameObj | null = null;
    let rightLine: GameObj | null = null;
    let bottomLine: GameObj | null = null;
    let leftLine: GameObj | null = null;
    const lineThickness = 4;

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
            if (d < best) { best = d; nearest = e; }
        }
        return nearest;
    }

    function fire(self: GameObj) {
        const target = findNearestEnemy(self.pos);
        if (!target) return;
        const dir = target.pos.sub(self.pos).unit();
        const p = k.add([
            k.rect(projSize, projSize),
            k.pos(self.pos.x, self.pos.y),
            k.color(projColor[0], projColor[1], projColor[2]),
            k.outline(2, k.rgb(255, 255, 255)),
            k.area(),
            { id: "projectile", vel: dir.scale(projSpeed) },
        ]);
        p.onUpdate(() => {
            p.move(p.vel);
            // remove if too far from camera
            if (p.pos.dist(self.pos) > k.width() * 2) p.destroy();
        });
        // hit enemy
        p.onCollide("enemy", (e: GameObj) => {
            // Simple effect: destroy projectile, optionally knock enemy
            p.destroy();
        });
        // hit walls
        p.onCollide("arena-wall", () => p.destroy());
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
                    k.pos(0, -2),
                    k.color(0, 255, 0),
                    k.scale(0, 1), // start with zero length on X
                    { id: "charge-indicator-top" },
                ]);
            }
            if (!rightLine) {
                rightLine = this.add([
                    k.rect(lineThickness, 1),
                    k.pos(w - 2, 0),
                    k.color(0, 255, 0),
                    k.scale(1, 0), // start with zero length on Y
                    { id: "charge-indicator-right" },
                ]);
            }
            if (!bottomLine) {
                bottomLine = this.add([
                    k.rect(1, lineThickness),
                    k.pos(0, h - 2),
                    k.color(0, 255, 0),
                    k.scale(0, 1), // start with zero length on X
                    { id: "charge-indicator-bottom" },
                ]);
            }
            if (!leftLine) {
                leftLine = this.add([
                    k.rect(lineThickness, 1),
                    k.pos(-2, 0),
                    k.color(0, 255, 0),
                    k.scale(1, 0), // start with zero length on Y
                    { id: "charge-indicator-left" },
                ]);
            }

            k.onUpdate(() => {
                const still = isStationary(this);
                if (still) {
                    channeling = true;
                    charge += k.dt();
                    const percentToShoot = Math.min(1, charge / chargeTime) * 100; // 0-100

                    const sizeSquare = (this.getSize().width / 100);

                    // Grow line lengths based on charge percent without spawning new squares
                    // Top edge: 0% - 25%
                    if (topLine) {
                        const pct = Math.min(percentToShoot, 25);
                        const len = Math.max(0, pct * 4 * sizeSquare + 4); // up to full width
                        // Scale X relative to base width 1
                        topLine.scale = k.vec2(len, 1);
                        topLine.pos = k.vec2(-2, -2);
                    }
                    // Right edge: 25% - 50%
                    if (rightLine) {
                        const pct = Math.max(0, Math.min(percentToShoot - 25, 25));
                        const len = Math.max(0, pct * 4 * sizeSquare + 4); // up to full height
                        rightLine.scale = k.vec2(1, len);
                        rightLine.pos = k.vec2(this.getSize().width - 2, -2);
                    }
                    // Bottom edge: 50% - 75%
                    if (bottomLine) {
                        const pct = Math.max(0, Math.min(percentToShoot - 50, 25));
                        const len = Math.max(0, pct * 4 * sizeSquare); // up to full width
                        bottomLine.scale = k.vec2(len, 1);
                        // grow inversely: start from right and extend left
                        const startX = this.getSize().width - 2 - len;
                        bottomLine.pos = k.vec2(startX, this.getSize().height - 2);
                    }
                    // Left edge: 75% - 100%
                    if (leftLine) {
                        const pct = Math.max(0, Math.min(percentToShoot - 75, 25));
                        const len = Math.max(0, pct * 4 * sizeSquare); // up to full height
                        leftLine.scale = k.vec2(1, len);
                        // grow inversely: start from bottom and extend up
                        const startY = this.getSize().height - 2 - len;
                        leftLine.pos = k.vec2(-2, startY);
                    }
                } else {
                    // movement cancels channeling and resets charge
                    channeling = false;
                    // Reset lines when movement happens
                    charge = 0;
                    if (topLine) topLine.scale = k.vec2(0, 1);
                    if (rightLine) rightLine.scale = k.vec2(1, 0);
                    if (bottomLine) bottomLine.scale = k.vec2(0, 1);
                    if (leftLine) leftLine.scale = k.vec2(1, 0);
                }

                if (channeling && charge >= chargeTime) {
                    channeling = false;
                    charge = 0;
                    // Optionally fire here
                    fire(this);
                }

                // Track last pos for next frame
                lastPos = this.pos.clone();
            });
        },
    } as const;
}
