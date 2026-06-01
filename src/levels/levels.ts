import type { LevelDefinition } from '../game/types';
import levelData from './level.json';

export const localLevelData = levelData as unknown as LevelDefinition[];

/**
 * Stub level used as initial board state before remote levels are fetched.
 * Ensures the store can initialize safely with an empty level.json.
 */
export const LOADING_LEVEL: LevelDefinition = {
  id: 0,
  title: 'Loading...',
  difficulty: 'Easy',
  gridSize: { columns: 5, rows: 5 },
  arrows: []
};

// Runtime levels array — starts empty, populated by fetchGameConfig
export let levels: LevelDefinition[] = localLevelData;

export function setDynamicLevels(newLevels: LevelDefinition[]) {
  if (Array.isArray(newLevels) && newLevels.length > 0) {
    levels = newLevels;
  }
}

/**
 * Returns the level or undefined — does NOT throw.
 * Always guard the return value before use.
 */
export function getLevel(id: number): LevelDefinition | undefined {
  return levels.find((l) => l.id === id);
}

export function getTotalLevels(): number {
  return levels.length;
}

export function getNextLevelId(currentId: number): number {
  const currentIndex = levels.findIndex((l) => l.id === currentId);
  if (currentIndex < 0 || currentIndex >= levels.length - 1) return currentId;
  return levels[currentIndex + 1]!.id;
}

/** True once at least one remote batch has been loaded into the runtime array. */
export function hasLevelsLoaded(): boolean {
  return levels.length > 0;
}
