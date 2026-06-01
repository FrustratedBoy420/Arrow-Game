/**
 * LEVEL MANAGEMENT STORE INTEGRATION
 *
 * Adapter layer that connects the Level Management System with the game store.
 * Handles star calculation, persistence, and level progression tracking.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  calculateStars,
  checkLevelUnlocks,
  initializeLevelMap,
  isLevelUnlocked,
  mergeLevelProgressMap,
  type LevelProgress
} from './levelManagement';

/** AsyncStorage may deserialize into a plain object — always normalize to Map. */
export function ensureLevelProgressMap(
  levelMap: Map<number, LevelProgress> | Record<string, LevelProgress> | null | undefined
): Map<number, LevelProgress> {
  if (levelMap instanceof Map) return levelMap;
  if (levelMap && typeof levelMap === 'object') {
    return new Map(
      Object.entries(levelMap).map(([key, value]) => [Number(key), value as LevelProgress])
    );
  }
  return initializeLevelMap();
}

// ============================================================================
// PERSISTENCE HELPERS
// ============================================================================

const LEVEL_PROGRESS_STORAGE_KEY = 'arrow-escape-level-progress';

/**
 * Saves the level progress map to AsyncStorage.
 */
export async function saveLevelProgress(levelMap: Map<number, LevelProgress>): Promise<void> {
  try {
    const data = JSON.stringify(Array.from(levelMap.entries()));
    await AsyncStorage.setItem(LEVEL_PROGRESS_STORAGE_KEY, data);
  } catch (error) {
    console.error('Failed to save level progress:', error);
  }
}

/**
 * Loads the level progress map from AsyncStorage.
 * Returns a fresh map if no saved data exists.
 */
export async function loadLevelProgress(): Promise<Map<number, LevelProgress>> {
  try {
    const data = await AsyncStorage.getItem(LEVEL_PROGRESS_STORAGE_KEY);
    if (data) {
      const entries = JSON.parse(data) as [number, LevelProgress][];
      const savedMap = new Map(entries);
      const mergedMap = mergeLevelProgressMap(savedMap);
      await saveLevelProgress(mergedMap);
      return mergedMap;
    }
  } catch (error) {
    console.error('Failed to load level progress:', error);
  }
  return initializeLevelMap();
}

// ============================================================================
// STAR CALCULATION & LEVEL COMPLETION
// ============================================================================

/**
 * Completes a level with star calculation.
 * Updates the level progress map and checks for new unlocks.
 *
 * @param levelMap - The level progress map to update
 * @param levelId - The level that was completed
 * @param timeTaken - Time taken in seconds
 * @param heartsLost - Number of hearts lost (0, 1, 2, or 3)
 * @param starsOverride - Optional pre-calculated stars to use instead of recalculating
 * @returns Object with starsEarned and breakdown
 */
export function completeLevelWithStars(
  levelMap: Map<number, LevelProgress>,
  levelId: number,
  timeTaken: number,
  heartsLost: number,
  starsOverride?: number
): { starsEarned: number; breakdown: string } {
  const progress = levelMap.get(levelId);
  if (!progress) {
    console.error(`Level ${levelId} not found in progress map`);
    return { starsEarned: 0, breakdown: 'Level not found' };
  }

  // Calculate stars or use override
  let starsEarned: number;
  let breakdown: string;

  if (starsOverride !== undefined) {
    starsEarned = starsOverride;
    breakdown = `Using authoritative HUD score: ${starsEarned} stars`;
  } else {
    const starResult = calculateStars(timeTaken, progress.totalArrows, heartsLost);
    starsEarned = starResult.finalStars;
    breakdown = starResult.breakdown;
  }

  // Update progress — keep best star count so replays cannot lower block totals
  progress.isCompleted = true;
  progress.starsEarned = Math.max(progress.starsEarned, starsEarned);
  progress.bestTime = progress.bestTime === null ? timeTaken : Math.min(progress.bestTime, timeTaken);
  starsEarned = progress.starsEarned;

  // Check for level unlocks
  const unlockResult = checkLevelUnlocks(levelMap);

  if (unlockResult.newlyUnlockedLevels.length > 0) {
    console.log(`🔓 New levels unlocked: ${unlockResult.newlyUnlockedLevels.join(', ')}`);
  }

  return {
    starsEarned,
    breakdown
  };
}

/**
 * Gets the total stars earned across all levels.
 */
export function getTotalStarsFromMap(levelMap: Map<number, LevelProgress>): number {
  return Array.from(levelMap.values()).reduce((sum, progress) => sum + progress.starsEarned, 0);
}

/**
 * Gets the star configuration for a specific level.
 * Returns totalArrows (baseline seconds) for that level.
 */
export function getLevelStarConfig(levelMap: Map<number, LevelProgress>, levelId: number): number | null {
  const progress = levelMap.get(levelId);
  return progress?.totalArrows ?? null;
}

let allLevelsUnlocked = false;

/**
 * Sets the administrative level bypass status (unlock all levels).
 */
export function setAllLevelsUnlocked(unlocked: boolean) {
  allLevelsUnlocked = unlocked;
}

/**
 * Checks if a level is locked (computed live — ignores stale saved flags).
 */
export function isLevelLocked(levelMap: Map<number, LevelProgress>, levelId: number): boolean {
  if (allLevelsUnlocked) return false;
  const map = ensureLevelProgressMap(levelMap);
  if (!map.has(levelId)) return true;
  return !isLevelUnlocked(map, levelId);
}

/**
 * Gets stars earned for a specific level.
 */
export function getLevelStars(levelMap: Map<number, LevelProgress>, levelId: number): number {
  const progress = levelMap.get(levelId);
  return progress?.starsEarned ?? 0;
}

