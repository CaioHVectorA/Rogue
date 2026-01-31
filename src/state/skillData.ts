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
    name: "Shockwave",
    desc: "Onda que empurra inimigos ao ficar parado e disparar.",
    cooldownMs: 3000,
    damage: "Empurra e causa dano moderado em área",
  },
  {
    id: "ricochet-shot",
    name: "Ricochet",
    desc: "Projétil quica e busca novos alvos próximos.",
    cooldownMs: 2500,
    damage: "Dano do projétil base por quique",
  },
  {
    id: "cone-shot",
    name: "Cone Shot",
    desc: "Vários projéteis em cone seguindo a mira.",
    cooldownMs: 2800,
    damage: "Dano por projétil; múltiplos acertos possíveis",
  },
  {
    id: "chain-lightning",
    name: "Chain Lightning",
    desc: "Raio elétrico salta entre inimigos próximos.",
    cooldownMs: 3200,
    damage: "Dano por salto; reduz ligeiramente a cada salto",
  },
  {
    id: "arc-mine",
    name: "Arc Mine",
    desc: "Minas que explodem ao aproximar inimigos.",
    cooldownMs: 3500,
    damage: "Alto dano em área na explosão",
  },
  {
    id: "poison-pool",
    name: "Poison Pool",
    desc: "Poças estáticas aplicam veneno por tempo.",
    cooldownMs: 3000,
    damage: "Dano por segundo enquanto em cima da poça",
  },
  {
    id: "boomerang-bolt",
    name: "Boomerang Bolt",
    desc: "Projétil vai e retorna, causando dano duplo.",
    cooldownMs: 2600,
    damage: "Dano na ida e na volta; pode acertar duas vezes",
  },
  {
    id: "summoned-totem",
    name: "Summoned Totem",
    desc: "Totem atira automaticamente em inimigos.",
    cooldownMs: 4000,
    damage: "DPS contínuo baseado na cadência do totem",
  },
  {
    id: "marked-shot",
    name: "Marked Shot",
    desc: "Acertos marcam inimigos; levam dano extra.",
    cooldownMs: 2400,
    damage: "Dano base + bônus em alvos marcados",
  },
  {
    id: "orbital-orbs",
    name: "Orbital Orbs",
    desc: "Orbes orbitam e colidem; ativação acelera.",
    cooldownMs: 3000,
    damage: "Dano por orb; múltiplos contatos ao orbitar",
  },
  {
    id: "attack-buff",
    name: "Buff de Ataque",
    desc: "Buff temporário no ataque básico.",
    cooldownMs: 3500,
    damage: "Aumenta o dano do ataque básico por duração",
  },
];
