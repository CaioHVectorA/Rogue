import { describe, expect, it } from "vitest";
import { arenaDimensions } from "../src/game/viewport";
import { detectInterface } from "../src/ui/device";

describe("device layouts", () => {
  it("detects phones, touch tablets and desktop without user-agent sniffing", () => {
    expect(detectInterface(390, true)).toBe("mobile");
    expect(detectInterface(844, true)).toBe("mobile");
    expect(detectInterface(1024, true)).toBe("mobile");
    expect(detectInterface(1024, false)).toBe("desktop");
    expect(detectInterface(1440, false)).toBe("desktop");
  });
  it("fits both phone orientations without changing world area", () => {
    for (const [width, height] of [
      [366, 530],
      [566, 264],
      [296, 250],
    ]) {
      const world = arenaDimensions(width, height, true);
      expect(world.width / world.height).toBeCloseTo(width / height);
      expect(world.width * world.height).toBeCloseTo(1200 * 760);
      const scale = Math.min(width / world.width, height / world.height);
      expect(world.width * scale).toBeCloseTo(width);
      expect(world.height * scale).toBeCloseTo(height);
    }
    expect(arenaDimensions(366, 530, false)).toEqual({
      width: 1200,
      height: 760,
    });
  });
});
