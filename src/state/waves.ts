import { Enemies } from "../components/enemies";

export type WaveEntry = { type: Enemies, count: number };
export const waves: WaveEntry[][] = [
    [{ type: "green", count: 5 }],
    [{ type: "red", count: 6 }, { type: "blue", count: 1 }],
    [{ type: "red", count: 6 }, { type: "blue", count: 2 }],
];
