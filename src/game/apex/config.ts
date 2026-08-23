// ─── APEX Configuration ─────────────────────────────────────────────
// Every tunable threshold in one place. No magic numbers elsewhere.

import type { ExperienceState, MatchType } from './types';

export const APEX_CONFIG = {
  // ── Frustration → ExperienceState thresholds ──
  frustrationThresholds: {
    comfortable: 20,   // 0-20
    engaged: 45,       // 20-45
    tense: 65,         // 45-65
    frustrated: 80,    // 65-80
    // 80-100 = RECOVERY
  } as const,

  // ── Match classification gaps (seconds) ──
  dominantWinGap: 8,
  closeGapSeconds: 3,
  crushingLossGap: 15,
  nearWinCompletion: 90,
  crushingLossCompletion: 50,

  // ── Frustration deltas per match type ──
  frustrationDeltas: {
    CLOSE_WIN:     -8,
    DOMINANT_WIN:  -12,
    COMEBACK_WIN:  -20,
    CLOSE_LOSS:     4,
    NORMAL_LOSS:   10,
    CRUSHING_LOSS: 18,
  } as Record<MatchType, number>,

  // ── Frustration modifiers ──
  frustrationModifiers: {
    consecutiveLoss3: 5,
    consecutiveLoss5: 8,
    highCompletionLoss: -2,
    improvementFromPrevious: -3,
    highMistakeRate: 3,
  },

  // ── Frustration smoothing ──
  frustrationSmoothing: 0.7,      // EMA weight for old value
  frustrationDecayPerMinute: 0.5, // natural decay between sessions
  frustrationDecayCap: 15,        // max decay in one load

  // ── Confidence deltas ──
  confidenceDeltas: {
    WIN: 10,
    CLOSE_LOSS: 2,       // near-misses BOOST confidence
    NORMAL_LOSS: -5,
    CRUSHING_LOSS: -12,
  },

  // ── Skill ──
  skillKFactor: 16,               // Elo K-factor
  skillEloScale: 40,              // scaling divisor (standard Elo uses 400, we use 0-100 scale)
  initialSkillRating: 50,
  skillMin: 10,
  skillMax: 95,

  // ── Bot tiers ──
  botTiers: [
    { tier: 'Rookie'       as const, skill: 40 },
    { tier: 'Beginner'     as const, skill: 50 },
    { tier: 'Competitive'  as const, skill: 60 },
    { tier: 'Advanced'     as const, skill: 70 },
    { tier: 'Expert'       as const, skill: 80 },
    { tier: 'Master'       as const, skill: 90 },
  ],

  // ── Target win probability by experience state ──
  targetWinProbability: {
    COMFORTABLE: { min: 0.45, max: 0.55 },
    ENGAGED:     { min: 0.45, max: 0.55 },
    TENSE:       { min: 0.50, max: 0.60 },
    FRUSTRATED:  { min: 0.55, max: 0.65 },
    RECOVERY:    { min: 0.60, max: 0.70 },
  } as Record<ExperienceState, { min: number; max: number }>,

  // ── History ──
  historySize: 15,

  // ── Puzzle difficulty adjustment by state ──
  puzzleDifficultyAdjust: {
    COMFORTABLE:  0,
    ENGAGED:      0,
    TENSE:        5,    // slightly harder — player is still engaged
    FRUSTRATED:  -8,
    RECOVERY:   -12,
  } as Record<ExperienceState, number>,

  puzzleDifficultyRange: 15,      // ±15 points from target

  // ── Bot skill step limit ──
  maxBotSkillStep: 5,             // max change per match (prevents sudden jumps)

  // ── Bot behavior ──
  botBaseMissRate: 0.03,          // Master-level base miss
  botMissSkillFactor: 0.0025,     // per skill point below 100
  botHesitationChance: 0.18,      // chance of human-like pause
} as const;

// ── Default fresh profile ──
export function createDefaultProfile(): import('./types').PlayerExperienceProfile {
  return {
    skillRating: APEX_CONFIG.initialSkillRating,
    skillConfidence: 20,
    frustrationScore: 10,
    confidenceScore: 50,
    tiltScore: 5,
    totalMatches: 0,
    totalWins: 0,
    totalLosses: 0,
    winStreak: 0,
    lossStreak: 0,
    averageSolveTime: 0,
    averageMistakes: 0,
    averageCompletion: 0,
    averageTimeGap: 0,
    nearWins: 0,
    closeLosses: 0,
    crushingLosses: 0,
    experienceState: 'COMFORTABLE',
    lastMatches: [],
    updatedAt: Date.now(),
  };
}
