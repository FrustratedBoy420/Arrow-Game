import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { trackEvent } from '../analytics/analytics';
import { createInitialBoard, findHintArrow, isBoardWon, resolveTap } from '../game/engine';
import type { BoardState, GameStatus, LevelDefinition } from '../game/types';
import { getLevel, getNextLevelId, LOADING_LEVEL, setDynamicLevels } from '../levels/levels';
import { completeLevelWithStars, ensureLevelProgressMap, isLevelLocked, loadLevelProgress, saveLevelProgress } from '../systems/levelManagementStore';
import { checkLevelUnlocks, type LevelProgress, initializeLevelMap } from '../systems/levelManagement';

/** Number of levels to load on first fetch */
const INITIAL_LEVEL_BATCH = 20;
/** Number of levels added per subsequent fetch */
const NEXT_LEVEL_BATCH = 5;

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
  hintUsedThisLevel: boolean;
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
    unlockAllLevels?: boolean;
  };
  versionConfig: {
    latest: string;
    critical: string;
  } | null;
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
  isFetchingConfig: boolean;
  fetchGameConfig: (serverUrl?: string) => Promise<void>;
  fetchVersionConfig: (serverUrl?: string) => Promise<void>;
  fetchNextLevels: () => Promise<void>;
  fetchAllLevelsForAdmin: () => Promise<void>;
  recordLevelCompletion: (timeTaken: number, heartsLost: number) => Promise<void>;
  setFinalStarsCalculated: (stars: number) => void;
};

