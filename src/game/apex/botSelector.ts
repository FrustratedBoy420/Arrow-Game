// ─── APEX Bot Selector ──────────────────────────────────────────────
// Selects a bot whose skill produces the desired win probability.

import { APEX_CONFIG } from './config';
import type { BotProfile, BotTierName, PlayerExperienceProfile } from './types';
import { getRandomBotName } from '../botNames';

/**
 * Select a bot calibrated to the player's current state.
 * The bot is chosen BEFORE the match — during the match, it plays genuinely.
 */
export function selectBotForPlayer(profile: PlayerExperienceProfile): BotProfile {
  const cfg = APEX_CONFIG;
  const state = profile.experienceState;

  // Step 1: Target win probability for current state
  const target = cfg.targetWinProbability[state];
  const targetWinProb = (target.min + target.max) / 2;

  // Step 2: Calculate bot skill that produces this win probability
  // From Elo: P = 1/(1+10^((bot-player)/scale))
  // Solving for bot: bot = player + scale × log10(1/P - 1)
  const rawBotSkill = profile.skillRating
    + cfg.skillEloScale * Math.log10((1 / targetWinProb) - 1);

  // Step 3: Clamp to prevent sudden jumps
  const lastMatch = profile.lastMatches.length > 0 ? profile.lastMatches[profile.lastMatches.length - 1] : undefined;
  const lastBotSkill = lastMatch ? lastMatch.botSkill : profile.skillRating;
  const clamped = Math.max(
    lastBotSkill - cfg.maxBotSkillStep,
    Math.min(lastBotSkill + cfg.maxBotSkillStep, rawBotSkill)
  );

  const finalSkill = Math.max(30, Math.min(95, Math.round(clamped)));

  // Step 4: Find matching tier name
  const tier = cfg.botTiers.reduce((best, t) =>
    Math.abs(t.skill - finalSkill) < Math.abs(best.skill - finalSkill) ? t : best
  );

  // Step 5: Variance — weaker bots are more inconsistent (human-like)
  const variance = 0.05 + (100 - finalSkill) / 500;

  return {
    name: getRandomBotName() || 'RivalTactician',
    skill: finalSkill,
    tier: tier.tier as BotTierName,
    variance: Math.round(variance * 100) / 100,
  };
}
