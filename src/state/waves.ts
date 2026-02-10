import { Enemies } from "../components/enemies";

export type WaveEntry = { type: Enemies; count: number };
export const waves: WaveEntry[][] = [
  [
    { type: "red", count: 6 },
    // { type: "stone", count: 3 },
  ],
  [{ type: "blue", count: 2 }],
  [{ type: "green", count: 5 }],
  [{ type: "blue", count: 5 }],
];
