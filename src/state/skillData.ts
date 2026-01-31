export type SkillInfo = {
  id: string;
  name: string;
  desc: string;
  cooldownMs: number; // cooldown inicial em milissegundos
  damage: string; // texto livre para dano, ex.: "25 por acerto" ou "escala com level"
};

export const skillInfos: SkillInfo[] = [
  {
    id: "shockwave",
    name: "Onda de choque",
    desc: "Onda que empurra inimigos e causa dano uma vez por colisão. Seu raio aumenta com níveis.",
    cooldownMs: 3000,
    damage: "Pouco dano, mas pode acertar múltiplos inimigos.",
  },
  {
    id: "ricochet-shot",
    name: "Ricochete",
    desc: "Lança um tiro alternativo que acerta um inimigo e ricocheteia em inimigos próximos. Pode ser aprimorado para mais ricochetes.",
    cooldownMs: 2500,
    damage: "TIRO ALTERNATIVO: Dano do projétil base por quique.",
  },
  {
    id: "cone-shot",
    name: "Tiro em cone",
    desc: "Projéteis em cone seguindo a direção do movimento. Uma ótima pedida para grandes grupos ou um grandão de perto.",
    cooldownMs: 2800,
    damage: "TIRO ALTERNATIVO: Dano do tiro base em cada projétil.",
  },
  {
    id: "chain-lightning",
    name: "Corrente Elétrica",
    desc: "Lança um disparo elétrico rápido que acerta um inimigo e eletrocuta ele e inimigos próximos, que por sua vez também podem eletrocutar outros.",
    cooldownMs: 3200,
    damage: "Causa dano médio e aplica 5 acúmulos de choque no inimigo inicial e os acúmulos nos outros depende do número de saltos.",
  },
  {
    id: "arc-mine",
    name: "Mina Terrestre",
    desc: "Lança uma mina terrestre que explodem quando um inimigo se aproxima. Tem cargas e pode ser aprimorada para mais cargas.",
    cooldownMs: 3500,
    damage: "Alto dano em área na explosão.",
  },
  {
    id: "poison-pool",
    name: "Poça Venenosa",
    desc: "Poças são lançadas em três direções de inimigos e envenenam inimigos que passarem por cima. Causa lentidão que escala conforme níveis",
    cooldownMs: 3000,
    damage: "Aplica um acúmulo de veneno por segundo enquanto em cima da poça.",
  },
  {
    id: "boomerang-bolt",
    name: "Bumerangue",
    desc: "Lança um projétil que retorna ao jogador num arco, acertando vários inimigos na ida e na volta. Apanhar o projétil de volta zera o tempo de recarga. A velocidade da volta aumenta com níveis.",
    cooldownMs: 4000,
    damage: "TIRO ALTERNATIVO: Dano do tiro padrão na ida e 2x na volta.",
  },
  {
    id: "summoned-totem",
    name: "Totem Rúnico",
    desc: "Posiciona um totem que atira automaticamente nos inimigos. Ele possui vida e pode ser destruído ou expira com o tempo. Com mais níveis, mais tempo ele dura.",
    cooldownMs: 12000,
    damage: "DPS contínuo; O totem atira mais rápido conforme níveis.",
  },
  {
    id: "marked-shot",
    name: "Tiro Marcado",
    desc: "Tiros acertados em inimigos marcam eles. Com 5 marcas, pode utilizar a habilidade para causar uma explosão no inimigo marcado. A explosão dá 2 marcas aos inimigos atingidos.",
    cooldownMs: 0,
    damage: "Explosão causa dano moderado em área.",
  },
  {
    id: "orbital-orbs",
    name: "Orbitais",
    desc: "Passivamente, orbes orbitam ao redor do jogador, colidindo com inimigos. Ativação acelera a rotação dos orbes por um curto período. Com níveis, mais orbes.",
    cooldownMs: 7200,
    damage: "Dano leve por cada colisão.",
  },
  {
    id: "attack-buff",
    name: "Sobrecarga",
    desc: "Por cinco segundos, Deixa seus tiros mais fortes, Além deles poderem ser disparados AO INICIAR um movimento.",
    cooldownMs: 9000,
    damage: "Aumenta o dano do ataque básico e a velocidade de recarga.",
  },
];
