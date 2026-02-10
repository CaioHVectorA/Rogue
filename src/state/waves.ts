import { Enemies } from "../components/enemies";

export type WaveEntry = { type: Enemies; count: number };
export const waves: WaveEntry[][] = [
  [
    { type: "stone", count: 3 },
    { type: "stone", count: 12 },
  ],
  [
    { type: "red", count: 6 },
    { type: "blue", count: 2 },
  ],
  [{ type: "green", count: 5 }],
];
