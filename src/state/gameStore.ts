import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { trackEvent } from '../analytics/analytics';
import { createInitialBoard, findHintArrow, isBoardWon, resolveTap } from '../game/engine';
import type { BoardState, GameStatus, LevelDefinition } from '../game/types';
import { getLevel, getNextLevelId, LOADING_LEVEL, setDynamicLevels } from '../levels/levels';
import { completeLevelWithStars, ensureLevelProgressMap, isLevelLocked, loadLevelProgress, saveLevelProgress } from '../systems/levelManagementStore';
import { initializeLevelMap, checkLevelUnlocks, type LevelProgress } from '../systems/levelManagement';
import { ARROW_SKINS, getSkinById, type BoosterItem, type DailyRewardDay, DAILY_REWARDS, type SpinSlice } from '../config/skins';
import { ACHIEVEMENTS_CATALOG, type Achievement, type MatchRecord } from '../config/achievements';

/** Number of levels to load on first fetch */
const INITIAL_LEVEL_BATCH = 20;
/** Number of levels added per subsequent fetch */
const NEXT_LEVEL_BATCH = 5;
/** Coins for a hint once the free hint and hint boosters are used (same as web economy.hintCost). */
export const HINT_COIN_COST = 15;
/** Hearts at level start; a Shield Life adds one. */
const STARTING_LIVES = 3;

