import type { GameObj, Vec2 } from "kaplay";
import { speed } from "./speed";
import { movimentable } from "./movimentable";
import { createMinimap } from "./minimap";

export type PlayerOptions = {
    pos?: Vec2,
    size?: number,
    color?: [number, number, number],
    speed?: number,
};

export function createPlayer(k: any, opts: PlayerOptions = {}): GameObj {
    const s = opts.size ?? 36;
    const spd = opts.speed ?? 220;
    const startPos = opts.pos ?? k.vec2(k.width() / 2, k.height() / 2);
    const color = opts.color ?? [0, 180, 255];

    const player = k.add([
        k.rect(s, s),
        k.pos(startPos.x, startPos.y),
        k.color(color[0], color[1], color[2]),
        k.outline(4),
        k.area(),
        k.body(),
        speed({ value: spd }),
        movimentable(k),
        {
            update(this: GameObj) {
                k.camPos(this.pos);
            },
        },
    ]);

    // Arena based on viewport size
    const wallThickness = 24;
    const arenaPadding = 40;
    const arena = {
        x: startPos.x - k.width() / 2 + arenaPadding,
        y: startPos.y - k.height() / 2 + arenaPadding,
        w: k.width() - arenaPadding * 2,
        h: k.height() - arenaPadding * 2,
    };

    const makeWall = (x: number, y: number, w: number, h: number) =>
        k.add([
            k.rect(w, h),
            k.pos(x, y),
            k.color(40, 40, 60),
            k.area(),
            k.body({ isStatic: true }),
        ]);

    // top
    makeWall(arena.x, arena.y, arena.w, wallThickness);
    // bottom
    makeWall(arena.x, arena.y + arena.h - wallThickness, arena.w, wallThickness);
    // left
    makeWall(arena.x, arena.y, wallThickness, arena.h);
    // right
    makeWall(arena.x + arena.w - wallThickness, arena.y, wallThickness, arena.h);

    // Minimap
    createMinimap(k, player, { arena, size: { w: 160, h: 120 }, margin: 8 });

    return player;
}
