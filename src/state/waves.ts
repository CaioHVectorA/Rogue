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
    { type: "spinner", count: 2 },
  ],
  // 8
  [
    { type: "purple", count: 8 },
    { type: "blue", count: 2 },
    { type: "cone_shooter", count: 2 },
  ],
  // 9
  [
    { type: "red", count: 15 },
    { type: "green", count: 4 },
    { type: "purple", count: 4 },
    { type: "spinner", count: 3 },
  ],
  // 10
  [
    { type: "red", count: 12 },
    { type: "blue", count: 3 },
    { type: "purple", count: 6 },
    { type: "green", count: 3 },
    { type: "cone_shooter", count: 3 },
  ],

  // ── Wave 11-15: Smart (amarelo) entra ──
  // 11
  [
    { type: "red", count: 14 },
    { type: "smart", count: 3 },
    { type: "summoner", count: 1 },
  ],
  // 12
  [
    { type: "purple", count: 8 },
    { type: "smart", count: 4 },
    { type: "spinner", count: 3 },
  ],
  // 13
  [
    { type: "red", count: 10 },
    { type: "green", count: 5 },
    { type: "smart", count: 4 },
    { type: "cone_shooter", count: 2 },
  ],
  // 14
  [
    { type: "blue", count: 4 },
    { type: "smart", count: 5 },
    { type: "purple", count: 5 },
    { type: "summoner", count: 2 },
  ],
  // 15
  [
    { type: "red", count: 18 },
    { type: "green", count: 4 },
    { type: "smart", count: 4 },
    { type: "stone", count: 1 },
    { type: "spinner", count: 3 },
    { type: "cone_shooter", count: 2 },
  ],

  // ── Wave 16-20: Stone tanque, pressão crescente ──
  // 16
  [
    { type: "stone", count: 2 },
    { type: "red", count: 15 },
    { type: "purple", count: 5 },
    { type: "regen", count: 2 },
  ],
  // 17
  [
    { type: "stone", count: 3 },
    { type: "green", count: 5 },
    { type: "smart", count: 4 },
    { type: "summoner", count: 2 },
  ],
  // 18
  [
    { type: "red", count: 20 },
    { type: "blue", count: 4 },
    { type: "stone", count: 2 },
    { type: "purple", count: 6 },
    { type: "spinner", count: 4 },
  ],
  // 19
  [
    { type: "smart", count: 6 },
    { type: "purple", count: 8 },
    { type: "stone", count: 2 },
    { type: "cone_shooter", count: 4 },
    { type: "regen", count: 2 },
  ],
  // 20
  [
    { type: "red", count: 20 },
    { type: "blue", count: 5 },
    { type: "green", count: 5 },
    { type: "stone", count: 3 },
    { type: "summoner", count: 2 },
    { type: "spinner", count: 3 },
  ],

  // ── Wave 21-25: Elites começam ──
  // 21
  [
    { type: "red_elite", count: 3 },
    { type: "red", count: 15 },
    { type: "purple", count: 6 },
    { type: "colossus", count: 1 },
  ],
  // 22
  [
    { type: "blue_elite", count: 2 },
    { type: "blue", count: 4 },
    { type: "smart", count: 5 },
    { type: "regen", count: 3 },
    { type: "summoner", count: 2 },
  ],
  // 23
  [
    { type: "red_elite", count: 5 },
    { type: "green", count: 5 },
    { type: "purple", count: 8 },
    { type: "spinner", count: 4 },
    { type: "cone_shooter", count: 3 },
  ],
  // 24
  [
    { type: "blue_elite", count: 3 },
    { type: "stone", count: 3 },
    { type: "smart", count: 5 },
    { type: "red", count: 10 },
    { type: "colossus", count: 1 },
    { type: "regen", count: 2 },
  ],
  // 25
  [
    { type: "red_elite", count: 6 },
    { type: "blue_elite", count: 2 },
    { type: "purple", count: 10 },
    { type: "green", count: 4 },
    { type: "summoner", count: 3 },
    { type: "spinner", count: 4 },
  ],

  // ── Wave 26-30: Elites verdes e smart ──
  // 26
  [
    { type: "green_elite", count: 3 },
    { type: "red_elite", count: 4 },
    { type: "red", count: 12 },
    { type: "spinner_elite", count: 2 },
    { type: "cone_shooter", count: 3 },
  ],
  // 27
  [
    { type: "smart_elite", count: 3 },
    { type: "smart", count: 5 },
    { type: "purple", count: 8 },
    { type: "summoner_elite", count: 2 },
  ],
  // 28
  [
    { type: "green_elite", count: 4 },
    { type: "blue_elite", count: 3 },
    { type: "stone", count: 3 },
    { type: "red", count: 10 },
    { type: "regen_elite", count: 2 },
    { type: "colossus", count: 1 },
  ],
  // 29
  [
    { type: "smart_elite", count: 4 },
    { type: "purple", count: 10 },
    { type: "red_elite", count: 5 },
    { type: "cone_shooter_elite", count: 3 },
    { type: "spinner_elite", count: 3 },
  ],
  // 30
  [
    { type: "red_elite", count: 8 },
    { type: "blue_elite", count: 3 },
    { type: "green_elite", count: 3 },
    { type: "green_elite", count: 3 },
    { type: "smart_elite", count: 3 },
    { type: "summoner_elite", count: 2 },
    { type: "colossus", count: 1 },
  ],

  // ── Wave 31-35: Purple elite, stone elite ──
  // 31
  [
    { type: "purple_elite", count: 5 },
    { type: "stone", count: 4 },
    { type: "red_elite", count: 6 },
    { type: "regen_elite", count: 2 },
    { type: "spinner_elite", count: 3 },
  ],
  // 32
  [
    { type: "stone_elite", count: 2 },
    { type: "blue_elite", count: 4 },
    { type: "smart_elite", count: 4 },
    { type: "cone_shooter_elite", count: 3 },
    { type: "summoner_elite", count: 2 },
  ],
  // 33
  [
    { type: "purple_elite", count: 8 },
    { type: "green_elite", count: 4 },
    { type: "red_elite", count: 6 },
    { type: "colossus_elite", count: 1 },
    { type: "spinner_elite", count: 4 },
  ],
  // 34
  [
    { type: "stone_elite", count: 3 },
    { type: "smart_elite", count: 5 },
    { type: "purple_elite", count: 6 },
    { type: "regen_elite", count: 3 },
    { type: "cone_shooter_elite", count: 3 },
  ],
  // 35
  [
    { type: "red_elite", count: 10 },
    { type: "blue_elite", count: 4 },
    { type: "purple_elite", count: 6 },
    { type: "stone_elite", count: 2 },
    { type: "summoner_elite", count: 3 },
    { type: "colossus_elite", count: 1 },
  ],

  // ── Wave 36-40: Composições mistas elite ──
  // 36
  [
    { type: "red_elite", count: 12 },
    { type: "green_elite", count: 5 },
    { type: "smart_elite", count: 5 },
    { type: "spinner_elite", count: 4 },
    { type: "cone_shooter_elite", count: 3 },
  ],
  // 37
  [
    { type: "purple_elite", count: 10 },
    { type: "blue_elite", count: 5 },
    { type: "stone_elite", count: 3 },
    { type: "regen_elite", count: 3 },
    { type: "colossus_elite", count: 1 },
  ],
  // 38
  [
    { type: "red_elite", count: 15 },
    { type: "smart_elite", count: 6 },
    { type: "green_elite", count: 5 },
    { type: "purple_elite", count: 5 },
    { type: "summoner_elite", count: 3 },
    { type: "spinner_elite", count: 4 },
  ],
  // 39
  [
    { type: "stone_elite", count: 4 },
    { type: "blue_elite", count: 5 },
    { type: "purple_elite", count: 8 },
    { type: "smart_elite", count: 5 },
    { type: "cone_shooter_elite", count: 4 },
    { type: "regen_elite", count: 3 },
  ],
  // 40
  [
    { type: "red_elite", count: 18 },
    { type: "blue_elite", count: 6 },
    { type: "green_elite", count: 6 },
    { type: "purple_elite", count: 6 },
    { type: "stone_elite", count: 2 },
    { type: "colossus_elite", count: 2 },
    { type: "summoner_elite", count: 3 },
  ],

  // ── Wave 41-45: Endgame ──
  // 41
  [
    { type: "red_elite", count: 20 },
    { type: "smart_elite", count: 8 },
    { type: "purple_elite", count: 8 },
    { type: "spinner_elite", count: 5 },
    { type: "cone_shooter_elite", count: 4 },
  ],
  // 42
  [
    { type: "stone_elite", count: 5 },
    { type: "blue_elite", count: 8 },
    { type: "green_elite", count: 6 },
    { type: "smart_elite", count: 6 },
    { type: "regen_elite", count: 4 },
    { type: "colossus_elite", count: 2 },
  ],
  // 43
  [
    { type: "purple_elite", count: 12 },
    { type: "red_elite", count: 15 },
    { type: "smart_elite", count: 8 },
    { type: "summoner_elite", count: 4 },
    { type: "spinner_elite", count: 5 },
  ],
  // 44
  [
    { type: "stone_elite", count: 5 },
    { type: "blue_elite", count: 8 },
    { type: "green_elite", count: 8 },
    { type: "purple_elite", count: 10 },
    { type: "smart_elite", count: 6 },
    { type: "cone_shooter_elite", count: 5 },
    { type: "regen_elite", count: 4 },
  ],
  // 45
  [
    { type: "red_elite", count: 25 },
    { type: "blue_elite", count: 8 },
    { type: "purple_elite", count: 12 },
    { type: "stone_elite", count: 4 },
    { type: "colossus_elite", count: 2 },
    { type: "summoner_elite", count: 4 },
    { type: "spinner_elite", count: 5 },
  ],

  // ── Wave 46-50: Boss waves ──
  // 46
  [
    { type: "stone_elite", count: 6 },
    { type: "red_elite", count: 20 },
    { type: "smart_elite", count: 10 },
    { type: "colossus_elite", count: 2 },
    { type: "cone_shooter_elite", count: 5 },
    { type: "regen_elite", count: 4 },
  ],
  // 47
  [
    { type: "purple_elite", count: 15 },
    { type: "blue_elite", count: 10 },
    { type: "green_elite", count: 10 },
    { type: "smart_elite", count: 8 },
    { type: "spinner_elite", count: 6 },
    { type: "summoner_elite", count: 4 },
  ],
  // 48
  [
    { type: "stone_elite", count: 8 },
    { type: "red_elite", count: 25 },
    { type: "purple_elite", count: 12 },
    { type: "smart_elite", count: 10 },
    { type: "colossus_elite", count: 3 },
    { type: "cone_shooter_elite", count: 6 },
  ],
  // 49
  [
    { type: "red_elite", count: 30 },
    { type: "blue_elite", count: 12 },
    { type: "green_elite", count: 10 },
    { type: "purple_elite", count: 15 },
    { type: "smart_elite", count: 10 },
    { type: "regen_elite", count: 5 },
    { type: "spinner_elite", count: 6 },
    { type: "summoner_elite", count: 4 },
  ],
  // 50 — Final wave
  [
    { type: "stone_elite", count: 10 },
    { type: "blue_elite", count: 12 },
    { type: "purple_elite", count: 18 },
    { type: "smart_elite", count: 12 },
    { type: "red_elite", count: 25 },
    { type: "colossus_elite", count: 3 },
    { type: "cone_shooter_elite", count: 7 },
    { type: "spinner_elite", count: 7 },
    { type: "summoner_elite", count: 5 },
    { type: "regen_elite", count: 5 },
  ],
];
