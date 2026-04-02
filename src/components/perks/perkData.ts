// ─── Perk Definitions ───────────────────────────────────

export type PerkCategory = "reset" | "stack" | "basic" | "shock" | "general";

export type PerkDef = {
  id: string;
  name: string;
  icon: string;
  desc: string;
  category: PerkCategory;
  color: [number, number, number];
};

export const PERK_COST = 5; // pontos de elevação
export const MAX_PERKS = 5;
export const MIN_LEVEL_FOR_PERKS = 3;

export const perkDefs: PerkDef[] = [
  // ── Reset perks ──
  {
    id: "execucao-limpa",
    name: "Execução Limpa",
    icon: "🔄",
    desc: "Matar inimigo reduz CD de Q em 40%.\nElites/campeões: reset total.",
    category: "reset",
    color: [60, 200, 180],
  },

  // ── General perks ──
  {
    id: "impacto-sismico",
    name: "Impacto Sísmico",
    icon: "💥",
    desc: "Tiros viram choque sísmico circular.\nDano escala com Vida Máxima.\nIntervalo reduz com Vel. Movimento.",
    category: "general",
    color: [180, 120, 60],
  },
  {
    id: "engenharia-runica",
    name: "Engenharia Rúnica",
    icon: "🗼",
    desc: "+1 Totem ativo.\nTotens herdam 30% do Dano de\nTiro e Vel. de Ataque do jogador.",
    category: "general",
    color: [120, 80, 200],
  },
  {
    id: "zona-de-perigo",
    name: "Zona de Perigo",
    icon: "⚠",
    desc: "Para cada inimigo próximo:\n+5% dano causado\n+3% dano recebido.",
    category: "general",
    color: [255, 160, 40],
  },
  {
    id: "reacao-em-cadeia",
    name: "Reação em Cadeia",
    icon: "🔥",
    desc: "Tiros têm 10% de chance de\ncausar explosão em área.\nExplosões em cadeia: -50% dano.",
    category: "general",
    color: [255, 100, 50],
  },

  // ── Ataque básico perks ──
  {
    id: "ligeirinho",
    name: "Ligeirinho",
    icon: "⚡",
    desc: "Tiros acertados: +4% Vel. Mov.\n(até 5x). 10% do bônus acelera\nrecarga. Errar reinicia acúmulos.",
    category: "basic",
    color: [255, 220, 60],
  },

  // ── Shock perk ──
  {
    id: "sobrecarga-eletrica",
    name: "Sobrecarga Elétrica",
    icon: "⚡",
    desc: "Inimigos com Choque recebem\n+X% dano de todas as fontes.\n10 acúmulos: explosão elétrica.",
    category: "shock",
    color: [80, 180, 255],
  },

  // ── General utility perks ──
  {
    id: "ima-magnetico",
    name: "Imã Magnético",
    icon: "🧲",
    desc: "Dobra o raio do imã de ouro.\n+0.3 Sorte permanente.",
    category: "general",
    color: [255, 200, 60],
  },
];

export function getPerkById(id: string): PerkDef | undefined {
  return perkDefs.find((p) => p.id === id);
}
