import AsyncStorage from '@react-native-async-storage/async-storage';

const MATCH_HISTORY_KEY = 'bot_match_history_v1';
const MAX_HISTORY = 8;

// Base timings (ms)
const BASE_MIN_DELAY = 600;
const BASE_MAX_DELAY = 1500;

const FIRST_NAMES = [
  'Arjun', 'Priya', 'Rahul', 'Neha', 'Rohan', 'Anjali', 'Karan', 'Vikas',
  'Aisha', 'Dev', 'Isha', 'Manish', 'Pooja', 'Siddharth', 'Tanvi', 'Yash'
];

const GAMING_SUFFIXES = [
  '_Pro', '_99', '_Arrow', '_Gamer', 'OP', '_King', '_Master', 'X', '_YT', '_GG'
];

type MatchHistory = {
  results: boolean[];
};

let consecutiveUserLosses = 0;
let consecutiveUserWins = 0;
let historyLoaded = false;

function syncStreaksFromHistory(results: boolean[]) {
  consecutiveUserWins = 0;
  consecutiveUserLosses = 0;

  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i]) {
      if (consecutiveUserLosses > 0) break;
      consecutiveUserWins++;
    } else {
      if (consecutiveUserWins > 0) break;
      consecutiveUserLosses++;
    }
  }
}

async function ensureHistoryLoaded() {
  if (historyLoaded) return;
  try {
    const raw = await AsyncStorage.getItem(MATCH_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MatchHistory;
      if (Array.isArray(parsed.results)) {
        syncStreaksFromHistory(parsed.results);
      }
    }
  } catch (e) {
    console.warn('Failed to load bot match history', e);
  } finally {
    historyLoaded = true;
  }
}

export async function recordMatchResult(userWon: boolean) {
  await ensureHistoryLoaded();

  if (userWon) {
    consecutiveUserWins++;
    consecutiveUserLosses = 0;
  } else {
    consecutiveUserLosses++;
    consecutiveUserWins = 0;
  }

  try {
    const raw = await AsyncStorage.getItem(MATCH_HISTORY_KEY);
    const parsed: MatchHistory = raw ? JSON.parse(raw) : { results: [] };
    const results = Array.isArray(parsed.results) ? parsed.results : [];
    results.push(userWon);
    const trimmed = results.slice(-MAX_HISTORY);
    await AsyncStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify({ results: trimmed }));
  } catch (e) {
    console.warn('Failed to save bot match history', e);
  }
}

export async function resetBotSession() {
  consecutiveUserLosses = 0;
  consecutiveUserWins = 0;
  historyLoaded = true;
  try {
    await AsyncStorage.removeItem(MATCH_HISTORY_KEY);
  } catch (e) {
    console.warn('Failed to reset bot session', e);
  }
}

function generateBotName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] ?? 'Player';
  const suffix = GAMING_SUFFIXES[Math.floor(Math.random() * GAMING_SUFFIXES.length)] ?? '_Pro';
  const useUnderscore = suffix.startsWith('_') || suffix.endsWith('X');
  return useUnderscore ? `${first}${suffix}` : `${first}_${suffix}`;
}

export function getFakeOpponentProfile() {
  const level = Math.floor(Math.random() * 40) + 10;
  const winStreak = Math.random() > 0.55 ? Math.floor(Math.random() * 5) + 2 : 0;

  return {
    name: generateBotName(),
    level,
    winStreak
  };
}

/**
 * Returns true when the bot should skip this scoring opportunity (human-like miss).
 */
export function shouldBotMissMove(): boolean {
  let missChance = 0.08;

  if (consecutiveUserLosses >= 2) {
    missChance += 0.12 + Math.min(consecutiveUserLosses - 2, 2) * 0.05;
  } else if (consecutiveUserWins >= 1) {
    missChance -= 0.04;
  }

  missChance += (Math.random() - 0.5) * 0.06;
  missChance = Math.max(0.03, Math.min(0.28, missChance));

  return Math.random() < missChance;
}

/**
 * Calculates how long the bot should wait before clearing its next arrow.
 * Factoring in dopamine-driven psychology to keep user engaged.
 */
export function calculateNextMoveDelay(
  botArrowsLeft: number,
  userArrowsLeft: number,
  totalArrows: number
): number {
  let minDelay = BASE_MIN_DELAY;
  let maxDelay = BASE_MAX_DELAY;

  const botProgress = totalArrows - botArrowsLeft;
  const userProgress = totalArrows - userArrowsLeft;

  if (consecutiveUserLosses >= 2) {
    minDelay += 700 + Math.min(consecutiveUserLosses, 4) * 120;
    maxDelay += 1200 + Math.min(consecutiveUserLosses, 4) * 200;
  } else if (consecutiveUserWins >= 1) {
    const winPressure = Math.min(consecutiveUserWins, 3);
    minDelay -= 120 + winPressure * 60;
    maxDelay -= 220 + winPressure * 80;
  }

  if (botProgress > userProgress + 3) {
    minDelay += 400 + Math.random() * 200;
    maxDelay += 800 + Math.random() * 300;
  } else if (userProgress > botProgress + 2) {
    minDelay -= 120 + Math.random() * 80;
    maxDelay -= 250 + Math.random() * 100;
  }

  if (Math.random() < 0.18) {
    minDelay += 600 + Math.random() * 900;
    maxDelay += 900 + Math.random() * 1200;
  }

  if (botArrowsLeft <= 3 && userArrowsLeft <= 3) {
    minDelay += 250 + Math.random() * 200;
    maxDelay += 500 + Math.random() * 350;
  }

  minDelay = Math.max(minDelay, 350);
  maxDelay = Math.max(maxDelay, minDelay + 250);

  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

void ensureHistoryLoaded();
