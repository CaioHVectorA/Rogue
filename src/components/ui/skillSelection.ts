import type { KAPLAYCtx, GameObj } from "kaplay";
import { gameState } from "../../state/gameState";

export type SkillUpgradeOverlayHandles = {
  show: () => void;
  hide: () => void;
  update: () => void;
  isVisible: () => boolean;
};

/**
 * Skill upgrade is now handled directly in the shop panel.
 * This module is kept as a no-op stub for compatibility.
 */
export function createSkillUpgradeOverlay(
  k: KAPLAYCtx,
): SkillUpgradeOverlayHandles {
  return {
    show: () => {},
    hide: () => {},
    update: () => {},
    isVisible: () => false,
  };
}
