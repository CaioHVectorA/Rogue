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
  phase: number;
  transition: number;
  slowed: number;
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
export interface Field extends Point {
  kind: "vortex" | "storm" | "turret" | "mine" | "orbit" | "decoy";
  radius: number;
  life: number;
  timer: number;
  power: number;
}
export interface Hazard extends Point {
  radius: number;
  delay: number;
  life: number;
  damage: number;
  fired: boolean;
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
  secondCd: number;
  shieldCd: number;
  stationary: number;
  dashCd: number;
  invulnerable: number;
  dashTime: number;
  dashX: number;
  dashY: number;
  moving: boolean;
}
export interface Run {
  seed: string;
  skills: [string, string | null];
  practice: boolean;
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
    reload: 0.36,
    speed: 235,
    cooldown: 3.2,
  },
  arcanist: {
    name: "Conjurador",
    title: "Controle o impossível.",
    skill: "Nova arcana",
    desc: "Q causa dano e afasta inimigos próximos. Controle de área.",
    color: "#c5afff",
    hp: 90,
    damage: 16,
    reload: 0.4,
    speed: 235,
    cooldown: 4,
  },
  colossus: {
    name: "Colosso",
    title: "Transforme risco em força.",
    skill: "Impacto sísmico",
    desc: "Q atinge uma grande área e recupera vida ao acertar.",
    color: "#ffbc8a",
    hp: 140,
    damage: 21,
    reload: 0.46,
    speed: 215,
    cooldown: 4.5,
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
export const SKILLS = [
  {
    id: "volley",
    name: "Sobrecarga",
    tag: "RAJADA",
    desc: "Sete projéteis perfurantes em leque. Abra uma passagem na horda.",
    cooldown: 3.2,
    color: "#a4f6c1",
    glyph: "double",
  },
  {
    id: "nova",
    name: "Nova arcana",
    tag: "CONTROLE",
    desc: "Uma onda afasta e congela a horda por um instante. Apaga tiros próximos.",
    cooldown: 4,
    color: "#c5afff",
    glyph: "explosion",
  },
  {
    id: "quake",
    name: "Impacto sísmico",
    tag: "BRIGA",
    desc: "Esmague inimigos próximos e recupere vida por alvo atingido.",
    cooldown: 4.5,
    color: "#ffbc8a",
    glyph: "shield",
  },
  {
    id: "vortex",
    name: "Poço gravitacional",
    tag: "AGRUPAR",
    desc: "Um poço no alvo puxa a horda. Agrupe antes de explodir ou perfurar.",
    cooldown: 5,
    color: "#c5afff",
    glyph: "mark",
  },
  {
    id: "storm",
    name: "Tempestade iônica",
    tag: "ZONA",
    desc: "Marque o alvo: relâmpagos atingem a área várias vezes. Controle uma passagem.",
    cooldown: 4.2,
    color: "#85d8ef",
    glyph: "bolt",
  },
  {
    id: "turret",
    name: "Sentinela de bolso",
    tag: "POSICIONAR",
    desc: "Plante uma torre que atira enquanto você se reposiciona. Dura quatro segundos.",
    cooldown: 5.5,
    color: "#a4f6c1",
    glyph: "target",
  },
  {
    id: "mine",
    name: "Presente explosivo",
    tag: "ARMADILHA",
    desc: "Deixe uma mina gigante aos seus pés. Aproxime a horda e fuja antes da explosão.",
    cooldown: 3.8,
    color: "#ffbc8a",
    glyph: "explosion",
  },
  {
    id: "orbit",
    name: "Coroa de lâminas",
    tag: "CORPO A CORPO",
    desc: "Três lâminas orbitam você e destroem projéteis próximos. Entre na horda.",
    cooldown: 5,
    color: "#ffda8a",
    glyph: "crown",
  },
  {
    id: "decoy",
    name: "Fantasma holográfico",
    tag: "ISCA",
    desc: "Deixe uma cópia que atrai os inimigos e explode ao desaparecer. Sua fuga vira armadilha.",
    cooldown: 4.8,
    color: "#85d8ef",
    glyph: "dash",
  },
] as const;
export const skillById = (id: string) => SKILLS.find((s) => s.id === id)!;
export const starterSkill: Record<ClassId, string> = {
  ranger: "volley",
  arcanist: "nova",
  colossus: "quake",
};
export const REWARDS: Reward[] = [
  {
    id: "anchor",
    name: "Ninho de atirador",
    tag: "FICAR E LUTAR",
    desc: "Fique parado um segundo: cada terceiro tiro vira um arpão pesado que atravessa a fila. Mover reinicia a preparação.",
    max: 1,
    color: "#a4f6c1",
  },
  {
    id: "dashload",
    name: "Gatilho de fuga",
    tag: "HIT & RUN",
    desc: "Esquivar recarrega o tiro e dispara uma rajada para trás. Seu recuo também ataca.",
    max: 1,
    color: "#85d8ef",
  },
  {
    id: "pierce",
    name: "Além do alvo",
    tag: "ALINHAR",
    desc: "Os tiros atravessam a fila de inimigos. Alinhe a horda antes de parar.",
    max: 1,
    color: "#a4f6c1",
  },
  {
    id: "double",
    name: "Disparo gêmeo",
    tag: "LEQUE",
    desc: "Atire dois projéteis divergentes. Encurte a distância para acertar ambos no mesmo alvo.",
    max: 1,
    color: "#a4f6c1",
  },
  {
    id: "echo",
    name: "Eco instável",
    tag: "COMBINAR",
    desc: "Usar Q adianta a recarga de E; usar E adianta Q. Alterne as habilidades para manter o fluxo.",
    max: 1,
    color: "#c5afff",
  },
  {
    id: "battery",
    name: "Bateria de abates",
    tag: "CONJURAR",
    desc: "Cada abate devolve um instante das duas recargas. Hordas alimentam suas habilidades.",
    max: 1,
    color: "#c5afff",
  },
  {
    id: "poison",
    name: "Toxina glacial",
    tag: "CONTROLAR",
    desc: "Tiros envenenam e desaceleram. Envenene a linha de frente para criar espaço.",
    max: 1,
    color: "#b8ff62",
  },
  {
    id: "explosion",
    name: "Reação em cadeia",
    tag: "DETONAR",
    desc: "Abates explodem; com toxina, a explosão também transmite veneno. Combine com um poço gravitacional.",
    max: 1,
    color: "#c5afff",
  },
  {
    id: "health",
    name: "Coração de titã",
    tag: "SUSTENTAR",
    desc: "Ganhe um coração extra e cure ferimentos. Uma escolha de sobrevivência para builds de contato.",
    max: 4,
    color: "#ffbc8a",
  },
  {
    id: "armor",
    name: "Casulo reativo",
    tag: "BLOQUEAR",
    desc: "Um escudo bloqueia um impacto e lança uma onda de repulsão. Reconstrói sozinho após seis segundos.",
    max: 1,
    color: "#ffbc8a",
  },
  {
    id: "vampire",
    name: "Fome de combate",
    tag: "APROXIMAR",
    desc: "Abates próximos recuperam vida. Matar de longe não alimenta: entre e saia da horda.",
    max: 1,
    color: "#ffbc8a",
  },
  {
    id: "speed",
    name: "Rastro de plasma",
    tag: "MOBILIDADE",
    desc: "Esquivar deixa uma mina de plasma na posição inicial. Use seu caminho como armadilha.",
    max: 1,
    color: "#85d8ef",
  },
  {
    id: "ricochet",
    name: "Sinuca de plasma",
    tag: "REBATER",
    desc: "Ao acertar, o tiro procura outro inimigo próximo. Não repete o mesmo alvo.",
    max: 1,
    color: "#85d8ef",
  },
  {
    id: "crossfire",
    name: "Bússola quebrada",
    tag: "CERCADO",
    desc: "Cada tiro também dispara para os lados e para trás. Ser cercado vira oportunidade.",
    max: 1,
    color: "#ffda8a",
  },
  {
    id: "thorns",
    name: "Retaliação",
    tag: "CONTRA-ATAQUE",
    desc: "Ao sofrer dano, apague tiros próximos e devolva uma explosão. Proteção vira abertura.",
    max: 1,
    color: "#ffbc8a",
  },
  {
    id: "gambit",
    name: "Febre do ouro",
    tag: "ARRISCAR",
    desc: "O combo dá mais ouro extra, mas receber dano derruba a sequência. Uma aposta na sua precisão.",
    max: 1,
    color: "#ffda8a",
  },
  ...SKILLS.map((s) => ({
    id: `skill:${s.id}`,
    name: s.name,
    tag: s.tag,
    desc: s.desc,
    max: 1,
    color: s.color,
  })),
];
export const comboDrain = (combo: number, moving: boolean) =>
  (1 + Math.min(3, combo / 16)) * (moving ? 1.7 : 1);
export const comboLootChance = (combo: number) =>
  Math.min(0.65, Math.max(0, combo - 2) * 0.018);
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
    skills: [starterSkill[classId], null],
    practice: false,
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
    secondCd: 0,
    shieldCd: 0,
    stationary: 0,
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
  // The first two clears guarantee a new active; later choices reshape the build.
  const draft = run.room <= 2;
  const eligible = REWARDS.filter(
    (r) =>
      (run.rewards[r.id] ?? 0) < r.max &&
      r.id.startsWith("skill:") === draft &&
      (!draft || !run.skills.includes(r.id.slice(6))),
  );
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
export function applyReward(
  run: Run,
  player: Player,
  id: string,
  slot: 0 | 1 = run.skills[1] ? 0 : 1,
): boolean {
  const reward = REWARDS.find((r) => r.id === id);
  if (!reward || (run.rewards[id] ?? 0) >= reward.max) return false;
  if (id.startsWith("skill:")) {
    const skill = id.slice(6);
    if (run.skills.includes(skill)) return false;
    run.skills[slot] = skill;
    player.skillCd = player.secondCd = 0;
  }
  run.rewards[id] = (run.rewards[id] ?? 0) + 1;
  if (id === "health") {
    player.maxHp += 25;
    player.hp = Math.min(player.maxHp, player.hp + 25);
  }
  return true;
}
export function roomComposition(room: number): EnemyKind[] {
  if (room % 4 === 0)
    return [
      "boss",
      ...Array.from(
        { length: 6 + Math.ceil(room / 4) * 3 },
        () => "chaser" as const,
      ),
    ];
  const act = Math.ceil(room / 4);
  const stage = (room - 1) % 4;
  const result: EnemyKind[] = Array.from(
    { length: 18 + stage * 10 + (act - 1) * 12 },
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
