import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { speed } from "./speed";
import { movimentable } from "./movimentable";

export type EnemyOptions = {
    pos?: Vec2,
    size?: number,
    color?: [number, number, number],
    speed?: number,
    target: GameObj,
};

export function createEnemy(k: KAPLAYCtx, opts: EnemyOptions): GameObj {
    const s = opts.size ?? 28;
    const spd = opts.speed ?? 160;
    const startPos = opts.pos ?? k.vec2(k.rand(0, k.width()), k.rand(0, k.height()));
    const color = opts.color ?? [255, 60, 60];

    const enemy = k.add([
        k.rect(s, s),
        k.pos(startPos.x, startPos.y),
        k.color(color[0], color[1], color[2]),
        k.outline(3),
        k.opacity(0),
        k.area(),
        // No physics body to avoid gravity; still collides via area
        speed({ value: spd }),
        movimentable(k, {
            // Provide AI direction that chases the target
            getDirection: () => {
                const to = opts.target.pos.sub(startPos);
                // Use current enemy pos for direction calculation
                return opts.target.pos.sub(enemy.pos);
            },
        }),
        {
            id: "enemy",
            update(this: GameObj) {
                // Optional simple behavior: look at target, could add wobble or patrol later
            },
        },
    ]);

    // Simple collision feedback
    enemy.onCollide("arena-wall", () => {
        // Bounce back a bit on wall hit
        const away = enemy.pos.sub(opts.target.pos).unit();
        enemy.move(away.scale(enemy.speed ?? 160));
    });

    return enemy;
}
