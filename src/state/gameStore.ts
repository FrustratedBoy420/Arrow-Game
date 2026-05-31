import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { trackEvent } from '../analytics/analytics';
import { createInitialBoard, findHintArrow, isBoardWon, resolveTap } from '../game/engine';
import type { BoardState, GameStatus } from '../game/types';
import { getLevel, getNextLevelId } from '../levels/levels';
import { completeLevelWithStars, loadLevelProgress, saveLevelProgress } from '../systems/levelManagementStore';
import type { LevelProgress } from '../systems/levelManagement';

type GameStore = {
  board: BoardState;
  currentLevelId: number;
  highestUnlockedLevel: number;
  hasSeenTutorial: boolean;
  status: GameStatus;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  musicEnabled: boolean;
  lastHintArrowId: string | null;
  // Level Management System Integration
  levelProgressMap: Map<number, LevelProgress>;
  starsEarnedThisLevel: number;
  levelStartTime: number;
  gameStartTime: number | null;
  finalStarsCalculated: number;
  startLevel: (levelId: number) => void;
  completeTutorial: () => void;
  tapArrow: (arrowId: string) => 'REMOVED' | 'BLOCKED';
  retry: () => void;
  nextLevel: () => void;
  undo: () => void;
  useHint: () => string | null;
  toggleSound: () => void;
  toggleHaptics: () => void;
  toggleMusic: () => void;
  recordLevelCompletion: (timeTaken: number, heartsLost: number) => Promise<void>;
  // FIX 3: Action dispatched by HUD every 100ms tick to keep store in sync
  setFinalStarsCalculated: (stars: number) => void;
};

const initialLevel = getLevel(1);

// Initialize level progress map - will be hydrated from storage
const initialLevelMap = new Map<number, LevelProgress>();

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      board: createInitialBoard(initialLevel),
      currentLevelId: initialLevel.id,
      highestUnlockedLevel: 1,
      hasSeenTutorial: false,
      status: 'playing',
      soundEnabled: true,
      hapticsEnabled: true,
      musicEnabled: true,
      lastHintArrowId: null,
      levelProgressMap: initialLevelMap,
      starsEarnedThisLevel: 0,
      levelStartTime: Date.now(),
      gameStartTime: null,
      // FIX 3: Default to 3 — optimistic, never pessimistic
      finalStarsCalculated: 3,
      startLevel: (levelId) => {
        const level = getLevel(levelId);
        trackEvent('level_start', { levelId: level.id, difficulty: level.difficulty });
        set({
          board: createInitialBoard(level),
          currentLevelId: level.id,
          status: 'playing',
          lastHintArrowId: null,
          levelStartTime: Date.now(),
          gameStartTime: null,
          // Reset star score on every new level start
          finalStarsCalculated: 3,
        });
      },
      completeTutorial: () => {
        set({ hasSeenTutorial: true });
        get().startLevel(1);
      },
      tapArrow: (arrowId) => {
        const { gameStartTime } = get();
        if (gameStartTime === null) {
          set({ gameStartTime: Date.now() });
        }
        
        const result = resolveTap(arrowId, get().board);
        const nextStatus: GameStatus = isBoardWon(result.board)
          ? 'won'
          : result.board.livesLeft <= 0
            ? 'failed'
            : 'playing';

        if (result.type === 'REMOVED') {
          trackEvent('move_correct', { levelId: get().currentLevelId, arrowId });
        } else {
          trackEvent('move_wrong', {
            levelId: get().currentLevelId,
            arrowId,
            livesLeft: result.livesLeft
          });
        }

        if (nextStatus === 'won') {
          const nextLevelId = getNextLevelId(get().currentLevelId);
          trackEvent('level_complete', { levelId: get().currentLevelId, nextLevelId });
          set((state) => ({
            highestUnlockedLevel: Math.max(state.highestUnlockedLevel, nextLevelId)
          }));
        }

        if (nextStatus === 'failed') {
          trackEvent('level_failed', { levelId: get().currentLevelId });
        }

        set({ board: result.board, status: nextStatus, lastHintArrowId: null });
        return result.type;
      },
      retry: () => {
        trackEvent('retry', { levelId: get().currentLevelId });
        get().startLevel(get().currentLevelId);
      },
      nextLevel: () => {
        get().startLevel(getNextLevelId(get().currentLevelId));
      },
      undo: () => {
        const { board } = get();
        const lastRemovedId = board.removedIds[board.removedIds.length - 1];

        if (!lastRemovedId) {
          return;
        }

        const originalArrow = board.level.arrows.find((arrow) => arrow.id === lastRemovedId);

        if (!originalArrow) {
          return;
        }

        set({
          board: {
            ...board,
            arrows: [...board.arrows, originalArrow],
            removedIds: board.removedIds.slice(0, -1)
          },
          status: 'playing',
          lastHintArrowId: null
        });
      },
      useHint: () => {
        const { board, status, gameStartTime } = get();

        if (status !== 'playing') {
          return null;
        }

        if (gameStartTime === null) {
          set({ gameStartTime: Date.now() });
        }

        const hintArrow = findHintArrow(board);

        if (!hintArrow) {
          return null;
        }

        // Auto-remove the hint arrow
        const result = resolveTap(hintArrow.id, board);

        if (result.type !== 'REMOVED') {
          return null;
        }

        const nextStatus: GameStatus = isBoardWon(result.board) ? 'won' : 'playing';

        if (nextStatus === 'won') {
          const nextLevelId = getNextLevelId(get().currentLevelId);
          trackEvent('level_complete', { levelId: get().currentLevelId, nextLevelId });
          set((state) => ({
            highestUnlockedLevel: Math.max(state.highestUnlockedLevel, nextLevelId)
          }));
        }

        set({
          board: result.board,
          status: nextStatus,
          lastHintArrowId: hintArrow.id
        });

        return hintArrow.id;
      },
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
      // FIX 3: Called by StarRatingDisplay every 100ms tick to keep store in sync
      setFinalStarsCalculated: (stars: number) =>
        set({ finalStarsCalculated: Math.max(1, Math.min(3, stars)) }),
      recordLevelCompletion: async (timeTaken, heartsLost) => {
        const { levelProgressMap, currentLevelId, finalStarsCalculated } = get();
        const result = completeLevelWithStars(levelProgressMap, currentLevelId, timeTaken, heartsLost, finalStarsCalculated);
        
        set({ starsEarnedThisLevel: finalStarsCalculated });
        
        // Save to storage
        await saveLevelProgress(levelProgressMap);
        
        // Track analytics
        trackEvent('stars_earned', {
          levelId: currentLevelId,
          stars: result.starsEarned,
          timeTaken,
          heartsLost
        });
      }
    }),
    {
      name: 'arrow-escape-progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentLevelId: state.currentLevelId,
        highestUnlockedLevel: state.highestUnlockedLevel,
        hasSeenTutorial: state.hasSeenTutorial,
        soundEnabled: state.soundEnabled,
        hapticsEnabled: state.hapticsEnabled,
        musicEnabled: state.musicEnabled
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.startLevel(state.currentLevelId);
        }
      }
    }
  )
);

/**
 * Initialize the level progress map from storage.
 * Call this once during app startup (e.g., in your root component).
 */
export async function initializeLevelProgressMap(): Promise<void> {
  const levelProgressMap = await loadLevelProgress();
  useGameStore.setState({ levelProgressMap });
}