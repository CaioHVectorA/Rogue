// Simple minimap overlay showing player and arena bounds
import type { GameObj } from "kaplay";

export type MinimapOptions = {
    arena: { x: number; y: number; w: number; h: number };
    size?: { w: number; h: number };
    margin?: number;
};

export function createMinimap(k: any, player: GameObj, opts: MinimapOptions) {
    const size = opts.size ?? { w: 160, h: 120 };
    const margin = opts.margin ?? 8;
    const arena = opts.arena;

    // Minimap frame (fixed to screen)
    const frame = k.add([
        k.rect(size.w, size.h),
        k.pos(margin, margin),
        k.color(20, 20, 25),
        k.outline(2, k.rgb(80, 80, 100)),
        k.fixed(),
        { id: "minimap-frame" },
    ]);

    // Player marker
    const markerSize = 6;
    const marker = k.add([
        k.rect(markerSize, markerSize),
        k.pos(margin, margin),
        k.color(0, 180, 255),
        k.fixed(),
        { id: "minimap-player" },
    ]);

    // Map walls outline (optional simple border)
    const borderPadding = 2;
    const border = k.add([
        k.rect(size.w - borderPadding * 2, size.h - borderPadding * 2),
        k.pos(margin + borderPadding, margin + borderPadding),
        k.color(0, 0, 0),
        k.outline(1, k.rgb(140, 140, 160)),
        k.fixed(),
        { id: "minimap-border" },
    ]);

    // Update marker based on player position inside arena
    k.onUpdate(() => {
        const nx = (player.pos.x - arena.x) / arena.w; // 0..1
        const ny = (player.pos.y - arena.y) / arena.h; // 0..1
        const px = margin + nx * size.w;
        const py = margin + ny * size.h;
        marker.pos = k.vec2(
            k.clamp(px - marker.width / 2, margin, margin + size.w - marker.width),
            k.clamp(py - marker.height / 2, margin, margin + size.h - marker.height)
        );
    });

    return { frame, marker, border };
}
