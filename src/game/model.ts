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
export type Element = "neutral" | "storm" | "toxin";
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
  venom: number;
  shock: number;
  markCd: number;
  windup: number;
  dashLeft: number;
  dashVX: number;
  dashVY: number;
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
  color?: string;
  ricochets?: boolean;
  element?: Element;
  origin?: "turret";
}
export interface Field extends Point {
  kind: "vortex" | "storm" | "turret" | "mine" | "orbit" | "decoy" | "toxin";
  radius: number;
  life: number;
  timer: number;
  power: number;
  blocks: number;
  ultimate?: boolean;
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
  skills: [ability: string | null, ultimate: string | null];
  weapon: WeaponId;
  weapons: WeaponId[];
  practice: boolean;
  reactions: { overload: number; catalysis: number; conduction: number };
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
  training: Partial<Record<HeroStat, number>>;
  ultimateCharge: number;
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
    skill: "Rajada perfurante",
    desc: "Q dispara uma rajada em leque. Ideal para abrir espaço.",
    color: "#a4f6c1",
    hp: 100,
    damage: 22,
    reload: 0.2,
    speed: 235,
    cooldown: 3.2,
  },
  arcanist: {
    name: "Conjurador",
    title: "Controle o impossível.",
    skill: "Onda de repulsão",
    desc: "Q causa dano e afasta inimigos próximos. Controle de área.",
    color: "#c5afff",
    hp: 90,
    damage: 20,
    reload: 0.23,
    speed: 235,
    cooldown: 4,
  },
  colossus: {
    name: "Colosso",
    title: "Transforme risco em força.",
    skill: "Pisada sísmica",
    desc: "Q atinge uma grande área e recupera vida ao acertar.",
    color: "#ffbc8a",
    hp: 140,
    damage: 25,
    reload: 0.26,
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
export const WEAPONS = [
  {
    id: "pulse",
    name: "Pistola de pulso",
    tag: "PRECISÃO",
    desc: "Pare para disparar tiros rápidos no alvo mais próximo. Boa distância e impacto imediato.",
    hint: "Tiro rápido e preciso",
    glyph: "target",
    color: "#a4f6c1",
    interval: 0.2,
    range: 850,
    power: 1,
    pattern: "line",
  },
  {
    id: "minigun",
    name: "Metralhadora",
    tag: "CADÊNCIA",
    desc: "Tiros mais fracos em sequência rápida. Troca dano concentrado por frequência de marcas e cargas.",
    hint: "Uma corrente de tiros",
    glyph: "charge",
    color: "#a4f6c1",
    interval: 0.14,
    range: 700,
    power: 0.58,
    pattern: "line",
  },
  {
    id: "shotgun",
    name: "Escopeta",
    tag: "CONE CURTO",
    desc: "Sete chumbos curtos e uma pausa maior entre tiros. De perto concentra dano; de longe perde força.",
    hint: "Perto: concentre sete chumbos",
    glyph: "shotgun",
    color: "#ffbc8a",
    interval: 0.5,
    range: 290,
    power: 0.34,
    pattern: "cone",
  },
  {
    id: "seismic",
    name: "Emissor sísmico",
    tag: "AO SEU REDOR",
    desc: "Ondas lentas atingem só o círculo próximo. Troca dano em alvo único por cobertura ao redor; exige ficar perto.",
    hint: "Só atinge quem entra no círculo",
    glyph: "seismic",
    color: "#ffda8a",
    interval: 0.6,
    range: 135,
    power: 0.95,
    pattern: "circle",
  },
  {
    id: "arc",
    name: "Arco elétrico",
    tag: "EM CADEIA",
    desc: "Choques fracos saltam por até três alvos próximos e acumulam cargas. Combine com descargas e tempestades.",
    hint: "O choque salta entre três alvos",
    glyph: "bolt",
    color: "#85d8ef",
    interval: 0.36,
    range: 340,
    power: 0.6,
    pattern: "chain",
  },
  {
    id: "rail",
    name: "Lança perfurante",
    tag: "LINHA LONGA",
    desc: "Um disparo pesado atravessa até cinco inimigos alinhados. Mais lento: alinhe a fila antes de parar.",
    hint: "Alinhe a horda e atravesse a fila",
    glyph: "pierce",
    color: "#c5afff",
    interval: 0.52,
    range: 950,
    power: 2,
    pattern: "line",
  },
  {
    id: "needle",
    name: "Agulha tóxica",
    tag: "VENENO",
    desc: "Agulhas atravessam dois alvos e aplicam duas doses de toxina. Dano direto menor; prepare doses antes de detonar.",
    hint: "Perfure e prepare doses de veneno",
    glyph: "toxin",
    color: "#b8ff62",
    interval: 0.28,
    range: 560,
    power: 0.8,
    pattern: "line",
  },
] as const;
export type WeaponId = (typeof WEAPONS)[number]["id"];
export const weaponById = (id: WeaponId) => WEAPONS.find((w) => w.id === id)!;

export const SKILLS = [
  {
    id: "volley",
    name: "Rajada perfurante",
    tag: "RAJADA",
    desc: "Sete projéteis perfurantes em leque. Abra uma passagem na horda.",
    cooldown: 3.2,
    color: "#a4f6c1",
    glyph: "double",
  },
  {
    id: "nova",
    name: "Onda de repulsão",
    tag: "CONTROLE",
    desc: "Uma onda ao seu redor empurra e desacelera inimigos por 2s. Também apaga tiros inimigos próximos.",
    cooldown: 4,
    color: "#c5afff",
    glyph: "explosion",
  },
  {
    id: "quake",
    name: "Pisada sísmica",
    tag: "BRIGA",
    desc: "Uma pisada atinge só inimigos perto de você e cura ao acertar. Aproxime-se antes de ativar.",
    cooldown: 4.5,
    color: "#ffbc8a",
    glyph: "seismic",
  },
  {
    id: "vortex",
    name: "Ímã gravitacional",
    tag: "AGRUPAR",
    desc: "Durante 3s, um poço no inimigo mais próximo puxa a horda. Combine com ataques de área.",
    cooldown: 5,
    color: "#c5afff",
    glyph: "mark",
  },
  {
    id: "storm",
    name: "Chuva de raios",
    tag: "ZONA",
    desc: "Cria uma tempestade no inimigo mais próximo. A área recebe vários raios durante 2,4s.",
    cooldown: 4.2,
    color: "#85d8ef",
    glyph: "bolt",
  },
  {
    id: "turret",
    name: "Torre automática",
    tag: "POSICIONAR",
    desc: "Plante uma torre que atira enquanto você se reposiciona. Dura quatro segundos.",
    cooldown: 5.5,
    color: "#a4f6c1",
    glyph: "target",
  },
  {
    id: "mine",
    name: "Mina de proximidade",
    tag: "ARMADILHA",
    desc: "Planta uma mina aos seus pés. Arma em 0,45s e explode quando um inimigo se aproxima, ou após 5s.",
    cooldown: 3.8,
    color: "#ffbc8a",
    glyph: "explosion",
  },
  {
    id: "orbit",
    name: "Lâminas orbitais",
    tag: "CORPO A CORPO",
    desc: "Por 3,2s, lâminas acompanham você e ferem inimigos próximos. Podem cortar até seis tiros; depois disso, reposicione-se.",
    cooldown: 5,
    color: "#ffda8a",
    glyph: "crown",
  },
  {
    id: "decoy",
    name: "Isca explosiva",
    tag: "ISCA",
    desc: "Deixa uma cópia na sua posição. Inimigos comuns seguem a isca; ela explode após 2,5s.",
    cooldown: 4.8,
    color: "#85d8ef",
    glyph: "dash",
  },
  {
    id: "venom",
    name: "Frasco ácido",
    tag: "VENENO",
    desc: "Arremessa um frasco no alvo mais próximo. A nuvem aplica doses de toxina por 3s; prepare uma detonação ou atraia a horda.",
    cooldown: 4.6,
    color: "#b8ff62",
    glyph: "toxin",
  },
] as const;
export const ULTIMATES = [
  {
    id: "tempest",
    name: "Olho da tempestade",
    tag: "ULTIMATE · RAIO",
    desc: "Uma tempestade acompanha você por 5s. Raios atingem a horda e acumulam cargas; a ativação apaga tiros próximos. Leve o temporal até os inimigos.",
    cooldown: 8,
    color: "#85d8ef",
    glyph: "bolt",
  },
  {
    id: "plague",
    name: "Eclosão tóxica",
    tag: "ULTIMATE · VENENO",
    desc: "Detona doses já aplicadas em qualquer lugar da arena e planta três nuvens nos alvos mais próximos. Sem doses, prepara veneno; com doses, provoca uma reação em cadeia.",
    cooldown: 8,
    color: "#b8ff62",
    glyph: "toxin",
  },
  {
    id: "cataclysm",
    name: "Cataclismo",
    tag: "ULTIMATE · IMPACTO",
    desc: "Três ondas crescentes partem do local da ativação, empurram a horda e apagam tiros. Cada impacto também detona doses de veneno com Catálise.",
    cooldown: 8,
    color: "#ffbc8a",
    glyph: "seismic",
  },
] as const;
export const isUltimate = (id: string) => ULTIMATES.some((s) => s.id === id);
export const skillById = (id: string) =>
  [...SKILLS, ...ULTIMATES].find((s) => s.id === id)!;
export const HERO_STATS = [
  {
    id: "vitality",
    name: "Vitalidade",
    glyph: "heart",
    effect: "+12 vida máxima",
    desc: "Acrescenta 12 de vida máxima e preenche apenas esses 12 pontos.",
  },
  {
    id: "cadence",
    name: "Cadência",
    glyph: "repeat",
    effect: "−6% intervalo de tiro",
    desc: "Dispara mais rápido com qualquer arma. Não muda o dano por tiro.",
  },
  {
    id: "agility",
    name: "Agilidade",
    glyph: "dash",
    effect: "+10 velocidade",
    desc: "Aumenta a velocidade de movimento.",
  },
  {
    id: "defense",
    name: "Resistência",
    glyph: "shield",
    effect: "−1 dano recebido",
    desc: "Reduz cada impacto em 1. Todo ataque ainda causa pelo menos 1 de dano.",
  },
  {
    id: "recovery",
    name: "Regeneração",
    glyph: "vampire",
    effect: "+1 vida / 10s",
    desc: "Recupera vida a cada dez segundos de combate ativo.",
  },
  {
    id: "focus",
    name: "Sintonia",
    glyph: "bolt",
    effect: "−6% recarga do Q",
    desc: "Reduz a recarga da habilidade Q. A ultimate continua dependendo de combate.",
  },
  {
    id: "evasion",
    name: "Reflexos",
    glyph: "arrow",
    effect: "−0,18s na esquiva",
    desc: "Encurta a espera entre esquivas, sem aumentar a invulnerabilidade.",
  },
  {
    id: "magnet",
    name: "Magnetismo",
    glyph: "coin",
    effect: "+35 alcance de coleta",
    desc: "Atrai moedas de mais longe. Não aumenta a quantidade de ouro.",
  },
] as const;
export type HeroStat = (typeof HERO_STATS)[number]["id"];
export const TRAINING_CAP = 3;
export const trainingCost = (run: Run, id: HeroStat) =>
  22 + (run.training[id] ?? 0) * 18 + (run.act - 1) * 5;

export const REWARDS: Reward[] = [
  ...ULTIMATES.map((s) => ({
    id: `ultimate:${s.id}`,
    name: s.name,
    tag: s.tag,
    desc: s.desc,
    max: 1,
    color: s.color,
  })),
  ...WEAPONS.filter((w) => w.id !== "pulse").map((w) => ({
    id: `weapon:${w.id}`,
    name: w.name,
    tag: w.tag,
    desc: w.desc,
    max: 1,
    color: w.color,
  })),
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
    desc: "Esquivar prepara o próximo tiro e lança dois disparos leves para trás. Recuar ajuda a preparar marcas e doses.",
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
    desc: "Ativar a ultimate deixa Q pronto imediatamente. Prepare o controle e solte os dois poderes em sequência.",
    max: 1,
    color: "#c5afff",
  },
  {
    id: "battery",
    name: "Bateria de abates",
    tag: "CONJURAR",
    desc: "Abates adiantam um instante da recarga de Q. A ultimate continua carregando apenas com ataques acertados.",
    max: 1,
    color: "#c5afff",
  },
  {
    id: "poison",
    name: "Frasco de toxina",
    tag: "VENENO · DOSES",
    desc: "Ataques aplicam uma dose de toxina. Doses acumulam até quatro; prepare inimigos para explosões e catálise.",
    max: 1,
    color: "#b8ff62",
  },
  {
    id: "explosion",
    name: "Estopim tóxico",
    tag: "VENENO · DETONAR",
    desc: "Inimigos mortos com três doses explodem e levam uma dose a até cinco vizinhos. A cadeia exige preparar a horda.",
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
    desc: "Um escudo bloqueia um impacto e lança uma onda de repulsão. Reconstrói sozinho após oito segundos.",
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
    desc: "Tiros retos procuram outro inimigo próximo após acertar. Não repete alvos nem muda o alcance dos chumbos.",
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
  {
    id: "capacitor",
    name: "Núcleo estático",
    tag: "RAIO · CARGAS",
    desc: "Ataques acumulam cargas. Na quarta carga, uma descarga leve salta para um vizinho. Cargas restantes passam adiante no abate; chumbos contam como um ataque.",
    max: 1,
    color: "#85d8ef",
  },
  {
    id: "groundwire",
    name: "Aterramento",
    tag: "RAIO · ESQUIVA",
    desc: "Esquivar consome cargas dos inimigos próximos e devolve uma descarga que os desacelera. Aproxime-se para abrir espaço.",
    max: 1,
    color: "#85d8ef",
  },
  {
    id: "rod",
    name: "Para-raios",
    tag: "RAIO · TORRE",
    desc: "A torre procura inimigos carregados. Seu disparo consome as cargas e lança choques em até dois vizinhos.",
    max: 1,
    color: "#85d8ef",
  },
  {
    id: "faraday",
    name: "Gaiola de Faraday",
    tag: "RAIO · CIRCUITO",
    desc: "O Olho da tempestade dentro do ímã consome cargas para saltar entre inimigos. Agrupe primeiro; leve a ultimate até a horda.",
    max: 1,
    color: "#85d8ef",
  },
  {
    id: "catalyst",
    name: "Catalisador sísmico",
    tag: "VENENO · CATÁLISE",
    desc: "Ondas sísmicas, pisada e minas consomem três ou mais doses para causar uma explosão de dano. Envenene antes de detonar.",
    max: 1,
    color: "#b8ff62",
  },
  {
    id: "mycelium",
    name: "Jardim fúngico",
    tag: "VENENO · CONTÁGIO",
    desc: "Abates com duas doses deixam pequenas nuvens que contaminam quem passa. Atraia a próxima fila para o jardim.",
    max: 1,
    color: "#b8ff62",
  },
  {
    id: "viscosity",
    name: "Melaço tóxico",
    tag: "VENENO · CONTROLE",
    desc: "Inimigos com três doses ficam lentos. O controle aparece depois de aplicar veneno, criando janelas para parar.",
    max: 1,
    color: "#b8ff62",
  },
  {
    id: "electrolysis",
    name: "Eletrólise",
    tag: "RAIO + VENENO",
    desc: "A sobrecarga transfere até duas doses de toxina para os alvos atingidos pelo salto. Prepare veneno; use raio para espalhar.",
    max: 1,
    color: "#c5afff",
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
  Math.min(0.4, Math.max(0, combo - 2) * 0.012);
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
    skills: [null, null],
    weapon: "pulse",
    weapons: ["pulse"],
    practice: false,
    reactions: { overload: 0, catalysis: 0, conduction: 0 },
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
    training: {},
    ultimateCharge: 0,
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
  const kind =
    run.room === 1
      ? "relic"
      : run.room === 2
        ? "skill"
        : run.room === 4
          ? "weapon"
          : run.room === 8
            ? "ultimate"
            : "perk";
  const projectile = !["circle", "chain"].includes(
    weaponById(run.weapon).pattern,
  );
  const elements = buildElements(run);
  const eligible = REWARDS.filter((r) => {
    if ((run.rewards[r.id] ?? 0) >= r.max) return false;
    if (kind === "relic")
      return ["capacitor", "poison", "dashload"].includes(r.id);
    if (r.id.startsWith("ultimate:"))
      return kind === "ultimate" && !run.skills[1];
    if (r.id.startsWith("skill:"))
      return (
        (kind === "skill" ||
          (kind === "perk" && [5, 7, 10].includes(run.room))) &&
        !run.skills.includes(r.id.slice(6))
      );
    if (kind === "ultimate") return false;
    if (r.id.startsWith("weapon:"))
      return run.room >= 4 && !run.weapons.includes(r.id.slice(7) as WeaponId);
    if (kind === "skill" || kind === "weapon") return false;
    if (
      !projectile &&
      ["anchor", "double", "pierce", "crossfire", "ricochet"].includes(r.id)
    )
      return false;
    if (r.id === "ricochet" && run.weapon === "shotgun") return false;
    if (r.id === "echo" && !run.skills.every(Boolean)) return false;
    if (r.id === "battery" && !run.skills.some(Boolean)) return false;
    if (
      ["explosion", "catalyst", "mycelium", "viscosity"].includes(r.id) &&
      !elements.toxin
    )
      return false;
    if (["groundwire", "rod", "faraday"].includes(r.id) && !elements.storm)
      return false;
    if (r.id === "rod" && !run.skills.includes("turret")) return false;
    if (
      r.id === "faraday" &&
      !(
        run.skills.includes("vortex") &&
        (run.skills.includes("storm") || run.skills.includes("tempest"))
      )
    )
      return false;
    if (
      r.id === "catalyst" &&
      !(
        run.weapon === "seismic" ||
        run.skills.some((id) => id === "quake" || id === "mine")
      )
    )
      return false;
    if (r.id === "electrolysis" && !(elements.storm && elements.toxin))
      return false;
    return true;
  });
  // A fully collected weapon draft falls back to legal passives (also useful in the lab).
  if (kind === "weapon" && eligible.length < 3) {
    for (const r of REWARDS)
      if (
        !r.id.includes(":") &&
        ["capacitor", "poison", "dashload", "health", "anchor"].includes(
          r.id,
        ) &&
        (run.rewards[r.id] ?? 0) < r.max
      )
        eligible.push(r);
  }
  const pool = [
    ...eligible.filter((r) => !exclude.includes(r.id)),
    ...eligible.filter((r) => exclude.includes(r.id)),
  ];
  const result: string[] = [];
  while (result.length < 3 && pool.length) {
    const fresh = pool.filter((r) => !exclude.includes(r.id));
    let choices = fresh.length ? fresh : pool;
    // One fitting offer helps a build become coherent; the others keep the draft open.
    const fitting = choices.filter((r) => rewardSynergy(run, r.id));
    if (!result.length && fitting.length) choices = fitting;
    const picked = choices[Math.floor(random() * choices.length)];
    result.push(picked.id);
    pool.splice(pool.indexOf(picked), 1);
  }
  return result;
}
export function applyReward(run: Run, player: Player, id: string): boolean {
  const reward = REWARDS.find((r) => r.id === id);
  if (!reward || (run.rewards[id] ?? 0) >= reward.max) return false;
  if (id.startsWith("weapon:")) {
    const weapon = id.slice(7) as WeaponId;
    if (run.weapons.includes(weapon)) return false;
    run.weapons.push(weapon);
    run.weapon = weapon;
    player.charge = 0;
  }
  if (id.startsWith("skill:")) {
    const skill = id.slice(6);
    if (run.skills.includes(skill)) return false;
    run.skills[0] = skill;
    player.skillCd = 0;
  }
  if (id.startsWith("ultimate:")) {
    if (run.skills[1]) return false;
    run.skills[1] = id.slice(9);
    run.ultimateCharge = 100;
    player.secondCd = 0;
  }
  run.rewards[id] = (run.rewards[id] ?? 0) + 1;
  if (id === "health") {
    player.maxHp += 25;
    player.hp = Math.min(player.maxHp, player.hp + 25);
  }
  return true;
}
export function roomComposition(room: number): EnemyKind[] {
  const act = Math.ceil(room / 4),
    stage = (room - 1) % 4;
  if (room % 4 === 0)
    return [
      "boss",
      ...Array.from({ length: 6 + act * 2 }, () => "chaser" as const),
    ];
  const groups: Record<Exclude<EnemyKind, "boss">, number> = {
    chaser: 20 + stage * 6 + (act - 1) * 8,
    runner: 2 + stage * 2 + (act - 1) * 2,
    shooter: 1 + stage + (act - 1) * 2,
    guard: Math.max(0, stage + act - 1),
  };
  const result: EnemyKind[] = [];
  // Interleave threats: ranged and flankers no longer arrive only after the basic horde.
  while (Object.values(groups).some((n) => n > 0))
    for (const kind of [
      "chaser",
      "chaser",
      "runner",
      "chaser",
      "shooter",
      "chaser",
      "guard",
    ] as const)
      if (groups[kind] > 0) {
        result.push(kind);
        groups[kind]--;
      }
  return result;
}
export function buildElements(run: Run) {
  return {
    storm:
      !!run.rewards.capacitor ||
      run.weapon === "arc" ||
      run.skills.includes("storm") ||
      run.skills.includes("tempest"),
    toxin:
      !!run.rewards.poison ||
      run.weapon === "needle" ||
      run.skills.includes("venom") ||
      run.skills.includes("plague"),
  };
}
export function rewardSynergy(run: Run, id: string): string | null {
  const e = buildElements(run);
  if (id === "electrolysis" && e.storm && e.toxin)
    return "RAIO + DOSES → CONTÁGIO";
  if (id === "faraday") return "ÍMÃ + TEMPESTADE → CIRCUITO";
  if (id === "rod") return "TORRE + CARGAS → PARA-RAIOS";
  if (id === "catalyst") return "DOSES + IMPACTO → CATÁLISE";
  if (
    e.storm &&
    [
      "capacitor",
      "groundwire",
      "weapon:arc",
      "skill:storm",
      "skill:turret",
    ].includes(id)
  )
    return "CARGAS → DESCARGAS EM CADEIA";
  if (
    e.toxin &&
    [
      "poison",
      "explosion",
      "mycelium",
      "viscosity",
      "weapon:needle",
      "skill:venom",
      "skill:quake",
      "skill:mine",
    ].includes(id)
  )
    return "DOSES → CONTROLE E DETONAÇÃO";
  return null;
}
export function advanceRoom(run: Run): boolean {
  if (run.room >= TOTAL_ROOMS) return false;
  run.room++;
  run.act = Math.ceil(run.room / 4);
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
