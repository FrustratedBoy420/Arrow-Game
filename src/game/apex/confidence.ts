// ─── APEX Confidence Calculator ─────────────────────────────────────
// Independent from frustration. A player can be frustrated yet confident.

import { APEX_CONFIG } from './config';
import type { MatchExperienceRecord, PlayerExperienceProfile } from './types';

/**
 * Calculate updated confidence after a match.
 * Close losses BOOST confidence (near-miss = "I can do this").
 */
export function calculateConfidence(
  profile: PlayerExperienceProfile,
  matchRecord: Pick<MatchExperienceRecord, 'result' | 'matchType' | 'completionPercentage'>
): number {
  const cfg = APEX_CONFIG;
  let delta: number;

  if (matchRecord.result === 'WIN') {
    delta = cfg.confidenceDeltas.WIN;
  } else {
    switch (matchRecord.matchType) {
      case 'CLOSE_LOSS':
        delta = cfg.confidenceDeltas.CLOSE_LOSS;     // +2
        break;
      case 'CRUSHING_LOSS':
        delta = cfg.confidenceDeltas.CRUSHING_LOSS;   // -12
        break;
      default:
        delta = cfg.confidenceDeltas.NORMAL_LOSS;     // -5
    }
  }

  // Performance above personal average → extra boost (when historical matches exist)
  if (profile.totalMatches > 0 && matchRecord.completionPercentage > profile.averageCompletion + 5) {
    delta += 3;
  }

  return Math.max(0, Math.min(100, Math.round(profile.confidenceScore + delta)));
}
