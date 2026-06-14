import type { GameObj, Vec2 } from "kaplay";
import { getPlayerSpeedMultiplier } from "./perks";

export type MovimentableOptions = {
    keys?: {
        left?: string[],
        right?: string[],
        up?: string[],
        down?: string[],
    },
    // Custom direction provider for AI or scripted movement.
    getDirection?: (self: GameObj) => Vec2 | null,
    enabled?: boolean,
};

export function movimentable(k: any, opts: MovimentableOptions = {}) {
    const keys = {
        left: opts.keys?.left ?? ["a", "left"],
        right: opts.keys?.right ?? ["d", "right"],
        up: opts.keys?.up ?? ["w", "up"],
        down: opts.keys?.down ?? ["s", "down"],
    };

    const enabled = opts.enabled ?? true;

    return {
        id: "movimentable",
        require: ["pos"],
        add(this: GameObj & { speed?: number }) {
            if (!enabled) return;
            // Per-frame movement using either input or provided direction
            k.onUpdate(() => {
                let dir: Vec2 | null = null;
                if (opts.getDirection) {
                    dir = opts.getDirection(this);
                } else {
                    const isSkillActive = k.get("ui-skill-overlay").some((o: any) => !o.hidden);
                    const isPerkActive = k.get("perk-overlay-bg").some((o: any) => !o.hidden);
                    const isShopActive = k.get("shop-bg").some((o: any) => !o.hidden);
                    if (isSkillActive || isPerkActive || isShopActive) {
                        dir = null;
                    } else {
                        const d = k.vec2(0, 0);
                        if (keys.left.some((key) => k.isKeyDown(key))) d.x -= 1;
                        if (keys.right.some((key) => k.isKeyDown(key))) d.x += 1;
                        if (keys.up.some((key) => k.isKeyDown(key))) d.y -= 1;
                        if (keys.down.some((key) => k.isKeyDown(key))) d.y += 1;
                        dir = d;
                    }
                }

                if (dir && (dir.x !== 0 || dir.y !== 0)) {
                    let spd = this.speed ?? 220;
                    if (!opts.getDirection) {
                        spd *= getPlayerSpeedMultiplier(this);
                    }
                    const move = dir.unit().scale(spd);
                    this.move(move);
                }
            });
        },
    } as const;
}
