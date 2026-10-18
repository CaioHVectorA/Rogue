export const WIDTH = 1200;
export const HEIGHT = 760;
export const TOTAL_ROOMS = 12;
export type Phase = "menu" | "combat" | "reward" | "camp" | "paused" | "result";
export type ClassId = "ranger" | "arcanist" | "colossus";
export type EnemyKind = "chaser" | "runner" | "shooter" | "guard" | "boss";
export interface Point {
  x: number;
  y: number;
}
export interface Enemy extends Point {
  id: number;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  damage: number;
  timer: number;
  flash: number;
  poisoned: number;
  bossAct: number;
  cycle: number;
  enraged: boolean;
}
export interface Bullet extends Point {
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  life: number;
  hostile: boolean;
  pierce: number;
  hit: Set<number>;
}
export interface Hazard extends Point {
  radius: number;
  delay: number;
  life: number;
  damage: number;
  fired: boolean;
}
export interface Particle extends Point {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
}
export interface Pickup extends Point {
  value: number;
  life: number;
}
export interface Player extends Point {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  reload: number;
  charge: number;
  skillCd: number;
  dashCd: number;
  invulnerable: number;
  dashTime: number;
  dashX: number;
  dashY: number;
  moving: boolean;
}
export interface Run {
  seed: string;
  classId: ClassId;
  room: number;
  act: number;
  gold: number;
  kills: number;
  elapsed: number;
  bosses: number;
  damageTaken: number;
  rewards: Record<string, number>;
  offers: string[];
  rerolls: number;
  purchases: number;
  healed: boolean;
  won: boolean;
  finished: boolean;
}
export interface RecordBook {
  runs: number;
  wins: number;
  bestRoom: number;
  bestTime: number | null;
}
export const CLASSES = {
  ranger: {
    name: "Atirador",
    title: "Precisão em movimento.",
    skill: "Sobrecarga",
    desc: "Q dispara uma rajada em leque. Ideal para abrir espaço.",
    color: "#a4f6c1",
    hp: 100,
    damage: 18,
    reload: 0.62,
    speed: 235,
    cooldown: 8,
  },
  arcanist: {
    name: "Conjurador",
    title: "Controle o impossível.",
    skill: "Nova arcana",
    desc: "Q causa dano e afasta inimigos próximos. Controle de área.",
    color: "#c5afff",
    hp: 90,
    damage: 16,
    reload: 0.68,
    speed: 235,
    cooldown: 9,
  },
  colossus: {
    name: "Colosso",
    title: "Transforme risco em força.",
    skill: "Impacto sísmico",
    desc: "Q atinge uma grande área e recupera vida ao acertar.",
    color: "#ffbc8a",
    hp: 140,
    damage: 21,
    reload: 0.8,
    speed: 215,
    cooldown: 11,
  },
} as const;
export const ACTS = [
  {
    name: "O limiar",
    boss: "O Sentinela",
    subtitle: "Aprenda a encontrar sua janela.",
    color: "#a4f6c1",
  },
  {
    name: "A fratura",
    boss: "A Tecelã",
    subtitle: "O espaço também é uma ameaça.",
    color: "#c5afff",
  },
  {
    name: "O núcleo",
    boss: "O Soberano",
    subtitle: "Faça sua construção valer.",
    color: "#ffbc8a",
  },
];
export interface Reward {
  id: string;
  name: string;
  tag: string;
  desc: string;
  max: number;
  color: string;
}
export const REWARDS: Reward[] = [
  {
    id: "power",
    name: "Calibre elevado",
    tag: "ATIRADOR",
    desc: "+22% de dano nos disparos básicos.",
    max: 4,
    color: "#a4f6c1",
  },
  {
    id: "reload",
    name: "Ritmo preciso",
    tag: "ATIRADOR",
    desc: "Recarga 14% mais rápida, parado ou em movimento.",
    max: 4,
    color: "#a4f6c1",
  },
  {
    id: "pierce",
    name: "Além do alvo",
    tag: "ATIRADOR",
    desc: "Seus disparos atravessam mais um inimigo.",
    max: 2,
    color: "#a4f6c1",
  },
  {
    id: "double",
    name: "Disparo duplo",
    tag: "ATIRADOR",
    desc: "Dois projéteis por disparo, cada um com 75% do dano.",
    max: 1,
    color: "#a4f6c1",
  },
  {
    id: "cast",
    name: "Ressonância",
    tag: "CONJURADOR",
    desc: "+30% de dano na habilidade Q.",
    max: 3,
    color: "#c5afff",
  },
  {
    id: "haste",
    name: "Eco arcano",
    tag: "CONJURADOR",
    desc: "Habilidade Q recarrega 18% mais rápido.",
    max: 3,
    color: "#c5afff",
  },
  {
    id: "poison",
    name: "Toxina residual",
    tag: "SINERGIA",
    desc: "Disparos aplicam veneno por 3 segundos. Acumule para aumentar o dano.",
    max: 3,
    color: "#c5afff",
  },
  {
    id: "explosion",
    name: "Reação em cadeia",
    tag: "SINERGIA",
    desc: "Inimigos envenenados explodem ao morrer e envenenam os próximos.",
    max: 1,
    color: "#c5afff",
  },
  {
    id: "health",
    name: "Força vital",
    tag: "COLOSSO",
    desc: "+25 de vida máxima, cura 25 e adiciona +5% de dano básico.",
    max: 4,
    color: "#ffbc8a",
  },
  {
    id: "armor",
    name: "Casca grossa",
    tag: "COLOSSO",
    desc: "Reduz todo dano recebido em 10%. Limite de 30%.",
    max: 3,
    color: "#ffbc8a",
  },
  {
    id: "vampire",
    name: "Segundo fôlego",
    tag: "COLOSSO",
    desc: "Derrotar um inimigo recupera 1 de vida. Chefes recuperam 10.",
    max: 3,
    color: "#ffbc8a",
  },
  {
    id: "speed",
    name: "Passo leve",
    tag: "MOBILIDADE",
    desc: "+10% de movimento e esquiva recarrega 15% mais rápido.",
    max: 3,
    color: "#85d8ef",
  },
];
// FNV-1a + Mulberry32: the same seed produces the same encounter and reward stream.
export function randomFromSeed(seed: string): () => number {
  let state = 2166136261;
  for (const char of seed)
    state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
export function createRun(seed: string, classId: ClassId): Run {
  return {
    seed,
    classId,
    room: 1,
    act: 1,
    gold: 0,
    kills: 0,
    elapsed: 0,
    bosses: 0,
    damageTaken: 0,
    rewards: {},
    offers: [],
    rerolls: 1,
    purchases: 0,
    healed: false,
    won: false,
    finished: false,
  };
}
export function createPlayer(classId: ClassId): Player {
  const stats = CLASSES[classId];
  return {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    hp: stats.hp,
    maxHp: stats.hp,
    speed: stats.speed,
    damage: stats.damage,
    reload: stats.reload,
    charge: 0,
    skillCd: 0,
    dashCd: 0,
    invulnerable: 0,
    dashTime: 0,
    dashX: 0,
    dashY: -1,
    moving: false,
  };
}
export function rewardOffers(
  run: Run,
  random: () => number,
  exclude: string[] = [],
): string[] {
  const eligible = REWARDS.filter((r) => (run.rewards[r.id] ?? 0) < r.max);
  const fresh = eligible.filter((r) => !exclude.includes(r.id));
  const pool = [...fresh, ...eligible.filter((r) => exclude.includes(r.id))];
  // Draw without replacement, preferring unseen offers during a reroll.
  const result: string[] = [];
  while (result.length < 3 && pool.length) {
    const freshCount = pool.filter((r) => !exclude.includes(r.id)).length;
    const index = Math.floor(random() * (freshCount || pool.length));
    result.push(pool.splice(index, 1)[0].id);
  }
  return result;
}
export function applyReward(run: Run, player: Player, id: string): boolean {
  const reward = REWARDS.find((r) => r.id === id);
  if (!reward || (run.rewards[id] ?? 0) >= reward.max) return false;
  run.rewards[id] = (run.rewards[id] ?? 0) + 1;
  if (id === "power") player.damage *= 1.22;
  if (id === "reload") player.reload *= 0.86;
  if (id === "health") {
    player.maxHp += 25;
    player.hp = Math.min(player.maxHp, player.hp + 25);
    player.damage *= 1.05;
  }
  if (id === "speed") player.speed *= 1.1;
  return true;
}
export function roomComposition(room: number): EnemyKind[] {
  if (room % 4 === 0) return ["boss"];
  const act = Math.ceil(room / 4);
  const stage = (room - 1) % 4;
  const result: EnemyKind[] = Array.from(
    { length: 4 + stage * 2 + act },
    () => "chaser",
  );
  if (stage >= 1 || act >= 2)
    result.push(
      ...Array.from({ length: act + stage }, () => "runner" as const),
    );
  if (stage >= 2 || act >= 2)
    result.push(...Array.from({ length: act }, () => "shooter" as const));
  if (act >= 2)
    result.push(...Array.from({ length: act - 1 }, () => "guard" as const));
  return result;
}
export function advanceRoom(run: Run): boolean {
  if (run.room >= TOTAL_ROOMS) return false;
  run.room++;
  run.act = Math.ceil(run.room / 4);
  run.healed = false;
  run.purchases = 0;
  return true;
}
export const emptyRecords = (): RecordBook => ({
  runs: 0,
  wins: 0,
  bestRoom: 0,
  bestTime: null,
});
export function finishRecords(records: RecordBook, run: Run): RecordBook {
  return {
    runs: records.runs + 1,
    wins: records.wins + Number(run.won),
    bestRoom: Math.max(records.bestRoom, run.room),
    bestTime: run.won
      ? Math.min(records.bestTime ?? Infinity, run.elapsed)
      : records.bestTime,
  };
}
export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}
