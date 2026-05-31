/**
 * Level Management & Star Rating System
 * 
 * A fully dynamic, scalable system for managing levels, tracking progress,
 * calculating stars, and handling level progression gates.
 * 
 * No hardcoded level numbers or arrow counts - everything is configuration-driven.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Global configuration for the level progression system.
 * Modify these values to change unlock thresholds and star requirements.
 */
export const LEVEL_CONFIG = {
  // Total stars required to unlock tier-2 levels (e.g., Level 6+)
  REQUIRED_TOTAL_STARS_FOR_TIER_2: 10,
  // Total stars required to unlock tier-3 levels (e.g., Level 11+)
  REQUIRED_TOTAL_STARS_FOR_TIER_3: 25,
  // Minimum stars per successful level completion
  MIN_STARS_PER_LEVEL: 1,
  // Maximum stars per level
  MAX_STARS_PER_LEVEL: 3
} as const;

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
 * Checks if levels should be unlocked based on total stars earned.
 * 
 * Automatically unlocks tier-2 levels (e.g., Level 6) when player reaches
 * REQUIRED_TOTAL_STARS_FOR_TIER_2, and tier-3 levels when reaching
 * REQUIRED_TOTAL_STARS_FOR_TIER_3, etc.
 * 
 * @param levelProgressMap - Map of level numbers to their progress data
 * @returns UnlockCheckResult with total stars and newly unlocked levels
 */
export function checkLevelUnlocks(levelProgressMap: Map<number, LevelProgress>): UnlockCheckResult {
  // Calculate total stars earned from all completed levels
  const totalStarsEarned = Array.from(levelProgressMap.values()).reduce(
    (sum, progress) => sum + progress.starsEarned,
    0
  );

  const newlyUnlockedLevels: number[] = [];

  // Determine tier boundaries dynamically
  // Tier 1: Levels 1-5
  // Tier 2: Levels 6-10 (unlock when totalStars >= REQUIRED_TOTAL_STARS_FOR_TIER_2)
  // Tier 3: Levels 11+ (unlock when totalStars >= REQUIRED_TOTAL_STARS_FOR_TIER_3)

  Array.from(levelProgressMap.values()).forEach((progress) => {
    const levelNum = progress.levelNumber;
    const wasLocked = progress.isLocked;

    // Determine unlock conditions dynamically based on level number
    let shouldBeUnlocked = false;

    if (levelNum <= 5) {
      // Tier 1: Always unlocked
      shouldBeUnlocked = true;
    } else if (levelNum >= 6 && levelNum <= 10) {
      // Tier 2: Unlock when totalStars >= REQUIRED_TOTAL_STARS_FOR_TIER_2
      shouldBeUnlocked = totalStarsEarned >= LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_2;
    } else if (levelNum >= 11) {
      // Tier 3: Unlock when totalStars >= REQUIRED_TOTAL_STARS_FOR_TIER_3
      shouldBeUnlocked = totalStarsEarned >= LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_3;
    }

    progress.isLocked = !shouldBeUnlocked;

    // Track newly unlocked levels
    if (wasLocked && shouldBeUnlocked) {
      newlyUnlockedLevels.push(levelNum);
    }
  });

  const progressReport = [
    `📊 Progression Report:`,
    `   Total Stars Earned: ${totalStarsEarned}`,
    `   Tier 2 Requirement: ${LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_2} stars`,
    `   Tier 3 Requirement: ${LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_3} stars`,
    newlyUnlockedLevels.length > 0
      ? `   🔓 Newly Unlocked: Levels ${newlyUnlockedLevels.join(', ')}`
      : `   (No new unlocks at this time)`
  ].join('\n');

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
    starsEarned: starResult.finalStars,
    bestTime: progress.bestTime === null ? timeTaken : Math.min(progress.bestTime, timeTaken)
  };
}

// ============================================================================
// LEVEL DATA INITIALIZATION & HELPERS
// ============================================================================

/**
 * Creates a new level progress entry for a given level definition.
 * Levels 1-5 are unlocked by default. Levels 6+ start as locked.
 * 
 * @param levelNumber - The level number
 * @param totalArrows - The number of arrows (= baseline time in seconds)
 * @returns LevelProgress object
 */
export function createLevelProgress(levelNumber: number, totalArrows: number): LevelProgress {
  return {
    levelNumber,
    totalArrows,
    isLocked: levelNumber > 5,  // Levels 6+ are locked initially
    starsEarned: 0,
    isCompleted: false,
    bestTime: null
  };
}

/**
 * Initialize a complete level progression map with starter levels.
 * Easily extensible - just call addLevel() for each new level.
 * 
 * Example:
 *   const levels = initializeLevelMap();
 *   addLevel(levels, 7, 22);  // Add Level 7 with 22 arrows
 *   addLevel(levels, 8, 25);  // Add Level 8 with 25 arrows
 * 
 * @returns Map of level numbers to LevelProgress objects
 */
export function initializeLevelMap(): Map<number, LevelProgress> {
  const levelMap = new Map<number, LevelProgress>();

  // Starter levels - easily add more by calling addLevel()
  const starterLevels = [
    { levelNumber: 1, totalArrows: 8 },
    { levelNumber: 2, totalArrows: 12 },
    { levelNumber: 3, totalArrows: 15 },
    { levelNumber: 4, totalArrows: 18 },
    { levelNumber: 5, totalArrows: 20 },
    { levelNumber: 6, totalArrows: 22 }  // Locked until REQUIRED_TOTAL_STARS_FOR_TIER_2 reached
  ];

  starterLevels.forEach(({ levelNumber, totalArrows }) => {
    levelMap.set(levelNumber, createLevelProgress(levelNumber, totalArrows));
  });

  return levelMap;
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
 * Gets the count of unlocked levels.
 */
export function getUnlockedLevelCount(levelMap: Map<number, LevelProgress>): number {
  return Array.from(levelMap.values()).filter((p) => !p.isLocked).length;
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
    `Next Tier Requirement: ${LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_2} stars`,
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
