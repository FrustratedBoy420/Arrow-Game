// ─── APEX Skill Rating ──────────────────────────────────────────────
// Simplified Elo-like rating. Independent from emotional state.

import { APEX_CONFIG } from './config';

/**
 * Update player skill rating based on match outcome vs bot skill.
 * Uses standard Elo formula scaled to 0-100 range.
 */
export function updateSkill(
  currentSkill: number,
  botSkill: number,
  playerWon: boolean
): number {
  const cfg = APEX_CONFIG;

  // Expected win probability: P = 1 / (1 + 10^((botSkill - playerSkill) / scale))
  const expected = 1 / (1 + Math.pow(10, (botSkill - currentSkill) / cfg.skillEloScale));
  const actual = playerWon ? 1 : 0;

  const newRating = currentSkill + cfg.skillKFactor * (actual - expected);

  return Math.max(cfg.skillMin, Math.min(cfg.skillMax, Math.round(newRating * 10) / 10));
}

/**
 * Calculate expected win probability for a given skill difference.
 * Exported for bot selection calculations.
 */
export function expectedWinProbability(playerSkill: number, botSkill: number): number {
  return 1 / (1 + Math.pow(10, (botSkill - playerSkill) / APEX_CONFIG.skillEloScale));
}
