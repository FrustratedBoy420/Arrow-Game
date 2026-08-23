import type { LevelProgress } from '../systems/levelManagement';
import { getTotalStarsEarned } from '../systems/levelManagement';
import { ensureLevelProgressMap } from '../systems/levelManagementStore';

export type AchievementCategory = 'stars' | 'streak' | 'skills' | 'economy' | 'multiplayer';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  targetValue: number;
  rewardCoins: number;
  getProgress: (state: AchievementEvaluatorState) => { current: number; max: number; isComplete: boolean };
};

export type MatchRecord = {
  id: string;
  timestamp: number;
  opponentName: string;
  roomCode: string;
  outcome: 'WIN' | 'LOSS' | 'DRAW';
  arrowsCleared: number;
  totalArrows: number;
  durationSeconds: number;
  trophyDelta: number;
};

export type AvatarDefinition = {
  id: string;
  name: string;
  emoji: string;
  bgGradient: [string, string];
  borderGlow: string;
  unlockReqText: string;
  isUnlocked: (state: AchievementEvaluatorState) => boolean;
};

export type AchievementEvaluatorState = {
  levelProgressMap: Map<number, LevelProgress> | Map<number, any> | Record<string, any>;
  highestUnlockedLevel: number;
  bestWinStreak: number;
  winStreak: number;
  totalArrowsCleared: number;
  totalFlawlessWins: number;
  fastestClearSeconds: number | null;
  ownedSkins: string[];
  playerTrophies: number;
  multiplayerHistory: MatchRecord[];
  dailyStreakDay: number;
};

