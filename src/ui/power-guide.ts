import { skillById, weaponById } from "../game/model";
import type { WeaponId } from "../game/model";

const GUIDES: Record<string, { where: string; pattern: string }> = {
  venom: { where: "NO INIMIGO MAIS PRÓXIMO", pattern: "field" },
  volley: { where: "NA DIREÇÃO DO ALVO", pattern: "cone" },
  nova: { where: "AO SEU REDOR", pattern: "circle" },
  quake: { where: "AO SEU REDOR", pattern: "circle" },
  vortex: { where: "NO INIMIGO MAIS PRÓXIMO", pattern: "field" },
  storm: { where: "NO INIMIGO MAIS PRÓXIMO", pattern: "field" },
  turret: { where: "NO CHÃO, ONDE VOCÊ ESTÁ", pattern: "deploy" },
  mine: { where: "NO CHÃO, ONDE VOCÊ ESTÁ", pattern: "trap" },
  orbit: { where: "ACOMPANHA VOCÊ", pattern: "orbit" },
  decoy: { where: "DEIXA UMA ISCA NA SUA POSIÇÃO", pattern: "trap" },
};
export function powerInfo(id: string) {
  const weapon = id.startsWith("weapon:");
  const key = id.slice(weapon ? 7 : 6);
  if (weapon) {
    const w = weaponById(key as WeaponId);
    return {
      name: w.name,
      desc: w.desc,
      color: w.color,
      glyph: w.glyph,
      where:
        w.pattern === "circle"
          ? "AO SEU REDOR"
          : w.pattern === "chain"
            ? "SALTA ENTRE INIMIGOS PRÓXIMOS"
            : "NA DIREÇÃO DO ALVO",
      pattern: w.pattern,
      trigger: "AUTOMÁTICO AO PARAR",
      timing: `${w.interval.toFixed(2)}s ENTRE ATAQUES`,
    };
  }
  const s = skillById(key);
  return {
    name: s.name,
    desc: s.desc,
    color: s.color,
    glyph: s.glyph,
    ...GUIDES[key],
    trigger: "APERTE O BOTÃO EQUIPADO · Q / E",
    timing: `${s.cooldown}s DE RECARGA`,
  };
}
/** A green pilot, red enemies and an explicit footprint explain where the effect happens. */
export function powerDiagram(id: string) {
  const info = powerInfo(id),
    pattern = info.pattern;
  const radial = pattern === "circle" || pattern === "orbit";
  const pilot = radial ? 85 : 25;
  let effect = "";
  if (radial) {
    effect =
      '<circle class="guide-area" cx="85" cy="37" r="30"/><path class="guide-wave" d="M52 37a33 33 0 0 1 66 0"/><rect class="guide-foe" x="105" y="25" width="8" height="8"/><rect class="guide-foe" x="60" y="44" width="8" height="8"/><rect class="guide-far" x="153" y="33" width="8" height="8"/>';
    if (pattern === "orbit")
      effect +=
        '<path class="guide-shot" d="m85 7 5 5-5 5-5-5Zm-29 30 5 5-5 5-5-5Zm52 16 5 5-5 5-5-5Z"/>';
  } else if (pattern === "cone") {
    effect =
      '<path class="guide-area" d="m32 37 96-29a100 100 0 0 1 0 58Z"/><path class="guide-shot" d="m38 37 70-19M38 37h75M38 37l70 19"/><rect class="guide-foe" x="105" y="15" width="8" height="8"/><rect class="guide-foe" x="115" y="34" width="8" height="8"/><rect class="guide-foe" x="105" y="54" width="8" height="8"/>';
  } else if (pattern === "chain") {
    effect =
      '<path class="guide-shot" d="m35 37 32-4-5 9 27-7 19-19-2 12 28-2 15 22"/><rect class="guide-foe" x="85" y="32" width="9" height="9"/><rect class="guide-foe" x="130" y="22" width="9" height="9"/><rect class="guide-foe" x="147" y="46" width="9" height="9"/>';
  } else if (pattern === "field") {
    effect =
      '<circle class="guide-area" cx="122" cy="37" r="29"/><path class="guide-aim" d="M38 37h58m-8-5 8 5-8 5"/><rect class="guide-foe" x="118" y="33" width="9" height="9"/><rect class="guide-foe" x="135" y="42" width="8" height="8"/><rect class="guide-foe" x="104" y="20" width="8" height="8"/>';
  } else if (pattern === "deploy" || pattern === "trap") {
    effect =
      '<path class="guide-aim" d="m38 56 27 0m-7-5 7 5-7 5"/><path class="guide-shot" d="m68 28 10-6 10 6v18H68Z"/><circle class="guide-area" cx="78" cy="37" r="25"/><rect class="guide-foe" x="139" y="33" width="9" height="9"/>';
    effect +=
      pattern === "deploy"
        ? '<path class="guide-shot" d="M90 37h43"/>'
        : '<path class="guide-aim" d="M135 37h-30m6-5-6 5 6 5"/>';
  } else {
    effect =
      '<path class="guide-shot" d="M38 37h110m-9-5 9 5-9 5"/><rect class="guide-foe" x="112" y="32" width="10" height="10"/><rect class="guide-far" x="151" y="32" width="10" height="10"/>';
  }
  return `<svg class="power-diagram" viewBox="0 0 180 80" aria-hidden="true" style="color:${info.color}">${effect}<path class="guide-pilot" d="m${pilot} 27 9 5v10l-9 5-9-5V32Z"/><text x="${pilot}" y="73" text-anchor="middle">VOCÊ</text></svg>`;
}
