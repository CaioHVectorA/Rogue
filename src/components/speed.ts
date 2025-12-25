import type { GameObj } from "kaplay";

export type SpeedOptions = {
    value?: number,
};

export function speed(opts: SpeedOptions = {}) {
    const value = opts.value ?? 220;
    return {
        id: "speed",
        require: [],
        speed: value,
        setSpeed(this: GameObj & { speed: number }, v: number) {
            this.speed = v;
        },
        getSpeed(this: GameObj & { speed: number }) {
            return this.speed;
        },
    } as const;
}
