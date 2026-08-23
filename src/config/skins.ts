export type ArrowSkin = {
  id: string;
  name: string;
  price: number;
  strokeColor: string;
  glowColor?: string;
  description: string;
  unlockLevelReq?: number;
  previewEmoji?: string;
  tier: 'STARTER' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
};

export type BoosterItem = {
  id: 'extra_hints' | 'extra_undos' | 'extra_lives';
  name: string;
  price: number;
  amount: number;
  icon: string;
  description: string;
};

export type DailyRewardDay = {
  day: number;
  type: 'coins' | 'hints' | 'lives' | 'mega_pack';
  coins: number;
  hints?: number;
  lives?: number;
  title: string;
  icon: string;
};

export type SpinSlice = {
  id: number;
  label: string;
  type: 'coins' | 'hints' | 'lives';
  amount: number;
  weight: number; // Probability weight
  color: string;
};

export const ARROW_SKINS: ArrowSkin[] = [
  {
    id: 'classic',
    name: 'Classic Cedar',
    price: 0,
    strokeColor: '#795548',
    glowColor: 'rgba(121, 85, 72, 0.25)',
    description: 'Handcrafted seasoned timber with timeless precision.',
    tier: 'STARTER'
  },
  {
    id: 'ice_blue',
    name: 'Glacial Shard',
    price: 200,
    strokeColor: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.55)',
    description: 'Cryo-forged frost crystals with blinding sub-zero aura.',
    tier: 'RARE'
  },
  {
    id: 'royal_gold',
    name: 'Imperial Sun',
    price: 450,
    strokeColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.6)',
    description: 'Forged in solid 24-karat gold for master puzzle tacticians.',
    tier: 'EPIC'
  }
];

export const BOOSTER_ITEMS: BoosterItem[] = [
  {
    id: 'extra_hints',
    name: '3x Smart Hints',
    price: 40,
    amount: 3,
    icon: '💡',
    description: 'Instant clear on any stuck puzzle.'
  },
  {
    id: 'extra_undos',
    name: '5x Tactical Undos',
    price: 25,
    amount: 5,
    icon: '↶',
    description: 'Revert tricky moves with zero heart penalties.'
  },
  {
    id: 'extra_lives',
    name: 'Shield Life (+1 ❤️)',
    price: 50,
    amount: 1,
    icon: '🛡️',
    description: 'Start your next tough level with 4 hearts.'
  }
];

export const DAILY_REWARDS: DailyRewardDay[] = [
  { day: 1, type: 'coins', coins: 15, title: 'Day 1', icon: '🪙' },
  { day: 2, type: 'coins', coins: 25, title: 'Day 2', icon: '🪙' },
  { day: 3, type: 'hints', coins: 10, hints: 1, title: 'Day 3', icon: '💡' },
  { day: 4, type: 'coins', coins: 40, title: 'Day 4', icon: '🪙' },
  { day: 5, type: 'lives', coins: 15, lives: 1, title: 'Day 5', icon: '🛡️' },
  { day: 6, type: 'hints', coins: 20, hints: 2, title: 'Day 6', icon: '💡' },
  { day: 7, type: 'mega_pack', coins: 200, hints: 2, lives: 1, title: 'Day 7', icon: '👑' }
];

export const SPIN_SLICES: SpinSlice[] = [
  { id: 0, label: '10 🪙', type: 'coins', amount: 10, weight: 30, color: '#4CAF50' },
  { id: 1, label: '20 🪙', type: 'coins', amount: 20, weight: 25, color: '#FFB300' },
  { id: 2, label: '1 💡', type: 'hints', amount: 1, weight: 12, color: '#00BCD4' },
  { id: 3, label: '50 🪙', type: 'coins', amount: 50, weight: 15, color: '#FF9800' },
  { id: 4, label: '1 ❤️', type: 'lives', amount: 1, weight: 10, color: '#F44336' },
  { id: 5, label: '100 🪙', type: 'coins', amount: 100, weight: 5, color: '#9C27B0' },
  { id: 6, label: '3 💡', type: 'hints', amount: 3, weight: 2, color: '#009688' },
  { id: 7, label: '250 🪙', type: 'coins', amount: 250, weight: 1, color: '#E91E63' }
];

export function getSkinById(id: string): ArrowSkin {
  return ARROW_SKINS.find((s) => s.id === id) ?? ARROW_SKINS[0]!;
}
