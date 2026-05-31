/**
 * Level Management & Star Rating System
 * 
 * A fully dynamic, scalable system for managing levels, tracking progress,
 * calculating stars, and handling level progression gates.
 * 
 * No hardcoded level numbers or arrow counts - everything is configuration-driven.
 */

import { levels } from '../levels/levels';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Global configuration for the level progression system.
 * Modify these values to change unlock thresholds and star requirements.
 */
export const LEVEL_CONFIG = {
  // Stars required to unlock the next block of 5 levels
  STARS_REQUIRED_PER_BLOCK: 13,
  // Minimum stars per successful level completion
  MIN_STARS_PER_LEVEL: 1,
  // Maximum stars per level
  MAX_STARS_PER_LEVEL: 3
} as const;

/** Number of levels per star-checkpoint block */
export const BLOCK_SIZE = 5;

/** Maximum stars achievable in one block (5 levels × 3 stars) */
export const MAX_BLOCK_STARS = BLOCK_SIZE * LEVEL_CONFIG.MAX_STARS_PER_LEVEL;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Represents the progression and performance data for a single level.
 */
export interface LevelProgress {
  levelNumber: number;
  totalArrows: number;          // Baseline seconds (arrow count = base time in seconds)
  isLocked: boolean;             // Whether the player can access this level
  starsEarned: number;           // 0 = not completed, 1-3 = completed with stars
  isCompleted: boolean;          // Whether the level has been successfully completed
  bestTime: number | null;       // Best completion time in seconds (null if not completed)
}

/**
 * Represents the results of a star calculation operation.
 */
export interface StarCalculationResult {
  baseStars: number;             // Stars earned based on time alone
  penalty: number;               // Penalty applied (0 or 1)
  finalStars: number;            // Final star count (baseStars - penalty, min 1)
  breakdown: string;             // Human-readable explanation
}

/**
 * Represents the result of checking level unlocks.
 */
export interface UnlockCheckResult {
  totalStarsEarned: number;      // Sum of all stars earned
  newlyUnlockedLevels: number[]; // Level numbers that became unlocked
  progressReport: string;        // Human-readable summary
}

// ============================================================================
// DYNAMIC STAR CALCULATION
// ============================================================================

/**
 * Calculates the number of stars earned for a level completion.
 * 
 * @param timeTaken - Time taken to complete the level (seconds)
 * @param totalArrows - Baseline time for this level (arrow count = base time)
 * @param heartsLost - Number of lives lost during completion (0, 1, 2, or 3)
 * @returns StarCalculationResult with breakdown information
 * 
 * Formula:
 * - 3 Stars: timeTaken <= totalArrows
 * - 2 Stars: timeTaken > totalArrows AND timeTaken <= (totalArrows + 5)
 * - 1 Star:  timeTaken > (totalArrows + 5)
 * - Penalty: If heartsLost > 0, subtract 1 star (floor to MIN_STARS_PER_LEVEL)
 */
export function calculateStars(
  timeTaken: number,
  totalArrows: number,
  heartsLost: number
): StarCalculationResult {
  // Step 1: Calculate base stars based on time
  let baseStars: number;
  let timeExplanation: string;

  if (timeTaken <= totalArrows) {
    baseStars = 3;
    timeExplanation = `Time (${timeTaken}s) ≤ Baseline (${totalArrows}s)`;
  } else if (timeTaken <= totalArrows + 5) {
    baseStars = 2;
    timeExplanation = `Time (${timeTaken}s) is within ${totalArrows} to ${totalArrows + 5} seconds`;
  } else {
    baseStars = 1;
    timeExplanation = `Time (${timeTaken}s) > Baseline + 5 (${totalArrows + 5}s)`;
  }

  // Step 2: Apply hearts lost penalty
  const penalty = heartsLost > 0 ? 1 : 0;
  const penaltyExplanation =
    heartsLost > 0 ? `Hearts lost: ${heartsLost} (-1 star penalty)` : 'Perfect health: No penalty';

  // Step 3: Calculate final stars with floor to minimum
  const finalStars = Math.max(baseStars - penalty, LEVEL_CONFIG.MIN_STARS_PER_LEVEL);

  const breakdown = [
    `⏱️  Time Analysis: ${timeExplanation} → ${baseStars} base stars`,
    `❤️  Health Penalty: ${penaltyExplanation}`,
    `⭐ Final Result: ${finalStars} stars (min floor: ${LEVEL_CONFIG.MIN_STARS_PER_LEVEL})`
  ].join('\n');

  return {
    baseStars,
    penalty,
    finalStars,
    breakdown
  };
}

