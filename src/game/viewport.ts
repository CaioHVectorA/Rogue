import { WIDTH, HEIGHT } from "./model";

/** Preserve the mobile world area across orientations while fitting the mobile playfield, without cropping threats. */
export function arenaDimensions(
  width: number,
  height: number,
  mobile: boolean,
) {
  if (!mobile) return { width: WIDTH, height: HEIGHT };
  const ratio = Math.max(0.5, Math.min(2.4, width / Math.max(1, height)));
  const area = WIDTH * HEIGHT * 0.82;
  const worldWidth = Math.sqrt(area * ratio);
  return { width: worldWidth, height: area / worldWidth };
}
