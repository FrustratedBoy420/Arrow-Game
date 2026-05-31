import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { trackEvent } from '../analytics/analytics';
import { createInitialBoard, findHintArrow, isBoardWon, resolveTap } from '../game/engine';
import type { BoardState, GameStatus, LevelDefinition } from '../game/types';
import { getLevel, getNextLevelId, setDynamicLevels } from '../levels/levels';
import { completeLevelWithStars, ensureLevelProgressMap, isLevelLocked, loadLevelProgress, saveLevelProgress } from '../systems/levelManagementStore';
import { checkLevelUnlocks, type LevelProgress, initializeLevelMap } from '../systems/levelManagement';

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
  dynamicLevels: LevelDefinition[] | null;
  musicUrls: {
    correct: string | null;
    wrong: string | null;
    victory: string | null;
    outOfMove: string | null;
    bgMusic: string | null;
  };
  iconsConfig: {
    homeArrow: string;
  };
  resetAllProgress: () => void;
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
  fetchGameConfig: (serverUrl?: string) => Promise<void>;
  recordLevelCompletion: (timeTaken: number, heartsLost: number) => Promise<void>;
  setFinalStarsCalculated: (stars: number) => void;
};

const initialLevel = getLevel(1);

const initialLevelMap = initializeLevelMap();

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
      dynamicLevels: null,
      musicUrls: {
        correct: null,
        wrong: null,
        victory: null,
        outOfMove: null,
        bgMusic: null
      },
      iconsConfig: {
        homeArrow: '➤'
      },
      levelProgressMap: initialLevelMap,
      starsEarnedThisLevel: 0,
      levelStartTime: Date.now(),
      gameStartTime: null,
      finalStarsCalculated: 3,

      resetAllProgress: () => {
        const freshMap = require('../systems/levelManagement').initializeLevelMap();
        set({
          highestUnlockedLevel: 1,
          levelProgressMap: freshMap,
          currentLevelId: 1
        });
        require('../systems/levelManagementStore').saveLevelProgress(freshMap);
      },

      startLevel: (levelId) => {
        const levelProgressMap = ensureLevelProgressMap(get().levelProgressMap);
        if (!levelProgressMap.get(levelId) || isLevelLocked(levelProgressMap, levelId)) {
          console.warn(`Level ${levelId} is locked`);
          return;
        }

        const level = getLevel(levelId);
        trackEvent('level_start', { levelId: level.id, difficulty: level.difficulty });
        set({
          board: createInitialBoard(level),
          currentLevelId: level.id,
          status: 'playing',
          lastHintArrowId: null,
          levelStartTime: Date.now(),
          gameStartTime: null,
          finalStarsCalculated: 3
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

        // ✅ FIX: Do NOT auto-unlock the next level here.
        // Level unlocks are handled exclusively by checkLevelUnlocks()
        // inside recordLevelCompletion → completeLevelWithStars.
        if (nextStatus === 'won') {
          trackEvent('level_complete', { levelId: get().currentLevelId });
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
        const nextId = getNextLevelId(get().currentLevelId);
        const levelProgressMap = ensureLevelProgressMap(get().levelProgressMap);
        if (!isLevelLocked(levelProgressMap, nextId)) {
          get().startLevel(nextId);
        } else {
          get().startLevel(get().currentLevelId);
        }
      },

      undo: () => {
        const { board } = get();
        const lastRemovedId = board.removedIds[board.removedIds.length - 1];
        if (!lastRemovedId) return;

        const originalArrow = board.level.arrows.find((arrow) => arrow.id === lastRemovedId);
        if (!originalArrow) return;

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
        if (status !== 'playing') return null;

        if (gameStartTime === null) {
          set({ gameStartTime: Date.now() });
        }

        const hintArrow = findHintArrow(board);
        if (!hintArrow) return null;

        const result = resolveTap(hintArrow.id, board);
        if (result.type !== 'REMOVED') return null;

        const nextStatus: GameStatus = isBoardWon(result.board) ? 'won' : 'playing';

        // ✅ FIX: Do NOT auto-unlock here either. Let recordLevelCompletion handle it.
        if (nextStatus === 'won') {
          trackEvent('level_complete', { levelId: get().currentLevelId });
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

      fetchGameConfig: async (serverUrl) => {
        let baseUrl = serverUrl?.trim() || 'https://arrow-game-backend.vercel.app';
        baseUrl = baseUrl.replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://${baseUrl}`;
        }

        try {
          const response = await fetch(`${baseUrl}/api/config`);
          if (!response.ok) throw new Error(`Server returned status ${response.status}`);
          const resData = await response.json();
          if (resData) {
            const { levels, music, icons } = resData;
            if (Array.isArray(levels) && levels.length > 0) {
              setDynamicLevels(levels);
              void refreshLevelProgressForLevels();
            }
            set({
              dynamicLevels: levels || null,
              musicUrls: music || {
                correct: null,
                wrong: null,
                victory: null,
                outOfMove: null,
                bgMusic: null
              },
              iconsConfig: icons || { homeArrow: '➤' }
            });
          }
        } catch (err) {
          console.warn('⚠️ Failed to fetch dynamic game config:', err);
        }
      },

      setFinalStarsCalculated: (stars: number) =>
        set({ finalStarsCalculated: Math.max(1, Math.min(3, stars)) }),

      recordLevelCompletion: async (timeTaken, heartsLost) => {
        const levelProgressMap = ensureLevelProgressMap(get().levelProgressMap);
        const { currentLevelId, finalStarsCalculated } = get();

        const result = completeLevelWithStars(
          levelProgressMap,
          currentLevelId,
          timeTaken,
          heartsLost,
          finalStarsCalculated
        );

        set({ starsEarnedThisLevel: finalStarsCalculated });

        // Persist updated progress (includes newly unlocked levels from checkLevelUnlocks)
        await saveLevelProgress(levelProgressMap);

        // Force re-render by replacing the map reference
        set({ levelProgressMap: new Map(levelProgressMap) });

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
        musicEnabled: state.musicEnabled,
        dynamicLevels: state.dynamicLevels,
        musicUrls: state.musicUrls,
        iconsConfig: state.iconsConfig
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { checkLevelUnlocks } = require('../systems/levelManagement');
          if (state.levelProgressMap) {
            checkLevelUnlocks(state.levelProgressMap);
          }
          if (state.dynamicLevels) {
            setDynamicLevels(state.dynamicLevels);
          }
          state.startLevel(state.currentLevelId);
        }
      }
    }
  )
);

export async function initializeLevelProgressMap(): Promise<void> {
  const levelProgressMap = await loadLevelProgress();
  checkLevelUnlocks(levelProgressMap);
  await saveLevelProgress(levelProgressMap);
  useGameStore.setState({ levelProgressMap: new Map(levelProgressMap) });
}

/** Re-sync locks after dynamic levels are loaded from the server. */
export async function refreshLevelProgressForLevels(): Promise<void> {
  const current = ensureLevelProgressMap(useGameStore.getState().levelProgressMap);
  const { mergeLevelProgressMap } = await import('../systems/levelManagement');
  const merged = mergeLevelProgressMap(current);
  await saveLevelProgress(merged);
  useGameStore.setState({ levelProgressMap: new Map(merged) });
}
