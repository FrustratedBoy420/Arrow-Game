import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { trackEvent } from '../analytics/analytics';
import { createInitialBoard, findHintArrow, isBoardWon, resolveTap } from '../game/engine';
import type { BoardState, GameStatus, LevelDefinition } from '../game/types';
import { getLevel, getNextLevelId, setDynamicLevels, levels, localLevelData } from '../levels/levels';
import { completeLevelWithStars, loadLevelProgress, saveLevelProgress, syncLevelProgressMap } from '../systems/levelManagementStore';
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
  fetchNextLevels: () => Promise<void>;
  recordLevelCompletion: (timeTaken: number, heartsLost: number) => Promise<void>;
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
      dynamicLevels: levels,
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
        const { currentLevelId } = get();
        const nextId = getNextLevelId(currentLevelId);
        
        if (nextId === currentLevelId) {
          // We are at the end of the current active levels list.
          // Let's check if there are more levels in localLevelData.
          const nextLevelExist = localLevelData.some(l => l.id === currentLevelId + 1);
          if (nextLevelExist) {
            const activeLevels = get().dynamicLevels || levels;
            const currentCount = activeLevels.length;
            const targetCount = currentCount + 5;
            const nextLevels = localLevelData.slice(0, targetCount);
            
            setDynamicLevels(nextLevels);
            const syncedMap = syncLevelProgressMap(get().levelProgressMap, nextLevels);
            void saveLevelProgress(syncedMap);
            
            set({
              dynamicLevels: nextLevels,
              levelProgressMap: syncedMap,
              highestUnlockedLevel: Math.max(get().highestUnlockedLevel, currentCount + 1)
            });
            
            get().startLevel(currentLevelId + 1);
            return;
          }
        }
        
        get().startLevel(nextId);
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
      fetchGameConfig: async (serverUrl) => {
        let baseUrl = serverUrl?.trim() || 'https://arrow-game-backend.vercel.app';
        baseUrl = baseUrl.replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://${baseUrl}`;
        }

        try {
          console.log(`📡 Fetching dynamic game config from ${baseUrl}/api/config`);
          const response = await fetch(`${baseUrl}/api/config`);
          if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
          }
          const resData = await response.json();
          if (resData) {
            const { levels: serverLevels, music, icons } = resData;

            // Apply levels to levels.ts runtime array (restricted to current count)
            if (Array.isArray(serverLevels) && serverLevels.length > 0) {
              const activeLevels = get().dynamicLevels;
              const currentCount = Math.max(20, activeLevels ? activeLevels.length : 20);
              
              const allowedLevels: LevelDefinition[] = [];
              for (let i = 1; i <= currentCount; i++) {
                const serverLvl = serverLevels.find(l => l.id === i);
                if (serverLvl) {
                  allowedLevels.push(serverLvl);
                } else {
                  const localLvl = localLevelData.find(l => l.id === i);
                  if (localLvl) {
                    allowedLevels.push(localLvl);
                  }
                }
              }

              setDynamicLevels(allowedLevels);
              
              const syncedMap = syncLevelProgressMap(get().levelProgressMap, allowedLevels);
              await saveLevelProgress(syncedMap);
              set({ 
                levelProgressMap: syncedMap,
                dynamicLevels: allowedLevels
              });
            }

            // Save in store state (will trigger subscription in audio.ts if music URLs changed)
            set({
              musicUrls: music || {
                correct: null,
                wrong: null,
                victory: null,
                outOfMove: null,
                bgMusic: null
              },
              iconsConfig: icons || {
                homeArrow: '➤'
              }
            });

            console.log('✅ Dynamic game config loaded successfully.');
          }
        } catch (err) {
          console.warn('⚠️ Failed to fetch dynamic game config, using cache/static:', err);
        }
      },
      fetchNextLevels: async () => {
        const activeLevels = get().dynamicLevels;
        const currentCount = Math.max(20, activeLevels ? activeLevels.length : 20);
        const targetCount = currentCount + 5;
        console.log(`🔓 Unlocking next 5 levels. New target count: ${targetCount}`);

        try {
          const savedUrl = await AsyncStorage.getItem('multiplayer_url');
          let baseUrl = savedUrl?.trim() || 'https://arrow-game-backend.vercel.app';
          baseUrl = baseUrl.replace(/\/$/, '');
          if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = `https://${baseUrl}`;
          }

          console.log(`📡 Fetching levels config for unlock from ${baseUrl}/api/config`);
          const response = await fetch(`${baseUrl}/api/config`);
          if (!response.ok) throw new Error();
          
          const resData = await response.json();
          const serverLevels = resData.levels || [];
          
          if (Array.isArray(serverLevels) && serverLevels.length > 0) {
            const nextLevels: LevelDefinition[] = [];
            for (let i = 1; i <= targetCount; i++) {
              const serverLvl = serverLevels.find(l => l.id === i);
              if (serverLvl) {
                nextLevels.push(serverLvl);
              } else {
                const localLvl = localLevelData.find(l => l.id === i);
                if (localLvl) {
                  nextLevels.push(localLvl);
                }
              }
            }

            setDynamicLevels(nextLevels);
            
            const syncedMap = syncLevelProgressMap(get().levelProgressMap, nextLevels);
            await saveLevelProgress(syncedMap);
            set({
              dynamicLevels: nextLevels,
              levelProgressMap: syncedMap,
              highestUnlockedLevel: Math.max(get().highestUnlockedLevel, currentCount + 1)
            });
            console.log(`✅ Successfully unlocked levels 1 to ${nextLevels.length} from database.`);
            return;
          }
        } catch (err) {
          console.warn('⚠️ Offline or failed to fetch config, unlocking next levels from localLevelData:', err);
        }

        // Offline Fallback
        const nextLevels = localLevelData.slice(0, targetCount);
        setDynamicLevels(nextLevels);
        
        const syncedMap = syncLevelProgressMap(get().levelProgressMap, nextLevels);
        await saveLevelProgress(syncedMap);
        set({
          dynamicLevels: nextLevels,
          levelProgressMap: syncedMap,
          highestUnlockedLevel: Math.max(get().highestUnlockedLevel, currentCount + 1)
        });
        console.log(`✅ Successfully unlocked levels 1 to ${nextLevels.length} from local levelData.`);
      },
      setFinalStarsCalculated: (stars: number) =>
        set({ finalStarsCalculated: Math.max(1, Math.min(3, stars)) }),
      recordLevelCompletion: async (timeTaken, heartsLost) => {
        const { levelProgressMap, currentLevelId, finalStarsCalculated, dynamicLevels } = get();
        const result = completeLevelWithStars(levelProgressMap, currentLevelId, timeTaken, heartsLost, finalStarsCalculated);
        
        set({ starsEarnedThisLevel: finalStarsCalculated });
        
        // Save to storage
        await saveLevelProgress(levelProgressMap);
        
        // Check if all currently available levels are completed
        const activeLevels = dynamicLevels || levels;
        const allCompleted = activeLevels.every(lvl => {
          const progress = levelProgressMap.get(lvl.id);
          return progress && progress.isCompleted;
        });

        if (allCompleted) {
          await get().fetchNextLevels();
        }

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
        musicEnabled: state.musicEnabled,
        dynamicLevels: state.dynamicLevels,
        musicUrls: state.musicUrls,
        iconsConfig: state.iconsConfig
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If we had previously cached dynamic levels, restore them (minimum 20 levels)
          if (state.dynamicLevels && state.dynamicLevels.length >= 20) {
            setDynamicLevels(state.dynamicLevels);
          } else {
            // First time load or recovery: initialize with the first 20 levels
            state.dynamicLevels = levels;
            setDynamicLevels(levels);
          }
          
          // Re-sync progress map immediately after hydration
          void initializeLevelProgressMap().then(() => {
            console.log('✅ Level progress map initialized and synced post-hydration');
          });

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
  const activeLevels = useGameStore.getState().dynamicLevels || levels;
  const syncedMap = syncLevelProgressMap(levelProgressMap, activeLevels);
  await saveLevelProgress(syncedMap);
  useGameStore.setState({ levelProgressMap: syncedMap });
}