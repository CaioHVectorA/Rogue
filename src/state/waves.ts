import { Enemies } from "../components/enemies";

export type WaveEntry = { type: Enemies; count: number };

// ── 50 Waves – Dificuldade Progressiva ──
// Fases:
//   1-5   : Introdução (red, poucos blue)
//   6-10  : Green entra, purple aparece
//   11-15 : Smart (amarelo) entra, composições mistas
//   16-20 : Stone tanque, mais purple/smart
//   21-25 : Elites começam (red_elite, blue_elite)
//   26-30 : Elites verdes e smart, composições densas
//   31-35 : Purple elite, stone elite, pressão alta
//   36-40 : Composições mistas elite, hordas grandes
//   41-45 : Endgame — todas as elites, números altos
//   46-50 : Boss waves — poucas mas brutais elites + hordas base

export const waves: WaveEntry[][] = [
  // ── Wave 1-5: Introdução ──
  // 1
  [{ type: "red", count: 8 }],
  // 2
  [{ type: "red", count: 12 }],
  // 3
  [
    { type: "red", count: 10 },
    { type: "blue", count: 1 },
  ],
  // 4
  [
    { type: "red", count: 14 },
    { type: "blue", count: 2 },
  ],
  // 5
  [
    { type: "red", count: 16 },
    { type: "blue", count: 3 },
  ],

  // ── Wave 6-10: Green + Purple entram ──
  // 6
  [
    { type: "red", count: 12 },
    { type: "green", count: 3 },
  ],
  // 7
  [
    { type: "red", count: 10 },
    { type: "green", count: 4 },
    { type: "purple", count: 3 },
  ],
  // 8
  [
    { type: "purple", count: 8 },
    { type: "blue", count: 2 },
  ],
  // 9
  [
    { type: "red", count: 15 },
    { type: "green", count: 4 },
    { type: "purple", count: 4 },
  ],
  // 10
  [
    { type: "red", count: 12 },
    { type: "blue", count: 3 },
    { type: "purple", count: 6 },
    { type: "green", count: 3 },
  ],

  // ── Wave 11-15: Smart (amarelo) entra ──
  // 11
  [
    { type: "red", count: 14 },
    { type: "smart", count: 3 },
  ],
  // 12
  [
    { type: "purple", count: 8 },
    { type: "smart", count: 4 },
  ],
  // 13
  [
    { type: "red", count: 10 },
    { type: "green", count: 5 },
    { type: "smart", count: 4 },
  ],
  // 14
  [
    { type: "blue", count: 4 },
    { type: "smart", count: 5 },
    { type: "purple", count: 5 },
  ],
  // 15
  [
    { type: "red", count: 18 },
    { type: "green", count: 4 },
    { type: "smart", count: 4 },
    { type: "stone", count: 1 },
  ],

  // ── Wave 16-20: Stone tanque, pressão crescente ──
  // 16
  [
    { type: "stone", count: 2 },
    { type: "red", count: 15 },
    { type: "purple", count: 5 },
  ],
  // 17
  [
    { type: "stone", count: 3 },
    { type: "green", count: 5 },
    { type: "smart", count: 4 },
  ],
  // 18
  [
    { type: "red", count: 20 },
    { type: "blue", count: 4 },
    { type: "stone", count: 2 },
    { type: "purple", count: 6 },
  ],
  // 19
  [
    { type: "smart", count: 6 },
    { type: "purple", count: 8 },
    { type: "stone", count: 2 },
  ],
  // 20
  [
    { type: "red", count: 20 },
    { type: "blue", count: 5 },
    { type: "green", count: 5 },
    { type: "stone", count: 3 },
  ],

  // ── Wave 21-25: Elites começam ──
  // 21
  [
    { type: "red_elite", count: 3 },
    { type: "red", count: 15 },
    { type: "purple", count: 6 },
  ],
  // 22
  [
    { type: "blue_elite", count: 2 },
    { type: "blue", count: 4 },
    { type: "smart", count: 5 },
  ],
  // 23
  [
    { type: "red_elite", count: 5 },
    { type: "green", count: 5 },
    { type: "purple", count: 8 },
  ],
  // 24
  [
    { type: "blue_elite", count: 3 },
    { type: "stone", count: 3 },
    { type: "smart", count: 5 },
    { type: "red", count: 10 },
  ],
  // 25
  [
    { type: "red_elite", count: 6 },
    { type: "blue_elite", count: 2 },
    { type: "purple", count: 10 },
    { type: "green", count: 4 },
  ],

  // ── Wave 26-30: Elites verdes e smart ──
  // 26
  [
    { type: "green_elite", count: 3 },
    { type: "red_elite", count: 4 },
    { type: "red", count: 12 },
  ],
  // 27
  [
    { type: "smart_elite", count: 3 },
    { type: "smart", count: 5 },
    { type: "purple", count: 8 },
  ],
  // 28
  [
    { type: "green_elite", count: 4 },
    { type: "blue_elite", count: 3 },
    { type: "stone", count: 3 },
    { type: "red", count: 10 },
  ],
  // 29
  [
    { type: "smart_elite", count: 4 },
    { type: "purple", count: 10 },
    { type: "red_elite", count: 5 },
  ],
  // 30
  [
    { type: "red_elite", count: 8 },
    { type: "blue_elite", count: 3 },
    { type: "green_elite", count: 3 },
    { type: "smart_elite", count: 3 },
  ],

  // ── Wave 31-35: Purple elite, stone elite ──
  // 31
  [
    { type: "purple_elite", count: 5 },
    { type: "stone", count: 4 },
    { type: "red_elite", count: 6 },
  ],
  // 32
  [
    { type: "stone_elite", count: 2 },
    { type: "blue_elite", count: 4 },
    { type: "smart_elite", count: 4 },
  ],
  // 33
  [
    { type: "purple_elite", count: 8 },
    { type: "green_elite", count: 4 },
    { type: "red_elite", count: 6 },
  ],
  // 34
  [
    { type: "stone_elite", count: 3 },
    { type: "smart_elite", count: 5 },
    { type: "purple_elite", count: 6 },
  ],
  // 35
  [
    { type: "red_elite", count: 10 },
    { type: "blue_elite", count: 4 },
    { type: "purple_elite", count: 6 },
    { type: "stone_elite", count: 2 },
  ],

  // ── Wave 36-40: Composições mistas elite ──
  // 36
  [
    { type: "red_elite", count: 12 },
    { type: "green_elite", count: 5 },
    { type: "smart_elite", count: 5 },
  ],
  // 37
  [
    { type: "purple_elite", count: 10 },
    { type: "blue_elite", count: 5 },
    { type: "stone_elite", count: 3 },
  ],
  // 38
  [
    { type: "red_elite", count: 15 },
    { type: "smart_elite", count: 6 },
    { type: "green_elite", count: 5 },
    { type: "purple_elite", count: 5 },
  ],
  // 39
  [
    { type: "stone_elite", count: 4 },
    { type: "blue_elite", count: 5 },
    { type: "purple_elite", count: 8 },
    { type: "smart_elite", count: 5 },
  ],
  // 40
  [
    { type: "red_elite", count: 18 },
    { type: "blue_elite", count: 6 },
    { type: "green_elite", count: 6 },
    { type: "purple_elite", count: 6 },
    { type: "stone_elite", count: 2 },
  ],

  // ── Wave 41-45: Endgame ──
  // 41
  [
    { type: "red_elite", count: 20 },
    { type: "smart_elite", count: 8 },
    { type: "purple_elite", count: 8 },
  ],
  // 42
  [
    { type: "stone_elite", count: 5 },
    { type: "blue_elite", count: 8 },
    { type: "green_elite", count: 6 },
    { type: "smart_elite", count: 6 },
  ],
  // 43
  [
    { type: "purple_elite", count: 12 },
    { type: "red_elite", count: 15 },
    { type: "smart_elite", count: 8 },
  ],
  // 44
  [
    { type: "stone_elite", count: 5 },
    { type: "blue_elite", count: 8 },
    { type: "green_elite", count: 8 },
    { type: "purple_elite", count: 10 },
    { type: "smart_elite", count: 6 },
  ],
  // 45
  [
    { type: "red_elite", count: 25 },
    { type: "blue_elite", count: 8 },
    { type: "purple_elite", count: 12 },
    { type: "stone_elite", count: 4 },
  ],

  // ── Wave 46-50: Boss waves ──
  // 46
  [
    { type: "stone_elite", count: 6 },
    { type: "red_elite", count: 20 },
    { type: "smart_elite", count: 10 },
  ],
  // 47
  [
    { type: "purple_elite", count: 15 },
    { type: "blue_elite", count: 10 },
    { type: "green_elite", count: 10 },
    { type: "smart_elite", count: 8 },
  ],
  // 48
  [
    { type: "stone_elite", count: 8 },
    { type: "red_elite", count: 25 },
    { type: "purple_elite", count: 12 },
    { type: "smart_elite", count: 10 },
  ],
  // 49
  [
    { type: "red_elite", count: 30 },
    { type: "blue_elite", count: 12 },
    { type: "green_elite", count: 10 },
    { type: "purple_elite", count: 15 },
    { type: "smart_elite", count: 10 },
  ],
  // 50 — Final wave
  [
    { type: "stone_elite", count: 10 },
    { type: "blue_elite", count: 12 },
    { type: "purple_elite", count: 18 },
    { type: "smart_elite", count: 12 },
    { type: "red_elite", count: 25 },
  ],
];
