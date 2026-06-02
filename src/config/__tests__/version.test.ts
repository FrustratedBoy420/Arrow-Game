import { describe, it, expect } from 'vitest';
import { isVersionOlder } from '../version';

describe('isVersionOlder', () => {
  it('should return true if current is older than target', () => {
    expect(isVersionOlder('1.1.3', '1.1.4')).toBe(true);
    expect(isVersionOlder('1.0.0', '1.1.0')).toBe(true);
    expect(isVersionOlder('0.9.9', '1.0.0')).toBe(true);
    expect(isVersionOlder('1.1.3', '1.2.0')).toBe(true);
  });

  it('should return false if current is equal to target', () => {
    expect(isVersionOlder('1.1.4', '1.1.4')).toBe(false);
    expect(isVersionOlder('1.0.0', '1.0.0')).toBe(false);
  });

  it('should return false if current is newer than target', () => {
    expect(isVersionOlder('1.1.5', '1.1.4')).toBe(false);
    expect(isVersionOlder('1.2.0', '1.1.9')).toBe(false);
    expect(isVersionOlder('2.0.0', '1.9.9')).toBe(false);
  });

  it('should handle leading "v" or "V" in version strings', () => {
    expect(isVersionOlder('v1.1.3', '1.1.4')).toBe(true);
    expect(isVersionOlder('1.1.3', 'V1.1.4')).toBe(true);
    expect(isVersionOlder('v1.1.4', 'v1.1.4')).toBe(false);
    expect(isVersionOlder('V1.1.5', 'v1.1.4')).toBe(false);
  });

  it('should handle missing padding components by treating them as 0', () => {
    expect(isVersionOlder('1', '1.1.0')).toBe(true); // 1.0.0 < 1.1.0 -> true
    expect(isVersionOlder('1.0', '1.0.1')).toBe(true); // 1.0.0 < 1.0.1 -> true
    expect(isVersionOlder('1.1', '1.1')).toBe(false);
    expect(isVersionOlder('1.2', '1.1.5')).toBe(false); // 1.2.0 > 1.1.5 -> false
  });

  it('should return false if current or target is invalid/missing', () => {
    expect(isVersionOlder('', '1.1.4')).toBe(false);
    expect(isVersionOlder('1.1.4', '')).toBe(false);
  });
});
