import type { Vec2 } from "kaplay";

export type ArenaOptions = {
    center?: Vec2,
    thickness?: number,
    padding?: number,
    mapState?: number, // 1..5 increases size
    color?: [number, number, number],
};

export function createArena(k: any, opts: ArenaOptions = {}) {
    const center = opts.center ?? k.vec2(k.width() / 2, k.height() / 2);
    const thickness = opts.thickness ?? 24;
    const padding = opts.padding ?? 40;
    const mapState = k.clamp(opts.mapState ?? 1, 1, 5);
    const color = opts.color ?? [40, 40, 60];

    // Explicit calibration per mapState
    let scaleW: number;
    let scaleH: number;
    switch (mapState) {
        case 1: // bem reduzido
            scaleW = 0.6; scaleH = 0.6;
            break;
        case 2: // ok (referência)
            scaleW = 1.0; scaleH = 1.0;
            break;
        case 3: // estado atual (ajustado para caber melhor na tela)
            scaleW = 1.3; scaleH = 1.2;
            break;
        case 4: // menor que 3
            scaleW = 1.2; scaleH = 1.1;
            break;
        case 5: // maior o suficiente para vazar além da tela
            scaleW = 2.2; scaleH = 2.0;
            break;
        default:
            scaleW = 1.0; scaleH = 1.0;
    }

    const arena = {
        x: center.x - (k.width() * scaleW) / 2 + padding,
        y: center.y - (k.height() * scaleH) / 2 + padding,
        w: k.width() * scaleW - padding * 2,
        h: k.height() * scaleH - padding * 2,
    };

    const makeWall = (x: number, y: number, w: number, h: number) =>
        k.add([
            k.rect(w, h),
            k.pos(x, y),
            k.color(color[0], color[1], color[2]),
            k.area(),
            k.body({ isStatic: true }),
            { id: "arena-wall" },
        ]);

    // top
    makeWall(arena.x, arena.y, arena.w, thickness);
    // bottom
    makeWall(arena.x, arena.y + arena.h - thickness, arena.w, thickness);
    // left
    makeWall(arena.x, arena.y, thickness, arena.h);
    // right
    makeWall(arena.x + arena.w - thickness, arena.y, thickness, arena.h);

    return arena;
}
