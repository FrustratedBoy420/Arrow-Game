import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo, memo, useState, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { getArrowCells, getArrowHead, getExitDirection, getCollisionDistance } from '../game/engine';
import type { ArrowNode, BoardState, Direction, LevelDefinition } from '../game/types';
import { theme } from '../theme/theme';

type BlockedArrowEntry = { arrow: ArrowNode; blocker: ArrowNode | null };

type Props = {
  board: BoardState;
  exitingArrows: ArrowNode[];
  /** Arrows currently playing the red slide-and-bounce animation (BLOCKED tap). */
  blockedArrows?: BlockedArrowEntry[];
  /** Arrows that briefly flash red (collision target). */
  flashingArrows?: ArrowNode[];
  width: number;
  onArrowPress: (arrowId: string) => void;
  onExitDone: (arrowId: string) => void;
  /** Called when a blocked arrow's animation completes. */
  onBlockedDone?: (arrowId: string) => void;
  /** Called at the collision moment so the parent can flash the blocker. */
  onCollisionPoint?: (blocker: ArrowNode | null) => void;
  /** When false, taps are handled by an outer zoom wrapper (Gameplay / Multiplayer). */
  enableTouch?: boolean;
  /** Coordinate of the last touch/tap for displaying tap feedback. */
  lastTap?: { x: number; y: number; timestamp: number } | undefined;
};

const arrowHeadSize = 12;

/** Target slide speed — scales duration by path length so all arrows feel snappy but smooth. */
const EXIT_SPEED_PX_PER_SEC = 1200;
const EXIT_DURATION_MIN_MS = 200;
const EXIT_DURATION_MAX_MS = 800;

const CANVAS_PADDING = 500;

/** How far the blocked arrow slides forward before snapping back (fraction of a cell). */
const BLOCKED_SLIDE_CELLS = 0.55;
/** Duration (ms) for the forward slide on a blocked arrow. */
const BLOCKED_FORWARD_MS = 160;
/** Duration (ms) for the snap-back on a blocked arrow. */
const BLOCKED_BACK_MS = 200;

function computeExitDurationMs(totalPathLengthPx: number): number {
  if (totalPathLengthPx <= 0) return EXIT_DURATION_MIN_MS;
  const ms = Math.round((totalPathLengthPx / EXIT_SPEED_PX_PER_SEC) * 1000);
  return Math.min(EXIT_DURATION_MAX_MS, Math.max(EXIT_DURATION_MIN_MS, ms));
}

const dirVec: Record<Direction, { x: number; y: number }> = {
  UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 }
};


