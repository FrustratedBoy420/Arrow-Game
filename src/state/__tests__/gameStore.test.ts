import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(null),
    removeItem: vi.fn().mockResolvedValue(null),
  },
}));

import { useGameStore } from '../gameStore';
import { BOOSTER_ITEMS, SPIN_SLICES } from '../../config/skins';

describe('gameStore Phase 1 retention mechanics', () => {
  beforeEach(() => {
    useGameStore.setState({
      coins: 100,
      coinsEarnedThisLevel: 25,
      winStreak: 3,
      bestWinStreak: 3,
      status: 'failed'
    });
  });

  it('doubles coins earned when rewarded ad is claimed', () => {
    useGameStore.getState().doubleCoinsEarned();
    const state = useGameStore.getState();

    expect(state.coins).toBe(125);
    expect(state.coinsEarnedThisLevel).toBe(50);
  });

  it('restores 1 life and resets status to playing on continueWithLife', () => {
    useGameStore.getState().continueWithLife();
    const state = useGameStore.getState();

    expect(state.status).toBe('playing');
    expect(state.board.livesLeft).toBe(1);
    expect(state.hasRecordedCurrentLevel).toBe(false);
  });

  it('resets win streak to zero', () => {
    useGameStore.getState().resetWinStreak();
    const state = useGameStore.getState();

    expect(state.winStreak).toBe(0);
    expect(state.bestWinStreak).toBe(3);
  });
});

describe('gameStore Phase 2 Economy & Habit mechanics', () => {
  beforeEach(() => {
    useGameStore.setState({
      coins: 500,
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
      highestUnlockedLevel: 10
    });
  });

  it('allows purchasing and equipping a skin when user has enough coins', () => {
    const res = useGameStore.getState().buySkin('ice_blue'); // price: 200
    expect(res.success).toBe(true);

    const state = useGameStore.getState();
    expect(state.coins).toBe(300);
    expect(state.ownedSkins).toContain('ice_blue');
    expect(state.activeSkinId).toBe('ice_blue');
  });

  it('rejects buying a skin when user has insufficient coins', () => {
    useGameStore.setState({ coins: 50 });
    const res = useGameStore.getState().buySkin('ice_blue'); // price: 200
    expect(res.success).toBe(false);

    const state = useGameStore.getState();
    expect(state.coins).toBe(50);
    expect(state.activeSkinId).toBe('classic');
  });

  it('equips an already owned skin without deducting coins', () => {
    useGameStore.setState({ ownedSkins: ['classic', 'ice_blue'], coins: 100 });
    useGameStore.getState().equipSkin('ice_blue');

    const state = useGameStore.getState();
    expect(state.activeSkinId).toBe('ice_blue');
    expect(state.coins).toBe(100);
  });

  it('purchases and consumes booster items correctly', () => {
    const hintBooster = BOOSTER_ITEMS.find((b) => b.id === 'extra_hints')!; // price 40, amount 3
    const res = useGameStore.getState().buyBooster(hintBooster);
    expect(res.success).toBe(true);

    let state = useGameStore.getState();
    expect(state.coins).toBe(460);
    expect(state.inventory.extraHints).toBe(3);

    // Consume booster
    const consumed = useGameStore.getState().consumeBooster('extraHints');
    expect(consumed).toBe(true);

    state = useGameStore.getState();
    expect(state.inventory.extraHints).toBe(2);
  });

  it('claims daily reward and updates streak and wallet', () => {
    const res = useGameStore.getState().claimDailyReward();
    expect(res.success).toBe(true);

    const state = useGameStore.getState();
    expect(state.coins).toBeGreaterThan(500);
    expect(state.lastDailyClaimDate).toBe(new Date().toISOString().split('T')[0]);

    // Prevent duplicate claim on same day
    const duplicate = useGameStore.getState().claimDailyReward();
    expect(duplicate.success).toBe(false);
  });

  it('claims spin wheel reward and updates inventory and coins', () => {
    const jackpotSlice = SPIN_SLICES.find((s) => s.amount === 250)!;
    useGameStore.getState().claimSpinReward(jackpotSlice);

    const state = useGameStore.getState();
    expect(state.coins).toBe(750);
    expect(state.lastFreeSpinDate).toBe(new Date().toISOString().split('T')[0]);
  });
});

