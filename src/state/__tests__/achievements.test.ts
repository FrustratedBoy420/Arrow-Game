import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(null),
    removeItem: vi.fn().mockResolvedValue(null),
  },
}));

import {
  ACHIEVEMENTS_CATALOG,
  getPlayerTitle,
  calculateSunkCostScore,
  AVATAR_CATALOG
} from '../../config/achievements';
import { useGameStore } from '../gameStore';

describe('Phase 3: The Lockdown - Achievements & Identity System', () => {
  beforeEach(() => {
    useGameStore.setState({
      coins: 0,
      winStreak: 0,
      bestWinStreak: 0,
      highestUnlockedLevel: 1,
      unlockedAchievements: [],
      claimedAchievements: [],
      totalArrowsCleared: 0,
      totalFlawlessWins: 0,
      fastestClearSeconds: null,
      ownedSkins: ['classic'],
      playerTrophies: 1000,
      multiplayerHistory: [],
      activeAchievementToast: null,
      iconsConfig: { homeArrow: 'default' }
    });
  });

  describe('Player Titles & Sunk Cost Index', () => {
    it('calculates player titles correctly across level and star tiers', () => {
      // Level 1, 0 stars -> 10 pts -> Novice Archer
      const title1 = getPlayerTitle(1, 0);
      expect(title1.title).toBe('Novice Archer');
      expect(title1.badge).toBe('🏹');

      // Level 12, 10 stars -> 120 + 50 = 170 pts -> Arrow Tactician
      const title2 = getPlayerTitle(12, 10);
      expect(title2.title).toBe('Arrow Tactician');
      expect(title2.badge).toBe('🎯');

      // Level 30, 40 stars -> 300 + 200 = 500 pts -> Puzzle Grandmaster
      const title3 = getPlayerTitle(30, 40);
      expect(title3.title).toBe('Puzzle Grandmaster');
      expect(title3.badge).toBe('🧩');

      // Level 60, 60 stars -> 600 + 300 = 900 pts -> Imperial Champion
      const title4 = getPlayerTitle(60, 60);
      expect(title4.title).toBe('Imperial Champion');
      expect(title4.badge).toBe('👑');

      // Level 90, 80 stars -> 900 + 400 = 1300 pts -> Quantum Sage
      const title5 = getPlayerTitle(90, 80);
      expect(title5.title).toBe('Quantum Sage');
      expect(title5.badge).toBe('🌌');
    });

    it('computes Sunk Cost Index accurately based on career investment', () => {
      // 10 levels, 30 stars, 150 arrows, 2 skins
      // 10*20 + 30*10 + 150 + 2*150 = 200 + 300 + 150 + 300 = 950
      const score = calculateSunkCostScore(10, 30, 150, 2);
      expect(score).toBe(950);
    });
  });

  describe('Achievement Evaluation & Unlocks', () => {
    it('unlocks streak achievements when winStreak reaches target', () => {
      useGameStore.setState({ winStreak: 3 });
      const unlocked = useGameStore.getState().checkAndUnlockAchievements();

      expect(unlocked.some((a) => a.id === 'streak_3')).toBe(true);
      expect(useGameStore.getState().unlockedAchievements).toContain('streak_3');
      expect(useGameStore.getState().activeAchievementToast?.id).toBe('streak_3');
    });

    it('unlocks speed demon when fastestClearSeconds <= 8', () => {
      useGameStore.setState({ fastestClearSeconds: 6.5 });
      const unlocked = useGameStore.getState().checkAndUnlockAchievements();

      expect(unlocked.some((a) => a.id === 'speed_demon')).toBe(true);
      expect(useGameStore.getState().unlockedAchievements).toContain('speed_demon');
    });

    it('unlocks wardrobe achievements when owning required skins', () => {
      useGameStore.setState({ ownedSkins: ['classic', 'ice_blue', 'neon_green'] });
      const unlocked = useGameStore.getState().checkAndUnlockAchievements();

      expect(unlocked.some((a) => a.id === 'wardrobe_3')).toBe(true);
      expect(useGameStore.getState().unlockedAchievements).toContain('wardrobe_3');
    });
  });

  describe('Reward Claiming', () => {
    it('claims achievement coin reward and marks as claimed', () => {
      useGameStore.setState({
        coins: 100,
        unlockedAchievements: ['streak_3']
      });

      const res = useGameStore.getState().claimAchievementReward('streak_3');
      expect(res.success).toBe(true);
      expect(res.coinsAwarded).toBe(50);
      expect(useGameStore.getState().coins).toBe(150);
      expect(useGameStore.getState().claimedAchievements).toContain('streak_3');

      // Attempt second claim -> fails
      const duplicateRes = useGameStore.getState().claimAchievementReward('streak_3');
      expect(duplicateRes.success).toBe(false);
      expect(useGameStore.getState().coins).toBe(150);
    });

    it('prevents claiming locked achievements', () => {
      const res = useGameStore.getState().claimAchievementReward('streak_12');
      expect(res.success).toBe(false);
      expect(useGameStore.getState().coins).toBe(0);
    });
  });

  describe('Multiplayer Battle Recording & Trophies', () => {
    it('updates trophies and records battle history upon win', () => {
      useGameStore.getState().recordMultiplayerBattle({
        opponentName: 'ArrowPro',
        roomCode: 'TEST-123',
        outcome: 'WIN',
        arrowsCleared: 8,
        totalArrows: 12,
        durationSeconds: 22
      });

      const state = useGameStore.getState();
      expect(state.playerTrophies).toBe(1025); // 1000 + 25
      expect(state.multiplayerHistory.length).toBe(1);
      expect(state.multiplayerHistory[0]?.outcome).toBe('WIN');
      expect(state.multiplayerHistory[0]?.opponentName).toBe('ArrowPro');

      // Win unlocks first blood achievement
      expect(state.unlockedAchievements).toContain('gladiator_win1');
    });

    it('decrements trophies on loss without dropping below floor 1000', () => {
      useGameStore.setState({ playerTrophies: 1005 });

      useGameStore.getState().recordMultiplayerBattle({
        opponentName: 'BotTactician',
        roomCode: 'BOT-1',
        outcome: 'LOSS',
        arrowsCleared: 4,
        totalArrows: 10,
        durationSeconds: 15
      });

      expect(useGameStore.getState().playerTrophies).toBe(1000); // Floored at 1000 (1005 - 12 = 993 -> 1000)
    });
  });
});
