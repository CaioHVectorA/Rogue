import { WIDTH, HEIGHT } from "./model";

/** Preserve world area while fitting the mobile playfield, without cropping threats. */
export function arenaDimensions(
  width: number,
  height: number,
  mobile: boolean,
) {
  if (!mobile) return { width: WIDTH, height: HEIGHT };
  const ratio = Math.max(0.5, Math.min(2.4, width / Math.max(1, height)));
  const worldWidth = Math.sqrt(WIDTH * HEIGHT * ratio);
  return { width: worldWidth, height: (WIDTH * HEIGHT) / worldWidth };
}