describe('gameStore Phase 4 Eternity & Endgame mechanics', () => {
  beforeEach(() => {
    useGameStore.setState({
      coins: 200,
      playerTrophies: 1200,
      currentLevelId: 1,
      dailyPuzzleState: {
        lastCompletedDate: null,
        currentStreak: 0,
        bestTimeSeconds: null,
        isDailyActive: false
      }
    });
  });

  it('preserves lives on blocked tap during Level 1-3 God-Mode', () => {
    // Setup Level 1 board with 1 blocked arrow
    useGameStore.setState({
      currentLevelId: 2,
      status: 'playing',
      isPaused: false,
      board: {
        level: {
          id: 2,
          title: 'Test',
          difficulty: 'Easy',
          gridSize: { columns: 3, rows: 3 },
          arrows: []
        },
        arrows: [
          {
            id: 'blocked_arr',
            path: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
            fullPath: [{ x: 0, y: 0 }, { x: 1, y: 0 }]
          },
          {
            id: 'blocker_arr',
            path: [{ x: 2, y: 0 }, { x: 2, y: 2 }],
            fullPath: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }]
          }
        ],
        livesLeft: 3,
        removedIds: []
      }
    });

    const result = useGameStore.getState().tapArrow('blocked_arr');
    expect(result).toBe('BLOCKED');

    // God-Mode shield prevents life deduction
    const state = useGameStore.getState();
    expect(state.board.livesLeft).toBe(3);
    expect(state.status).toBe('playing');
  });

  it('records daily challenge completion and increments streak and trophies', () => {
    const res = useGameStore.getState().recordDailyChallengeCompletion(22);
    expect(res.coinsAwarded).toBe(100);
    expect(res.trophiesAwarded).toBe(25);

    const state = useGameStore.getState();
    expect(state.coins).toBe(300);
    expect(state.playerTrophies).toBe(1225);
    expect(state.dailyPuzzleState.currentStreak).toBe(1);
    expect(state.dailyPuzzleState.bestTimeSeconds).toBe(22);
    expect(state.dailyPuzzleState.lastCompletedDate).toBe(new Date().toISOString().split('T')[0]);
  });
});

describe('gameStore run rules shared with the web game', () => {
  const level = {
    id: 9,
    title: 'Rules',
    difficulty: 'Easy' as const,
    gridSize: { columns: 3, rows: 3 },
    arrows: [
      { id: 'free', path: [{ x: 0, y: 2 }, { x: 1, y: 2 }], fullPath: [{ x: 0, y: 2 }, { x: 1, y: 2 }] },
      { id: 'other', path: [{ x: 0, y: 0 }, { x: 0, y: 1 }], fullPath: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }
    ]
  };
  const fresh = (extra: Record<string, unknown> = {}) =>
    useGameStore.setState({
      currentLevelId: 9,
      status: 'playing',
      isPaused: false,
      gameStartTime: null,
      hintUsedThisLevel: false,
      undoUsedThisLevel: false,
      maxLives: 3,
      undoneArrowIds: [],
      coins: 0,
      iconsConfig: { homeArrow: '➤' },
      inventory: { extraHints: 0, extraUndos: 0, extraLives: 0 },
      board: { level, arrows: level.arrows, livesLeft: 3, removedIds: [], blockedAttemptIds: [] },
      ...extra
    });

  it('ignores taps once the run is won', () => {
    fresh({ status: 'won' });
    expect(useGameStore.getState().tapArrow('free')).toBe('IGNORED');
  });

  it('first undo is free, the next one spends an Extra Undo, then stops', () => {
    fresh({ inventory: { extraHints: 0, extraUndos: 1, extraLives: 0 } });
    const s = useGameStore.getState();
    s.tapArrow('free');
    expect(useGameStore.getState().undo()).toBe('used');
    useGameStore.getState().tapArrow('free');
    expect(useGameStore.getState().undo()).toBe('used');
    expect(useGameStore.getState().inventory.extraUndos).toBe(0);
    useGameStore.getState().tapArrow('free');
    expect(useGameStore.getState().undo()).toBe('none');
  });

  it('second hint needs a booster or coins and is never free', () => {
    fresh({ coins: 20 });
    expect(useGameStore.getState().useHint()).not.toBeNull();
    expect(useGameStore.getState().useHint()).toBeNull();
    expect(useGameStore.getState().useHint('coins')).not.toBeNull();
    expect(useGameStore.getState().coins).toBe(5);
  });

  it('shield adds a 4th heart only before the first tap', () => {
    fresh({ inventory: { extraHints: 0, extraUndos: 0, extraLives: 2 } });
    expect(useGameStore.getState().activateShield()).toBe(true);
    expect(useGameStore.getState().board.livesLeft).toBe(4);
    expect(useGameStore.getState().activateShield()).toBe(false);
    expect(useGameStore.getState().inventory.extraLives).toBe(1);
  });
});
