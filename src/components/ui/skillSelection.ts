import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../../state/gameState";
import { skillsRegistry } from "../skills";
import { skillInfos } from "../../state/skillData";

const SKILL_COST = 3;
const MAX_SKILL_LEVEL = 5;

export type SkillUpgradeOverlayHandles = {
  show: () => void;
  hide: () => void;
  update: () => void;
  isVisible: () => boolean;
};

/**
 * Overlay for leveling up the player's current skill.
 * Appears when the player levels up above 2 AND already has a skill.
 * Costs 3 elevation points per skill level, max level 5.
 */
export function createSkillUpgradeOverlay(
  k: KAPLAYCtx,
): SkillUpgradeOverlayHandles {
  // Track last player level to detect level-ups
  let lastPlayerLevel = gameState.level;
  let pendingLevelUps = 0; // how many level-ups to show

  // All managed objects
  const allObjs: GameObj[] = [];
  const track = <T extends GameObj>(obj: T): T => {
    allObjs.push(obj);
    return obj;
  };

  // ── Dimmed background ──
  const overlayBg = track(
    k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.55),
      k.fixed(),
      k.z(4000),
      { id: "skill-up-overlay-bg" },
    ]),
  );

  // ── Card ──
  const cardW = 380;
  const cardH = 340;
  const cardX = () => Math.floor((k.width() - cardW) / 2);
  const cardY = () => Math.floor((k.height() - cardH) / 2);

  const card = track(
    k.add([
      k.rect(cardW, cardH, { radius: 16 }),
      k.pos(cardX(), cardY()),
      k.color(24, 24, 32),
      k.outline(4, k.rgb(180, 140, 255)),
      k.area(),
      k.fixed(),
      k.z(4001),
      { id: "skill-up-card" },
    ]),
  );

  // ── Glow ring on top ──
  const glowBadge = track(
    k.add([
      k.text("⬆", { size: 48 }),
      k.pos(card.pos.x + cardW / 2, card.pos.y - 10),
      k.anchor("bot"),
      k.color(180, 140, 255),
      k.fixed(),
      k.z(4003),
      { id: "skill-up-glow" },
    ]),
  );

  // ── Title ──
  const titleTxt = track(
    k.add([
      k.text("Level Up!", { size: 28 }),
      k.pos(card.pos.x + cardW / 2, card.pos.y + 20),
      k.anchor("top"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-title" },
    ]),
  );

  // ── Skill name ──
  const skillNameTxt = track(
    k.add([
      k.text("", { size: 22 }),
      k.pos(card.pos.x + cardW / 2, card.pos.y + 60),
      k.anchor("top"),
      k.color(180, 220, 255),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-name" },
    ]),
  );

  // ── Skill level display ──
  const levelTxt = track(
    k.add([
      k.text("Nível 1 → 2", { size: 20 }),
      k.pos(card.pos.x + cardW / 2, card.pos.y + 95),
      k.anchor("top"),
      k.color(180, 140, 255),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-level" },
    ]),
  );

  // ── Description of what changes ──
  const descTxt = track(
    k.add([
      k.text("", { size: 15 }),
      k.pos(card.pos.x + 24, card.pos.y + 135),
      k.color(180, 180, 200),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-desc" },
    ]),
  );

  // ── Cost display ──
  const costTxt = track(
    k.add([
      k.text(`★ ${SKILL_COST} pontos de elevação`, { size: 16 }),
      k.pos(card.pos.x + cardW / 2, card.pos.y + 210),
      k.anchor("top"),
      k.color(180, 140, 255),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-cost" },
    ]),
  );

  // ── Upgrade button ──
  const btnW = cardW - 60;
  const upgradeBtn = track(
    k.add([
      k.rect(btnW, 48, { radius: 10 }),
      k.pos(card.pos.x + 30, card.pos.y + cardH - 110),
      k.color(40, 160, 80),
      k.outline(3, k.rgb(100, 255, 140)),
      k.area(),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-btn" },
    ]),
  );
  const upgradeBtnTxt = track(
    k.add([
      k.text("Aprimorar Habilidade", { size: 18 }),
      k.pos(upgradeBtn.pos.x + btnW / 2, upgradeBtn.pos.y + 13),
      k.anchor("top"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(4003),
      { id: "skill-up-btn-txt" },
    ]),
  );

  // ── Skip button ──
  const skipBtn = track(
    k.add([
      k.rect(btnW, 40, { radius: 8 }),
      k.pos(card.pos.x + 30, card.pos.y + cardH - 55),
      k.color(60, 60, 70),
      k.outline(2, k.rgb(120, 120, 140)),
      k.area(),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-skip" },
    ]),
  );
  const skipBtnTxt = track(
    k.add([
      k.text("Pular", { size: 16 }),
      k.pos(skipBtn.pos.x + btnW / 2, skipBtn.pos.y + 10),
      k.anchor("top"),
      k.color(180, 180, 180),
      k.fixed(),
      k.z(4003),
      { id: "skill-up-skip-txt" },
    ]),
  );

  // ─── Visibility ──────────────────────────────
  const setVisible = (visible: boolean) => {
    for (const obj of allObjs) obj.hidden = !visible;
  };
  setVisible(false);

  // ─── Reposition ──────────────────────────────
  const reposition = () => {
    const cx = cardX();
    const cy = cardY();
    card.pos = k.vec2(cx, cy);
    overlayBg.pos = k.vec2(0, 0);
    (overlayBg as any).width = k.width();
    (overlayBg as any).height = k.height();
    glowBadge.pos = k.vec2(cx + cardW / 2, cy - 10);
    titleTxt.pos = k.vec2(cx + cardW / 2, cy + 20);
    skillNameTxt.pos = k.vec2(cx + cardW / 2, cy + 60);
    levelTxt.pos = k.vec2(cx + cardW / 2, cy + 95);
    descTxt.pos = k.vec2(cx + 24, cy + 135);
    costTxt.pos = k.vec2(cx + cardW / 2, cy + 210);
    upgradeBtn.pos = k.vec2(cx + 30, cy + cardH - 110);
    upgradeBtnTxt.pos = k.vec2(
      upgradeBtn.pos.x + btnW / 2,
      upgradeBtn.pos.y + 13,
    );
    skipBtn.pos = k.vec2(cx + 30, cy + cardH - 55);
    skipBtnTxt.pos = k.vec2(skipBtn.pos.x + btnW / 2, skipBtn.pos.y + 10);
  };
  k.onResize(reposition);

  // ─── Refresh card content ────────────────────
  function refreshContent() {
    const skillId = gameState.skills.skill1;
    if (!skillId) return;

    const info = skillInfos.find((s) => s.id === skillId);
    const lv = gameState.skills.levels[skillId] ?? 1;
    const canUp =
      lv < MAX_SKILL_LEVEL && gameState.elevationPoints >= SKILL_COST;

    (skillNameTxt as any).text = info?.name ?? skillId;
    (levelTxt as any).text =
      lv >= MAX_SKILL_LEVEL ? `Nível ${lv} (MÁX)` : `Nível ${lv} → ${lv + 1}`;

    // Build a short per-skill description of level-up benefits
    let descLines = "";
    if (info) {
      descLines = `${info.damage}`;
    }
    if (lv >= MAX_SKILL_LEVEL) {
      descLines += "\n\nHabilidade no nível máximo!";
    }
    (descTxt as any).text = wrapText(descLines, 38);

    (costTxt as any).text = canUp
      ? `★ ${SKILL_COST} pontos de elevação`
      : lv >= MAX_SKILL_LEVEL
        ? "Nível máximo atingido"
        : `★ Insuficiente (${gameState.elevationPoints}/${SKILL_COST})`;

    // Button state
    if (canUp) {
      (upgradeBtn as any).color = k.rgb(40, 160, 80);
      upgradeBtn.outline.color = k.rgb(100, 255, 140);
      (upgradeBtnTxt as any).color = k.rgb(255, 255, 255);
    } else {
      (upgradeBtn as any).color = k.rgb(50, 50, 55);
      upgradeBtn.outline.color = k.rgb(80, 80, 80);
      (upgradeBtnTxt as any).color = k.rgb(100, 100, 100);
    }
  }

  // ─── Actions ─────────────────────────────────
  upgradeBtn.onClick(() => {
    const skillId = gameState.skills.skill1;
    if (!skillId) return;
    const lv = gameState.skills.levels[skillId] ?? 1;
    if (lv >= MAX_SKILL_LEVEL) return;
    if (gameState.elevationPoints < SKILL_COST) return;

    gameState.elevationPoints -= SKILL_COST;
    gameState.skills.levels[skillId] = lv + 1;

    // Flash effect
    card.outline.color = k.rgb(100, 255, 140);
    const flashTimer = { t: 0 };
    const cancel = k.onUpdate(() => {
      flashTimer.t += k.dt();
      if (flashTimer.t >= 0.3) {
        card.outline.color = k.rgb(180, 140, 255);
        cancel.cancel();
      }
    });

    pendingLevelUps = Math.max(0, pendingLevelUps - 1);
    if (pendingLevelUps > 0) {
      // Show next level-up
      refreshContent();
    } else {
      hide();
    }
  });

  skipBtn.onClick(() => {
    pendingLevelUps = Math.max(0, pendingLevelUps - 1);
    if (pendingLevelUps > 0) {
      refreshContent();
    } else {
      hide();
    }
  });

  // ─── Public API ──────────────────────────────
  const show = () => {
    if (!gameState.skills.skill1) return;
    setVisible(true);
    reposition();
    refreshContent();
    // Pause gameplay while overlay is open
    (k as any).setTimeScale?.(0);
  };

  const hide = () => {
    setVisible(false);
    pendingLevelUps = 0;
    // Resume gameplay
    (k as any).setTimeScale?.(1);
  };

  const isVisible = () => !overlayBg.hidden;

  const update = () => {
    // Detect player level-ups
    if (gameState.level > lastPlayerLevel) {
      const gained = gameState.level - lastPlayerLevel;
      lastPlayerLevel = gameState.level;

      // Only show skill upgrade if player already has a skill and level > 2
      if (gameState.skills.skill1 && gameState.level > 2) {
        const skillId = gameState.skills.skill1;
        const lv = gameState.skills.levels[skillId] ?? 1;
        if (lv < MAX_SKILL_LEVEL) {
          pendingLevelUps += gained;
          if (!isVisible()) {
            show();
          }
        }
      }
    }
  };

  return { show, hide, update, isVisible };
}

// ─── Simple text wrap helper ───────────────────────
function wrapText(text: string, maxCharsPerLine: number): string {
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
