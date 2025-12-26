import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { speed } from "./speed";
import { movimentable } from "./movimentable";

export type EnemyOptions = {
    pos?: Vec2,
    size?: number,
    color?: [number, number, number],
    speed?: number,
    target: GameObj,
    arenaBounds?: { x: number, y: number, w: number, h: number },
    margin?: number,
    hp?: number,
};

export function createEnemy(k: KAPLAYCtx, opts: EnemyOptions): GameObj {
    const s = opts.size ?? 28;
    const spd = opts.speed ?? 90; // slower default speed
    const margin = opts.margin ?? 32; // avoid spawning inside walls
    const arena = opts.arenaBounds;
    const startPos = opts.pos ?? (
        arena
            ? k.vec2(
                k.rand(arena.x + margin, arena.x + arena.w - margin),
                k.rand(arena.y + margin, arena.y + arena.h - margin)
            )
            : k.vec2(k.rand(0, k.width()), k.rand(0, k.height()))
    );
    const color = opts.color ?? [255, 60, 60];
    const maxHP = opts.hp ?? 3;

    const enemy = k.add([
        k.rect(s, s),
        k.pos(startPos.x, startPos.y),
        k.color(color[0], color[1], color[2]),
        k.outline(3),
        k.area(),
        k.body(), // enable physics collisions with walls and other enemies
        speed({ value: spd }),
        movimentable(k, {
            getDirection: (self) => {
                // Chase the target based on current position
                return opts.target.pos.sub(self.pos);
            },
        }),
        {
            id: "enemy",
            hp: maxHP,
            update(this: GameObj & { hp: number }) {
                // keep inside arena bounds by nudging back if beyond
                if (arena) {
                    const minX = arena.x + margin;
                    const maxX = arena.x + arena.w - margin;
                    const minY = arena.y + margin;
                    const maxY = arena.y + arena.h - margin;
                    this.pos.x = k.clamp(this.pos.x, minX, maxX);
                    this.pos.y = k.clamp(this.pos.y, minY, maxY);
                }
            },
        },
    ]) as GameObj & { hp: number, speed?: number };

    // Collide with walls: body handles resolution; add small bounce feedback
    enemy.onCollide("arena-wall", () => {
        const away = enemy.pos.sub(opts.target.pos).unit();
        enemy.move(away.scale(enemy.speed ?? spd));
    });

    // Collide with other enemies to avoid overlapping
    enemy.onCollide("enemy", (other: GameObj) => {
        const push = enemy.pos.sub(other.pos).unit();
        enemy.move(push.scale(20));
    });

    return enemy;
}
