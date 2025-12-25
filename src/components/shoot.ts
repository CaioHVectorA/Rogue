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
    let squaresCharge = 0
    let sizeLines = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    }
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
            k.onUpdate(() => {
                const still = isStationary(this);
                if (still) {
                    channeling = true;
                    charge += k.dt();
                    const percentToShoot = Math.min(1, charge / chargeTime) * 100; // 0-100
                    //console.log(`Charging: ${(percentToShoot).toFixed(0)}%`);
                    const fixedSize = 4;
                    const sizeSquare = (this.getSize().width / 100); // a edge in percenting based on 100
                    // the idea is to make a crescent outline based on charge time
                    if (percentToShoot <= 25) {
                        // is a horizontal line
                        const squaresNeededFirstEdge = (percentToShoot) * 4;
                        for (let i = squaresCharge; i < squaresNeededFirstEdge + 16; i++) {
                            const sizeToUp = (i - squaresCharge) * sizeSquare;
                            const rect = k.rect(sizeSquare, fixedSize);
                            //const pos = squaresCharge * sizeSquare - 2;
                            const pos = i * sizeSquare - 2;
                            this.add([
                                rect,
                                k.color(0, 255, 0),
                                //k.outline(fixedSize, k.rgb(0, 255, 0)),
                                k.pos(pos, -2),
                                { id: "charge-indicator" },
                            ]);
                            sizeLines.top += sizeSquare;
                        }
                        squaresCharge = squaresNeededFirstEdge;
                    }
                    else if (percentToShoot <= 50) {
                        // is a vertical line
                        const squaresNeededSecondEdge = (percentToShoot - 25) * 4;
                        for (let i = squaresCharge; i < squaresNeededSecondEdge + 16; i++) {
                            const sizeToUp = (i - squaresCharge) * sizeSquare;
                            const rect = k.rect(fixedSize, sizeSquare);
                            const pos = i * sizeSquare - 2;
                            this.add([
                                rect,
                                k.color(0, 255, 0),
                                //k.outline(fixedSize, k.rgb(0, 255, 0)),
                                k.pos(this.getSize().width - 2, pos),
                                { id: "charge-indicator" },
                            ]);
                            sizeLines.right += sizeSquare;
                        }
                        squaresCharge = squaresNeededSecondEdge;
                    }
                    else if (percentToShoot <= 75) {
                        // is a horizontal line (bottom)
                        const squaresNeededThirdEdge = (percentToShoot - 50) * 4;
                        for (let i = squaresCharge; i < squaresNeededThirdEdge + 16; i++) {
                            const sizeToUp = (i - squaresCharge) * sizeSquare;
                            const rect = k.rect(sizeSquare, fixedSize);
                            const pos = i * sizeSquare - 2;
                            this.add([
                                rect,
                                k.color(0, 255, 0),
                                //k.outline(fixedSize, k.rgb(0, 255, 0)),
                                k.pos(pos, this.getSize().height - 2),
                                { id: "charge-indicator" },
                            ]);
                            sizeLines.bottom += sizeSquare;
                        }
                        squaresCharge = squaresNeededThirdEdge;
                    } else if (percentToShoot <= 100) {
                        // is a vertical line (left)
                        const squaresNeededFourthEdge = (percentToShoot - 75) * 4;
                        for (let i = squaresCharge; i < squaresNeededFourthEdge + 16; i++) {
                            const sizeToUp = (i - squaresCharge) * sizeSquare;
                            const rect = k.rect(fixedSize, sizeSquare);
                            const pos = i * sizeSquare - 2;
                            this.add([
                                rect,
                                k.color(0, 255, 0),
                                //k.outline(fixedSize, k.rgb(0, 255, 0)),
                                k.pos(-2, pos),
                                { id: "charge-indicator" },
                            ]);
                            sizeLines.left += sizeSquare;
                        }
                        squaresCharge = squaresNeededFourthEdge;
                    }
                } else {
                    // movement cancels channeling and resets charge
                    channeling = false;
                    //charge = 0;
                }

                if (channeling && charge >= chargeTime) {
                    //charge = 0;
                    channeling = false;
                    //fire(this);
                }

                // Track last pos for next frame
                lastPos = this.pos.clone();
            });
        },
    } as const;
}
