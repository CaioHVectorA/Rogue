import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { speed } from "../speed";
import { movimentable } from "../movimentable";
import { spawnGoldDrop } from "../gold";

export type EnemyBaseOptions = {
    pos?: Vec2,
    size?: number,
    color?: [number, number, number],
    speed?: number,
    target: GameObj,
    arenaBounds?: { x: number, y: number, w: number, h: number },
    margin?: number,
    hp?: number,
    damage?: number,
    type?: string,
};

export function commonEnemy(k: KAPLAYCtx, opts: EnemyBaseOptions) {
    const s = opts.size ?? 28;
    const spd = opts.speed ?? 100;
    const margin = opts.margin ?? 32;
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
    const dmg = opts.damage ?? 1;

    const enemy = k.add([
        k.rect(s, s),
        k.pos(startPos.x, startPos.y),
        k.color(color[0], color[1], color[2]),
        k.outline(3),
        k.area(),
        k.body(),
        speed({ value: spd }),
        movimentable(k, {
            getDirection: (self) => opts.target.pos.sub(self.pos),
        }),
        {
            id: "enemy",
            enemyType: opts.type ?? "red",
            hp: maxHP,
            damage: dmg,
            lastDamageTime: 0,
            update(this: GameObj & { hp: number }) {
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
    ]) as GameObj & { hp: number, speed?: number, damage: number, lastDamageTime: number, enemyType: string };

    enemy.onCollide("arena-wall", () => {
        const away = enemy.pos.sub(opts.target.pos).unit();
        enemy.move(away.scale(enemy.speed ?? spd));
    });
    enemy.onDestroy(() => spawnGoldDrop(k, enemy.pos.clone(), 1));
    return enemy;
}