// ============================================================================
// LEVEL PROGRESSION MANAGEMENT
// ============================================================================

/**
 * Computes whether a level should be playable right now.
 * Never trust persisted isLocked — always derive from completion + star gates.
 */
export function isLevelUnlocked(
  levelMap: Map<number, LevelProgress>,
  levelNumber: number
): boolean {
  if (levelNumber === 1) return true;

  const prev = levelMap.get(levelNumber - 1);
  if (!prev?.isCompleted) return false;

  if (isCheckpointLevel(levelNumber)) {
    const requiredStars = getCheckpointRequiredStars(levelNumber);
    const cumulativeStars = getBlockStars(levelMap, 1, levelNumber - 1);
    return cumulativeStars >= requiredStars;
  }

  return true;
}

/**
 * Writes isLocked on every level entry from computed unlock rules.
 */
export function syncLevelLockFlags(levelMap: Map<number, LevelProgress>): void {
  for (const progress of getAllLevelsSorted(levelMap)) {
    progress.isLocked = !isLevelUnlocked(levelMap, progress.levelNumber);
  }
}

/**
 * Checks if levels should be unlocked based on linear progression and block gates.
 *
 * 1. Linear: Level N unlocks only when Level N-1 is completed.
 * 2. Star gates: Levels 6, 11, 16… need cumulative stars from all prior levels
 *    (13 per completed block of 5: L6→13, L11→26, L16→39…).
 */
export function checkLevelUnlocks(levelProgressMap: Map<number, LevelProgress>): UnlockCheckResult {
  const allLevels = getAllLevelsSorted(levelProgressMap);
  const totalStarsEarned = getTotalStarsEarned(levelProgressMap);
  const newlyUnlockedLevels: number[] = [];

  allLevels.forEach((progress) => {
    const wasLocked = progress.isLocked;
    const shouldBeUnlocked = isLevelUnlocked(levelProgressMap, progress.levelNumber);
    progress.isLocked = !shouldBeUnlocked;

    if (wasLocked && shouldBeUnlocked) {
      newlyUnlockedLevels.push(progress.levelNumber);
    }
  });

  const progressReport = `📊 Progression: ${totalStarsEarned} stars. Checkpoints: 13 stars per block (cumulative).`;

  return {
    totalStarsEarned,
    newlyUnlockedLevels,
    progressReport
  };
}

/**
 * Updates a level's progress after completion.
 * 
 * @param progress - The level progress to update
 * @param timeTaken - Time taken in seconds
 * @param heartsLost - Hearts lost during completion
 * @returns Updated LevelProgress object
 */
export function updateLevelProgress(
  progress: LevelProgress,
  timeTaken: number,
  heartsLost: number
): LevelProgress {
  const starResult = calculateStars(timeTaken, progress.totalArrows, heartsLost);

  return {
    ...progress,
    isCompleted: true,
    starsEarned: Math.max(progress.starsEarned, starResult.finalStars),
    bestTime: progress.bestTime === null ? timeTaken : Math.min(progress.bestTime, timeTaken)
  };
}

/**
 * Returns true for checkpoint levels (6, 11, 16, 21...) that require a star gate.
 */
export function isCheckpointLevel(levelNumber: number): boolean {
  return levelNumber > 1 && (levelNumber - 1) % BLOCK_SIZE === 0;
}

/**
 * Returns the level range for the block immediately before a checkpoint level.
 * e.g. Level 6 → { start: 1, end: 5 }
 */
export function getPreviousBlockRange(levelNumber: number): { start: number; end: number } | null {
  if (!isCheckpointLevel(levelNumber)) return null;
  const blockIndex = Math.floor((levelNumber - 1) / BLOCK_SIZE);
  return {
    start: (blockIndex - 1) * BLOCK_SIZE + 1,
    end: blockIndex * BLOCK_SIZE
  };
}

