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
        add(this: GameObj & { width: number; height: number }) {
            this.width = w;
            this.height = h;
        },

        getSize(this: GameObj & { width: number; height: number }) {
            return { width: this.width, height: this.height };
        },

        setSize(this: GameObj & { width: number; height: number }, nw: number, nh: number) {
            this.width = nw;
            this.height = nh;
        }

    } as const;
}
