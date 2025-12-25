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

    const scaleW = 1 + (mapState - 1) * 0.5;
    const scaleH = 1 + (mapState - 1) * 0.3;

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