/**
 * Sums stars earned across a contiguous range of levels.
 */
export function getBlockStars(
  levelMap: Map<number, LevelProgress>,
  start: number,
  end: number
): number {
  let total = 0;
  for (let i = start; i <= end; i++) {
    total += levelMap.get(i)?.starsEarned ?? 0;
  }
  return total;
}

/**
 * Stars required to unlock a checkpoint level (cumulative across all prior levels).
 * Level 6 → 13, Level 11 → 26, Level 16 → 39 …
 */
export function getCheckpointRequiredStars(levelNumber: number): number {
  if (!isCheckpointLevel(levelNumber)) return 0;
  const completedBlocks = Math.floor((levelNumber - 1) / BLOCK_SIZE);
  return completedBlocks * LEVEL_CONFIG.STARS_REQUIRED_PER_BLOCK;
}

export type CheckpointGateProgress = {
  targetLevel: number;
  gateStart: number;
  gateEnd: number;
  requiredStars: number;
  currentStars: number;
  maxStars: number;
  starsNeeded: number;
  levelBreakdown: { level: number; stars: number }[];
};

/**
 * Full star-gate progress for a checkpoint level (for popups / UI).
 */
export function getCheckpointGateProgress(
  levelMap: Map<number, LevelProgress>,
  levelNumber: number
): CheckpointGateProgress | null {
  if (!isCheckpointLevel(levelNumber)) return null;

  const gateEnd = levelNumber - 1;
  const requiredStars = getCheckpointRequiredStars(levelNumber);
  const levelBreakdown: { level: number; stars: number }[] = [];
  let currentStars = 0;

  for (let i = 1; i <= gateEnd; i++) {
    const stars = levelMap.get(i)?.starsEarned ?? 0;
    levelBreakdown.push({ level: i, stars });
    currentStars += stars;
  }

  return {
    targetLevel: levelNumber,
    gateStart: 1,
    gateEnd,
    requiredStars,
    currentStars,
    maxStars: gateEnd * LEVEL_CONFIG.MAX_STARS_PER_LEVEL,
    starsNeeded: Math.max(0, requiredStars - currentStars),
    levelBreakdown
  };
}

/**
 * @deprecated Use getCheckpointGateProgress for cumulative gates.
 */
export function getCheckpointBlockProgress(
  levelMap: Map<number, LevelProgress>,
  levelNumber: number
): {
  currentStars: number;
  requiredStars: number;
  maxStars: number;
  blockStart: number;
  blockEnd: number;
} | null {
  const gate = getCheckpointGateProgress(levelMap, levelNumber);
  if (!gate) return null;

  return {
    currentStars: gate.currentStars,
    requiredStars: gate.requiredStars,
    maxStars: gate.maxStars,
    blockStart: gate.gateStart,
    blockEnd: gate.gateEnd
  };
}

// ============================================================================
// LEVEL DATA INITIALIZATION & HELPERS
// ============================================================================

/**
 * Creates a new level progress entry for a given level definition.
 * Only level 1 starts unlocked; syncLevelLockFlags applies the rest.
 */
export function createLevelProgress(levelNumber: number, totalArrows: number): LevelProgress {
  return {
    levelNumber,
    totalArrows,
    isLocked: levelNumber !== 1,  // Only Level 1 is unlocked by default
    starsEarned: 0,
    isCompleted: false,
    bestTime: null
  };
}

/**
 * Builds a full progress map from level definitions, optionally merging saved data.
 * Re-applies linear unlock + 13/15 star block gates every time.
 */
export function mergeLevelProgressMap(
  savedMap: Map<number, LevelProgress> | null | undefined
): Map<number, LevelProgress> {
  const levelMap = new Map<number, LevelProgress>();

  for (const level of levels) {
    const totalArrows = level.arrows.length;
    const saved = savedMap?.get(level.id);

    if (saved) {
      levelMap.set(level.id, {
        ...saved,
        levelNumber: level.id,
        totalArrows
      });
    } else {
      levelMap.set(level.id, createLevelProgress(level.id, totalArrows));
    }
  }

  checkLevelUnlocks(levelMap);
  return levelMap;
}