export const ACHIEVEMENTS_CATALOG: Achievement[] = [
  // 1. Stars Category
  {
    id: 'star_bronze',
    title: 'Star Seeker',
    description: 'Collect 25 total stars across levels.',
    icon: '⭐',
    category: 'stars',
    targetValue: 25,
    rewardCoins: 50,
    getProgress: (s) => {
      const pMap = ensureLevelProgressMap(s.levelProgressMap);
      const current = getTotalStarsEarned(pMap);
      return { current: Math.min(25, current), max: 25, isComplete: current >= 25 };
    }
  },
  {
    id: 'star_silver',
    title: 'Constellation',
    description: 'Collect 75 total stars across levels.',
    icon: '🌟',
    category: 'stars',
    targetValue: 75,
    rewardCoins: 120,
    getProgress: (s) => {
      const pMap = ensureLevelProgressMap(s.levelProgressMap);
      const current = getTotalStarsEarned(pMap);
      return { current: Math.min(75, current), max: 75, isComplete: current >= 75 };
    }
  },
  {
    id: 'star_gold',
    title: 'Galaxy Master',
    description: 'Collect 150 total stars across levels.',
    icon: '💫',
    category: 'stars',
    targetValue: 150,
    rewardCoins: 250,
    getProgress: (s) => {
      const pMap = ensureLevelProgressMap(s.levelProgressMap);
      const current = getTotalStarsEarned(pMap);
      return { current: Math.min(150, current), max: 150, isComplete: current >= 150 };
    }
  },

  // 2. Streaks Category
  {
    id: 'streak_3',
    title: 'On Fire!',
    description: 'Achieve a 3-level win streak.',
    icon: '🔥',
    category: 'streak',
    targetValue: 3,
    rewardCoins: 50,
    getProgress: (s) => {
      const current = Math.max(s.winStreak, s.bestWinStreak);
      return { current: Math.min(3, current), max: 3, isComplete: current >= 3 };
    }
  },
  {
    id: 'streak_7',
    title: 'Unstoppable',
    description: 'Achieve a 7-level win streak.',
    icon: '⚡',
    category: 'streak',
    targetValue: 7,
    rewardCoins: 150,
    getProgress: (s) => {
      const current = Math.max(s.winStreak, s.bestWinStreak);
      return { current: Math.min(7, current), max: 7, isComplete: current >= 7 };
    }
  },
  {
    id: 'streak_12',
    title: 'Legendary Run',
    description: 'Achieve a 12-level win streak.',
    icon: '👑',
    category: 'streak',
    targetValue: 12,
    rewardCoins: 350,
    getProgress: (s) => {
      const current = Math.max(s.winStreak, s.bestWinStreak);
      return { current: Math.min(12, current), max: 12, isComplete: current >= 12 };
    }
  },

  // 3. Skills Category
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Clear any level in under 8 seconds.',
    icon: '⏱️',
    category: 'skills',
    targetValue: 1,
    rewardCoins: 100,
    getProgress: (s) => {
      const isComplete = s.fastestClearSeconds !== null && s.fastestClearSeconds <= 8;
      return { current: isComplete ? 1 : 0, max: 1, isComplete };
    }
  },
  {
    id: 'flawless_10',
    title: 'Flawless Archer',
    description: 'Clear 10 levels with 3 hearts intact.',
    icon: '🛡️',
    category: 'skills',
    targetValue: 10,
    rewardCoins: 120,
    getProgress: (s) => {
      const current = s.totalFlawlessWins || 0;
      return { current: Math.min(10, current), max: 10, isComplete: current >= 10 };
    }
  },
  {
    id: 'arrow_master',
    title: 'Arrow Buster',
    description: 'Clear 300 arrows across your journey.',
    icon: '🏹',
    category: 'skills',
    targetValue: 300,
    rewardCoins: 150,
    getProgress: (s) => {
      const current = s.totalArrowsCleared || 0;
      return { current: Math.min(300, current), max: 300, isComplete: current >= 300 };
    }
  },
  {
    id: 'arrow_legend',
    title: 'Arrow Annihilator',
    description: 'Clear 1,000 arrows across your journey.',
    icon: '💥',
    category: 'skills',
    targetValue: 1000,
    rewardCoins: 300,
    getProgress: (s) => {
      const current = s.totalArrowsCleared || 0;
      return { current: Math.min(1000, current), max: 1000, isComplete: current >= 1000 };
    }
  },

  // 4. Economy Category
  {
    id: 'wardrobe_3',
    title: 'Stylist',
    description: 'Unlock and own 3 unique Arrow Skins.',
    icon: '🎨',
    category: 'economy',
    targetValue: 3,
    rewardCoins: 100,
    getProgress: (s) => {
      const count = s.ownedSkins?.length || 1;
      return { current: Math.min(3, count), max: 3, isComplete: count >= 3 };
    }
  },
  {
    id: 'wardrobe_6',
    title: 'Fashion Royalty',
    description: 'Unlock and own 6 unique Arrow Skins.',
    icon: '💎',
    category: 'economy',
    targetValue: 6,
    rewardCoins: 250,
    getProgress: (s) => {
      const count = s.ownedSkins?.length || 1;
      return { current: Math.min(6, count), max: 6, isComplete: count >= 6 };
    }
  },
  {
    id: 'daily_devotee',
    title: 'Dedicated Tactician',
    description: 'Reach Day 5 in the Daily Login Calendar.',
    icon: '📅',
    category: 'economy',
    targetValue: 5,
    rewardCoins: 100,
    getProgress: (s) => {
      const day = s.dailyStreakDay || 1;
      return { current: Math.min(5, day), max: 5, isComplete: day >= 5 };
    }
  },

  // 5. Multiplayer Category
  {
    id: 'gladiator_win1',
    title: 'First Blood',
    description: 'Win your first 1v1 Multiplayer battle.',
    icon: '⚔️',
    category: 'multiplayer',
    targetValue: 1,
    rewardCoins: 75,
    getProgress: (s) => {
      const wins = s.multiplayerHistory?.filter((m) => m.outcome === 'WIN').length || 0;
      return { current: Math.min(1, wins), max: 1, isComplete: wins >= 1 };
    }
  },
  {
    id: 'gladiator_win5',
    title: 'Arena Gladiator',
    description: 'Win 5 1v1 Multiplayer battles.',
    icon: '🏆',
    category: 'multiplayer',
    targetValue: 5,
    rewardCoins: 150,
    getProgress: (s) => {
      const wins = s.multiplayerHistory?.filter((m) => m.outcome === 'WIN').length || 0;
      return { current: Math.min(5, wins), max: 5, isComplete: wins >= 5 };
    }
  },
  {
    id: 'gladiator_win15',
    title: 'Arena Titan',
    description: 'Win 15 1v1 Multiplayer battles.',
    icon: '🥇',
    category: 'multiplayer',
    targetValue: 15,
    rewardCoins: 350,
    getProgress: (s) => {
      const wins = s.multiplayerHistory?.filter((m) => m.outcome === 'WIN').length || 0;
      return { current: Math.min(15, wins), max: 15, isComplete: wins >= 15 };
    }
  }
];

