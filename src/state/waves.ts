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
  // 9
  [
    { type: "red", count: 4 },
    { type: "green", count: 2 },
    { type: "purple", count: 2 },
    { type: "spinner", count: 1 },
    { type: "berserker", count: 2 },
    { type: "shield_guard", count: 2 },
  ],
  // 10
  [
    { type: "red", count: 6 },
    { type: "blue", count: 2 },
    { type: "purple", count: 3 },
    { type: "green", count: 1 },
    { type: "cone_shooter", count: 1 },
  ],

  // ── Wave 11-15: Smart (amarelo) entra ──
  // 11
  [
    { type: "red", count: 6 },
    { type: "smart", count: 2 },
    { type: "summoner", count: 1 },
  ],
  // 12
  [
    { type: "purple", count: 4 },
    { type: "smart", count: 2 },
    { type: "spinner", count: 1 },
    { type: "berserker", count: 2 },
  ],
  // 13
  [
    { type: "red", count: 4 },
    { type: "green", count: 2 },
    { type: "smart", count: 2 },
    { type: "cone_shooter", count: 1 },
  ],
  // 14
  [
    { type: "blue", count: 2 },
    { type: "smart", count: 2 },
    { type: "purple", count: 3 },
    { type: "summoner", count: 1 },
  ],
  // 15
  [
    { type: "red", count: 8 },
    { type: "green", count: 2 },
    { type: "smart", count: 2 },
    { type: "stone", count: 1 },
    { type: "spinner", count: 1 },
    { type: "cone_shooter", count: 1 },
  ],

  // ── Wave 16-20: Stone tanque, pressão crescente ──
  // 16
  [
    { type: "stone", count: 1 },
    { type: "red", count: 4 },
    { type: "purple", count: 2 },
    { type: "regen", count: 1 },
    { type: "shield_guard", count: 2 },
  ],
  // 17
  [
    { type: "stone", count: 2 },
    { type: "green", count: 2 },
    { type: "smart", count: 2 },
    { type: "summoner", count: 1 },
  ],
  // 18
  [
    { type: "red", count: 8 },
    { type: "blue", count: 2 },
    { type: "stone", count: 1 },
    { type: "purple", count: 3 },
    { type: "spinner", count: 1 },
  ],
  // 19
  [
    { type: "smart", count: 3 },
    { type: "purple", count: 4 },
    { type: "stone", count: 1 },
    { type: "cone_shooter", count: 1 },
    { type: "regen", count: 1 },
  ],
  // 20
  [
    { type: "red", count: 8 },
    { type: "blue", count: 2 },
    { type: "green", count: 2 },
    { type: "stone", count: 1 },
    { type: "summoner", count: 1 },
    { type: "spinner", count: 1 },
  ],

  // ── Wave 21-25: Elites começam ──
  // 21
  [
    { type: "red_elite", count: 2 },
    { type: "red", count: 6 },
    { type: "purple", count: 3 },
    { type: "colossus", count: 1 },
  ],
  // 22
  [
    { type: "blue_elite", count: 1 },
    { type: "blue", count: 2 },
    { type: "smart", count: 2 },
    { type: "regen", count: 1 },
    { type: "summoner", count: 1 },
    { type: "shield_guard_elite", count: 1 },
  ],
  // 23
  [
    { type: "red_elite", count: 2 },
    { type: "green", count: 2 },
    { type: "purple", count: 4 },
    { type: "spinner", count: 1 },
    { type: "cone_shooter", count: 1 },
  ],
  // 24
  [
    { type: "blue_elite", count: 1 },
    { type: "stone", count: 1 },
    { type: "smart", count: 2 },
    { type: "red", count: 4 },
    { type: "colossus", count: 1 },
    { type: "regen", count: 1 },
  ],
  // 25
  [
    { type: "red_elite", count: 2 },
    { type: "blue_elite", count: 1 },
    { type: "purple", count: 4 },
    { type: "green", count: 2 },
    { type: "summoner", count: 1 },
    { type: "spinner", count: 1 },
  ],

  // ── Wave 26-30: Elites verdes e smart ──
  // 26
  [
    { type: "green_elite", count: 1 },
    { type: "red_elite", count: 2 },
    { type: "red", count: 4 },
    { type: "spinner_elite", count: 1 },
    { type: "cone_shooter", count: 1 },
  ],
  // 27
  [
    { type: "smart_elite", count: 1 },
    { type: "smart", count: 2 },
    { type: "purple", count: 3 },
    { type: "summoner_elite", count: 1 },
  ],
  // 28
  [
    { type: "green_elite", count: 2 },
    { type: "blue_elite", count: 1 },
    { type: "stone", count: 1 },
    { type: "red", count: 4 },
    { type: "regen_elite", count: 1 },
    { type: "colossus", count: 1 },
  ],
  // 29
  [
    { type: "smart_elite", count: 2 },
    { type: "purple", count: 4 },
    { type: "red_elite", count: 2 },
    { type: "cone_shooter_elite", count: 1 },
    { type: "spinner_elite", count: 1 },
  ],
  // 30
  [
    { type: "red_elite", count: 3 },
    { type: "blue_elite", count: 1 },
    { type: "green_elite", count: 1 },
    { type: "smart_elite", count: 1 },
    { type: "summoner_elite", count: 1 },
    { type: "colossus", count: 1 },
  ],

  // ── Wave 31-35: Purple elite, stone elite ──
  // 31
  [
    { type: "purple_elite", count: 2 },
    { type: "stone", count: 1 },
    { type: "red_elite", count: 2 },
  ],
  // 32
  [
    { type: "charger_elite", count: 2 },
    { type: "detonator_elite", count: 1 },
    { type: "phantom_elite", count: 2 },
    { type: "stone_elite", count: 1 },
    { type: "blue_elite", count: 1 },
  ],
  // 33
  [
    { type: "ninja_elite", count: 2 },
    { type: "illusionist_elite", count: 2 },
    { type: "trapper_elite", count: 1 },
    { type: "purple_elite", count: 2 },
  ],
  // 34
  [
    { type: "vampire_elite", count: 2 },
    { type: "detonator_elite", count: 2 },
    { type: "charger_elite", count: 2 },
    { type: "regen_elite", count: 1 },
  ],
  // 35
  [
    { type: "phantom_elite", count: 2 },
    { type: "ninja_elite", count: 2 },
    { type: "trapper_elite", count: 1 },
    { type: "colossus_elite", count: 1 },
    { type: "blue_elite", count: 2 },
  ],
  // 36
  [
    { type: "charger_elite", count: 2 },
    { type: "illusionist_elite", count: 2 },
    { type: "vampire_elite", count: 2 },
    { type: "smart_elite", count: 2 },
  ],
  // 37
  [
    { type: "detonator_elite", count: 2 },
    { type: "phantom_elite", count: 2 },
    { type: "ninja_elite", count: 2 },
    { type: "stone_elite", count: 2 },
  ],
  // 38
  [
    { type: "trapper_elite", count: 2 },
    { type: "vampire_elite", count: 2 },
    { type: "charger_elite", count: 2 },
    { type: "purple_elite", count: 2 },
  ],
  // 39
  [
    { type: "illusionist_elite", count: 2 },
    { type: "detonator_elite", count: 2 },
    { type: "phantom_elite", count: 2 },
    { type: "regen_elite", count: 2 },
  ],
  // 40
  [
    { type: "colossus_elite", count: 2 },
    { type: "charger_elite", count: 2 },
    { type: "vampire_elite", count: 2 },
    { type: "ninja_elite", count: 2 },
  ],
  // 41
  [
    { type: "phantom_elite", count: 2 },
    { type: "trapper_elite", count: 2 },
    { type: "illusionist_elite", count: 2 },
    { type: "blue_elite", count: 2 },
  ],
  // 42
  [
    { type: "detonator_elite", count: 2 },
    { type: "vampire_elite", count: 2 },
    { type: "charger_elite", count: 2 },
    { type: "stone_elite", count: 2 },
  ],
  // 43
  [
    { type: "ninja_elite", count: 2 },
    { type: "phantom_elite", count: 2 },
    { type: "trapper_elite", count: 2 },
    { type: "purple_elite", count: 3 },
  ],
  // 44
  [
    { type: "illusionist_elite", count: 2 },
    { type: "vampire_elite", count: 2 },
    { type: "regen_elite", count: 2 },
    { type: "charger_elite", count: 3 },
  ],
  // 45
  [
    { type: "detonator_elite", count: 2 },
    { type: "phantom_elite", count: 2 },
    { type: "colossus_elite", count: 2 },
    { type: "ninja_elite", count: 2 },
  ],
  // 46
  [
    { type: "trapper_elite", count: 2 },
    { type: "vampire_elite", count: 2 },
    { type: "charger_elite", count: 2 },
    { type: "stone_elite", count: 3 },
  ],
  // 47
  [
    { type: "illusionist_elite", count: 2 },
    { type: "phantom_elite", count: 2 },
    { type: "ninja_elite", count: 2 },
    { type: "purple_elite", count: 3 },
  ],
  // 48
  [
    { type: "detonator_elite", count: 2 },
    { type: "vampire_elite", count: 2 },
    { type: "trapper_elite", count: 2 },
    { type: "colossus_elite", count: 2 },
  ],
  // 49
  [
    { type: "charger_elite", count: 2 },
    { type: "illusionist_elite", count: 2 },
    { type: "phantom_elite", count: 2 },
    { type: "ninja_elite", count: 2 },
    { type: "regen_elite", count: 1 },
  ],
  // 50 — Final wave
  [
    { type: "colossus_elite", count: 2 },
    { type: "vampire_elite", count: 2 },
    { type: "detonator_elite", count: 2 },
    { type: "phantom_elite", count: 2 },
    { type: "ninja_elite", count: 2 },
  ],
];
