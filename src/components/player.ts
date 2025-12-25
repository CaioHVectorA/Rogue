import type { GameObj, Vec2 } from "kaplay";
import { speed } from "./speed";
import { movimentable } from "./movimentable";

export type PlayerOptions = {
    pos?: Vec2,
    size?: number,
    color?: [number, number, number],
    speed?: number,
    mapState?: number,
};

export function createPlayer(k: any, opts: PlayerOptions = {}): GameObj {
    const s = opts.size ?? 36;
    const spd = opts.speed ?? 220;
    const startPos = opts.pos ?? k.vec2(k.width() / 2, k.height() / 2);
    const color = opts.color ?? [0, 180, 255];

    // Camera zoom based on mapState
    const mapState = k.clamp(opts.mapState ?? 1, 1, 5);
    const zoomOutFactor = 1 - (mapState - 1) * 0.33;
    k.camScale(k.vec2(Math.max(0.4, zoomOutFactor)));

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

    return player;
}
