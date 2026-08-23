// ─── APEX Match Classifier ──────────────────────────────────────────
// Pure function: classifies a match result into one of 6 MatchTypes.

import { APEX_CONFIG } from './config';
import type { MatchType } from './types';

export interface MatchClassificationInput {
  result: 'WIN' | 'LOSS';
  playerScore: number;
  botScore: number;
  arrowsTotal: number;
  timeGap: number;         // seconds
  wasComeback: boolean;    // player was trailing mid-match but won
}

export function classifyMatch(input: MatchClassificationInput): MatchType {
  const { result, playerScore, arrowsTotal, timeGap, wasComeback } = input;
  const cfg = APEX_CONFIG;
  const completion = arrowsTotal > 0 ? (playerScore / arrowsTotal) * 100 : 0;

  if (result === 'WIN') {
    if (wasComeback) return 'COMEBACK_WIN';
    if (timeGap >= cfg.dominantWinGap) return 'DOMINANT_WIN';
    return 'CLOSE_WIN';
  }

  // result === 'LOSS'
  if (completion >= cfg.nearWinCompletion || timeGap <= cfg.closeGapSeconds) {
    return 'CLOSE_LOSS';
  }
  if (timeGap >= cfg.crushingLossGap || completion < cfg.crushingLossCompletion) {
    return 'CRUSHING_LOSS';
  }
  return 'NORMAL_LOSS';
}
