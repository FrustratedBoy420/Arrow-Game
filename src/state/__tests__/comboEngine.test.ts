import { describe, expect, it } from 'vitest';

describe('Phase 5 Combo Engine & Auditory Semitone Escalation', () => {
  it('calculates equal-temperament semitone audio playback rate correctly', () => {
    const computeRate = (combo: number) => {
      return Math.min(1.60, 1.00 + Math.max(0, combo - 1) * 0.12);
    };

    expect(computeRate(1)).toBeCloseTo(1.00);
    expect(computeRate(2)).toBeCloseTo(1.12);
    expect(computeRate(3)).toBeCloseTo(1.24);
    expect(computeRate(4)).toBeCloseTo(1.36);
    expect(computeRate(5)).toBeCloseTo(1.48);
    expect(computeRate(6)).toBeCloseTo(1.60);
    expect(computeRate(10)).toBeCloseTo(1.60); // Capped at 1.60
  });

  it('awards dynamic bonus coins based on combo thresholds', () => {
    const getBonusCoins = (combo: number) => {
      if (combo >= 5) return 10;
      if (combo === 4) return 5;
      if (combo === 3) return 2;
      return 0;
    };

    expect(getBonusCoins(1)).toBe(0);
    expect(getBonusCoins(2)).toBe(0);
    expect(getBonusCoins(3)).toBe(2);
    expect(getBonusCoins(4)).toBe(5);
    expect(getBonusCoins(5)).toBe(10);
    expect(getBonusCoins(8)).toBe(10);
  });

  it('determines combo window validity within 1800ms threshold', () => {
    const isComboValid = (lastTapTime: number, now: number) => {
      return now - lastTapTime <= 1800;
    };

    const t0 = 10000;
    expect(isComboValid(t0, t0 + 500)).toBe(true);
    expect(isComboValid(t0, t0 + 1799)).toBe(true);
    expect(isComboValid(t0, t0 + 1800)).toBe(true);
    expect(isComboValid(t0, t0 + 1801)).toBe(false);
    expect(isComboValid(t0, t0 + 3000)).toBe(false);
  });
});
