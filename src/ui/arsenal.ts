import type { ClassId } from "../game/model";
import { CLASSES, SKILLS, WEAPONS } from "../game/model";
import { icon } from "./icons";

const SKILL_HINTS: Record<string, string> = {
  volley: "Abra uma passagem com sete tiros",
  nova: "Afaste a horda e apague tiros",
  quake: "Esmague de perto para se curar",
  vortex: "Agrupe a horda antes de detonar",
  storm: "Bloqueie uma passagem com raios",
  turret: "Plante cobertura; mova-se livremente",
  mine: "Deixe o presente e atraia a horda",
  orbit: "Entre na horda; lâminas apagam tiros",
  decoy: "Sua cópia atrai a horda e explode",
};

export const ITEM_VISUALS: Record<
  string,
  { glyph: string; value: string; stat: string; hint: string }
> = {
  anchor: {
    glyph: "target",
    value: "⚓",
    stat: "ARPÃO",
    hint: "Parado: carregue tiros perfurantes",
  },
  dashload: {
    glyph: "dash",
    value: "↶",
    stat: "CONTRAFOGO",
    hint: "Esquiva dispara para trás",
  },
  pierce: {
    glyph: "pierce",
    value: "→",
    stat: "PERFURAR",
    hint: "Alinhe a horda",
  },
  double: {
    glyph: "double",
    value: "×2",
    stat: "LEQUE",
    hint: "Dois tiros; aproxime para concentrar",
  },
  echo: {
    glyph: "repeat",
    value: "Q⇄E",
    stat: "ECO",
    hint: "Uma habilidade adianta a outra",
  },
  battery: {
    glyph: "charge",
    value: "↻",
    stat: "BATERIA",
    hint: "Abates alimentam as recargas",
  },
  poison: {
    glyph: "toxin",
    value: "❄",
    stat: "TOXINA",
    hint: "Envenene e freie a linha de frente",
  },
  explosion: {
    glyph: "explosion",
    value: "∞",
    stat: "CADEIA",
    hint: "Abates explodem e espalham toxina",
  },
  health: {
    glyph: "heart",
    value: "♥",
    stat: "CORAÇÃO",
    hint: "Mais fôlego para entrar na horda",
  },
  armor: {
    glyph: "shield",
    value: "◇",
    stat: "CASULO",
    hint: "Bloqueie um impacto e afaste a horda",
  },
  vampire: {
    glyph: "vampire",
    value: "♥",
    stat: "FOME",
    hint: "Abates próximos recuperam vida",
  },
  speed: {
    glyph: "dash",
    value: "✦",
    stat: "RASTRO",
    hint: "Esquiva deixa uma mina",
  },
  ricochet: {
    glyph: "repeat",
    value: "↗",
    stat: "RICOCHETE",
    hint: "Tiros saltam entre alvos",
  },
  crossfire: {
    glyph: "target",
    value: "✛",
    stat: "CROSSFIRE",
    hint: "Dispare em quatro direções",
  },
  thorns: {
    glyph: "explosion",
    value: "↯",
    stat: "RETALIAR",
    hint: "Receber dano abre uma passagem",
  },
  gambit: {
    glyph: "coin",
    value: "♦",
    stat: "APOSTAR",
    hint: "Combo dá mais ouro; dano zera tudo",
  },
  ...Object.fromEntries(
    WEAPONS.map((w) => [
      `weapon:${w.id}`,
      { glyph: w.glyph, value: "AUTO", stat: w.tag, hint: w.hint },
    ]),
  ),
  ...Object.fromEntries(
    SKILLS.map((s) => [
      `skill:${s.id}`,
      {
        glyph: s.glyph,
        value: `${s.cooldown}s`,
        stat: "HABILIDADE",
        hint: SKILL_HINTS[s.id],
      },
    ]),
  ),
};

/** Local SVG equipment portraits, no image/font requests or generated-image dependency. */
export function pilotPortrait(id: ClassId) {
  const color = CLASSES[id].color;
  const weapon =
    id === "ranger"
      ? '<path d="m134 81 9 8-14 21-15-8 7-19Z"/><path d="m136 79 11-16 7 5-11 18Z"/>'
      : id === "arcanist"
        ? '<path d="m132 113 6-57h5l-4 57Z"/><path d="m141 28 13 17-14 17-13-17Z"/><circle cx="141" cy="45" r="6"/>'
        : '<path d="m120 76 30-5 7 34-24 20-15-22Z"/><path d="m137 83 9 17-9 11-9-10Z"/>';
  return `<svg class="pilot-portrait" viewBox="0 0 180 180" fill="none" aria-hidden="true" style="--pilot-color:${color}"><ellipse cx="90" cy="159" rx="51" ry="10" fill="${color}" opacity=".12"/><g stroke="${color}" stroke-width="1" opacity=".22"><path d="M23 59 90 20l67 39v77l-67 38-67-38Z"/><path d="M12 100h156M90 12v155"/></g><g stroke="${color}" stroke-width="2.5" fill="#18243a" stroke-linejoin="bevel"><path d="m69 48 21-11 21 11-3 27-18 10-18-10Z"/><path d="m75 53 15 6 15-6-2 10-13 7-13-7Z" fill="${color}"/><path d="m62 79 28-7 28 7 5 42-33 14-32-14Z"/><path d="m90 88 15 14-15 18-15-18Z" fill="${color}"/><path d="m60 78-18 8-5 29 16 7 15-31Zm60 0 17 8 6 29-16 7-15-31Z"/><path d="m64 125 23 5-4 26-22-1Zm29 5 23-5 4 30-23 1Z"/><path d="m61 153-9 11h31v-11Zm36 0v11h31l-9-11Z"/>${weapon}</g><path d="m83 57 7 3 7-3" stroke="#fff" stroke-width="3"/><g fill="${color}"><circle cx="43" cy="47" r="2"/><circle cx="126" cy="143" r="2"/><path d="m26 128 3 3-3 3-3-3Z"/></g></svg>`;
}

export const statChip = (glyph: string, value: string, label: string) =>
  `<span class="stat-chip" title="${label}">${icon(glyph)}<b>${value}</b><small>${label}</small></span>`;
