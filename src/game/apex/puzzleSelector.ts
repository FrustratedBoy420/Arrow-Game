// ─── APEX Puzzle Selector ───────────────────────────────────────────
// Scores level difficulty and selects puzzles matched to player state.

import { APEX_CONFIG } from './config';
import type { PlayerExperienceProfile } from './types';
import type { LevelDefinition } from '../types';

/**
 * Calculate a 0-100 difficulty score for a level based on its properties.
 */
export function calculatePuzzleDifficulty(level: LevelDefinition): number {
  const { columns, rows } = level.gridSize;
  const arrowCount = level.arrows.length;
  const gridCells = columns * rows;

  // Grid size factor (0-30): larger grids are harder
  const gridScore = Math.min(30, (gridCells / 100) * 30);

  // Arrow density factor (0-25): more arrows per cell = harder
  const density = gridCells > 0 ? arrowCount / gridCells : 0;
  const densityScore = Math.min(25, density * 50);

  // Arrow count factor (0-25): raw arrow count
  const countScore = Math.min(25, (arrowCount / 30) * 25);

  // Difficulty tag bonus (0-20)
  const tagBonus: Record<string, number> = {
    'Easy': 0,
    'Medium': 8,
    'Hard': 14,
    'Expert': 20,
  };
  const tag = tagBonus[level.difficulty] ?? 8;

  return Math.min(100, Math.round(gridScore + densityScore + countScore + tag));
}

/**
 * Select a puzzle matched to the player's skill + experience state.
 * Avoids repeating the last 3 played levels.
 */
export function selectPuzzleForPlayer(
  profile: PlayerExperienceProfile,
  levels: LevelDefinition[]
): LevelDefinition {
  if (levels.length === 0) {
    // ponytail: should never happen, caller guarantees non-empty
    throw new Error('No levels available for puzzle selection');
  }

  const cfg = APEX_CONFIG;
  const adjust = cfg.puzzleDifficultyAdjust[profile.experienceState];
  const targetDifficulty = profile.skillRating + adjust;
  const range = cfg.puzzleDifficultyRange;

  // Filter levels within difficulty range
  const candidates = levels.filter(l => {
    const d = calculatePuzzleDifficulty(l);
    return d >= targetDifficulty - range && d <= targetDifficulty + range;
  });

  // Avoid repeating recent levels
  const recentIds = new Set(profile.lastMatches.slice(-3).map(m => m.matchId));
  const fresh = candidates.filter(l => !recentIds.has(String(l.id)));

  const pool = fresh.length > 0 ? fresh : candidates.length > 0 ? candidates : levels;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return chosen ?? levels[0]!;
}