/**
 * Initialize a complete level progression map from all level definitions.
 * Only Level 1 is unlocked until the player progresses.
 */
export function initializeLevelMap(): Map<number, LevelProgress> {
  return mergeLevelProgressMap(null);
}

/**
 * Dynamically adds a new level to the progression map.
 * 
 * Example:
 *   addLevel(levelMap, 7, 24);  // Add Level 7 with 24 arrows
 * 
 * @param levelMap - The level progress map to add to
 * @param levelNumber - The new level number
 * @param totalArrows - The number of arrows (= baseline time)
 */
export function addLevel(
  levelMap: Map<number, LevelProgress>,
  levelNumber: number,
  totalArrows: number
): void {
  if (levelMap.has(levelNumber)) {
    console.warn(`Level ${levelNumber} already exists. Skipping.`);
    return;
  }
  levelMap.set(levelNumber, createLevelProgress(levelNumber, totalArrows));
}

/**
 * Retrieves a level's progress data, or undefined if not found.
 */
export function getLevel(levelMap: Map<number, LevelProgress>, levelNumber: number): LevelProgress | undefined {
  return levelMap.get(levelNumber);
}

/**
 * Gets all levels sorted by level number.
 */
export function getAllLevelsSorted(levelMap: Map<number, LevelProgress>): LevelProgress[] {
  return Array.from(levelMap.values()).sort((a, b) => a.levelNumber - b.levelNumber);
}

/**
 * Gets total stars earned across all completed levels.
 */
export function getTotalStarsEarned(levelMap: Map<number, LevelProgress>): number {
  return Array.from(levelMap.values()).reduce((sum, progress) => sum + progress.starsEarned, 0);
}

/**
 * Gets the count of completed levels.
 */
export function getCompletedLevelCount(levelMap: Map<number, LevelProgress>): number {
  return Array.from(levelMap.values()).filter((p) => p.isCompleted).length;
}

/**
 * Gets the count of unlocked levels (computed from progression rules).
 */
export function getUnlockedLevelCount(levelMap: Map<number, LevelProgress>): number {
  return getAllLevelsSorted(levelMap).filter((p) => isLevelUnlocked(levelMap, p.levelNumber)).length;
}

// ============================================================================
// DEBUGGING & REPORTING
// ============================================================================

/**
 * Generates a detailed progress report for debugging and UI display.
 */
export function generateProgressReport(levelMap: Map<number, LevelProgress>): string {
  const allLevels = getAllLevelsSorted(levelMap);
  const totalStars = getTotalStarsEarned(levelMap);
  const completedCount = getCompletedLevelCount(levelMap);
  const totalLevelCount = levelMap.size;
  const unlockedCount = getUnlockedLevelCount(levelMap);

  const levelDetails = allLevels
    .map((progress) => {
      const status = progress.isLocked ? '🔒 LOCKED' : progress.isCompleted ? '✅ COMPLETE' : '🔓 OPEN';
      const stars = '⭐'.repeat(progress.starsEarned) || '○';
      const timeStr = progress.bestTime ? `(${progress.bestTime}s)` : '(—)';
      return `  Level ${progress.levelNumber}: ${status} | ${stars} ${timeStr}`;
    })
    .join('\n');

  return [
    `${'='.repeat(50)}`,
    `📈 LEVEL PROGRESSION REPORT`,
    `${'='.repeat(50)}`,
    `Progress: ${completedCount}/${totalLevelCount} levels completed`,
    `Unlocked: ${unlockedCount}/${totalLevelCount} levels available`,
    `Total Stars: ${totalStars}`,
    `Block Requirement: ${LEVEL_CONFIG.STARS_REQUIRED_PER_BLOCK} stars per 5 levels`,
    ``,
    levelDetails,
    `${'='.repeat(50)}`
  ].join('\n');
}

/**
 * Prints a progress report to the console.
 */
export function printProgressReport(levelMap: Map<number, LevelProgress>): void {
  console.log(generateProgressReport(levelMap));
}
