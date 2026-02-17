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
 * Skill upgrade system:
 * - A small badge appears on top of the Q skill icon when upgrades are available
 * - Clicking the badge opens the upgrade panel (pauses game)
 * - Panel has Upgrade + Skip buttons
 */
export function createSkillUpgradeOverlay(
  k: KAPLAYCtx,
): SkillUpgradeOverlayHandles {
  // Track last player level to detect level-ups
  let lastPlayerLevel = gameState.level;
  let pendingLevelUps = 0;

  // ═══════════════════════════════════════════════
  // BADGE — small indicator on top of Q skill icon
  // ═══════════════════════════════════════════════
  const skillSize = 64;
  const badgeSize = 44;

  const getBadgePos = () => {
    const skillX = k.width() - skillSize - 20;
    const skillY = k.height() - skillSize - 20;
    return {
      x: skillX + skillSize / 2 - badgeSize / 2,
      y: skillY - badgeSize - 6,
    };
  };

  const bp = getBadgePos();

  const badge = k.add([
    k.rect(badgeSize, badgeSize, { radius: 12 }),
    k.pos(bp.x, bp.y),
    k.color(120, 60, 220),
    k.outline(3, k.rgb(255, 220, 100)),
    k.area(),
    k.scale(1),
    k.fixed(),
    k.z(1300),
    { id: "skill-up-badge" },
  ]);

  const badgeText = k.add([
    k.text("UP!", { size: 18 }),
    k.pos(bp.x + badgeSize / 2, bp.y + badgeSize / 2),
    k.anchor("center"),
    k.color(255, 220, 100),
    k.scale(1),
    k.fixed(),
    k.z(1301),
    { id: "skill-up-badge-txt" },
  ]);

  badge.hidden = true;
  badgeText.hidden = true;

  // Pulse animation for badge
  let badgePulseT = 0;

  const positionBadge = () => {
    const p = getBadgePos();
    badge.pos = k.vec2(p.x, p.y);
    badgeText.pos = k.vec2(p.x + badgeSize / 2, p.y + badgeSize / 2);
  };
  k.onResize(positionBadge);

  // Badge click → open panel
  badge.onClick(() => {
    if (badge.hidden) return; // guard: badge not visible
    if (pendingLevelUps > 0) {
      showPanel();
    }
  });

  // ═══════════════════════════════════════════════
  // PANEL — fullscreen overlay (only when user clicks badge)
  // ═══════════════════════════════════════════════
  const panelObjs: GameObj[] = [];
  const trackP = <T extends GameObj>(obj: T): T => {
    panelObjs.push(obj);
    return obj;
  };

  const overlayBg = trackP(
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

  const cardW = 380;
  const cardH = 340;
  const cardX = () => Math.floor((k.width() - cardW) / 2);
  const cardY = () => Math.floor((k.height() - cardH) / 2);

  const card = trackP(
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

  const glowBadgeIcon = trackP(
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

  const titleTxt = trackP(
    k.add([
      k.text("Aprimorar Habilidade", { size: 24 }),
      k.pos(card.pos.x + cardW / 2, card.pos.y + 20),
      k.anchor("top"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-title" },
    ]),
  );

  const skillNameTxt = trackP(
    k.add([
      k.text("", { size: 22 }),
      k.pos(card.pos.x + cardW / 2, card.pos.y + 55),
      k.anchor("top"),
      k.color(180, 220, 255),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-name" },
    ]),
  );

  const levelTxt = trackP(
    k.add([
      k.text("Nível 1 → 2", { size: 20 }),
      k.pos(card.pos.x + cardW / 2, card.pos.y + 85),
      k.anchor("top"),
      k.color(180, 140, 255),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-level" },
    ]),
  );

  const descTxt = trackP(
    k.add([
      k.text("", { size: 15 }),
      k.pos(card.pos.x + 24, card.pos.y + 120),
      k.color(180, 180, 200),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-desc" },
    ]),
  );

  const costTxt = trackP(
    k.add([
      k.text(`★ ${SKILL_COST} pontos de elevação`, { size: 16 }),
      k.pos(card.pos.x + cardW / 2, card.pos.y + 200),
      k.anchor("top"),
      k.color(180, 140, 255),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-cost" },
    ]),
  );

  const pendingTxt = trackP(
    k.add([
      k.text("", { size: 14 }),
      k.pos(card.pos.x + cardW / 2, card.pos.y + 225),
      k.anchor("top"),
      k.color(140, 140, 160),
      k.fixed(),
      k.z(4002),
      { id: "skill-up-pending" },
    ]),
  );

  const btnW = cardW - 60;
  const upgradeBtn = trackP(
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
  const upgradeBtnTxt = trackP(
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

  const skipBtn = trackP(
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
  const skipBtnTxt = trackP(
    k.add([
      k.text("Fechar", { size: 16 }),
      k.pos(skipBtn.pos.x + btnW / 2, skipBtn.pos.y + 10),
      k.anchor("top"),
      k.color(180, 180, 180),
      k.fixed(),
      k.z(4003),
      { id: "skill-up-skip-txt" },
    ]),
  );

  // ─── Panel visibility ──────────────────────────
  let panelOpen = false;

  const setPanelVisible = (visible: boolean) => {
    panelOpen = visible;
    for (const obj of panelObjs) obj.hidden = !visible;
  };
  setPanelVisible(false);

  // ─── Panel reposition ──────────────────────────
  const repositionPanel = () => {
    const cx = cardX();
    const cy = cardY();
    card.pos = k.vec2(cx, cy);
    overlayBg.pos = k.vec2(0, 0);
    (overlayBg as any).width = k.width();
    (overlayBg as any).height = k.height();
    glowBadgeIcon.pos = k.vec2(cx + cardW / 2, cy - 10);
    titleTxt.pos = k.vec2(cx + cardW / 2, cy + 20);
    skillNameTxt.pos = k.vec2(cx + cardW / 2, cy + 55);
    levelTxt.pos = k.vec2(cx + cardW / 2, cy + 85);
    descTxt.pos = k.vec2(cx + 24, cy + 120);
    costTxt.pos = k.vec2(cx + cardW / 2, cy + 200);
    pendingTxt.pos = k.vec2(cx + cardW / 2, cy + 225);
    upgradeBtn.pos = k.vec2(cx + 30, cy + cardH - 110);
    upgradeBtnTxt.pos = k.vec2(
      upgradeBtn.pos.x + btnW / 2,
      upgradeBtn.pos.y + 13,
    );
    skipBtn.pos = k.vec2(cx + 30, cy + cardH - 55);
    skipBtnTxt.pos = k.vec2(skipBtn.pos.x + btnW / 2, skipBtn.pos.y + 10);
  };
  k.onResize(repositionPanel);

  // ─── Refresh panel content ─────────────────────
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

    (pendingTxt as any).text =
      pendingLevelUps > 1 ? `${pendingLevelUps} aprimoramentos pendentes` : "";

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

  // ─── Button actions ────────────────────────────
  upgradeBtn.onClick(() => {
    if (!panelOpen) return; // guard: panel not visible
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
      refreshContent();
    } else {
      hidePanel();
    }
  });

  skipBtn.onClick(() => {
    if (!panelOpen) return; // guard: panel not visible
    hidePanel();
  });

  // ─── Show / Hide panel ─────────────────────────
  function showPanel() {
    if (!gameState.skills.skill1) return;
    if (pendingLevelUps <= 0) return;
    setPanelVisible(true);
    repositionPanel();
    refreshContent();
    (k as any).setTimeScale?.(0);
  }

  function hidePanel() {
    setPanelVisible(false);
    (k as any).setTimeScale?.(1);
  }

  // ─── Update badge visibility ───────────────────
  function updateBadge() {
    const hasPending = pendingLevelUps > 0 && !!gameState.skills.skill1;
    badge.hidden = !hasPending;
    badgeText.hidden = !hasPending;

    if (hasPending) {
      (badgeText as any).text =
        pendingLevelUps > 1 ? `UP!×${pendingLevelUps}` : "UP!";
      positionBadge();

      // Strong pulse animation with bounce
      badgePulseT += k.dt() * 4;
      const scale = 1.0 + Math.sin(badgePulseT) * 0.18;
      badge.scale = k.vec2(scale, scale);
      badgeText.scale = k.vec2(scale, scale);

      // Color pulse: alternate between gold and bright green
      const t = (Math.sin(badgePulseT * 0.7) + 1) / 2;
      badge.color = k.rgb(
        Math.floor(40 + t * 80),
        Math.floor(160 + t * 60),
        Math.floor(80 - t * 40),
      );
      badge.outline.color = k.rgb(
        Math.floor(255 - t * 55),
        Math.floor(220 + t * 35),
        Math.floor(100 - t * 50),
      );
    }
  }

  // ─── Public API ──────────────────────────────
  const show = () => showPanel();
  const hide = () => hidePanel();
  const isVisible = () => panelOpen;

  const update = () => {
    // Detect player level-ups
    if (gameState.level > lastPlayerLevel) {
      const gained = gameState.level - lastPlayerLevel;
      lastPlayerLevel = gameState.level;

      // Only accumulate if player already has a skill and level > 2
      // and the skill is NOT already at max level
      if (gameState.skills.skill1 && gameState.level > 2) {
        const skillId = gameState.skills.skill1;
        const lv = gameState.skills.levels[skillId] ?? 1;
        if (lv < MAX_SKILL_LEVEL) {
          pendingLevelUps += gained;
        }
      }
    }

    // Clamp pendingLevelUps to 0 if skill is already at max
    if (gameState.skills.skill1) {
      const skillId = gameState.skills.skill1;
      const lv = gameState.skills.levels[skillId] ?? 1;
      if (lv >= MAX_SKILL_LEVEL) {
        pendingLevelUps = 0;
      }
    }

    // Update badge (always, even during gameplay)
    if (!panelOpen) {
      updateBadge();
    } else {
      badge.hidden = true;
      badgeText.hidden = true;
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
