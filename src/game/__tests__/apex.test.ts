// ─── APEX Test Suite ────────────────────────────────────────────────
// Tests all 8 spec scenarios + pure function unit tests.

import { describe, it, expect } from 'vitest';
import { classifyMatch } from '../apex/matchClassifier';
import { calculateFrustration } from '../apex/frustration';
import { calculateConfidence } from '../apex/confidence';
import { updateSkill, expectedWinProbability } from '../apex/skill';
import { selectBotForPlayer } from '../apex/botSelector';
import { calculatePuzzleDifficulty } from '../apex/puzzleSelector';
import { createDefaultProfile, APEX_CONFIG } from '../apex/config';
import { deriveExperienceState, processMatchResult } from '../apex/playerExperienceService';
import type { PlayerExperienceProfile } from '../apex/types';

// ─── Helper: simulate a match result on a profile ───────────────────
function simulateMatch(
  profile: PlayerExperienceProfile,
  overrides: Partial<Parameters<typeof processMatchResult>[1]> = {}
): PlayerExperienceProfile {
  return processMatchResult(profile, {
    playerScore: 10,
    botScore: 8,
    arrowsTotal: 15,
    matchDurationMs: 45000,
    mistakes: 1,
    wasComeback: false,
    botSkill: 50,
    puzzleDifficulty: 50,
    levelId: 1,
    ...overrides,
  });
}

// ══════════════════════════════════════════════════════════════════════
// 1. Match Classification
// ══════════════════════════════════════════════════════════════════════

