import type { KAPLAYCtx, GameObj } from "kaplay";
import { commonEnemy } from "./types";

export const ENEMY_PRESETS = {
  // ── Base ──
  red: {
    name: "Redubio",
    size: 28,
    color: [255, 60, 60] as [number, number, number],
    speed: 180,
    hp: 3,
    damage: 40,
  },
  blue: {
    name: "Barrublu",
    size: 40,
    color: [60, 120, 255] as [number, number, number],
    speed: 120,
    hp: 6,
    damage: 80,
  },
  green: {
    name: "Verdu",
    size: 30,
    color: [60, 200, 100] as [number, number, number],
    speed: 165,
    hp: 4,
    damage: 50,
  },
  stone: {
    name: "Pedrão",
    size: 44,
    color: [140, 110, 80] as [number, number, number],
    speed: 55,
    hp: 20,
    damage: 60,
  },
  purple: {
    name: "Veloxio",
    size: 22,
    color: [180, 60, 220] as [number, number, number],
    speed: 340,
    hp: 2,
    damage: 25,
  },
  smart: {
    name: "Esquivão",
    size: 26,
    color: [240, 200, 40] as [number, number, number],
    speed: 190,
    hp: 4,
    damage: 45,
  },

  // ── Elevados (elite) ──
  red_elite: {
    name: "Redubio+",
    size: 32,
    color: [255, 30, 30] as [number, number, number],
    speed: 205,
    hp: 8,
    damage: 70,
  },
  blue_elite: {
    name: "Barrublu+",
    size: 46,
    color: [30, 80, 255] as [number, number, number],
    speed: 135,
    hp: 14,
    damage: 120,
  },
  green_elite: {
    name: "Verdu+",
    size: 34,
    color: [30, 180, 70] as [number, number, number],
    speed: 190,
    hp: 9,
    damage: 80,
  },
  stone_elite: {
    name: "Pedrão+",
    size: 52,
    color: [100, 80, 55] as [number, number, number],
    speed: 70,
    hp: 40,
    damage: 100,
  },
  purple_elite: {
    name: "Veloxio+",
    size: 26,
    color: [200, 30, 255] as [number, number, number],
    speed: 420,
    hp: 5,
    damage: 45,
  },
  smart_elite: {
    name: "Esquivão+",
    size: 30,
    color: [255, 220, 20] as [number, number, number],
    speed: 220,
    hp: 10,
    damage: 75,
  },
};

export type Enemies = keyof typeof ENEMY_PRESETS;

export const ENEMY_TYPES = {
  grunt: {
    hp: 3,
    speed: 120,
    spawnWeight: 100,
    score: 5,
  },
  runner: {
    hp: 2,
    speed: 220,
    spawnWeight: 80,
    score: 6,
  },
  shooter: {
    hp: 4,
    speed: 100,
    spawnWeight: 70,
    projectileSpeed: 560,
    score: 10,
  },
  tank: {
    hp: 12,
    speed: 70,
    spawnWeight: 30,
    score: 25,
  },
};
