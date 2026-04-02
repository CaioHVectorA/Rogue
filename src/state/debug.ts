import type { skillsName } from "./skillData";
import type { PerkId } from "./perkIds";

// ═══════════════════════════════════════════════════════════
// Debug Presets — Troque o ACTIVE_PRESET para testar cada fase.
// Todos começam SEM skill e SEM perks — escolha na hora!
// ═══════════════════════════════════════════════════════════

type DebugPreset = {
  name: string;
  INITIAL_GOLD: number;
  INITIAL_WAVE: number;
  INITIAL_LEVEL: number;
  INITIAL_XP: number;
  INITIAL_ELEVATION: number;
  INITIAL_SKILL1: skillsName | "";
  INITIAL_SKILL1_LEVEL: 1 | 2 | 3 | 4 | 5;
  INITIAL_PERKS: PerkId[];
  INITIAL_MAP_STATE: number | undefined;
};

const PRESETS = {
  // ── Do zero, experiência limpa ──
  initial: {
    name: "Início (wave 1)",
    INITIAL_GOLD: 5,
    INITIAL_WAVE: 1,
    INITIAL_LEVEL: 1,
    INITIAL_XP: 0,
    INITIAL_ELEVATION: 10,
    INITIAL_SKILL1: "",
    INITIAL_SKILL1_LEVEL: 1,
    INITIAL_PERKS: [],
    INITIAL_MAP_STATE: undefined,
  },

  // ── Mid game: já tem recursos, skill à escolha ──
  midgame: {
    name: "Mid Game (wave 15)",
    INITIAL_GOLD: 200,
    INITIAL_WAVE: 15,
    INITIAL_LEVEL: 8,
    INITIAL_XP: 0,
    INITIAL_ELEVATION: 40,
    INITIAL_SKILL1: "",
    INITIAL_SKILL1_LEVEL: 1,
    INITIAL_PERKS: [],
    INITIAL_MAP_STATE: undefined,
  },

  // ── Late game: muitos recursos, builds completas ──
  lategame: {
    name: "Late Game (wave 35)",
    INITIAL_GOLD: 500,
    INITIAL_WAVE: 35,
    INITIAL_LEVEL: 18,
    INITIAL_XP: 0,
    INITIAL_ELEVATION: 70,
    INITIAL_SKILL1: "",
    INITIAL_SKILL1_LEVEL: 1,
    INITIAL_PERKS: [],
    INITIAL_MAP_STATE: undefined,
  },

  // ── Boss waves: endgame puro, full build ──
  boss: {
    name: "Boss Waves (wave 46)",
    INITIAL_GOLD: 800,
    INITIAL_WAVE: 46,
    INITIAL_LEVEL: 25,
    INITIAL_XP: 0,
    INITIAL_ELEVATION: 100,
    INITIAL_SKILL1: "",
    INITIAL_SKILL1_LEVEL: 1,
    INITIAL_PERKS: [],
    INITIAL_MAP_STATE: undefined,
  },
} satisfies Record<string, DebugPreset>;

// ╔═══════════════════════════════════════════════╗
// ║  TROQUE AQUI O PRESET ATIVO PARA TESTAR:     ║
// ║  "initial" | "midgame" | "lategame" | "boss"  ║
// ╚═══════════════════════════════════════════════╝
const ACTIVE_PRESET: keyof typeof PRESETS = "lategame";

const preset = PRESETS[ACTIVE_PRESET];

export const debug = {
  ...preset,

  // ══════════════════════════════════════════════════════
  // GAME_SPEED — multiplicador global de velocidade/dificuldade
  //   1.0 = normal | 0.5 = metade da velocidade | 2.0 = dobro
  //   Afeta: velocidade do player, inimigos, projéteis e recarga.
  // ══════════════════════════════════════════════════════
  GAME_SPEED: 1,

  // ── Perk IDs disponíveis (referência) ──
  // "execucao-limpa" | "nao-olhe-para-tras" | "ciclo-vicioso"
  // "sede-de-caca" | "aprendizado-doloroso"
  // "impacto-sismico" | "engenharia-runica" | "zona-de-perigo" | "reacao-em-cadeia"
  // "ligeirinho" | "diga-onde-voce-vai"
  // "sobrecarga-eletrica"
  //
  // ── Referência de waves ──
  //   1-5   : Introdução (red, blue)
  //   6-10  : Green + Purple
  //   11-15 : Smart (amarelo)
  //   16-20 : Stone, pressão crescente
  //   21-25 : Elites (red_elite, blue_elite)
  //   26-30 : Green_elite, smart_elite
  //   31-35 : Purple_elite, stone_elite
  //   36-40 : Composições mistas elite
  //   41-45 : Endgame — todas as elites
  //   46-50 : Boss waves finais
  //
  // ── Mapa ──
  // Cresce a cada 5 waves (1→5). INITIAL_MAP_STATE força um tamanho.
};
