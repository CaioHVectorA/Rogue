export type SkillInfo = {
  id: string;
  name: string;
  desc: string;
  cooldownMs: number; // cooldown inicial em milissegundos
  damage: string; // texto livre para dano, ex.: "25 por acerto" ou "escala com level"
};

export const skillInfos = [
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
    desc: "Lança um projétil que busca o inimigo mais próximo e ricocheteia entre alvos. Cada quique muda de cor e gera um arco visual. +1 quique por nível, com menos perda de dano.",
    cooldownMs: 2200,
    damage:
      "TIRO ALTERNATIVO: Dano de Tiro no primeiro hit, -15~10% por quique conforme nível. 2→6 quiques.",
  },
  {
    id: "chain-lightning",
    name: "Corrente Elétrica",
    desc: "Lança um disparo elétrico rápido que acerta um inimigo e eletrocuta ele e inimigos próximos, que por sua vez também podem eletrocutar outros.",
    cooldownMs: 3200,
    damage:
      "Causa dano médio e aplica 5 acúmulos de choque no inimigo inicial e os acúmulos nos outros depende do número de saltos.",
  },
  {
    id: "arc-mine",
    name: "Mina Terrestre",
    desc: "Lança uma mina terrestre que explodem quando um inimigo se aproxima. Tem cargas e pode ser aprimorada para mais cargas. Uma mina pode explodir a outra, use isso com sabedoria, pois a explosão também te atinge!",
    cooldownMs: 3500,
    damage: "Alto dano em área na explosão.",
  },
  {
    id: "poison-pool",
    name: "Poça Venenosa",
    desc: "Lança uma grande poça roxa na direção do inimigo mais próximo. Inimigos dentro dela recebem acúmulos de veneno e ficam lentos. A lentidão e duração escalam com nível.",
    cooldownMs: 8000,
    damage:
      "Aplica 1 acúmulo de veneno a cada 0.8s. Lentidão: 10%–35% conforme nível.",
  },
  {
    id: "boomerang-bolt",
    name: "Bumerangue",
    desc: "Lança um projétil que retorna ao jogador num arco, acertando vários inimigos na ida e na volta. Apanhar o projétil de volta zera o tempo de recarga. A velocidade da volta aumenta com níveis.",
    cooldownMs: 4000,
    damage: "TIRO ALTERNATIVO: Dano de Tiro na ida e 2× Dano de Tiro na volta.",
  },
  {
    id: "summoned-totem",
    name: "Totem Rúnico",
    desc: "Posiciona um totem que atira automaticamente nos inimigos. Ele possui vida e pode ser destruído ou expira com o tempo. Com mais níveis, mais tempo ele dura.",
    cooldownMs: 12000,
    damage: "DPS contínuo; O totem atira mais rápido conforme níveis.",
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
  // Novas habilidades
  {
    id: "sniper-shot",
    name: "Tiro de Precisão",
    desc: "Dispara um feixe laser perfurante de altíssima velocidade em linha reta. Causa dano alto inicial que decai após cada inimigo atravessado.",
    cooldownMs: 4500,
    damage: "Alto dano linear. Dano decai 30% por inimigo atravessado.",
  },
  {
    id: "tactical-roll",
    name: "Pulo Tático",
    desc: "Rola na direção oposta ao mouse, ganha invulnerabilidade curta (0.3s) e deixa 3 armadilhas de enraizamento (stun 1s) no chão. Recarrega a arma básica em 100%.",
    cooldownMs: 6000,
    damage: "Mobilidade defensiva + recarga instantânea.",
  },
  {
    id: "void-rift",
    name: "Fissura Abissal",
    desc: "Cria uma fenda gravitacional que puxa inimigos próximos para o centro e causa dano periódico a cada 0.5s por 3 segundos.",
    cooldownMs: 8000,
    damage: "Controle de grupo + dano mágico contínuo.",
  },
  {
    id: "frost-nova",
    name: "Tempestade de Gelo",
    desc: "Conjura uma explosão circular congelante que causa dano e reduz a velocidade dos inimigos em 50% por 3s. Inimigos já sob efeito de lentidão ou veneno são congelados (stun) por 1.5s.",
    cooldownMs: 7000,
    damage: "Dano mágico leve + Lentidão/Congelamento.",
  },
  {
    id: "phoenix-burst",
    name: "Fogo da Fênix",
    desc: "Dispara uma onda de fogo horizontal lenta que causa queima (dano periódico por 4s). Se a onda passar por uma Poça Venenosa no chão, gera uma explosão química massiva.",
    cooldownMs: 9000,
    damage: "Dano de fogo + explosão química se combinado com poça de veneno.",
  },
  {
    id: "juggernaut-rush",
    name: "Investida Imparável",
    desc: "Investe para a frente empurrando inimigos. Se colidirem contra paredes da arena, sofrem stun por 2s e dano massivo escalado com o HP Máximo do jogador.",
    cooldownMs: 7500,
    damage: "Escala com o HP Máximo do jogador. Stun contra paredes.",
  },
  {
    id: "baluarte-shield",
    name: "Escudo Refletor",
    desc: "Cria uma barreira semicircular frontal por 4s que bloqueia e reflete projéteis inimigos de volta. Velocidade de movimento é reduzida em 25% enquanto ativo.",
    cooldownMs: 10000,
    damage: "Mitigação de projéteis + 50% de reflexão de dano.",
  },
  {
    id: "lucky-dome",
    name: "Campo de Probabilidade",
    desc: "Conjura uma cúpula dourada por 6s. Dentro dela, a Sorte do jogador é multiplicada por 3x, e projéteis inimigos têm 40% de chance de desaparecer sem causar dano.",
    cooldownMs: 14000,
    damage: "Utilidade de Sorte + Bloqueio de projéteis.",
  },
  {
    id: "life-tether",
    name: "Drenagem Vital",
    desc: "Conecta um cabo de energia sombria ao inimigo mais próximo por 5s. Drena HP continuamente curando o jogador e rouba 30% da velocidade de movimento do alvo.",
    cooldownMs: 11000,
    damage: "Dano contínuo + Auto-cura + Roubo de velocidade.",
  },
  {
    id: "time-bubble",
    name: "Domo de Estase",
    desc: "Invoca uma bolha temporal que desacelera inimigos e projéteis inimigos em 80% (lentidão temporal) por 5 segundos.",
    cooldownMs: 12000,
    damage: "Controle de tempo e espaço em área.",
  },
] as const satisfies readonly SkillInfo[];

export type skillsName = (typeof skillInfos)[number]["id"];
