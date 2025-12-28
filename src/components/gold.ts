import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";

export function spawnGoldDrop(k: KAPLAYCtx, pos: Vec2, amount = 1): GameObj {
    const w = 10;
    const h = 6;
    const drop = k.add([
        k.rect(w, h),
        k.pos(pos.x - w / 2, pos.y - h / 2),
        k.color(255, 215, 0),
        k.outline(2, k.rgb(200, 160, 0)),
        k.area(),
        { id: "gold-drop", value: amount },
    ]) as GameObj & { value: number };

    return drop;
}