export const PuzzleBoardCanvas = memo(function PuzzleBoardCanvas({
  board,
  exitingArrows = [],
  blockedArrows = [],
  flashingArrows = [],
  width,
  onArrowPress,
  onExitDone,
  onBlockedDone = () => {},
  onCollisionPoint = () => {},
  enableTouch = true,
  lastTap
}: Props) {
  const [localTaps, setLocalTaps] = useState<{ id: number; x: number; y: number }[]>([]);
  const [localFlashingArrows, setLocalFlashingArrows] = useState<ArrowNode[]>([]);

  const tapIdCounter = useRef(0);

  useEffect(() => {
    if (lastTap) {
      tapIdCounter.current += 1;
      setLocalTaps((prev) => [...prev, { id: tapIdCounter.current, x: lastTap.x, y: lastTap.y }]);
    }
  }, [lastTap]);

  const handleTapIndicatorDone = useCallback((id: number) => {
    setLocalTaps((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleCollisionPointInternal = useCallback((blocker: ArrowNode | null) => {
    if (!blocker) return;
    setLocalFlashingArrows((prev) => {
      if (prev.some((a) => a.id === blocker.id)) return prev;
      return [...prev, blocker];
    });
    setTimeout(() => {
      setLocalFlashingArrows((prev) => prev.filter((a) => a.id !== blocker.id));
    }, 520);
    if (onCollisionPoint) {
      onCollisionPoint(blocker);
    }
  }, [onCollisionPoint]);

  const cellSize = (width / board.level.gridSize.columns);
  const height = cellSize * board.level.gridSize.rows;
  const strokeW = Math.max(3, cellSize * 0.13);

  const initialDots = useMemo(() => {
    const dots: { r: number; c: number }[] = [];
    const occupied = new Set<string>();

    const arrows = board.level?.arrows || [];
    arrows.forEach((arrow) => {
      const fullPath = arrow.fullPath || [];
      fullPath.forEach((cell) => {
        occupied.add(`${cell.x},${cell.y}`);
      });
    });

    const rows = board.level?.gridSize?.rows || 0;
    const columns = board.level?.gridSize?.columns || 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        if (occupied.has(`${c},${r}`)) {
          dots.push({ r, c });
        }
      }
    }
    return dots;
  }, [board.level]);

  const pathCacheRef = useRef<Record<string, { path: any; cellSize: number }>>({});

  // Pre-compute paths for all board arrows (memoized by board.arrows + cellSize, utilizing local ref cache).
  const arrowPathsAll = useMemo(() => {
    const cache = pathCacheRef.current;
    return board.arrows.map((arrow) => {
      const cacheKey = `${arrow.id}-${cellSize}`;
      if (cache[cacheKey] && cache[cacheKey].cellSize === cellSize) {
        return { id: arrow.id, path: cache[cacheKey].path };
      }
      const newPath = makeArrowPath(arrow, cellSize);
      cache[cacheKey] = { path: newPath, cellSize };
      return { id: arrow.id, path: newPath };
    });
  }, [board.arrows, cellSize]);

  // Build lookup sets for quick render-time checks.
  const blockedArrowIdSet = useMemo(
    () => new Set(blockedArrows.map((b) => b.arrow.id)),
    [blockedArrows]
  );

  const flashingArrowIdSet = useMemo(() => {
    const ids = new Set<string>();
    if (flashingArrows) {
      flashingArrows.forEach((a) => ids.add(a.id));
    }
    localFlashingArrows.forEach((a) => ids.add(a.id));
    return ids;
  }, [flashingArrows, localFlashingArrows]);

  const exitingArrowIdSet = useMemo(() => {
    const ids = new Set<string>();
    for (const arrow of exitingArrows) {
      ids.add(arrow.id);
      if (arrow.id.startsWith('me-')) {
        ids.add(arrow.id.slice(3));
      } else if (arrow.id.startsWith('opponent-')) {
        ids.add(arrow.id.slice(9));
      }
    }
    return ids;
  }, [exitingArrows]);

  const uniqueExitingArrows = useMemo(() => {
    const seen = new Set<string>();
    return exitingArrows.filter((arrow) => {
      if (seen.has(arrow.id)) return false;
      seen.add(arrow.id);
      return true;
    });
  }, [exitingArrows]);

  return (
    <View style={[styles.container, { width, height }]}>
      {/* A single unified canvas that covers the board + padding to avoid mounting delays & GL blinks */}
      <View
        style={{
          position: 'absolute',
          left: -CANVAS_PADDING,
          top: -CANVAS_PADDING,
          width: width + 2 * CANVAS_PADDING,
          height: height + 2 * CANVAS_PADDING,
        }}
        pointerEvents="none"
      >
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Shift all standard board elements by CANVAS_PADDING to align them with the visible board container */}
          <Group transform={[{ translateX: CANVAS_PADDING }, { translateY: CANVAS_PADDING }]}>
            {initialDots.map(({ r, c }) => (
              <Circle
                key={`dot-${r}-${c}`}
                cx={c * cellSize + cellSize / 2}
                cy={r * cellSize + cellSize / 2}
                r={Math.max(2, cellSize * 0.05)}
                color={theme.colors.borderSoft}
              />
            ))}
            
            {arrowPathsAll
              .filter(
                ({ id }) =>
                  !blockedArrowIdSet.has(id) &&
                  !flashingArrowIdSet.has(id) &&
                  !exitingArrowIdSet.has(id)
              )
              .map(({ id, path }) => (
                <Path
                  key={id}
                  path={path}
                  color={theme.colors.arrowStroke}
                  style="stroke"
                  strokeCap="round"
                  strokeJoin="round"
                  strokeWidth={strokeW}
                />
              ))}

            {/* Blocked arrow overlays — red + slide forward then snap back */}
            {blockedArrows.map(({ arrow, blocker }) => (
              <BlockedArrowOverlay
                key={`blocked-${arrow.id}`}
                arrow={arrow}
                blocker={blocker}
                board={board}
                cellSize={cellSize}
                strokeWidth={strokeW}
                onDone={onBlockedDone}
                onCollisionPoint={handleCollisionPointInternal}
              />
            ))}

            {/* Flashing arrow overlays — blocker briefly flashes red on collision */}
            {flashingArrows.map((arrow) => {
              const cacheKey = `${arrow.id}-${cellSize}`;
              const path = pathCacheRef.current[cacheKey]?.path || makeArrowPath(arrow, cellSize);
              return (
                <FlashingArrowOverlay
                  key={`flash-prop-${arrow.id}`}
                  path={path}
                  cellSize={cellSize}
                  strokeWidth={strokeW}
                />
              );
            })}
            {localFlashingArrows.map((arrow) => {
              const cacheKey = `${arrow.id}-${cellSize}`;
              const path = pathCacheRef.current[cacheKey]?.path || makeArrowPath(arrow, cellSize);
              return (
                <FlashingArrowOverlay
                  key={`flash-local-${arrow.id}`}
                  path={path}
                  cellSize={cellSize}
                  strokeWidth={strokeW}
                />
              );
            })}
          </Group>

          {/* Exiting arrow overlays with slide animation — drawn with CANVAS_PADDING baked in */}
          {uniqueExitingArrows.map((arrow) => (
            <ExitingArrow
              key={`exit-${arrow.id}`}
              arrow={arrow}
              cellSize={cellSize}
              strokeWidth={strokeW}
              boardWidth={width}
              boardHeight={height}
              onDone={onExitDone}
            />
          ))}
        </Canvas>
      </View>

      {enableTouch ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={(event) => {
            const { locationX, locationY } = event.nativeEvent;
            const arrow = findArrowAtPoint(board.arrows, locationX, locationY, cellSize);
            if (arrow) {
              setLocalTaps((prev) => [...prev, { id: Date.now(), x: locationX, y: locationY }]);
              onArrowPress(arrow.id);
            }
          }}
        />
      ) : null}

      {localTaps.map((t) => (
        <TapRipple
          key={t.id}
          id={t.id}
          x={t.x}
          y={t.y}
          cellSize={cellSize}
          onDone={handleTapIndicatorDone}
        />
      ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// ExitingArrow — slides the removed arrow off the grid.
// ---------------------------------------------------------------------------
const ExitingArrow = memo(function ExitingArrow({
  arrow, cellSize, strokeWidth: sw, boardWidth, boardHeight, onDone
}: {
  arrow: ArrowNode;
  cellSize: number;
  strokeWidth: number;
  boardWidth: number;
  boardHeight: number;
  onDone: (arrowId: string) => void;
}) {
  const animProgress = useSharedValue(0);
  const calledRef = useRef(false);

  const exitDir = getExitDirection(arrow);
  const v = dirVec[exitDir];

  const extensionLength = useMemo(() => {
    const cells = arrow.fullPath;
    if (cells.length === 0) return 0;
    const first = cells[0]!;
    const start = centerOf(first, cellSize);

    let distanceToEdge = 0;
    if (v.x > 0) { // moving RIGHT
      distanceToEdge = boardWidth + CANVAS_PADDING - start.x;
    } else if (v.x < 0) { // moving LEFT
      distanceToEdge = start.x + CANVAS_PADDING;
    } else if (v.y > 0) { // moving DOWN
      distanceToEdge = boardHeight + CANVAS_PADDING - start.y;
    } else if (v.y < 0) { // moving UP
      distanceToEdge = start.y + CANVAS_PADDING;
    }

    // Add extra 100 pixels buffer to make sure it's completely past the padded canvas edge
    return distanceToEdge + 100;
  }, [arrow, cellSize, boardWidth, boardHeight, v]);

  const trackPath = useMemo(() => {
    const path = Skia.Path.Make();
    const cells = arrow.fullPath;
    if (cells.length === 0) return path;

    const first = cells[0]!;
    const start = centerOf(first, cellSize);
    path.moveTo(start.x + CANVAS_PADDING, start.y + CANVAS_PADDING);

    for (let i = 1; i < cells.length; i++) {
      const pt = centerOf(cells[i]!, cellSize);
      path.lineTo(pt.x + CANVAS_PADDING, pt.y + CANVAS_PADDING);
    }

    const head = cells[cells.length - 1]!;
    const lastCenter = centerOf(head, cellSize);

    const exitEnd = {
      x: lastCenter.x + v.x * extensionLength + CANVAS_PADDING,
      y: lastCenter.y + v.y * extensionLength + CANVAS_PADDING
    };
    path.lineTo(exitEnd.x, exitEnd.y);

    return path;
  }, [arrow, cellSize, extensionLength, v]);

  const trackPointsAndDistances = useMemo(() => {
    const cells = arrow.fullPath;
    const points: { x: number; y: number }[] = [];
    if (cells.length === 0) {
      return { points: [{ x: 0, y: 0 }], cumDist: [0], totalLength: 0, arrowLength: 0 };
    }

    // 1. Map all cells of fullPath to their center points, shifted by CANVAS_PADDING
    for (let i = 0; i < cells.length; i++) {
      const pt = centerOf(cells[i]!, cellSize);
      points.push({
        x: pt.x + CANVAS_PADDING,
        y: pt.y + CANVAS_PADDING
      });
    }

    // 2. Add the exit end point extending from the last cell (the tip)
    const headCell = cells[cells.length - 1]!;
    const lastCenter = centerOf(headCell, cellSize);
    points.push({
      x: lastCenter.x + v.x * extensionLength + CANVAS_PADDING,
      y: lastCenter.y + v.y * extensionLength + CANVAS_PADDING
    });

    // 3. Compute cumulative distances
    const cumDist: number[] = [0];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1]!.x - points[i]!.x;
      const dy = points[i + 1]!.y - points[i]!.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      total += dist;
      cumDist.push(total);
    }

    const arrowLength = Math.max(0, (cells.length - 1) * cellSize);

    return { points, cumDist, totalLength: total, arrowLength };
  }, [arrow, cellSize, extensionLength, v]);

  const { points, cumDist, totalLength, arrowLength } = trackPointsAndDistances;

  // JS-side wrapper so runOnJS can call it from the UI thread and the ref stays in sync.
  const handleDone = useCallback(() => {
    if (!calledRef.current) {
      calledRef.current = true;
      onDone(arrow.id);
    }
  }, [onDone, arrow.id]);

  useEffect(() => {
    calledRef.current = false;
    // Exit speed scales with the cell size (e.g. 22.0 cells per second)
    // so that smaller cells on large levels cross the screen at the same visual rate as large levels.
    const cellsPerSec = 22.0;
    const speedPxPerSec = cellsPerSec * cellSize;
    const ms = Math.round((totalLength / speedPxPerSec) * 1000);
    const duration = Math.min(EXIT_DURATION_MAX_MS, Math.max(EXIT_DURATION_MIN_MS, ms));
    const moveEasing = Easing.linear;

    animProgress.value = 0;

    animProgress.value = withTiming(
      1,
      { duration, easing: moveEasing },
      (finished) => {
        'worklet';
        if (finished !== false) {
          runOnJS(handleDone)();
        }
      }
    );

    // Don't call handleDone in cleanup — let the animation finish naturally.
    // The parent clears exitingArrows on level reset anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per mounted exit arrow
  }, [totalLength, cellSize]);

  const startVal = useDerivedValue(() => {
    const t = animProgress.value;
    return totalLength > 0 ? (t * (totalLength - arrowLength)) / totalLength : 0;
  });

  const endVal = useDerivedValue(() => {
    const t = animProgress.value;
    return totalLength > 0 ? (arrowLength + t * (totalLength - arrowLength)) / totalLength : 0;
  });

  const headPath = useMemo(() => makeGenericHeadPath(cellSize), [cellSize]);

  const headTransform = useDerivedValue(() => {
    const t = animProgress.value;
    const distance = arrowLength + t * (totalLength - arrowLength);
    const { x, y, angle } = getPointAtDistance(distance, cumDist, points);
    return [
      { translateX: x },
      { translateY: y },
      { rotate: angle }
    ];
  });

  const pathColor = arrow.color || theme.colors.arrowStroke;

  return (
    <>
      {/* Draw the moving shaft segment */}
      <Path
        path={trackPath}
        start={startVal}
        end={endVal}
        color={pathColor}
        style="stroke"
        strokeCap="round"
        strokeJoin="round"
        strokeWidth={sw}
      />
      {/* Draw the moving arrowhead */}
      <Group transform={headTransform}>
        <Path
          path={headPath}
          color={pathColor}
          style="stroke"
          strokeCap="round"
          strokeJoin="round"
          strokeWidth={sw}
        />
      </Group>
    </>
  );
});

// ---------------------------------------------------------------------------
// BlockedArrowOverlay — turns arrow red, slides it forward into the blocker,
// then snaps it back. Fires onCollisionPoint at the forward-most point.
// ---------------------------------------------------------------------------
const BlockedArrowOverlay = memo(function BlockedArrowOverlay({
  arrow,
  blocker,
  board,
  cellSize,
  strokeWidth: sw,
  onDone,
  onCollisionPoint
}: {
  arrow: ArrowNode;
  blocker: ArrowNode | null;
  board: BoardState;
  cellSize: number;
  strokeWidth: number;
  onDone: (arrowId: string) => void;
  onCollisionPoint: (blocker: ArrowNode | null) => void;
}) {
  const progress = useSharedValue(0);

  const exitDir = getExitDirection(arrow);
  const v = dirVec[exitDir];
  
  // Calculate cell steps to blocker
  const cellsDistance = getCollisionDistance(arrow, board);
  // Slide all the way to touch the blocker (offset 0.1 to avoid overlapping/clipping)
  const slideDist = cellSize * Math.max(0.2, cellsDistance - 0.1);

  // 1. Build a track path that traces the arrow body and extends slideDist forward
  const trackPath = useMemo(() => {
    const path = Skia.Path.Make();
    const cells = arrow.fullPath;
    if (cells.length === 0) return path;

    const first = cells[0]!;
    const start = centerOf(first, cellSize);
    path.moveTo(start.x, start.y);

    for (let i = 1; i < cells.length; i++) {
      const pt = centerOf(cells[i]!, cellSize);
      path.lineTo(pt.x, pt.y);
    }

    const head = cells[cells.length - 1]!;
    const lastCenter = centerOf(head, cellSize);

    const exitEnd = {
      x: lastCenter.x + v.x * slideDist,
      y: lastCenter.y + v.y * slideDist
    };
    path.lineTo(exitEnd.x, exitEnd.y);

    return path;
  }, [arrow, cellSize, slideDist, v]);

  // 2. Calculate cumulative segment distances and point positions
  const trackPointsAndDistances = useMemo(() => {
    const cells = arrow.fullPath;
    const points: { x: number; y: number }[] = [];
    if (cells.length === 0) {
      return { points: [{ x: 0, y: 0 }], cumDist: [0], totalLength: 0, arrowLength: 0 };
    }

    for (let i = 0; i < cells.length; i++) {
      const pt = centerOf(cells[i]!, cellSize);
      points.push({ x: pt.x, y: pt.y });
    }

    const headCell = cells[cells.length - 1]!;
    const lastCenter = centerOf(headCell, cellSize);
    points.push({
      x: lastCenter.x + v.x * slideDist,
      y: lastCenter.y + v.y * slideDist
    });

    const cumDist: number[] = [0];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1]!.x - points[i]!.x;
      const dy = points[i + 1]!.y - points[i]!.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      total += dist;
      cumDist.push(total);
    }

    const arrowLength = Math.max(0, (cells.length - 1) * cellSize);
    return { points, cumDist, totalLength: total, arrowLength };
  }, [arrow, cellSize, slideDist, v]);

  const { points, cumDist, totalLength, arrowLength } = trackPointsAndDistances;

  // Adjust timing organically based on distance
  const forwardDuration = Math.max(140, Math.min(280, cellsDistance * 80));

  const calledRef = useRef(false);

  // JS-side wrapper so runOnJS can call it from the UI thread and the ref stays in sync.
  const handleDone = useCallback(() => {
    if (!calledRef.current) {
      calledRef.current = true;
      onDone(arrow.id);
    }
  }, [onDone, arrow.id]);

  useEffect(() => {
    calledRef.current = false;
    progress.value = 0;

    progress.value = withSequence(
      withTiming(
        1,
        { duration: forwardDuration, easing: Easing.bezier(0.25, 1, 0.5, 1) },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(onCollisionPoint)(blocker);
          }
        }
      ),
      withSpring(
        0,
        {
          damping: 14,
          stiffness: 200,
          mass: 0.6
        },
        (finished) => {
          'worklet';
          if (finished !== false) {
            runOnJS(handleDone)();
          }
        }
      )
    );

    // Don't call handleDone in cleanup — let the animation finish naturally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamic start and end values for path trimming
  const startVal = useDerivedValue(() => {
    const t = progress.value;
    return totalLength > 0 ? (t * (totalLength - arrowLength)) / totalLength : 0;
  });

  const endVal = useDerivedValue(() => {
    const t = progress.value;
    return totalLength > 0 ? (arrowLength + t * (totalLength - arrowLength)) / totalLength : 0;
  });

  const headPath = useMemo(() => makeGenericHeadPath(cellSize), [cellSize]);

  const headTransform = useDerivedValue(() => {
    const t = progress.value;
    const distance = arrowLength + t * (totalLength - arrowLength);
    const { x, y, angle } = getPointAtDistance(distance, cumDist, points);
    return [
      { translateX: x },
      { translateY: y },
      { rotate: angle }
    ];
  });

  return (
    <>
      {/* Draw the sliding red shaft segment */}
      <Path
        path={trackPath}
        start={startVal}
        end={endVal}
        color="#FF3B30"
        style="stroke"
        strokeCap="round"
        strokeJoin="round"
        strokeWidth={sw}
      />
      {/* Draw the sliding red arrowhead */}
      <Group transform={headTransform}>
        <Path
          path={headPath}
          color="#FF3B30"
          style="stroke"
          strokeCap="round"
          strokeJoin="round"
          strokeWidth={sw}
        />
      </Group>
    </>
  );
});

// ---------------------------------------------------------------------------
// FlashingArrowOverlay — briefly shows the blocker in red, then fades away.
// ---------------------------------------------------------------------------
const FlashingArrowOverlay = memo(function FlashingArrowOverlay({
  path,
  cellSize,
  strokeWidth: sw
}: {
  path: any;
  cellSize: number;
  strokeWidth: number;
}) {
  const flashOpacity = useSharedValue(1);
  const shake = useSharedValue(0);

  useEffect(() => {
    // Hold bright red briefly, then fade out the red overlay
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 50, easing: Easing.out(Easing.quad) }),
      withDelay(50, withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 1, 0.5, 1) }))
    );

    // Organic decay shake animation on impact using spring
    shake.value = 6;
    shake.value = withSpring(0, {
      damping: 10,
      stiffness: 200,
      mass: 0.8
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shakeTransform = useDerivedValue(() => {
    const s = shake.value;
    return [
      { translateX: s },
      { translateY: s * 0.5 } // Shake slightly diagonally for a organic shockwave feel
    ];
  });

  return (
    <Group transform={shakeTransform}>
      {/* 1. Base arrow in normal color so it stays visible while flashing/shaking */}
      <Path
        path={path}
        color={theme.colors.arrowStroke}
        style="stroke"
        strokeCap="round"
        strokeJoin="round"
        strokeWidth={sw}
      />
      {/* 2. Red overlay that wiggles and fades out */}
      <Path
        path={path}
        color="#FF3B30"
        opacity={flashOpacity}
        style="stroke"
        strokeCap="round"
        strokeJoin="round"
        strokeWidth={sw}
      />
    </Group>
  );
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPointAtDistance(
  d: number,
  cumDist: number[],
  points: { x: number; y: number }[]
) {
  'worklet';
  if (points.length === 0) return { x: 0, y: 0, angle: 0 };
  if (d <= 0) {
    const p = points[0]!;
    let angle = 0;
    if (points.length > 1) {
      angle = Math.atan2(points[1]!.y - points[0]!.y, points[1]!.x - points[0]!.x);
    }
    return { x: p.x, y: p.y, angle };
  }
  const lastIdx = points.length - 1;
  if (d >= cumDist[lastIdx]!) {
    const p = points[lastIdx]!;
    let angle = 0;
    if (points.length > 1) {
      angle = Math.atan2(
        points[lastIdx]!.y - points[lastIdx - 1]!.y,
        points[lastIdx]!.x - points[lastIdx - 1]!.x
      );
    }
    return { x: p.x, y: p.y, angle };
  }

  // Find the segment containing d
  for (let i = 0; i < lastIdx; i++) {
    const startD = cumDist[i]!;
    const endD = cumDist[i + 1]!;
    if (d >= startD && d <= endD) {
      const segLen = endD - startD;
      const ratio = segLen > 0 ? (d - startD) / segLen : 0;
      const pStart = points[i]!;
      const pEnd = points[i + 1]!;
      const dx = pEnd.x - pStart.x;
      const dy = pEnd.y - pStart.y;
      const angle = Math.atan2(dy, dx);
      return {
        x: pStart.x + dx * ratio,
        y: pStart.y + dy * ratio,
        angle
      };
    }
  }

  // Fallback
  return { x: 0, y: 0, angle: 0 };
}

/**
 * Build a Skia path that traces through all fullPath cells and draws an arrowhead at the tip.
 */
function makeShaftPath(arrow: ArrowNode, cellSize: number, extensionLength = 0) {
  const path = Skia.Path.Make();
  const cells = arrow.fullPath;
  if (cells.length === 0) return path;

  const first = cells[0]!;
  const start = centerOf(first, cellSize);
  path.moveTo(start.x, start.y);

  for (let i = 1; i < cells.length; i++) {
    const pt = centerOf(cells[i]!, cellSize);
    path.lineTo(pt.x, pt.y);
  }

  if (extensionLength > 0) {
    const head = cells[cells.length - 1]!;
    const exitDir = getExitDirection(arrow);
    const v = dirVec[exitDir];
    const lastCenter = centerOf(head, cellSize);
    path.lineTo(lastCenter.x + v.x * extensionLength, lastCenter.y + v.y * extensionLength);
  }

  return path;
}

function makeHeadPath(headCenter: { x: number; y: number }, exitDir: Direction, cellSize: number) {
  const path = Skia.Path.Make();
  const headPoints = getHeadPoints(headCenter, exitDir, cellSize);

  path.moveTo(headPoints.left.x, headPoints.left.y);
  path.lineTo(headCenter.x, headCenter.y);
  path.lineTo(headPoints.right.x, headPoints.right.y);

  return path;
}

function makeGenericHeadPath(cellSize: number) {
  const path = Skia.Path.Make();
  const sz = Math.min(arrowHeadSize, cellSize * 0.32);
  path.moveTo(-sz, -sz);
  path.lineTo(0, 0);
  path.lineTo(-sz, sz);
  return path;
}

function getDirectionAngle(dir: Direction): number {
  switch (dir) {
    case 'RIGHT': return 0;
    case 'DOWN': return Math.PI / 2;
    case 'LEFT': return Math.PI;
    case 'UP': return -Math.PI / 2;
  }
}

function makeArrowPath(arrow: ArrowNode, cellSize: number) {
  const path = makeShaftPath(arrow, cellSize);
  const head = getArrowHead(arrow);
  const end = centerOf(head, cellSize);
  const exitDir = getExitDirection(arrow);
  const headPoints = getHeadPoints(end, exitDir, cellSize);

  path.moveTo(headPoints.left.x, headPoints.left.y);
  path.lineTo(end.x, end.y);
  path.lineTo(headPoints.right.x, headPoints.right.y);

  return path;
}

function centerOf(pos: { x: number; y: number }, cellSize: number) {
  return { x: pos.x * cellSize + (cellSize / 2), y: pos.y * cellSize + (cellSize / 2) };
}

function getHeadPoints(pt: { x: number; y: number }, dir: Direction, cellSize: number) {
  const sz = Math.min(arrowHeadSize, cellSize * 0.32);
  switch (dir) {
    case 'UP':    return { left: { x: pt.x - sz, y: pt.y + sz }, right: { x: pt.x + sz, y: pt.y + sz } };
    case 'DOWN':  return { left: { x: pt.x - sz, y: pt.y - sz }, right: { x: pt.x + sz, y: pt.y - sz } };
    case 'LEFT':  return { left: { x: pt.x + sz, y: pt.y - sz }, right: { x: pt.x + sz, y: pt.y + sz } };
    case 'RIGHT': return { left: { x: pt.x - sz, y: pt.y - sz }, right: { x: pt.x - sz, y: pt.y + sz } };
  }
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function findArrowAtPoint(arrows: ArrowNode[], x: number, y: number, cellSize: number) {
  // 1. Priority 1: Direct Cell Hit. If tap falls inside a cell's boundary (<= 0.5 * cellSize) of any arrow, select it immediately.
  for (const arrow of arrows) {
    const cells = getArrowCells(arrow);
    for (const cell of cells) {
      const c = centerOf(cell, cellSize);
      if (Math.hypot(c.x - x, c.y - y) <= cellSize * 0.5) {
        return arrow;
      }
    }
  }

  // 2. Priority 2: Proximity selection. Calculate shortest distance to arrow polyline segments within 1.2 * cellSize slop.
  let closestArrow: ArrowNode | null = null;
  let minDistance = Infinity;
  const maxDistance = cellSize * 1.2;

  for (const arrow of arrows) {
    const cells = getArrowCells(arrow);
    if (cells.length === 0) continue;

    let arrowDist = Infinity;
    const points = cells.map((cell) => centerOf(cell, cellSize));

    const firstPt = points[0];
    if (points.length === 1 && firstPt) {
      arrowDist = Math.hypot(firstPt.x - x, firstPt.y - y);
    } else {
      for (let i = 0; i < points.length - 1; i++) {
        const ptA = points[i];
        const ptB = points[i + 1];
        if (ptA && ptB) {
          const d = distanceToSegment(x, y, ptA.x, ptA.y, ptB.x, ptB.y);
          if (d < arrowDist) {
            arrowDist = d;
          }
        }
      }
    }

    if (arrowDist < minDistance && arrowDist <= maxDistance) {
      minDistance = arrowDist;
      closestArrow = arrow;
    }
  }

  return closestArrow;
}

const styles = StyleSheet.create({
  container: { overflow: 'visible' },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFD54F',
    backgroundColor: 'rgba(255, 213, 79, 0.25)',
    zIndex: 30
  }
});

// ---------------------------------------------------------------------------
// TapRipple — brief touch indicator feedback circle
// ---------------------------------------------------------------------------
const TapRipple = memo(function TapRipple({
  id,
  x,
  y,
  cellSize,
  onDone
}: {
  id: number;
  x: number;
  y: number;
  cellSize: number;
  onDone: (id: number) => void;
}) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0.9);

  const rippleSize = cellSize * 0.8;

  const calledRef = useRef(false);

  const handleDone = useCallback(() => {
    if (!calledRef.current) {
      calledRef.current = true;
      onDone(id);
    }
  }, [onDone, id]);

  useEffect(() => {
    calledRef.current = false;
    scale.value = withTiming(1.3, { duration: 300, easing: Easing.out(Easing.quad) });

    opacity.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) }, (fin) => {
      'worklet';
      if (fin) {
        runOnJS(handleDone)();
      }
    });

    // Don't call handleDone in cleanup — let the animation finish naturally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View
      style={[
        styles.ripple,
        animStyle,
        {
          width: rippleSize,
          height: rippleSize,
          borderRadius: (rippleSize / 2),
          left: (x - rippleSize / 2),
          top: (y - rippleSize / 2),
        }
      ]}
      pointerEvents="none"
    />
  );
});
