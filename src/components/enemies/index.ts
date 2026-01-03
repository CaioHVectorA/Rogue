import type { KAPLAYCtx, GameObj } from "kaplay";
import { commonEnemy } from "./types";

export const ENEMY_PRESETS = {
    red: { name: "REDUBIO", size: 28, color: [255, 60, 60] as [number, number, number], speed: 120, hp: 3, damage: 1 },
    blue: { name: "barrublu", size: 40, color: [60, 120, 255] as [number, number, number], speed: 80, hp: 6, damage: 1 },
    yellow: { name: "Amarilo", size: 28, color: [240, 200, 40] as [number, number, number], speed: 150, hp: 3, damage: 1 },
    green: { name: "Verdu", size: 30, color: [60, 200, 100] as [number, number, number], speed: 110, hp: 4, damage: 1 },
};
export type Enemies = keyof typeof ENEMY_PRESETS;
export function spawnRed(k: KAPLAYCtx, target: GameObj, arena: { x: number, y: number, w: number, h: number }) {
    const p = ENEMY_PRESETS.red;
    return commonEnemy(k, { target, arenaBounds: arena, size: p.size, color: p.color, speed: p.speed, hp: p.hp, damage: p.damage, type: "red" });
}

export function spawnBlue(k: KAPLAYCtx, target: GameObj, arena: { x: number, y: number, w: number, h: number }) {
    const p = ENEMY_PRESETS.blue;
    return commonEnemy(k, { target, arenaBounds: arena, size: p.size, color: p.color, speed: p.speed, hp: p.hp, damage: p.damage, type: "blue" });
}

export function spawnYellow(k: KAPLAYCtx, target: GameObj, arena: { x: number, y: number, w: number, h: number }) {
    const p = ENEMY_PRESETS.yellow;
    return commonEnemy(k, { target, arenaBounds: arena, size: p.size, color: p.color, speed: p.speed, hp: p.hp, damage: p.damage, type: "yellow" });
}

export function spawnGreen(k: KAPLAYCtx, target: GameObj, arena: { x: number, y: number, w: number, h: number }) {
    const p = ENEMY_PRESETS.green;
    const e = commonEnemy(k, { target, arenaBounds: arena, size: p.size, color: p.color, speed: p.speed, hp: p.hp, damage: p.damage, type: "green" });
    // walking/stop+shoot cycle: walk 1.2s, stop 0.6s and shoot towards player
    let timer = 0;
    let walking = true;
    console.log('jdsakjaskl')
    e.onUpdate(() => {
        timer += k.dt();
        k.debug.log("Enemy timer", timer);
        if (walking && timer >= 1.2) { walking = false; timer = 0; (e as any).speed = 0; }
        else if (!walking && timer >= 0.6) { walking = true; timer = 0; (e as any).speed = ENEMY_PRESETS.green.speed; }
        // shoot when stopped (every cycle start)
        if (!walking && timer < 0.05) {
            const dir = target.pos.sub(e.pos).unit();
            // simple bullet: small rect moving
            const b = k.add([k.rect(8, 8), k.pos(e.pos.x, e.pos.y), k.color(60, 200, 100), k.area(), { id: "enemy-bullet" }]);
            b.onUpdate(() => b.move(dir.scale(260)));
            // damage on collide with player
            k.onCollide("player", "enemy-bullet", (p: any, bb: any) => { bb.destroy(); (p as any).hp = Math.max(0, (p as any).hp - 1); });
        }
    });
    return e;
}
