import type { GameObj, Vec2 } from "kaplay";
import { speed } from "./speed";
import { movimentable } from "./movimentable";
import { shoot } from "./shoot";
import { size } from "./size";

export type PlayerOptions = {
    pos?: Vec2,
    size?: number,
    color?: [number, number, number],
    speed?: number,
    mapState?: number,
    hp?: number,
};

export function createPlayer(k: any, opts: PlayerOptions = {}): GameObj {
    const s = opts.size ?? 36;
    const spd = opts.speed ?? 220;
    const startPos = opts.pos ?? k.vec2(k.width() / 2, k.height() / 2);
    const color = opts.color ?? [0, 180, 255];
    const baseHP = opts.hp ?? 5;

    // Camera zoom based on mapState (gentler scaling)
    const mapState = k.clamp(opts.mapState ?? 1, 1, 5);
    let camScaleVal: number;
    switch (mapState) {
        case 1: camScaleVal = 1.15; break; // menos pequeno
        case 2: camScaleVal = 1.0; break;  // ok
        case 3: camScaleVal = 0.8; break; // quase sem zoom out
        case 4: camScaleVal = 0.72; break; // um pouco menor
        case 5: camScaleVal = 0.82; break; // amplo sem exagero
        default: camScaleVal = 1.0;
    }
    k.camScale(k.vec2(camScaleVal));
    const outline = 6
    const player = k.add([
        k.rect(s, s),
        k.pos(startPos.x, startPos.y),
        k.color(color[0], color[1], color[2]),
        k.outline(outline, k.rgb(255, 255, 255)),
        k.area(),
        k.body(),
        size({ width: s, height: s }),
        speed({ value: spd }),
        movimentable(k),
        // Use default projectile speed from gameState inside shoot
        shoot(k, { outlineSize: outline, chargeTime: 0.2 }),
        {
            id: "player", hp: baseHP,
            update(this: GameObj & { hp: number }) {
                // Camera só segue o player no estado 5
                if (mapState === 5) {
                    k.camPos(this.pos);
                }
            },
        },
    ]) as GameObj & { hp: number };

    return player;
}
