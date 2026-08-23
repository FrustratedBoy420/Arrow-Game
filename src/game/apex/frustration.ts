// ─── APEX Frustration Calculator ────────────────────────────────────
// EMA-smoothed frustration scoring with streak/completion modifiers.

import { APEX_CONFIG } from './config';
import type { MatchExperienceRecord, PlayerExperienceProfile } from './types';

/**
 * Calculate updated frustration score after a match.
 * Uses Exponential Moving Average so one match can't dominate long-term state.
 */
export function calculateFrustration(
  profile: PlayerExperienceProfile,
  matchRecord: Pick<MatchExperienceRecord, 'matchType' | 'result' | 'completionPercentage' | 'mistakes'>
): number {
  const cfg = APEX_CONFIG;
  let delta = cfg.frustrationDeltas[matchRecord.matchType];

  // Streak modifiers
  if (profile.lossStreak >= 5) {
    delta += cfg.frustrationModifiers.consecutiveLoss5;
  } else if (profile.lossStreak >= 3) {
    delta += cfg.frustrationModifiers.consecutiveLoss3;
  }

  // High completion during loss = near-miss, reduces frustration bump
  if (matchRecord.result === 'LOSS' && matchRecord.completionPercentage >= cfg.nearWinCompletion) {
    delta += cfg.frustrationModifiers.highCompletionLoss;
  }

  // Improvement from previous match
  const lastMatch = profile.lastMatches[profile.lastMatches.length - 1];
  if (lastMatch && matchRecord.completionPercentage > lastMatch.completionPercentage + 5) {
    delta += cfg.frustrationModifiers.improvementFromPrevious;
  }

  // High mistake rate
  if (matchRecord.mistakes >= 5) {
    delta += cfg.frustrationModifiers.highMistakeRate;
  }

  // Time decay — reward players who take a break
  const minutesSinceLastMatch = Math.max(0, (Date.now() - profile.updatedAt) / 60000);
  const decay = Math.min(minutesSinceLastMatch * cfg.frustrationDecayPerMinute, cfg.frustrationDecayCap);

  // EMA smoothing
  const rawNew = profile.frustrationScore - decay + delta;
  const smoothed = cfg.frustrationSmoothing * profile.frustrationScore
    + (1 - cfg.frustrationSmoothing) * rawNew;

  return Math.max(0, Math.min(100, Math.round(smoothed * 10) / 10));
}
