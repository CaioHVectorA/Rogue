export type GoldTier = 1 | 2 | 5 | 10;

export type GoldDropTable = {
  weights: Record<GoldTier, number>;
  colors: Record<GoldTier, [number, number, number]>;
  scales: Record<GoldTier, number>;
};

// Base configuration for tiers
const BASE_TABLE: GoldDropTable = {
  weights: { 1: 60, 2: 30, 5: 8, 10: 2 },
  // Distinct colors per tier (golden hues)
  colors: {
    1: [255, 215, 0],    // standard gold
    2: [255, 231, 76],   // lighter gold
    5: [255, 198, 0],    // deeper gold
    10: [255, 140, 0],   // orange-gold (rare)
  },
  // Visual scale per tier
  scales: { 1: 1.0, 2: 1.2, 5: 1.4, 10: 1.8 },
};

// Clamp helper
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// Compute weights influenced by luck
export function getGoldWeightsByLuck(luck: number): Record<GoldTier, number> {
  const L = clamp(Number.isFinite(luck) ? luck : 1.0, 0.5, 3.0);
  const w1 = Math.max(5, Math.round(BASE_TABLE.weights[1] / L));
  const w2 = Math.max(5, Math.round(BASE_TABLE.weights[2] * (0.8 + 0.2 * L)));
  const w5 = Math.max(1, Math.round(BASE_TABLE.weights[5] * (0.7 + 0.3 * L)));
  const w10 = Math.max(1, Math.round(BASE_TABLE.weights[10] * (0.5 + 0.5 * L)));
  return { 1: w1, 2: w2, 5: w5, 10: w10 };
}

// Pick a tier according to weights
export function pickGoldTier(weights: Record<GoldTier, number>, rand: (min: number, max: number) => number): GoldTier {
  const total = weights[1] + weights[2] + weights[5] + weights[10];
  const r = Math.floor(rand(0, total));
  if (r < weights[1]) return 1;
  if (r < weights[1] + weights[2]) return 2;
  if (r < weights[1] + weights[2] + weights[5]) return 5;
  return 10;
}

export function getGoldColor(tier: GoldTier): [number, number, number] {
  return BASE_TABLE.colors[tier];
}

export function getGoldScale(tier: GoldTier): number {
  return BASE_TABLE.scales[tier];
}
