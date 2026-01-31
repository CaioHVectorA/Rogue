import type { KAPLAYCtx } from "kaplay";

export function centerCardsLayout(k: KAPLAYCtx, cardW: number, cardH: number, gap: number) {
  const totalW = cardW * 3 + gap * 2;
  const startX = Math.floor((k.width() - totalW) / 2);
  const y = Math.floor((k.height() - cardH) / 2);
  return [
    k.vec2(startX, y),
    k.vec2(startX + cardW + gap, y),
    k.vec2(startX + (cardW + gap) * 2, y),
  ];
}

export function wrapText(text: string, maxCharsPerLine: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? line + " " + w : w;
    if (next.length > maxCharsPerLine) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}
