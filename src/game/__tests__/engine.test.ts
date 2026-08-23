import { describe, expect, it } from 'vitest';

import { createInitialBoard, isFrontClear, resolveTap, getCollisionDistance } from '../engine';
import type { LevelDefinition } from '../types';

const level: LevelDefinition = {
  id: 99,
  title: 'Test Level',
  difficulty: 'Easy',
  gridSize: { columns: 5, rows: 5 },
  arrows: [
    {
      id: 'clear',
      path: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      fullPath: [{ x: 0, y: 0 }, { x: 1, y: 0 }]
    },
    {
      id: 'blocked',
      path: [{ x: 0, y: 2 }, { x: 1, y: 2 }],
      fullPath: [{ x: 0, y: 2 }, { x: 1, y: 2 }]
    },
    {
      id: 'blocker',
      path: [{ x: 3, y: 2 }, { x: 3, y: 3 }],
      fullPath: [{ x: 3, y: 2 }, { x: 3, y: 3 }]
    }
  ]
};

describe('engine', () => {
  it('allows removal when the arrow front is clear to the edge', () => {
    const board = createInitialBoard(level);
    const arrow = board.arrows.find((candidate) => candidate.id === 'clear')!;

    expect(isFrontClear(arrow, board)).toBe(true);
    expect(resolveTap('clear', board).type).toBe('REMOVED');
  });

  it('rejects a tap when another arrow blocks the front path', () => {
    const board = createInitialBoard(level);
    const arrow = board.arrows.find((candidate) => candidate.id === 'blocked')!;

    expect(isFrontClear(arrow, board)).toBe(false);
    expect(resolveTap('blocked', board).type).toBe('BLOCKED');
  });

  it('decrements a life on invalid moves', () => {
    const board = createInitialBoard(level, 3);
    const result = resolveTap('blocked', board);

    expect(result.type).toBe('BLOCKED');
    expect(result.board.livesLeft).toBe(2);
  });

  it('does not deduct extra lives on rapid duplicate taps on blocked arrows', () => {
    const board = createInitialBoard(level, 3);
    const firstTap = resolveTap('blocked', board);
    expect(firstTap.board.livesLeft).toBe(2);

    const rapidTap = resolveTap('blocked', firstTap.board, {
      arrowId: 'blocked',
      timestamp: Date.now()
    });
    expect(rapidTap.type).toBe('BLOCKED');
    expect(rapidTap.board.livesLeft).toBe(2);
  });

  it('keeps blocked arrows in place without auto-exiting when their path clears', () => {
    const board = createInitialBoard(level, 3);

    // Tap blocked arrow first
    const blockedRes = resolveTap('blocked', board);
    expect(blockedRes.type).toBe('BLOCKED');

    // Tap blocker arrow to remove it
    const clearBlocker = resolveTap('blocker', blockedRes.board);
    expect(clearBlocker.type).toBe('REMOVED');
    // Blocked arrow must NOT auto-exit; it should remain on the board until player taps it
    expect(clearBlocker.board.arrows.some((a) => a.id === 'blocked')).toBe(true);

    // Player explicitly taps the now-clear arrow
    const removeBlocked = resolveTap('blocked', clearBlocker.board);
    expect(removeBlocked.type).toBe('REMOVED');
    expect(removeBlocked.board.arrows.some((a) => a.id === 'blocked')).toBe(false);
  });

  describe('getCollisionDistance', () => {
    it('returns the exact cell distance to a blocking arrow', () => {
      const board = createInitialBoard(level);
      const arrow = board.arrows.find((candidate) => candidate.id === 'blocked')!;
      expect(getCollisionDistance(arrow, board)).toBe(2);
    });

    it('returns the cell distance to the boundary when the front is clear', () => {
      const board = createInitialBoard(level);
      const arrow = board.arrows.find((candidate) => candidate.id === 'clear')!;
      expect(getCollisionDistance(arrow, board)).toBe(4);
    });
  });
});
