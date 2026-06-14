// ─── Perk Definitions ───────────────────────────────────

export type PerkCategory = "reset" | "stack" | "basic" | "shock" | "general";

export type PerkClass = "Geral" | "Atirador" | "Conjurador" | "Colosso";

export type PerkDef = {
  id: string;
  name: string;
  icon: string;
  desc: string;
  category: PerkCategory;
  class: PerkClass;
  color: [number, number, number];
};

export const PERK_COST = 5; // pontos de elevação
export const MAX_PERKS = 5;
export const MIN_LEVEL_FOR_PERKS = 3;

export const perkDefs: PerkDef[] = [
  // ── Geral / Híbridos ──
  {
    id: "um-dois-tres-quatro-cinco",
    name: "Um, Dois, Três, Quatro... CINCO!",
    icon: "☄",
    desc: "A cada 5 disparos, o próximo é um super projétil\nque viaja a 2x de velocidade e causa 2x de dano.",
    category: "general",
    class: "Geral",
    color: [255, 100, 100],
  },
  {
    id: "super-ima",
    name: "Super Ímã",
    icon: "🧲",
    desc: "Dobra o raio de atração do ímã de ouro\ne concede +0.3 de Sorte permanente.",
    category: "general",
    class: "Geral",
    color: [255, 200, 60],
  },
  {
    id: "rastro-nocivo",
    name: "Rastro Nocivo",
    icon: "👣",
    desc: "Deixa um rastro tóxico ao correr que envenena\ne causa dano contínuo aos inimigos.",
    category: "general",
    class: "Geral",
    color: [180, 50, 255],
  },

  // ── Atirador ──
  {
    id: "tiro-perfurante",
    name: "Tiro Perfurante",
    icon: "🏹",
    desc: "Seus tiros básicos agora atravessam\n1 inimigo adicional.",
    category: "basic",
    class: "Atirador",
    color: [100, 200, 255],
  },
  {
    id: "disparo-duplo",
    name: "Disparo Duplo",
    icon: "🔱",
    desc: "Atira 2 projéteis por vez em um ângulo pequeno,\nmaior propagação e -15% de dano por projétil.",
    category: "basic",
    class: "Atirador",
    color: [60, 150, 255],
  },
  {
    id: "estacao-de-defesa",
    name: "Estação de Defesa",
    icon: "🛡",
    desc: "Ficar parado por mais de 0.5s aumenta seu dano\nde tiro em +35% e resistência a dano em +10%.",
    category: "basic",
    class: "Atirador",
    color: [120, 220, 255],
  },

  // ── Conjurador ──
  {
    id: "eco-magico",
    name: "Eco Mágico",
    icon: "🌀",
    desc: "Suas habilidades ativas (Q) têm 20% de chance\nde serem conjuradas duas vezes seguidas sem custo.",
    category: "reset",
    class: "Conjurador",
    color: [220, 120, 255],
  },
  {
    id: "arsenal-ampliado",
    name: "Arsenal Ampliado",
    icon: "🔋",
    desc: "Concede +1 Carga Máxima para todas as habilidades\nque utilizam sistema de cargas.",
    category: "general",
    class: "Conjurador",
    color: [200, 100, 255],
  },
  {
    id: "luz-divina",
    name: "Luz Divina",
    icon: "☀",
    desc: "Invocações (orbes e totens) causam 30% mais dano\ne duram 30% mais tempo.",
    category: "general",
    class: "Conjurador",
    color: [255, 230, 100],
  },

  // ── Colosso ──
  {
    id: "onda-de-choque",
    name: "Onda de Choque",
    icon: "💢",
    desc: "Ao sofrer dano ou a cada 3s em combate, emite uma\nonda de choque que empurra e fere baseado na Vida Máxima.",
    category: "general",
    class: "Colosso",
    color: [255, 140, 60],
  },
  {
    id: "casca-grossa",
    name: "Casca Grossa",
    icon: "🧱",
    desc: "Concede +1 de redução plana de dano (armadura)\npara cada 150 de Vida Máxima do jogador.",
    category: "general",
    class: "Colosso",
    color: [200, 100, 60],
  },
  {
    id: "furia-indomavel",
    name: "Fúria Indomável",
    icon: "🩸",
    desc: "Quanto menor a vida atual do jogador, maior seu dano\nde tiro e velocidade de recarga (até +50%).",
    category: "stack",
    class: "Colosso",
    color: [255, 60, 60],
  },
  {
    id: "sobrevida-veloz",
    name: "Sobrevida Veloz",
    icon: "🏎",
    desc: "Concede +35% de velocidade de movimento\nquando a vida está abaixo de 30%.",
    category: "general",
    class: "Colosso",
    color: [100, 255, 100],
  },
  {
    id: "intangibilidade",
    name: "Intangibilidade",
    icon: "👻",
    desc: "Ao cair abaixo de 25% de vida, fica intangível\n(imune a dano) por 3s. Ocorre 1x por wave.",
    category: "general",
    class: "Colosso",
    color: [200, 200, 255],
  },
  {
    id: "forca-vital",
    name: "Força Vital",
    icon: "🌱",
    desc: "Seu dano de tiro e Poder de Conjuração aumentam\nem +2% para cada 10 de Vida Máxima.",
    category: "general",
    class: "Colosso",
    color: [80, 220, 120],
  },
  {
    id: "escudo-vital",
    name: "Escudo de Cura",
    icon: "🔰",
    desc: "Derrotar um inimigo do tipo Elite com uma habilidade\nativa (Q) restaura 8% da sua Vida Máxima.",
    category: "general",
    class: "Conjurador",
    color: [255, 215, 0],
  },
  {
    id: "retaliacao-sombria",
    name: "Retaliação Sombria",
    icon: "🗡",
    desc: "Ao ativar a Intangibilidade, dispara 8 adagas venenosas\nem todas as direções que causam dano e envenenam.",
    category: "general",
    class: "Colosso",
    color: [180, 50, 180],
  },
  {
    id: "furia-vital",
    name: "Fúria Vital",
    icon: "🔥",
    desc: "Aumenta o Poder de Conjuração em +1.5% para\ncada 1% de vida perdida do jogador.",
    category: "general",
    class: "Conjurador",
    color: [255, 120, 0],
  },
  {
    id: "imunidade-critica",
    name: "Escudo de Sorte",
    icon: "🍀",
    desc: "Chance igual a 50% do seu status de Sorte de bloquear\ncompletamente qualquer dano recebido.",
    category: "general",
    class: "Geral",
    color: [120, 255, 200],
  },
  {
    id: "passo-espiritual",
    name: "Passo Espiritual",
    icon: "👣",
    desc: "Concede +20% de velocidade de movimento por 2s\nsempre que usar uma habilidade ativa (Q).",
    category: "general",
    class: "Conjurador",
    color: [100, 180, 255],
  },
  {
    id: "toxina-explosiva",
    name: "Toxina Explosiva",
    icon: "☣",
    desc: "Inimigos que morrem envenenados explodem,\ncausando dano tóxico em área e aplicando veneno.",
    category: "general",
    class: "Geral",
    color: [140, 60, 255],
  },
  {
    id: "sopro-gelado",
    name: "Sopro Gelado",
    icon: "❄",
    desc: "Seus tiros básicos têm 20% de chance de desacelerar\no inimigo em 40% por 2.5 segundos.",
    category: "basic",
    class: "Atirador",
    color: [130, 220, 255],
  },
];

export function getPerkById(id: string): PerkDef | undefined {
  return perkDefs.find((p) => p.id === id);
}
