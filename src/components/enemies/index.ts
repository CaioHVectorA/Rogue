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
    let timer = 0;
    let walking = true;
    let shotCooldown = 0;
    console.log(e)
    // single collision handler for enemy bullets
    k.onCollide("player", "enemy-bullet", (pl: any, bb: any) => { bb.destroy(); (pl as any).hp = Math.max(0, (pl as any).hp - 1); });

    e.onUpdate(() => {
        const spdComp = (e as any);
        const dt = k.dt();
        timer += dt;
        shotCooldown = Math.max(0, shotCooldown - dt);
        if (walking && timer >= 1.2) {
            walking = false;
            timer = 0;
            spdComp.setSpeed ? spdComp.setSpeed(0) : (spdComp.speed = 0);
        } else if (!walking && timer >= 0.6) {
            walking = true;
            timer = 0;
            spdComp.setSpeed ? spdComp.setSpeed(p.speed) : (spdComp.speed = p.speed);
        }
        // shoot once when entering stop phase
        if (!walking && timer < 0.05 && shotCooldown <= 0) {
            shotCooldown = 0.6; // fire once per stop window
            const dir = target.pos.sub(e.pos).unit();
            const b = k.add([k.rect(8, 8), k.pos(e.pos.x, e.pos.y), k.color(60, 200, 100), k.area(), { id: "enemy-bullet" }]);
            b.onUpdate(() => b.move(dir.scale(260)));
        }
    });
    return e;
}