type GameStore = {
  board: BoardState;
  currentLevelId: number;
  highestUnlockedLevel: number;
  hasSeenTutorial: boolean;
  status: GameStatus;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  musicEnabled: boolean;
  coins: number;
  winStreak: number;
  bestWinStreak: number;
  activeSkinId: string;
  ownedSkins: string[];
  inventory: {
    extraHints: number;
    extraUndos: number;
    extraLives: number;
  };
  dailyStreakDay: number;
  lastDailyClaimDate: string | null;
  lastFreeSpinDate: string | null;
  lastFreeSpinTimestamp: number | null;
  // Phase 3 State
  unlockedAchievements: string[];
  claimedAchievements: string[];
  totalArrowsCleared: number;
  totalFlawlessWins: number;
  fastestClearSeconds: number | null;
  selectedAvatarId: string;
  playerTrophies: number;
  multiplayerHistory: MatchRecord[];
  activeAchievementToast: Achievement | null;
  // Phase 4 State
  dailyPuzzleState: {
    lastCompletedDate: string | null;
    currentStreak: number;
    bestTimeSeconds: number | null;
    isDailyActive: boolean;
  };
  lastHintArrowId: string | null;
  lastBlockedTap: { arrowId: string; timestamp: number } | null;
  hintUsedThisLevel: boolean;
  /** First undo each level is free; later ones spend an Extra Undo booster. */
  undoUsedThisLevel: boolean;
  /** Hearts this run started with (3, or 4 with a Shield Life). */
  maxLives: number;
  /** Arrows put back by Undo: clearing them again earns no combo coins or lifetime stats. */
  undoneArrowIds: string[];
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
    termsUrl?: string;
    updateUrl?: string;
  } | null;
  adsConfig: {
    showAds: boolean;
    showBanner: boolean;
    showInterstitial: boolean;
    showAppOpen: boolean;
    showRewarded: boolean;
    androidBanner: string;
    androidInterstitial: string;
    androidAppOpen: string;
    androidRewarded: string;
    iosBanner: string;
    iosInterstitial: string;
    iosAppOpen: string;
    iosRewarded: string;
    useTestAds?: boolean;
  };

  resetAllProgress: () => void;
  // Level Management System Integration
  levelProgressMap: Map<number, LevelProgress>;
  starsEarnedThisLevel: number;
  coinsEarnedThisLevel: number;
  hasRecordedCurrentLevel: boolean;
  levelStartTime: number;
  gameStartTime: number | null;
  /** When the run was decided (won / failed); the timer stops here. */
  levelEndTime: number | null;
  finalStarsCalculated: number;
  startLevel: (levelId: number) => void;
  completeTutorial: () => void;
  tapArrow: (arrowId: string) => 'REMOVED' | 'BLOCKED' | 'IGNORED';
  retry: () => void;
  nextLevel: () => void;
  undo: () => 'used' | 'none' | 'empty' | 'blocked';
  /** `paid`: the player watched an ad or pays HINT_COIN_COST once the free hint is used. */
  useHint: (paid?: 'ad' | 'coins') => string | null;
  /** Spend one Extra Life booster for a 4th heart; only before the first tap of a run. */
  activateShield: () => boolean;
  doubleCoinsEarned: () => void;
  continueWithLife: () => void;
  resetWinStreak: () => void;
  buySkin: (skinId: string) => { success: boolean; message?: string };
  equipSkin: (skinId: string) => void;
  buyBooster: (item: BoosterItem) => { success: boolean; message?: string };
  consumeBooster: (type: 'extraHints' | 'extraUndos' | 'extraLives') => boolean;
  claimDailyReward: () => { success: boolean; reward?: DailyRewardDay };
  claimSpinReward: (slice: SpinSlice) => void;
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
  resetAppFlow?: () => void;
  isPaused: boolean;
  pausedAt: number | null;
  accumulatedPausedTime: number;
  pauseGame: () => void;
  resumeGame: () => void;
  isMultiplayerActive: boolean;
  setIsMultiplayerActive: (active: boolean) => void;
  isGameplayActive: boolean;
  // Phase 3 Actions
  setPlayerAvatar: (avatarId: string) => void;
  checkAndUnlockAchievements: () => Achievement[];
  claimAchievementReward: (achievementId: string) => { success: boolean; coinsAwarded: number };
  dismissAchievementToast: () => void;
  recordMultiplayerBattle: (record: Omit<MatchRecord, 'id' | 'timestamp' | 'trophyDelta'>) => void;
  // Phase 4 Actions
  startDailyChallenge: (level: LevelDefinition) => void;
  recordDailyChallengeCompletion: (timeTaken: number) => { coinsAwarded: number; trophiesAwarded: number };
  fetchDailyPuzzle: (serverUrl?: string) => Promise<any>;
  fetchLeaderboard: (category: 'stars' | 'trophies', serverUrl?: string) => Promise<any>;
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
      coins: 0,
      winStreak: 0,
      bestWinStreak: 0,
      activeSkinId: 'classic',
      ownedSkins: ['classic'],
      inventory: {
        extraHints: 0,
        extraUndos: 0,
        extraLives: 0
      },
      dailyStreakDay: 1,
      lastDailyClaimDate: null,
      lastFreeSpinDate: null,
      lastFreeSpinTimestamp: null,
      // Phase 3 Initial State
      unlockedAchievements: [],
      claimedAchievements: [],
      totalArrowsCleared: 0,
      totalFlawlessWins: 0,
      fastestClearSeconds: null,
      selectedAvatarId: 'archer_boy',
      playerTrophies: 1000,
      multiplayerHistory: [],
      activeAchievementToast: null,
      // Phase 4 Initial State
      dailyPuzzleState: {
        lastCompletedDate: null,
        currentStreak: 0,
        bestTimeSeconds: null,
        isDailyActive: false
      },
      coinsEarnedThisLevel: 0,
      lastHintArrowId: null,
      lastBlockedTap: null,
      hintUsedThisLevel: false,
      undoUsedThisLevel: false,
      maxLives: STARTING_LIVES,
      undoneArrowIds: [],
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
      adsConfig: {
        showAds: true,
        showBanner: true,
        showInterstitial: true,
        showAppOpen: true,
        showRewarded: true,
        androidBanner: 'ca-app-pub-1466180289159501/3095811477',
        androidInterstitial: 'ca-app-pub-1466180289159501/2069670266',
        androidAppOpen: 'ca-app-pub-1466180289159501/1199286193',
        androidRewarded: 'ca-app-pub-1466180289159501/6436078651',
        iosBanner: 'ca-app-pub-1466180289159501/2934735716',
        iosInterstitial: 'ca-app-pub-1466180289159501/4411468910',
        iosAppOpen: 'ca-app-pub-1466180289159501/9257395921',
        iosRewarded: 'ca-app-pub-1466180289159501/5224354917',
        useTestAds: false,
      },

      levelProgressMap: initialLevelMap,
      starsEarnedThisLevel: 0,
      hasRecordedCurrentLevel: false,
      levelStartTime: Date.now(),
      gameStartTime: null,
      levelEndTime: null,
      finalStarsCalculated: 3,
      isFetchingConfig: false,
      isPaused: false,
      pausedAt: null,
      accumulatedPausedTime: 0,

      pauseGame: () => {
        const { status, isPaused, gameStartTime } = get();
        if (status === 'playing' && !isPaused && gameStartTime !== null) {
          set({
            isPaused: true,
            pausedAt: Date.now()
          });
        }
      },

      resumeGame: () => {
        const { isPaused, pausedAt, accumulatedPausedTime } = get();
        if (isPaused && pausedAt !== null) {
          const pausedDuration = Date.now() - pausedAt;
          set({
            isPaused: false,
            accumulatedPausedTime: accumulatedPausedTime + pausedDuration,
            pausedAt: null
          });
        }
      },
      isMultiplayerActive: false,
      setIsMultiplayerActive: (active) => set({ isMultiplayerActive: active }),
      isGameplayActive: false,

      resetAllProgress: () => {
        const freshMap = require('../systems/levelManagement').initializeLevelMap();
        set({
          highestUnlockedLevel: 1,
          levelProgressMap: freshMap,
          currentLevelId: 1,
          coins: 0,
          isPaused: false,
          pausedAt: null,
          accumulatedPausedTime: 0
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
        
        const { iconsConfig } = get();
        const isAdmin = !!iconsConfig?.unlockAllLevels;

        // Shield Life is no longer spent automatically: the player chooses it (activateShield)
        set({
          board: createInitialBoard(level, STARTING_LIVES),
          currentLevelId: level.id,
          ...(isAdmin ? { coins: 999999 } : {}),
          status: 'playing',
          lastHintArrowId: null,
          lastBlockedTap: null,
          hintUsedThisLevel: false,
          undoUsedThisLevel: false,
          maxLives: STARTING_LIVES,
          undoneArrowIds: [],
          levelStartTime: Date.now(),
          gameStartTime: null,
          levelEndTime: null,
          finalStarsCalculated: 3,
          isPaused: false,
          pausedAt: null,
          accumulatedPausedTime: 0,
          hasRecordedCurrentLevel: false,
        });
      },

      completeTutorial: () => {
        set({ hasSeenTutorial: true });
        get().startLevel(1);
      },

      tapArrow: (arrowId) => {
        const { gameStartTime, lastBlockedTap, currentLevelId, dailyPuzzleState, status, isPaused, board, undoneArrowIds } = get();
        // no moves once the run is decided, while paused, or on an arrow that already left
        if (status !== 'playing' || isPaused || !board.arrows.some((a) => a.id === arrowId)) return 'IGNORED';
        if (gameStartTime === null) {
          set({ gameStartTime: Date.now() });
        }

        const result = resolveTap(arrowId, board, lastBlockedTap ?? undefined);

        // ponytail: FTUE God-Mode Shield for Levels 1-3 (normal campaign only, not daily puzzle)
        // Wrong taps trigger visual/haptic feedback but do NOT deduct lives, preventing early churn.
        const isGodMode = currentLevelId <= 3 && !dailyPuzzleState?.isDailyActive;
        const effectiveBoard = isGodMode && result.type === 'BLOCKED'
          ? { ...result.board, livesLeft: board.livesLeft }
          : result.board;

        const nextStatus: GameStatus = isBoardWon(effectiveBoard)
          ? 'won'
          : effectiveBoard.livesLeft <= 0
            ? 'failed'
            : 'playing';

        const levelEndTime = nextStatus === 'playing' ? null : Date.now();

        if (result.type === 'REMOVED') {
          trackEvent('move_correct', { levelId: get().currentLevelId, arrowId });
          set((state) => ({
            board: effectiveBoard,
            status: nextStatus,
            levelEndTime,
            lastHintArrowId: null,
            lastBlockedTap: null,
            totalArrowsCleared: (state.totalArrowsCleared || 0) + (undoneArrowIds.includes(arrowId) ? 0 : 1)
          }));
        } else {
          trackEvent('move_wrong', {
            levelId: get().currentLevelId,
            arrowId,
            livesLeft: effectiveBoard.livesLeft
          });
          set({
            board: effectiveBoard,
            status: nextStatus,
            levelEndTime,
            lastHintArrowId: null,
            lastBlockedTap: { arrowId, timestamp: Date.now() }
          });
        }

        if (nextStatus === 'won') {
          trackEvent('level_complete', { levelId: get().currentLevelId });
        }

        if (nextStatus === 'failed') {
          trackEvent('level_failed', { levelId: get().currentLevelId });
        }

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
        const { board, status, isPaused, undoUsedThisLevel, inventory, iconsConfig, undoneArrowIds } = get();
        // a won run must stay won: undo after the last arrow would reopen a recorded level
        if (status !== 'playing' || isPaused) return 'blocked';
        const lastRemovedId = board.removedIds[board.removedIds.length - 1];
        if (!lastRemovedId) return 'empty';

        const originalArrow = board.level.arrows.find((arrow) => arrow.id === lastRemovedId);
        if (!originalArrow) return 'empty';

        const isAdmin = !!iconsConfig?.unlockAllLevels;
        const nextInv = { ...inventory };
        if (undoUsedThisLevel && !isAdmin) {
          if (nextInv.extraUndos <= 0) return 'none';
          nextInv.extraUndos -= 1;
        }

        set({
          board: {
            ...board,
            arrows: [...board.arrows, originalArrow],
            removedIds: board.removedIds.slice(0, -1)
          },
          inventory: nextInv,
          undoUsedThisLevel: true,
          undoneArrowIds: [...undoneArrowIds, lastRemovedId],
          lastHintArrowId: null,
          lastBlockedTap: null
        });
        return 'used';
      },

      useHint: (paid) => {
        const { board, status, isPaused, gameStartTime, hintUsedThisLevel, iconsConfig, inventory, coins } = get();
        const isAdmin = !!iconsConfig?.unlockAllLevels;
        if (status !== 'playing' || isPaused) return null;

        const hintArrow = findHintArrow(board);
        if (!hintArrow) return null;

        // after the free hint: an ad the player watched, coins, or else a hint booster
        const nextInv = { ...inventory };
        let nextCoins = coins;
        if (hintUsedThisLevel && !isAdmin) {
          if (paid === 'ad') {
            /* rewarded video watched */
          } else if (paid === 'coins') {
            if (coins < HINT_COIN_COST) return null;
            nextCoins = coins - HINT_COIN_COST;
          } else if (nextInv.extraHints > 0) {
            nextInv.extraHints -= 1;
          } else {
            return null;
          }
        }

        if (gameStartTime === null) {
          set({ gameStartTime: Date.now() });
        }

        const result = resolveTap(hintArrow.id, board);
        if (result.type !== 'REMOVED') return null;

        const nextStatus: GameStatus = isBoardWon(result.board) ? 'won' : 'playing';

        if (nextStatus === 'won') {
          trackEvent('level_complete', { levelId: get().currentLevelId });
        }

        set({
          board: result.board,
          status: nextStatus,
          inventory: nextInv,
          coins: nextCoins,
          lastHintArrowId: hintArrow.id,
          levelEndTime: nextStatus === 'won' ? Date.now() : null,
          hintUsedThisLevel: isAdmin ? false : true
        });

        return hintArrow.id;
      },

      doubleCoinsEarned: () => {
        const { coinsEarnedThisLevel } = get();
        if (coinsEarnedThisLevel > 0) {
          set((state) => ({
            coins: state.coins + coinsEarnedThisLevel,
            coinsEarnedThisLevel: state.coinsEarnedThisLevel * 2
          }));
        }
      },

      continueWithLife: () => {
        const { board, status, levelEndTime, accumulatedPausedTime } = get();
        if (status !== 'failed') return;
        set({
          board: { ...board, livesLeft: 1 },
          status: 'playing',
          levelEndTime: null,
          accumulatedPausedTime: accumulatedPausedTime + (levelEndTime !== null ? Date.now() - levelEndTime : 0),
          lastBlockedTap: null,
          hasRecordedCurrentLevel: false
        });
      },

      activateShield: () => {
        const { status, gameStartTime, maxLives, inventory, board } = get();
        if (status !== 'playing' || gameStartTime !== null || maxLives > STARTING_LIVES || inventory.extraLives <= 0) return false;
        set({
          board: { ...board, livesLeft: STARTING_LIVES + 1 },
          maxLives: STARTING_LIVES + 1,
          inventory: { ...inventory, extraLives: inventory.extraLives - 1 }
        });
        return true;
      },

      resetWinStreak: () => {
        set({ winStreak: 0 });
      },

      buySkin: (skinId: string) => {
        const { coins, ownedSkins, highestUnlockedLevel, iconsConfig } = get();
        const isAdmin = !!iconsConfig?.unlockAllLevels;
        const skin = getSkinById(skinId);
        if (!skin) return { success: false, message: 'Skin not found' };
        if (ownedSkins.includes(skinId)) {
          set({ activeSkinId: skinId });
          return { success: true, message: 'Equipped!' };
        }
        if (isAdmin) {
          set({
            coins: 999999,
            ownedSkins: Array.from(new Set([...ownedSkins, skinId])),
            activeSkinId: skinId
          });
          return { success: true, message: 'Admin: Unlocked & equipped!' };
        }
        if (skin.unlockLevelReq && highestUnlockedLevel < skin.unlockLevelReq) {
          return { success: false, message: `Reach Level ${skin.unlockLevelReq} to unlock!` };
        }
        if (coins < skin.price) {
          return { success: false, message: `Need ${skin.price - coins} more coins!` };
        }
        set({
          coins: coins - skin.price,
          ownedSkins: [...ownedSkins, skinId],
          activeSkinId: skinId
        });
        return { success: true, message: 'Purchased and equipped!' };
      },

      equipSkin: (skinId: string) => {
        const { ownedSkins } = get();
        if (ownedSkins.includes(skinId)) {
          set({ activeSkinId: skinId });
        }
      },

      buyBooster: (item: BoosterItem) => {
        const { coins, inventory, iconsConfig } = get();
        const isAdmin = !!iconsConfig?.unlockAllLevels;
        if (!isAdmin && coins < item.price) {
          return { success: false, message: `Need ${item.price - coins} more coins!` };
        }
        const nextInv = { ...inventory };
        if (item.id === 'extra_hints') nextInv.extraHints += item.amount;
        else if (item.id === 'extra_undos') nextInv.extraUndos += item.amount;
        else if (item.id === 'extra_lives') nextInv.extraLives += item.amount;

        set({
          coins: isAdmin ? 999999 : coins - item.price,
          inventory: nextInv
        });
        return { success: true, message: `Purchased ${item.name}!` };
      },

      consumeBooster: (type: 'extraHints' | 'extraUndos' | 'extraLives') => {
        const { inventory } = get();
        if (inventory[type] <= 0) return false;
        set({
          inventory: {
            ...inventory,
            [type]: inventory[type] - 1
          }
        });
        return true;
      },

      claimDailyReward: () => {
        const { lastDailyClaimDate, dailyStreakDay, coins, inventory } = get();
        const today = new Date().toISOString().split('T')[0]!;

        if (lastDailyClaimDate === today) {
          return { success: false };
        }

        let nextDay = 1;
        if (lastDailyClaimDate) {
          const lastDate = new Date(lastDailyClaimDate);
          const currentDate = new Date(today);
          const diffTime = currentDate.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive login day
            nextDay = dailyStreakDay >= 7 ? 1 : dailyStreakDay + 1;
          } else {
            // Missed day -> reset to Day 1
            nextDay = 1;
          }
        }

        const reward = DAILY_REWARDS.find((r) => r.day === nextDay) || DAILY_REWARDS[0]!;
        const nextInv = { ...inventory };
        if (reward.hints) nextInv.extraHints += reward.hints;
        if (reward.lives) nextInv.extraLives += reward.lives;

        set({
          coins: coins + reward.coins,
          inventory: nextInv,
          dailyStreakDay: nextDay,
          lastDailyClaimDate: today
        });

        return { success: true, reward };
      },

      claimSpinReward: (slice: SpinSlice) => {
        const { coins, inventory, iconsConfig } = get();
        const isAdmin = !!iconsConfig?.unlockAllLevels;
        const now = Date.now();
        const today = new Date().toISOString().split('T')[0]!;
        const nextInv = { ...inventory };

        let addedCoins = 0;
        if (slice.type === 'coins') addedCoins = slice.amount;
        else if (slice.type === 'hints') nextInv.extraHints += slice.amount;
        else if (slice.type === 'lives') nextInv.extraLives += slice.amount;

        set({
          coins: isAdmin ? 999999 : coins + addedCoins,
          inventory: nextInv,
          lastFreeSpinTimestamp: now,
          lastFreeSpinDate: today
        });

        get().checkAndUnlockAchievements();
      },

      setPlayerAvatar: (avatarId: string) => {
        set({ selectedAvatarId: avatarId });
      },

      checkAndUnlockAchievements: () => {
        const state = get();
        const unlocked = new Set(state.unlockedAchievements || []);
        const newlyUnlocked: Achievement[] = [];

        const evaluatorState = {
          levelProgressMap: state.levelProgressMap,
          highestUnlockedLevel: state.highestUnlockedLevel,
          bestWinStreak: state.bestWinStreak,
          winStreak: state.winStreak,
          totalArrowsCleared: state.totalArrowsCleared || 0,
          totalFlawlessWins: state.totalFlawlessWins || 0,
          fastestClearSeconds: state.fastestClearSeconds,
          ownedSkins: state.ownedSkins,
          playerTrophies: state.playerTrophies || 1000,
          multiplayerHistory: state.multiplayerHistory || [],
          dailyStreakDay: state.dailyStreakDay || 1
        };

        for (const achievement of ACHIEVEMENTS_CATALOG) {
          if (!unlocked.has(achievement.id)) {
            const { isComplete } = achievement.getProgress(evaluatorState);
            if (isComplete) {
              unlocked.add(achievement.id);
              newlyUnlocked.push(achievement);
            }
          }
        }

        if (newlyUnlocked.length > 0) {
          set({
            unlockedAchievements: Array.from(unlocked),
            activeAchievementToast: newlyUnlocked[0]!
          });
        }

        return newlyUnlocked;
      },

      claimAchievementReward: (achievementId: string) => {
        const { unlockedAchievements, claimedAchievements, coins, iconsConfig } = get();
        const isAdmin = !!iconsConfig?.unlockAllLevels;
        const achievement = ACHIEVEMENTS_CATALOG.find((a) => a.id === achievementId);

        if (!achievement) return { success: false, coinsAwarded: 0 };
        if (!(unlockedAchievements || []).includes(achievementId)) return { success: false, coinsAwarded: 0 };
        if ((claimedAchievements || []).includes(achievementId)) return { success: false, coinsAwarded: 0 };

        const reward = achievement.rewardCoins;
        set({
          coins: isAdmin ? 999999 : coins + reward,
          claimedAchievements: [...(claimedAchievements || []), achievementId]
        });

        return { success: true, coinsAwarded: reward };
      },

      dismissAchievementToast: () => {
        set({ activeAchievementToast: null });
      },

      recordMultiplayerBattle: (battleData) => {
        const { multiplayerHistory, playerTrophies } = get();

        const isWin = battleData.outcome === 'WIN';
        const trophyDelta = isWin ? 25 : battleData.outcome === 'LOSS' ? -12 : 0;
        const nextTrophies = Math.max(1000, (playerTrophies || 1000) + trophyDelta);

        const newRecord: MatchRecord = {
          id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          ...battleData,
          trophyDelta
        };

        const updatedHistory = [newRecord, ...(multiplayerHistory || [])].slice(0, 15);

        set({
          playerTrophies: nextTrophies,
          multiplayerHistory: updatedHistory
        });

        get().checkAndUnlockAchievements();
      },

      startDailyChallenge: (level: LevelDefinition) => {
        set({
          board: createInitialBoard(level, STARTING_LIVES),
          currentLevelId: level.id,
          status: 'playing',
          lastHintArrowId: null,
          lastBlockedTap: null,
          hintUsedThisLevel: false,
          undoUsedThisLevel: false,
          maxLives: STARTING_LIVES,
          undoneArrowIds: [],
          levelStartTime: Date.now(),
          gameStartTime: null,
          levelEndTime: null,
          finalStarsCalculated: 3,
          isPaused: false,
          pausedAt: null,
          accumulatedPausedTime: 0,
          hasRecordedCurrentLevel: false,
          dailyPuzzleState: {
            ...get().dailyPuzzleState,
            isDailyActive: true
          }
        });
      },

      recordDailyChallengeCompletion: (timeTaken: number) => {
        const { dailyPuzzleState, coins, playerTrophies, iconsConfig } = get();
        const isAdmin = !!iconsConfig?.unlockAllLevels;
        const today = new Date().toISOString().split('T')[0]!;

        const alreadyDoneToday = dailyPuzzleState?.lastCompletedDate === today;
        const coinsAwarded = alreadyDoneToday ? 15 : 100;
        const trophiesAwarded = alreadyDoneToday ? 5 : 25;

        // Calculate streak
        let nextStreak = dailyPuzzleState?.currentStreak || 0;
        if (!alreadyDoneToday) {
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
          if (dailyPuzzleState?.lastCompletedDate === yesterday) {
            nextStreak += 1;
          } else {
            nextStreak = 1;
          }
        }

        const prevBest = dailyPuzzleState?.bestTimeSeconds;
        const nextBest = prevBest !== null && prevBest !== undefined ? Math.min(prevBest, timeTaken) : timeTaken;

        set({
          coins: isAdmin ? 999999 : coins + coinsAwarded,
          playerTrophies: (playerTrophies || 1000) + trophiesAwarded,
          dailyPuzzleState: {
            lastCompletedDate: today,
            currentStreak: nextStreak,
            bestTimeSeconds: nextBest,
            isDailyActive: false
          }
        });

        get().checkAndUnlockAchievements();

        // Sync user profile to backend
        import('../utils/userRegistration').then(({ registerUserProfile }) => {
          registerUserProfile();
        }).catch((err) => console.log('Error syncing user profile:', err));

        return { coinsAwarded, trophiesAwarded };
      },

      fetchDailyPuzzle: async (serverUrl?: string) => {
        let baseUrl = serverUrl?.trim() || 'https://arrow-game-be.vercel.app';
        baseUrl = baseUrl.replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://${baseUrl}`;
        }

        try {
          const response = await fetch(`${baseUrl}/api/daily-puzzle`);
          if (!response.ok) throw new Error(`Status ${response.status}`);
          return await response.json();
        } catch (err) {
          console.warn('⚠️ Failed to fetch daily puzzle:', err);
          return null;
        }
      },

      fetchLeaderboard: async (category: 'stars' | 'trophies', serverUrl?: string) => {
        let baseUrl = serverUrl?.trim() || 'https://arrow-game-be.vercel.app';
        baseUrl = baseUrl.replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://${baseUrl}`;
        }

        try {
          const systemId = await AsyncStorage.getItem('game_system_id');
          const url = `${baseUrl}/api/leaderboard?category=${category}&systemId=${encodeURIComponent(systemId || '')}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Status ${response.status}`);
          return await response.json();
        } catch (err) {
          console.warn('⚠️ Failed to fetch leaderboard:', err);
          return null;
        }
      },

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),

      fetchGameConfig: async (serverUrl) => {
        set({ isFetchingConfig: true });
        let baseUrl = serverUrl?.trim() || 'https://arrow-game-be.vercel.app';
        baseUrl = baseUrl.replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://${baseUrl}`;
        }

        try {
          const response = await fetch(`${baseUrl}/api/config`);
          if (!response.ok) throw new Error(`Server returned status ${response.status}`);
          const resData = await response.json();

          if (resData) {
            const { levels: serverLevels, music, icons, version, ads, pusherKey, pusherCluster } = resData;

            if (pusherKey) {
              await AsyncStorage.setItem('multiplayer_pusher_key', pusherKey.trim());
            }
            if (pusherCluster) {
              await AsyncStorage.setItem('multiplayer_pusher_cluster', pusherCluster.trim());
            }

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
              versionConfig: version || null,
              adsConfig: ads ? { ...get().adsConfig, ...ads } : get().adsConfig
            });

            // Dynamically import adManager to preload ads now that adsConfig is loaded
            void import('../utils/ads').then(({ adManager }) => {
              adManager.preloadAllAds();
            });
          }
        } catch (err) {
          console.warn('⚠️ Failed to fetch dynamic game config:', err);
        } finally {
          set({ isFetchingConfig: false });
        }
      },

      /**
       * Lightweight version-only check — does NOT reload levels.
       * Use this on internet reconnect to check for updates without heavy data fetch.
       */
      fetchVersionConfig: async (serverUrl) => {
        let baseUrl = serverUrl?.trim() || 'https://arrow-game-be.vercel.app';
        baseUrl = baseUrl.replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://${baseUrl}`;
        }

        try {
          const response = await fetch(`${baseUrl}/api/config`);
          if (!response.ok) return;
          const resData = await response.json();
          if (resData?.version) {
            set({ versionConfig: resData.version });
            console.log(`✅ Version config refreshed: ${JSON.stringify(resData.version)}`);
          }
        } catch (err) {
          console.warn('⚠️ Failed to fetch version config:', err);
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

        try {
          let savedUrl = await AsyncStorage.getItem('multiplayer_url');
          if (savedUrl && savedUrl.includes('arrow-game-backend.vercel.app')) {
            savedUrl = 'https://arrow-game-be.vercel.app';
            await AsyncStorage.setItem('multiplayer_url', savedUrl);
          }
          let baseUrl = savedUrl?.trim() || 'https://arrow-game-be.vercel.app';
          baseUrl = baseUrl.replace(/\/$/, '');
          if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = `https://${baseUrl}`;
          }

          console.log('👑 Admin: fetching ALL levels from server...');
          const response = await fetch(`${baseUrl}/api/config`);
          if (!response.ok) throw new Error(`Status ${response.status}`);

          const resData = await response.json();
          const serverLevels: LevelDefinition[] = resData.levels || [];

          if (!Array.isArray(serverLevels) || serverLevels.length === 0) {
            console.warn('⚠️ Admin fetch: no levels returned from server.');
            return;
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

          console.log(`👑 Admin: all ${serverLevels.length} levels loaded and unlocked.`);
        } catch (err) {
          console.warn('⚠️ Admin: failed to fetch all levels:', err);
        }
      },

      fetchNextLevels: async () => {
        const { mergeLevelProgressMap } = await import('../systems/levelManagement');
        const activeLevels = get().dynamicLevels;
        const currentCount = activeLevels ? activeLevels.length : INITIAL_LEVEL_BATCH;
        const targetCount = currentCount + NEXT_LEVEL_BATCH;
        console.log(`🔓 Fetching next ${NEXT_LEVEL_BATCH} levels (total: ${targetCount}).`);

        try {
          let savedUrl = await AsyncStorage.getItem('multiplayer_url');
          if (savedUrl && savedUrl.includes('arrow-game-backend.vercel.app')) {
            savedUrl = 'https://arrow-game-be.vercel.app';
            await AsyncStorage.setItem('multiplayer_url', savedUrl);
          }
          let baseUrl = savedUrl?.trim() || 'https://arrow-game-be.vercel.app';
          baseUrl = baseUrl.replace(/\/$/, '');
          if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = `https://${baseUrl}`;
          }

          const response = await fetch(`${baseUrl}/api/config`);
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
            console.log(`✅ Levels expanded: now showing 1–${nextLevels.length}.`);
            return;
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch next levels (offline or server error):', err);
        }

        // No offline fallback — level.json is intentionally empty.
        // The player must reconnect to unlock more levels.
        console.log('ℹ️ Cannot unlock more levels offline. Please reconnect.');
      },

      recordLevelCompletion: async (timeTaken, heartsLost) => {
        // Guard: only run once per level session (prevents React Strict Mode double-fire)
        if (get().hasRecordedCurrentLevel) return;
        set({ hasRecordedCurrentLevel: true });

        const { currentLevelId, finalStarsCalculated, dynamicLevels } = get();

        // ensureLevelProgressMap converts plain objects (from AsyncStorage rehydration) to a Map
        // We must read wasAlreadyCompleted from it BEFORE completeLevelWithStars mutates it
        const levelProgressMap = ensureLevelProgressMap(get().levelProgressMap);

        // Read BEFORE completeLevelWithStars mutates isCompleted to true
        const wasAlreadyCompleted = levelProgressMap.get(currentLevelId)?.isCompleted ?? false;

        const result = completeLevelWithStars(
          levelProgressMap,
          currentLevelId,
          timeTaken,
          heartsLost,
          finalStarsCalculated
        );

        let earned = 0;
        if (wasAlreadyCompleted) {
          earned = 5;
        } else {
          if (finalStarsCalculated === 1) earned = 10;
          else if (finalStarsCalculated === 2) earned = 15;
          else if (finalStarsCalculated >= 3) earned = 25;
        }

        // Win streak calculation: perfect completion (0 hearts lost) increments streak, else resets
        const currentStreak = get().winStreak;
        let nextStreak = currentStreak;
        if (heartsLost === 0) {
          nextStreak = currentStreak + 1;
        } else {
          nextStreak = 0;
        }

        // Streak Multiplier: 1.5x at 3+ streak, 2.0x at 5+ streak
        const multiplier = nextStreak >= 5 ? 2.0 : nextStreak >= 3 ? 1.5 : 1.0;
        earned = Math.round(earned * multiplier);

        // Calculate highest unlocked level from levelProgressMap
        let maxUnlocked = 1;
        for (const [lvlId, progress] of levelProgressMap.entries()) {
          if (!progress.isLocked && lvlId > maxUnlocked) {
            maxUnlocked = lvlId;
          }
        }

        const prevFastest = get().fastestClearSeconds;
        const nextFastest = prevFastest !== null ? Math.min(prevFastest, timeTaken) : timeTaken;

        set((state) => ({ 
          starsEarnedThisLevel: finalStarsCalculated,
          coinsEarnedThisLevel: earned,
          coins: state.coins + earned,
          winStreak: nextStreak,
          bestWinStreak: Math.max(state.bestWinStreak, nextStreak),
          highestUnlockedLevel: Math.max(state.highestUnlockedLevel, maxUnlocked),
          fastestClearSeconds: nextFastest,
          totalFlawlessWins: heartsLost === 0 ? (state.totalFlawlessWins || 0) + 1 : (state.totalFlawlessWins || 0)
        }));

        // Persist updated progress (includes newly unlocked levels from checkLevelUnlocks)
        await saveLevelProgress(levelProgressMap);

        // Force re-render by replacing the map reference
        set({ levelProgressMap: new Map(levelProgressMap) });

        // Trigger Phase 3 Achievement evaluation
        get().checkAndUnlockAchievements();

        // Sync progress to backend
        import('../utils/userRegistration').then(({ registerUserProfile }) => {
          registerUserProfile();
        }).catch((err) => console.log('Error syncing user profile:', err));

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
      name: 'arrowverse-multiplayer-progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentLevelId: state.currentLevelId,
        highestUnlockedLevel: state.highestUnlockedLevel,
        hasSeenTutorial: state.hasSeenTutorial,
        soundEnabled: state.soundEnabled,
        hapticsEnabled: state.hapticsEnabled,
        musicEnabled: state.musicEnabled,
        coins: state.coins,
        winStreak: state.winStreak,
        bestWinStreak: state.bestWinStreak,
        activeSkinId: state.activeSkinId,
        ownedSkins: state.ownedSkins,
        inventory: state.inventory,
        dailyStreakDay: state.dailyStreakDay,
        lastDailyClaimDate: state.lastDailyClaimDate,
        lastFreeSpinDate: state.lastFreeSpinDate,
        lastFreeSpinTimestamp: state.lastFreeSpinTimestamp,
        // Phase 3 Persistence
        unlockedAchievements: state.unlockedAchievements,
        claimedAchievements: state.claimedAchievements,
        totalArrowsCleared: state.totalArrowsCleared,
        totalFlawlessWins: state.totalFlawlessWins,
        fastestClearSeconds: state.fastestClearSeconds,
        selectedAvatarId: state.selectedAvatarId,
        playerTrophies: state.playerTrophies,
        multiplayerHistory: state.multiplayerHistory,
        // Phase 4 Persistence
        dailyPuzzleState: state.dailyPuzzleState,
        // Persist the loaded batch so levels survive a background-kill restart
        dynamicLevels: state.dynamicLevels,
        musicUrls: state.musicUrls,
        iconsConfig: state.iconsConfig,
        versionConfig: state.versionConfig,
        adsConfig: state.adsConfig
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Fallback defaults for existing users
          if (!state.ownedSkins || state.ownedSkins.length === 0) {
            state.ownedSkins = ['classic'];
          }
          if (!state.activeSkinId) {
            state.activeSkinId = 'classic';
          }
          if (!state.inventory) {
            state.inventory = { extraHints: 0, extraUndos: 0, extraLives: 0 };
          }
          if (!state.dailyStreakDay) {
            state.dailyStreakDay = 1;
          }
          if (!state.unlockedAchievements) {
            state.unlockedAchievements = [];
          }
          if (!state.claimedAchievements) {
            state.claimedAchievements = [];
          }
          if (typeof state.totalArrowsCleared !== 'number') {
            state.totalArrowsCleared = 0;
          }
          if (typeof state.totalFlawlessWins !== 'number') {
            state.totalFlawlessWins = 0;
          }
          if (!state.selectedAvatarId) {
            state.selectedAvatarId = 'archer_boy';
          }
          if (typeof state.playerTrophies !== 'number') {
            state.playerTrophies = 1000;
          }
          if (!state.multiplayerHistory) {
            state.multiplayerHistory = [];
          }
          if (!state.dailyPuzzleState) {
            state.dailyPuzzleState = {
              lastCompletedDate: null,
              currentStreak: 0,
              bestTimeSeconds: null,
              isDailyActive: false
            };
          }

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

/** Seconds the current run took: pauses and time on the fail screen are excluded; stops at the win. */
export function runSeconds(state: Pick<GameStore, 'gameStartTime' | 'levelStartTime' | 'levelEndTime' | 'accumulatedPausedTime'>): number {
  const start = state.gameStartTime ?? state.levelStartTime;
  const end = state.levelEndTime ?? Date.now();
  return Math.max(1, Math.round((end - start - (state.accumulatedPausedTime || 0)) / 1000));
}

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