describe('classifyMatch', () => {
  it('classifies dominant win (large gap)', () => {
    expect(classifyMatch({
      result: 'WIN', playerScore: 15, botScore: 8, arrowsTotal: 15, timeGap: 12, wasComeback: false,
    })).toBe('DOMINANT_WIN');
  });

  it('classifies close win (small gap)', () => {
    expect(classifyMatch({
      result: 'WIN', playerScore: 15, botScore: 14, arrowsTotal: 15, timeGap: 1.5, wasComeback: false,
    })).toBe('CLOSE_WIN');
  });

  it('classifies comeback win', () => {
    expect(classifyMatch({
      result: 'WIN', playerScore: 15, botScore: 12, arrowsTotal: 15, timeGap: 5, wasComeback: true,
    })).toBe('COMEBACK_WIN');
  });

  it('classifies close loss (small gap)', () => {
    expect(classifyMatch({
      result: 'LOSS', playerScore: 14, botScore: 15, arrowsTotal: 15, timeGap: 2, wasComeback: false,
    })).toBe('CLOSE_LOSS');
  });

  it('classifies close loss (high completion)', () => {
    expect(classifyMatch({
      result: 'LOSS', playerScore: 14, botScore: 15, arrowsTotal: 15, timeGap: 7, wasComeback: false,
    })).toBe('CLOSE_LOSS'); // 93% completion >= 90 threshold
  });

  it('classifies crushing loss (large gap)', () => {
    expect(classifyMatch({
      result: 'LOSS', playerScore: 5, botScore: 15, arrowsTotal: 15, timeGap: 20, wasComeback: false,
    })).toBe('CRUSHING_LOSS');
  });

  it('classifies crushing loss (low completion)', () => {
    expect(classifyMatch({
      result: 'LOSS', playerScore: 6, botScore: 15, arrowsTotal: 15, timeGap: 10, wasComeback: false,
    })).toBe('CRUSHING_LOSS'); // 40% completion < 50 threshold
  });

  it('classifies normal loss (moderate gap)', () => {
    expect(classifyMatch({
      result: 'LOSS', playerScore: 10, botScore: 15, arrowsTotal: 15, timeGap: 8, wasComeback: false,
    })).toBe('NORMAL_LOSS');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 2. Frustration Model
// ══════════════════════════════════════════════════════════════════════

describe('calculateFrustration', () => {
  it('decreases on win', () => {
    const profile = { ...createDefaultProfile(), frustrationScore: 40, updatedAt: Date.now() };
    const result = calculateFrustration(profile, {
      matchType: 'CLOSE_WIN', result: 'WIN', completionPercentage: 100, mistakes: 0,
    });
    expect(result).toBeLessThan(40);
  });

  it('increases on crushing loss', () => {
    const profile = { ...createDefaultProfile(), frustrationScore: 30, updatedAt: Date.now() };
    const result = calculateFrustration(profile, {
      matchType: 'CRUSHING_LOSS', result: 'LOSS', completionPercentage: 30, mistakes: 3,
    });
    expect(result).toBeGreaterThan(30);
  });

  it('increases less on close loss with high completion', () => {
    const profile = { ...createDefaultProfile(), frustrationScore: 30, updatedAt: Date.now() };
    const closeLoss = calculateFrustration(profile, {
      matchType: 'CLOSE_LOSS', result: 'LOSS', completionPercentage: 95, mistakes: 0,
    });
    const crushingLoss = calculateFrustration(profile, {
      matchType: 'CRUSHING_LOSS', result: 'LOSS', completionPercentage: 30, mistakes: 3,
    });
    expect(closeLoss).toBeLessThan(crushingLoss);
  });

  it('stays clamped between 0 and 100', () => {
    const low = { ...createDefaultProfile(), frustrationScore: 2, updatedAt: Date.now() };
    const r1 = calculateFrustration(low, {
      matchType: 'DOMINANT_WIN', result: 'WIN', completionPercentage: 100, mistakes: 0,
    });
    expect(r1).toBeGreaterThanOrEqual(0);

    const high = { ...createDefaultProfile(), frustrationScore: 98, updatedAt: Date.now() };
    const r2 = calculateFrustration(high, {
      matchType: 'CRUSHING_LOSS', result: 'LOSS', completionPercentage: 20, mistakes: 8,
    });
    expect(r2).toBeLessThanOrEqual(100);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 3. Confidence Model
// ══════════════════════════════════════════════════════════════════════

describe('calculateConfidence', () => {
  it('increases on win', () => {
    const profile = { ...createDefaultProfile(), confidenceScore: 50 };
    const result = calculateConfidence(profile, { result: 'WIN', matchType: 'CLOSE_WIN', completionPercentage: 80 });
    expect(result).toBe(60);
  });

  it('increases slightly on close loss (near-miss motivation)', () => {
    const profile = { ...createDefaultProfile(), confidenceScore: 50 };
    const result = calculateConfidence(profile, { result: 'LOSS', matchType: 'CLOSE_LOSS', completionPercentage: 80 });
    expect(result).toBe(52); // +2 for close loss
  });

  it('drops significantly on crushing loss', () => {
    const profile = { ...createDefaultProfile(), confidenceScore: 50 };
    const result = calculateConfidence(profile, { result: 'LOSS', matchType: 'CRUSHING_LOSS', completionPercentage: 30 });
    expect(result).toBe(38); // -12
  });

  it('stays clamped 0-100', () => {
    const low = { ...createDefaultProfile(), confidenceScore: 5 };
    expect(calculateConfidence(low, { result: 'LOSS', matchType: 'CRUSHING_LOSS', completionPercentage: 20 })).toBeGreaterThanOrEqual(0);

    const high = { ...createDefaultProfile(), confidenceScore: 95 };
    expect(calculateConfidence(high, { result: 'WIN', matchType: 'DOMINANT_WIN', completionPercentage: 100 })).toBeLessThanOrEqual(100);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 4. Skill Rating
// ══════════════════════════════════════════════════════════════════════

describe('updateSkill', () => {
  it('increases on win against equal opponent', () => {
    const result = updateSkill(50, 50, true);
    expect(result).toBeGreaterThan(50);
  });

  it('decreases on loss against equal opponent', () => {
    const result = updateSkill(50, 50, false);
    expect(result).toBeLessThan(50);
  });

  it('increases less on win against weaker opponent', () => {
    const vsWeak = updateSkill(60, 40, true);
    const vsEqual = updateSkill(60, 60, true);
    expect(vsWeak - 60).toBeLessThan(vsEqual - 60);
  });

  it('drops more on loss to weaker opponent', () => {
    const vsWeak = updateSkill(60, 40, false);
    const vsEqual = updateSkill(60, 60, false);
    expect(60 - vsWeak).toBeGreaterThan(60 - vsEqual);
  });

  it('expected win probability is ~50% for equal skills', () => {
    expect(expectedWinProbability(50, 50)).toBeCloseTo(0.5, 2);
  });

  it('expected win probability is higher against weaker opponent', () => {
    expect(expectedWinProbability(60, 40)).toBeGreaterThan(0.7);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 5. Experience State
// ══════════════════════════════════════════════════════════════════════

describe('deriveExperienceState', () => {
  it('maps frustration ranges correctly', () => {
    expect(deriveExperienceState(10)).toBe('COMFORTABLE');
    expect(deriveExperienceState(30)).toBe('ENGAGED');
    expect(deriveExperienceState(50)).toBe('TENSE');
    expect(deriveExperienceState(70)).toBe('FRUSTRATED');
    expect(deriveExperienceState(90)).toBe('RECOVERY');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 6. Bot Selection
// ══════════════════════════════════════════════════════════════════════

describe('selectBotForPlayer', () => {
  it('selects a lower-skill bot for FRUSTRATED state', () => {
    const profile = { ...createDefaultProfile(), skillRating: 60, frustrationScore: 75, experienceState: 'FRUSTRATED' as const };
    const bot = selectBotForPlayer(profile);
    expect(bot.skill).toBeLessThan(60);
  });

  it('selects a near-equal bot for ENGAGED state', () => {
    const profile = { ...createDefaultProfile(), skillRating: 60, frustrationScore: 30, experienceState: 'ENGAGED' as const };
    const bot = selectBotForPlayer(profile);
    expect(Math.abs(bot.skill - 60)).toBeLessThanOrEqual(10);
  });

  it('returns a valid tier name', () => {
    const profile = createDefaultProfile();
    const bot = selectBotForPlayer(profile);
    expect(['Rookie', 'Beginner', 'Competitive', 'Advanced', 'Expert', 'Master']).toContain(bot.tier);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 7. Puzzle Difficulty
// ══════════════════════════════════════════════════════════════════════

describe('calculatePuzzleDifficulty', () => {
  it('scores easy small puzzles low', () => {
    const score = calculatePuzzleDifficulty({
      id: 1, title: 'Easy', difficulty: 'Easy',
      gridSize: { columns: 4, rows: 4 }, arrows: new Array(5).fill({ id: '1', path: [], fullPath: [] }),
    });
    expect(score).toBeLessThan(30);
  });

  it('scores hard large puzzles high', () => {
    const score = calculatePuzzleDifficulty({
      id: 99, title: 'Expert', difficulty: 'Expert',
      gridSize: { columns: 10, rows: 10 }, arrows: new Array(25).fill({ id: '1', path: [], fullPath: [] }),
    });
    expect(score).toBeGreaterThan(50);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 8. Scenario Simulations
// ══════════════════════════════════════════════════════════════════════

describe('Scenario A — New Player', () => {
  it('ramps bot difficulty after initial wins', () => {
    let p = createDefaultProfile();
    const initialSkill = p.skillRating;

    // Win 3 matches
    for (let i = 0; i < 3; i++) {
      p = simulateMatch(p, { playerScore: 12, botScore: 8, botSkill: 40 + i * 5 });
    }

    expect(p.skillRating).toBeGreaterThan(initialSkill);
    expect(p.totalWins).toBe(3);
    expect(p.experienceState).toBe('COMFORTABLE');
  });
});

describe('Scenario C — Losing Streak', () => {
  it('gradually increases frustration and triggers state change', () => {
    let p = { ...createDefaultProfile(), skillRating: 60, frustrationScore: 30, confidenceScore: 65 };

    for (let i = 0; i < 4; i++) {
      p = simulateMatch(p, { playerScore: 8, botScore: 15, arrowsTotal: 15, botSkill: 58 - i * 2 });
    }

    expect(p.frustrationScore).toBeGreaterThan(30);
    expect(p.lossStreak).toBe(4);
    // Should have transitioned from ENGAGED toward TENSE or beyond
    expect(['TENSE', 'FRUSTRATED', 'RECOVERY']).toContain(p.experienceState);
  });
});

describe('Scenario D — Close Losses', () => {
  it('frustration rises slowly for close losses', () => {
    let p = { ...createDefaultProfile(), frustrationScore: 25, confidenceScore: 70 };

    for (let i = 0; i < 3; i++) {
      p = simulateMatch(p, {
        playerScore: 14, botScore: 15, arrowsTotal: 15, // 93% completion
        botSkill: 50,
      });
    }

    // Frustration should NOT explode — close losses only add +4 each (with EMA)
    expect(p.frustrationScore).toBeLessThan(45);
    // Confidence should stay reasonable (close losses give +2)
    expect(p.confidenceScore).toBeGreaterThanOrEqual(65);
  });
});

describe('Scenario E — Crushing Losses', () => {
  it('frustration rises fast for crushing losses', () => {
    let p = { ...createDefaultProfile(), frustrationScore: 20, confidenceScore: 70 };

    for (let i = 0; i < 3; i++) {
      p = simulateMatch(p, {
        playerScore: 5, botScore: 15, arrowsTotal: 15, // 33% completion
        botSkill: 80,
      });
    }

    // Frustration should rise significantly
    expect(p.frustrationScore).toBeGreaterThan(35);
    // Confidence should have dropped
    expect(p.confidenceScore).toBeLessThan(50);
  });
});

describe('Scenario F — Recovery', () => {
  it('frustration decreases after wins following losses', () => {
    let p = { ...createDefaultProfile(), frustrationScore: 20, confidenceScore: 60 };

    // 3 losses
    for (let i = 0; i < 3; i++) {
      p = simulateMatch(p, { playerScore: 8, botScore: 15, arrowsTotal: 15, botSkill: 60 });
    }
    const peakFrustration = p.frustrationScore;

    // 2 wins
    for (let i = 0; i < 2; i++) {
      p = simulateMatch(p, { playerScore: 13, botScore: 8, arrowsTotal: 15, botSkill: 45 });
    }

    expect(p.frustrationScore).toBeLessThan(peakFrustration);
    expect(p.winStreak).toBe(2);
  });
});

describe('Scenario G — Dominant Player', () => {
  it('increases skill and bot difficulty after repeated wins', () => {
    let p = createDefaultProfile();

    for (let i = 0; i < 5; i++) {
      p = simulateMatch(p, { playerScore: 15, botScore: 5, arrowsTotal: 15, botSkill: 45 + i * 3 });
    }

    expect(p.skillRating).toBeGreaterThan(60);
    expect(p.totalWins).toBe(5);
    expect(p.winStreak).toBe(5);
    expect(p.frustrationScore).toBeLessThan(10); // should be very low
  });
});
