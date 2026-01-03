export type WaveEntry = { type: "red" | "blue", count: number };
export const waves: WaveEntry[][] = [
    [{ type: "red", count: 5 }],
    [{ type: "red", count: 6 }, { type: "blue", count: 1 }],
    [{ type: "red", count: 6 }, { type: "blue", count: 2 }],
];
