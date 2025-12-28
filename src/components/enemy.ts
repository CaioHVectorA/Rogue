import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { speed } from "./speed";
import { movimentable } from "./movimentable";
import { spawnGoldDrop } from "./gold";

export type EnemyOptions = {
    pos?: Vec2,
    size?: number,
    color?: [number, number, number],
    speed?: number,
    target: GameObj,
    arenaBounds?: { x: number, y: number, w: number, h: number },
    margin?: number,
    hp?: number,
    type?: "red" | "blue",
    damage?: number,
};

export const ENEMY_PRESETS = {
    red: {
        name: "REDUBIO",
        size: 28,
        color: [255, 60, 60] as [number, number, number],
        speed: 120,
        hp: 3,
        damage: 1,
    },
    blue: {
        name: "barrublu",
        size: 40,
        color: [60, 120, 255] as [number, number, number], // azul de fato
        speed: 80,
        hp: 6,
        damage: 1,
    },
};

export function createEnemy(k: KAPLAYCtx, opts: EnemyOptions): GameObj {
    const type = opts.type ?? "red";
    const preset = ENEMY_PRESETS[type];
    const s = opts.size ?? preset.size;
    const spd = opts.speed ?? preset.speed; // default based on type
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
    const color = opts.color ?? preset.color;
    const maxHP = opts.hp ?? preset.hp;
    const dmg = opts.damage ?? preset.damage;

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
            enemyType: type,
            name: preset.name,
            hp: maxHP,
            damage: dmg,
            lastDamageTime: 0,
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
                // Red-specific schooling: tend to group with nearby reds
                if (this.enemyType === "red") {
                    const neighbors = (k.get ? k.get("enemy") : []) as (GameObj & { enemyType?: string })[];
                    const nearbyReds = neighbors.filter(n => n !== this && n.enemyType === "red" && this.pos.dist(n.pos) < 160);
                    if (nearbyReds.length > 0) {
                        // steer slightly towards average position of nearby reds
                        let cx = 0, cy = 0;
                        for (const n of nearbyReds) { cx += n.pos.x; cy += n.pos.y; }
                        cx /= nearbyReds.length; cy /= nearbyReds.length;
                        const cohesion = k.vec2(cx, cy).sub(this.pos).unit();
                        // apply small attraction
                        this.move(cohesion.scale(30));
                    }
                }
            },
        },
    ]) as GameObj & { hp: number, speed?: number, damage: number, lastDamageTime: number, enemyType: "red" | "blue" };

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

    enemy.onDestroy(() => {
        // spawn a gold drop at enemy position
        spawnGoldDrop(k, enemy.pos.clone(), 1);
    });

    return enemy;
}