// Use LOADING_LEVEL stub — real levels come from the DB on first fetch
const initialLevelMap = initializeLevelMap();

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      board: createInitialBoard(LOADING_LEVEL),
      currentLevelId: 1,
      highestUnlockedLevel: 1,
      hasSeenTutorial: false,
      status: 'playing',
      soundEnabled: true,
      hapticsEnabled: true,
      musicEnabled: true,
      lastHintArrowId: null,
      hintUsedThisLevel: false,
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
      versionConfig: null,
      levelProgressMap: initialLevelMap,
      starsEarnedThisLevel: 0,
      levelStartTime: Date.now(),
      gameStartTime: null,
      finalStarsCalculated: 3,
      isFetchingConfig: false,

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

        // Guard: level must be in the progress map and unlocked
        if (!levelProgressMap.get(levelId) || isLevelLocked(levelProgressMap, levelId)) {
          console.warn(`Level ${levelId} is locked or not in progress map yet`);
          return;
        }

        // Guard: level data must be loaded from DB
        const level = getLevel(levelId);
        if (!level) {
          console.warn(`Level ${levelId} not found — DB levels not loaded yet`);
          return;
        }

        trackEvent('level_start', { levelId: level.id, difficulty: level.difficulty });
        set({
          board: createInitialBoard(level),
          currentLevelId: level.id,
          status: 'playing',
          lastHintArrowId: null,
          hintUsedThisLevel: false,
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
        const { board, status, gameStartTime, hintUsedThisLevel } = get();
        if (status !== 'playing' || hintUsedThisLevel) return null;

        if (gameStartTime === null) {
          set({ gameStartTime: Date.now() });
        }

        const hintArrow = findHintArrow(board);
        if (!hintArrow) return null;

        const result = resolveTap(hintArrow.id, board);
        if (result.type !== 'REMOVED') return null;

        const nextStatus: GameStatus = isBoardWon(result.board) ? 'won' : 'playing';

        if (nextStatus === 'won') {
          trackEvent('level_complete', { levelId: get().currentLevelId });
        }

        set({
          board: result.board,
          status: nextStatus,
          lastHintArrowId: hintArrow.id,
          hintUsedThisLevel: true
        });

        return hintArrow.id;
      },

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),

      fetchGameConfig: async (serverUrl) => {
        set({ isFetchingConfig: true });
        
        let urlsToTry = ['https://arrow-game-backend.vercel.app'];
        if (serverUrl && serverUrl.trim()) {
          let customUrl = serverUrl.trim().replace(/\/$/, '');
          if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
            customUrl = `https://${customUrl}`;
          }
          urlsToTry = [customUrl, 'https://arrow-game-backend.vercel.app'];
        }

        for (const baseUrl of urlsToTry) {
          try {
            console.log(`📡 Fetching game config from: ${baseUrl}/api/config`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${baseUrl}/api/config`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Server returned status ${response.status}`);
            const resData = await response.json();

            if (resData) {
              const { levels: serverLevels, music, icons, version } = resData;

              // Only load levels from DB if not already cached locally
              const existingLevels = get().dynamicLevels;
              if (Array.isArray(serverLevels) && serverLevels.length > 0 && (!existingLevels || existingLevels.length === 0)) {
                // ── Load only the first INITIAL_LEVEL_BATCH levels ──
                const first20 = serverLevels.slice(0, INITIAL_LEVEL_BATCH);
                setDynamicLevels(first20);

                // Re-sync the progress map with the newly loaded levels
                await refreshLevelProgressForLevels();

                // Now that levels are in memory, start the correct level
                const { currentLevelId } = get();
                const targetId = getLevel(currentLevelId) ? currentLevelId : 1;
                get().startLevel(targetId);

                set({ dynamicLevels: first20 });
                console.log(`✅ Loaded first ${first20.length} levels from DB.`);
              } else if (existingLevels && existingLevels.length > 0) {
                console.log(`ℹ️ Levels already cached (${existingLevels.length}). Skipping level reload.`);
              }

              set({
                musicUrls: music || {
                  correct: null,
                  wrong: null,
                  victory: null,
                  outOfMove: null,
                  bgMusic: null
                },
                iconsConfig: icons ? { ...get().iconsConfig, ...icons } : get().iconsConfig,
                versionConfig: version || null
              });
              console.log(`✅ Game config loaded successfully from ${baseUrl}`);
              break; // exit loop on success
            }
          } catch (err) {
            console.warn(`⚠️ Failed to fetch config from ${baseUrl}:`, err);
          }
        }

        set({ isFetchingConfig: false });
      },

      /**
       * Lightweight version-only check — does NOT reload levels.
       * Use this on internet reconnect to check for updates without heavy data fetch.
       */
      fetchVersionConfig: async (serverUrl) => {
        let urlsToTry = ['https://arrow-game-backend.vercel.app'];
        if (serverUrl && serverUrl.trim()) {
          let customUrl = serverUrl.trim().replace(/\/$/, '');
          if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
            customUrl = `https://${customUrl}`;
          }
          urlsToTry = [customUrl, 'https://arrow-game-backend.vercel.app'];
        }

        for (const baseUrl of urlsToTry) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${baseUrl}/api/config`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Server returned status ${response.status}`);
            const resData = await response.json();
            if (resData?.version) {
              set({ versionConfig: resData.version });
              console.log(`✅ Version config refreshed from ${baseUrl}: ${JSON.stringify(resData.version)}`);
              break;
            }
          } catch (err) {
            console.warn(`⚠️ Failed to fetch version config from ${baseUrl}:`, err);
          }
        }
      },

      setFinalStarsCalculated: (stars: number) =>
        set({ finalStarsCalculated: Math.max(1, Math.min(3, stars)) }),

      /**
       * Admin-only: fetch EVERY level from the server in one shot.
       * Bypasses the 20 + 5 + 5 batch logic entirely.
       * After loading, marks all levels as unlocked in the progress map.
       */
      fetchAllLevelsForAdmin: async () => {
        const { mergeLevelProgressMap } = await import('../systems/levelManagement');

        const savedUrl = await AsyncStorage.getItem('multiplayer_url');
        let urlsToTry = ['https://arrow-game-backend.vercel.app'];
        if (savedUrl && savedUrl.trim()) {
          let customUrl = savedUrl.trim().replace(/\/$/, '');
          if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
            customUrl = `https://${customUrl}`;
          }
          urlsToTry = [customUrl, 'https://arrow-game-backend.vercel.app'];
        }

        for (const baseUrl of urlsToTry) {
          try {
            console.log(`👑 Admin: fetching ALL levels from server: ${baseUrl}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${baseUrl}/api/config`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Status ${response.status}`);

            const resData = await response.json();
            const serverLevels: LevelDefinition[] = resData.levels || [];

            if (!Array.isArray(serverLevels) || serverLevels.length === 0) {
              console.warn(`⚠️ Admin fetch: no levels returned from server ${baseUrl}.`);
              continue;
            }

            // Load ALL levels — no slice
            setDynamicLevels(serverLevels);

            // Build progress map for all levels and unlock every one
            const current = ensureLevelProgressMap(get().levelProgressMap);
            const merged = mergeLevelProgressMap(current);
            for (const progress of merged.values()) {
              progress.isLocked = false;
            }

            await saveLevelProgress(merged);
            set({
              dynamicLevels: serverLevels,
              levelProgressMap: new Map(merged),
              highestUnlockedLevel: serverLevels.length
            });

            console.log(`👑 Admin: all ${serverLevels.length} levels loaded and unlocked from ${baseUrl}.`);
            break; // exit loop on success
          } catch (err) {
            console.warn(`⚠️ Admin: failed to fetch all levels from ${baseUrl}:`, err);
          }
        }
      },

      fetchNextLevels: async () => {
        const { mergeLevelProgressMap } = await import('../systems/levelManagement');
        const activeLevels = get().dynamicLevels;
        const currentCount = activeLevels ? activeLevels.length : INITIAL_LEVEL_BATCH;
        const targetCount = currentCount + NEXT_LEVEL_BATCH;
        console.log(`🔓 Fetching next ${NEXT_LEVEL_BATCH} levels (total: ${targetCount}).`);

        const savedUrl = await AsyncStorage.getItem('multiplayer_url');
        let urlsToTry = ['https://arrow-game-backend.vercel.app'];
        if (savedUrl && savedUrl.trim()) {
          let customUrl = savedUrl.trim().replace(/\/$/, '');
          if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
            customUrl = `https://${customUrl}`;
          }
          urlsToTry = [customUrl, 'https://arrow-game-backend.vercel.app'];
        }

        for (const baseUrl of urlsToTry) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${baseUrl}/api/config`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Status ${response.status}`);

            const resData = await response.json();
            const serverLevels: LevelDefinition[] = resData.levels || [];

            if (Array.isArray(serverLevels) && serverLevels.length > 0) {
              const nextLevels = serverLevels.slice(0, targetCount);

              if (nextLevels.length <= currentCount) {
                console.log('ℹ️ No new levels available on server yet.');
                return;
              }

              setDynamicLevels(nextLevels);

              const current = ensureLevelProgressMap(get().levelProgressMap);
              const merged = mergeLevelProgressMap(current);
              await saveLevelProgress(merged);
              set({
                dynamicLevels: nextLevels,
                levelProgressMap: new Map(merged),
                highestUnlockedLevel: Math.max(get().highestUnlockedLevel, currentCount + 1)
              });
              console.log(`✅ Levels expanded from ${baseUrl}: now showing 1–${nextLevels.length}.`);
              return;
            }
          } catch (err) {
            console.warn(`⚠️ Could not fetch next levels from ${baseUrl}:`, err);
          }
        }

        // No offline fallback — level.json is intentionally empty.
        // The player must reconnect to unlock more levels.
        console.log('ℹ️ Cannot unlock more levels offline. Please reconnect.');
      },

      recordLevelCompletion: async (timeTaken, heartsLost) => {
        const levelProgressMap = ensureLevelProgressMap(get().levelProgressMap);
        const { currentLevelId, finalStarsCalculated, dynamicLevels } = get();

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

        // If all currently available levels are completed, fetch the next batch from DB
        const activeLevels = dynamicLevels || [];
        if (activeLevels.length > 0) {
          const allCompleted = activeLevels.every((lvl) => {
            const progress = levelProgressMap.get(lvl.id);
            return progress && progress.isCompleted;
          });
          if (allCompleted) {
            console.log('🎉 All current levels completed! Fetching next batch...');
            await get().fetchNextLevels();
          }
        }

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
        // Persist the loaded batch so levels survive a background-kill restart
        dynamicLevels: state.dynamicLevels,
        musicUrls: state.musicUrls,
        iconsConfig: state.iconsConfig,
        versionConfig: state.versionConfig
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore previously cached dynamic levels into the runtime levels array
          if (state.dynamicLevels && state.dynamicLevels.length > 0) {
            setDynamicLevels(state.dynamicLevels);
          }
          // Load + re-sync the level progress map from AsyncStorage
          // (levelProgressMap is NOT in partialize — must be reloaded manually)
          void initializeLevelProgressMap().then(() => {
            console.log('✅ Level progress map initialized post-hydration');
            // Now that progress map is ready, try to start the saved level
            const { currentLevelId } = useGameStore.getState();
            const targetId = getLevel(currentLevelId) ? currentLevelId : 1;
            useGameStore.getState().startLevel(targetId);
          });
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

/** Re-sync locks after a new level batch is loaded from the server. */
export async function refreshLevelProgressForLevels(): Promise<void> {
  const current = ensureLevelProgressMap(useGameStore.getState().levelProgressMap);
  const { mergeLevelProgressMap } = await import('../systems/levelManagement');
  const merged = mergeLevelProgressMap(current);
  await saveLevelProgress(merged);
  useGameStore.setState({ levelProgressMap: new Map(merged) });
}
