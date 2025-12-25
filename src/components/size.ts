import type { GameObj } from "kaplay";

export type SizeOptions = {
    width?: number,
    height?: number,
};

export function size(opts: SizeOptions = {}) {
    const w = opts.width ?? 36;
    const h = opts.height ?? w;
    return {
        id: "size",
        require: [],
        width: w,
        height: h,
        setSize(this: GameObj & { width: number; height: number }, nw: number, nh: number) {
            this.width = nw;
            this.height = nh;
        },
        getSize(this: GameObj & { width: number; height: number }) {
            return { width: this.width, height: this.height };
        },
    } as const;
}