export const AVATAR_CATALOG: AvatarDefinition[] = [
  {
    id: 'archer_boy',
    name: 'Rookie Scout',
    emoji: '🏹',
    bgGradient: ['#4E342E', '#3E2723'],
    borderGlow: '#A1887F',
    unlockReqText: 'Unlocked by Default',
    isUnlocked: () => true
  },
  {
    id: 'cyber_bot',
    name: 'Cyber Core',
    emoji: '🤖',
    bgGradient: ['#004D40', '#00796B'],
    borderGlow: '#00E676',
    unlockReqText: 'Own Cyber Matrix Skin',
    isUnlocked: (s) => (s.ownedSkins || []).includes('neon_green')
  },
  {
    id: 'cryo_sage',
    name: 'Frost Guardian',
    emoji: '❄️',
    bgGradient: ['#006064', '#0097A7'],
    borderGlow: '#00E5FF',
    unlockReqText: 'Own Glacial Shard Skin',
    isUnlocked: (s) => (s.ownedSkins || []).includes('ice_blue')
  },
  {
    id: 'gold_king',
    name: 'Imperial Monarch',
    emoji: '👑',
    bgGradient: ['#FF6F00', '#FF8F00'],
    borderGlow: '#FFD700',
    unlockReqText: 'Reach Level 15',
    isUnlocked: (s) => (s.highestUnlockedLevel || 1) >= 15
  },
  {
    id: 'fire_dragon',
    name: 'Dragon Warlord',
    emoji: '🐲',
    bgGradient: ['#BF360C', '#D84315'],
    borderGlow: '#FF3D00',
    unlockReqText: 'Reach 5-Level Win Streak',
    isUnlocked: (s) => Math.max(s.winStreak || 0, s.bestWinStreak || 0) >= 5
  },
  {
    id: 'ninja_blade',
    name: 'Shadow Shinobi',
    emoji: '🥷',
    bgGradient: ['#212121', '#424242'],
    borderGlow: '#FF1744',
    unlockReqText: 'Clear Level in < 8 seconds',
    isUnlocked: (s) => s.fastestClearSeconds !== null && s.fastestClearSeconds <= 8
  },
  {
    id: 'cosmic_wizard',
    name: 'Void Sorcerer',
    emoji: '🧙‍♂️',
    bgGradient: ['#4A148C', '#6A1B9A'],
    borderGlow: '#D500F9',
    unlockReqText: 'Reach Level 30',
    isUnlocked: (s) => (s.highestUnlockedLevel || 1) >= 30
  },
  {
    id: 'diamond_champion',
    name: 'Grand Apex',
    emoji: '💎',
    bgGradient: ['#1A237E', '#283593'],
    borderGlow: '#00E676',
    unlockReqText: 'Collect 75 Total Stars',
    isUnlocked: (s) => {
      const pMap = ensureLevelProgressMap(s.levelProgressMap);
      return getTotalStarsEarned(pMap) >= 75;
    }
  }
];

export type PlayerTitleInfo = {
  title: string;
  badge: string;
  color: string;
  rankPoints: number;
};

export function getPlayerTitle(level: number, stars: number): PlayerTitleInfo {
  const rankPoints = level * 10 + stars * 5;

  if (rankPoints >= 1200) {
    return { title: 'Quantum Sage', badge: '🌌', color: '#D500F9', rankPoints };
  }
  if (rankPoints >= 700) {
    return { title: 'Imperial Champion', badge: '👑', color: '#FF3D00', rankPoints };
  }
  if (rankPoints >= 350) {
    return { title: 'Puzzle Grandmaster', badge: '🧩', color: '#FFD700', rankPoints };
  }
  if (rankPoints >= 120) {
    return { title: 'Arrow Tactician', badge: '🎯', color: '#00E5FF', rankPoints };
  }
  return { title: 'Novice Archer', badge: '🏹', color: '#A1887F', rankPoints };
}

export function calculateSunkCostScore(
  levelsCleared: number,
  stars: number,
  arrowsCleared: number,
  skinsCount: number
): number {
  return levelsCleared * 20 + stars * 10 + arrowsCleared + skinsCount * 150;
}
