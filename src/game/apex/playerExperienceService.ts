// ─── APEX Player Experience Service ─────────────────────────────────
// Orchestrator: single entry point for all APEX operations.
// Load/save profile, process match results, prepare next match.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { APEX_CONFIG, createDefaultProfile } from './config';
import { selectBotForPlayer } from './botSelector';
import { calculateConfidence } from './confidence';
import { calculateFrustration } from './frustration';
import { classifyMatch } from './matchClassifier';
import { selectPuzzleForPlayer, calculatePuzzleDifficulty } from './puzzleSelector';
import { updateSkill } from './skill';
import type {
  BotProfile,
  ExperienceState,
  MatchExperienceRecord,
  PlayerExperienceProfile,
} from './types';
import type { LevelDefinition } from '../types';

const STORAGE_KEY = 'apex:player_profile';

// ── Persistence ──────────────────────────────────────────────────────

export async function loadProfile(): Promise<PlayerExperienceProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlayerExperienceProfile;
      // ponytail: basic shape check — if it has skillRating it's good enough
      if (typeof parsed.skillRating === 'number') return parsed;
    }
  } catch (e) {
    console.warn('APEX: Failed to load profile, using default', e);
  }
  return createDefaultProfile();
}

export async function saveProfile(profile: PlayerExperienceProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('APEX: Failed to save profile', e);
  }
}

// ── Experience State Derivation ──────────────────────────────────────

export function deriveExperienceState(frustration: number): ExperienceState {
  const t = APEX_CONFIG.frustrationThresholds;
  if (frustration < t.comfortable) return 'COMFORTABLE';
  if (frustration < t.engaged) return 'ENGAGED';
  if (frustration < t.tense) return 'TENSE';
  if (frustration < t.frustrated) return 'FRUSTRATED';
  return 'RECOVERY';
}

// ── Tilt Calculation ─────────────────────────────────────────────────

function calculateTilt(frustration: number, confidence: number): number {
  return Math.round((frustration * (100 - confidence)) / 100);
}

// ── Aggregate Statistics ─────────────────────────────────────────────

function updateAggregates(
  profile: PlayerExperienceProfile,
  record: MatchExperienceRecord
): void {
  const n = profile.totalMatches;
  // Running average update: newAvg = oldAvg + (value - oldAvg) / (n + 1)
  const count = n + 1;
  profile.averageSolveTime += (record.matchDurationMs - profile.averageSolveTime) / count;
  profile.averageMistakes += (record.mistakes - profile.averageMistakes) / count;
  profile.averageCompletion += (record.completionPercentage - profile.averageCompletion) / count;
  profile.averageTimeGap += (record.timeGap - profile.averageTimeGap) / count;
}

// ── Match Result Processing ──────────────────────────────────────────

export interface MatchResultInput {
  playerScore: number;
  botScore: number;
  arrowsTotal: number;
  matchDurationMs: number;
  mistakes: number;
  wasComeback: boolean;
  botSkill: number;
  puzzleDifficulty: number;
  levelId: number;
}

export function processMatchResult(
  profile: PlayerExperienceProfile,
  input: MatchResultInput
): PlayerExperienceProfile {
  const result: 'WIN' | 'LOSS' = input.playerScore > input.botScore ? 'WIN' : 'LOSS';
  const completion = input.arrowsTotal > 0
    ? (input.playerScore / input.arrowsTotal) * 100
    : 0;

  // Time gap estimation from score differential
  const scoreGap = Math.abs(input.playerScore - input.botScore);
  const timePerArrow = input.arrowsTotal > 0
    ? input.matchDurationMs / input.arrowsTotal / 1000
    : 1;
  const timeGap = scoreGap * timePerArrow;

  // 1. Classify match
  const matchType = classifyMatch({
    result,
    playerScore: input.playerScore,
    botScore: input.botScore,
    arrowsTotal: input.arrowsTotal,
    timeGap,
    wasComeback: input.wasComeback,
  });

  // Snapshot emotional state before updates
  const frustrationBefore = profile.frustrationScore;
  const confidenceBefore = profile.confidenceScore;

  // 2. Update streaks BEFORE scoring (used by frustration calculator)
  if (result === 'WIN') {
    profile.winStreak += 1;
    profile.lossStreak = 0;
    profile.totalWins += 1;
  } else {
    profile.lossStreak += 1;
    profile.winStreak = 0;
    profile.totalLosses += 1;
  }

  // 3. Calculate new scores
  const matchPartial = { matchType, result, completionPercentage: completion, mistakes: input.mistakes };
  profile.frustrationScore = calculateFrustration(profile, matchPartial);
  profile.confidenceScore = calculateConfidence(profile, matchPartial);
  profile.skillRating = updateSkill(profile.skillRating, input.botSkill, result === 'WIN');
  profile.tiltScore = calculateTilt(profile.frustrationScore, profile.confidenceScore);
  profile.experienceState = deriveExperienceState(profile.frustrationScore);

  // 4. Update pattern counters
  if (matchType === 'CLOSE_LOSS') {
    profile.closeLosses += 1;
    if (completion >= APEX_CONFIG.nearWinCompletion) profile.nearWins += 1;
  }
  if (matchType === 'CRUSHING_LOSS') profile.crushingLosses += 1;

  // 5. Create match record
  const record: MatchExperienceRecord = {
    matchId: String(input.levelId),
    result,
    playerScore: input.playerScore,
    botScore: input.botScore,
    arrowsTotal: input.arrowsTotal,
    completionPercentage: Math.round(completion * 10) / 10,
    timeGap: Math.round(timeGap * 10) / 10,
    matchDurationMs: input.matchDurationMs,
    mistakes: input.mistakes,
    puzzleDifficulty: input.puzzleDifficulty,
    botSkill: input.botSkill,
    matchType,
    wasComeback: input.wasComeback,
    frustrationBefore,
    frustrationAfter: profile.frustrationScore,
    confidenceBefore,
    confidenceAfter: profile.confidenceScore,
    createdAt: Date.now(),
  };

  // 6. Update aggregates
  updateAggregates(profile, record);
  profile.totalMatches += 1;

  // 7. Add to history (trim to historySize)
  profile.lastMatches.push(record);
  if (profile.lastMatches.length > APEX_CONFIG.historySize) {
    profile.lastMatches = profile.lastMatches.slice(-APEX_CONFIG.historySize);
  }

  // 8. Increase skill confidence with more matches
  profile.skillConfidence = Math.min(100, Math.round(20 + profile.totalMatches * 4));
  profile.updatedAt = Date.now();

  return profile;
}

// ── Match Preparation ────────────────────────────────────────────────

export interface MatchPreparation {
  bot: BotProfile;
  level: LevelDefinition;
  puzzleDifficulty: number;
}

export function prepareMatch(
  profile: PlayerExperienceProfile,
  levels: LevelDefinition[]
): MatchPreparation {
  const bot = selectBotForPlayer(profile);
  const level = selectPuzzleForPlayer(profile, levels);
  const puzzleDifficulty = calculatePuzzleDifficulty(level);

  return { bot, level, puzzleDifficulty };
}
