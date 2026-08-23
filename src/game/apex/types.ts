// ─── APEX Types ─────────────────────────────────────────────────────
// Adaptive Player Experience Engine — all type definitions

export type ExperienceState = 'COMFORTABLE' | 'ENGAGED' | 'TENSE' | 'FRUSTRATED' | 'RECOVERY';

export type MatchType =
  | 'DOMINANT_WIN' | 'CLOSE_WIN' | 'COMEBACK_WIN'
  | 'CLOSE_LOSS'  | 'NORMAL_LOSS' | 'CRUSHING_LOSS';

export interface MatchExperienceRecord {
  matchId: string;
  result: 'WIN' | 'LOSS';
  playerScore: number;
  botScore: number;
  arrowsTotal: number;
  completionPercentage: number;  // (playerScore / arrowsTotal) * 100
  timeGap: number;               // seconds, estimated from score differential
  matchDurationMs: number;
  mistakes: number;
  puzzleDifficulty: number;      // 0-100
  botSkill: number;
  matchType: MatchType;
  wasComeback: boolean;
  frustrationBefore: number;
  frustrationAfter: number;
  confidenceBefore: number;
  confidenceAfter: number;
  createdAt: number;
}

export interface PlayerExperienceProfile {
  // Skill
  skillRating: number;           // Elo-like, starts at 50
  skillConfidence: number;       // 0-100, certainty of estimate

  // Emotional
  frustrationScore: number;      // 0-100
  confidenceScore: number;       // 0-100
  tiltScore: number;             // derived: frustration × (100 - confidence) / 100

  // History
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winStreak: number;
  lossStreak: number;

  // Performance
  averageSolveTime: number;      // ms
  averageMistakes: number;
  averageCompletion: number;     // 0-100
  averageTimeGap: number;        // seconds

  // Patterns
  nearWins: number;
  closeLosses: number;
  crushingLosses: number;

  // Derived
  experienceState: ExperienceState;

  // Recent matches (last N)
  lastMatches: MatchExperienceRecord[];

  updatedAt: number;
}

export type BotTierName = 'Rookie' | 'Beginner' | 'Competitive' | 'Advanced' | 'Expert' | 'Master';

export interface BotProfile {
  name: string;
  skill: number;         // 30-95
  tier: BotTierName;
  variance: number;      // 0.05-0.20, randomness factor
}
