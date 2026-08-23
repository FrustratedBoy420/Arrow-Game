import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBotName } from './botNames';
import type { BotProfile } from './apex/types';
import { APEX_CONFIG } from './apex/config';

// ─── Legacy storage key (kept for backward compat during transition) ──
const MATCH_HISTORY_KEY = 'bot_match_history_v1';

// ponytail: legacy recordMatchResult kept for MultiplayerFriendsScreen
// which still uses the old system. APEX replaces this for Random mode.
export async function recordMatchResult(userWon: boolean) {
  try {
    const raw = await AsyncStorage.getItem(MATCH_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : { results: [] };
    const results = Array.isArray(parsed.results) ? parsed.results : [];
    results.push(userWon);
    const trimmed = results.slice(-8);
    await AsyncStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify({ results: trimmed }));
  } catch (e) {
    console.warn('Failed to save bot match history', e);
  }
}

export function getFakeOpponentProfile() {
  return { name: getRandomBotName() };
}

// ─── APEX-Powered Bot Behavior ──────────────────────────────────────

/**
 * Returns true when the bot should skip this move (human-like miss).
 * Miss rate derived from BotProfile.skill:
 *   skill=90 (Master)  → ~5% miss
 *   skill=50 (Beginner) → ~15% miss
 *   skill=40 (Rookie)   → ~18% miss
 */
export function shouldBotMissMove(botProfile?: BotProfile): boolean {
  if (!botProfile) {
    // Legacy fallback — 8% flat
    return Math.random() < 0.08;
  }

  const baseMiss = APEX_CONFIG.botBaseMissRate + (100 - botProfile.skill) * APEX_CONFIG.botMissSkillFactor;
  const variance = (Math.random() - 0.5) * 0.04;
  const missChance = Math.max(0.02, Math.min(0.25, baseMiss + variance));

  return Math.random() < missChance;
}

/**
 * Calculates how long the bot waits before clearing its next arrow.
 * Skill-based: stronger bots are faster with less variance.
 *
 *   skill=90 → ~480-920ms (fast, precise)
 *   skill=50 → ~800-1500ms (moderate)
 *   skill=40 → ~880-1640ms (slow, inconsistent)
 */
export function calculateNextMoveDelay(
  botArrowsLeft: number,
  userArrowsLeft: number,
  totalArrows: number,
  botProfile?: BotProfile
): number {
  // ── Skill-based base timing ──
  const skill = botProfile?.skill ?? 55;
  const skillFactor = (100 - skill) / 100;
  let minDelay = 400 + skillFactor * 800;
  let maxDelay = 800 + skillFactor * 1400;

  // ── Natural variance from bot personality ──
  const variance = botProfile?.variance ?? 0.10;
  const varianceRange = (maxDelay - minDelay) * variance;
  minDelay += (Math.random() - 0.5) * varianceRange;
  maxDelay += (Math.random() - 0.5) * varianceRange;

  // ── Position-based adjustments (subtle, NOT rubber-banding) ──
  const botProgress = totalArrows - botArrowsLeft;
  const userProgress = totalArrows - userArrowsLeft;

  if (botProgress > userProgress + 3) {
    // Bot is far ahead — natural slight hesitation on harder remaining arrows
    minDelay += 200;
    maxDelay += 350;
  } else if (userProgress > botProgress + 2) {
    // Player ahead — bot tries a bit harder (mild, not teleporting)
    minDelay -= 80;
    maxDelay -= 150;
  }

  // ── Human-like hesitation (thinking pause) ──
  if (Math.random() < APEX_CONFIG.botHesitationChance) {
    minDelay += 500 + Math.random() * 800;
    maxDelay += 800 + Math.random() * 1000;
  }

  // ── Endgame tension — last 3 arrows feel intense ──
  if (botArrowsLeft <= 3 && userArrowsLeft <= 3) {
    minDelay += 200;
    maxDelay += 400;
  }

  // ── Floor and ceiling ──
  minDelay = Math.max(350, minDelay);
  maxDelay = Math.max(minDelay + 200, maxDelay);

  return Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
}
