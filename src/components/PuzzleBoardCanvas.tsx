import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo, memo, useState, useCallback } from 'react';
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
const EXIT_SPEED_PX_PER_SEC = 750;
const EXIT_DURATION_MIN_MS = 450;
const EXIT_DURATION_MAX_MS = 1500;

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

  useEffect(() => {
    if (lastTap) {
      setLocalTaps((prev) => [...prev, { id: lastTap.timestamp, x: lastTap.x, y: lastTap.y }]);
    }
  }, [lastTap]);

  const handleTapIndicatorDone = useCallback((id: number) => {
    setLocalTaps((prev) => prev.filter((t) => t.id !== id));
  }, []);
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

  // Pre-compute paths for all board arrows (memoized by board.arrows + cellSize).
  const arrowPathsAll = useMemo(
    () =>
      board.arrows.map((arrow) => ({
        id: arrow.id,
        path: makeArrowPath(arrow, cellSize)
      })),
    [board.arrows, cellSize]
  );

  // Build lookup sets for quick render-time checks.
  const blockedArrowIdSet = useMemo(
    () => new Set(blockedArrows.map((b) => b.arrow.id)),
    [blockedArrows]
  );

  const flashingArrowIdSet = useMemo(
    () => new Set(flashingArrows.map((a) => a.id)),
    [flashingArrows]
  );

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
              .filter(({ id }) => !blockedArrowIdSet.has(id) && !flashingArrowIdSet.has(id))
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
                onCollisionPoint={onCollisionPoint}
              />
            ))}

            {/* Flashing arrow overlays — blocker briefly flashes red on collision */}
            {flashingArrows.map((arrow) => (
              <FlashingArrowOverlay
                key={`flash-${arrow.id}`}
                arrow={arrow}
                cellSize={cellSize}
                strokeWidth={strokeW}
              />
            ))}
          </Group>

          {/* Exiting arrow overlays with slide animation — drawn with CANVAS_PADDING baked in */}
          {exitingArrows.map((arrow) => (
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

  const { totalLength, arrowLength } = useMemo(() => {
    const it = Skia.ContourMeasureIter(trackPath, false, 1);
    const contourVal = it.next();
    const trackLen = contourVal ? contourVal.length() : 0;
    const arrowLen = Math.max(0, trackLen - extensionLength);
    return { totalLength: trackLen, arrowLength: arrowLen };
  }, [trackPath, extensionLength]);

  useEffect(() => {
    // Exit speed scales with the cell size (e.g. 13.5 cells per second)
    // so that smaller cells on large levels cross the screen at the same visual rate as large levels.
    const cellsPerSec = 13.5;
    const speedPxPerSec = cellsPerSec * cellSize;
    const ms = Math.round((totalLength / speedPxPerSec) * 1000);
    const duration = Math.min(EXIT_DURATION_MAX_MS, Math.max(EXIT_DURATION_MIN_MS, ms));
    const moveEasing = Easing.linear;

    animProgress.value = 0;

    animProgress.value = withTiming(
      1,
      { duration, easing: moveEasing },
      (finished) => {
        if (finished) runOnJS(onDone)(arrow.id);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per mounted exit arrow
  }, [totalLength, cellSize]);

  const startVal = useDerivedValue(() => {
    const t = animProgress.value;
    return (t * (totalLength - arrowLength)) / totalLength;
  });

  const endVal = useDerivedValue(() => {
    const t = animProgress.value;
    return (arrowLength + t * (totalLength - arrowLength)) / totalLength;
  });

  const headPath = useMemo(() => makeGenericHeadPath(cellSize), [cellSize]);

  const initialTransform = useMemo(() => {
    const cells = arrow.fullPath;
    if (cells.length === 0) return [{ translateX: 0 }, { translateY: 0 }, { rotate: 0 }];
    const head = cells[cells.length - 1]!;
    const center = centerOf(head, cellSize);
    const angle = getDirectionAngle(exitDir);
    return [
      { translateX: center.x + CANVAS_PADDING },
      { translateY: center.y + CANVAS_PADDING },
      { rotate: angle }
    ];
  }, [arrow, cellSize, exitDir]);

  const headTransform = useDerivedValue(() => {
    const t = animProgress.value;
    const distance = arrowLength + t * (totalLength - arrowLength);
    const it = Skia.ContourMeasureIter(trackPath, false, 1);
    const contour = it.next();
    if (contour) {
      const length = contour.length();
      const clampedDistance = Math.max(0, Math.min(length, distance));
      const [pos, tan] = contour.getPosTan(clampedDistance);
      const angle = Math.atan2(tan.y, tan.x);
      return [
        { translateX: pos.x },
        { translateY: pos.y },
        { rotate: angle }
      ];
    }
    return initialTransform;
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

  // The track path is the shaft path plus an extension of length slideDist
  const trackPath = useMemo(() => makeShaftPath(arrow, cellSize, slideDist), [arrow, cellSize, slideDist]);

  const { totalLength, shaftLength } = useMemo(() => {
    const it = Skia.ContourMeasureIter(trackPath, false, 1);
    const contourVal = it.next();
    const trackLen = contourVal ? contourVal.length() : 0;
    const sLen = Math.max(0, trackLen - slideDist);
    return { totalLength: trackLen, shaftLength: sLen };
  }, [trackPath, slideDist]);

  // Adjust timing organically based on distance
  const forwardDuration = Math.max(100, Math.min(220, cellsDistance * 60));

  useEffect(() => {
    progress.value = 0;

    progress.value = withTiming(
      1,
      { duration: forwardDuration, easing: Easing.bezier(0.25, 1, 0.5, 1) },
      (fin) => {
        if (fin) {
          runOnJS(onCollisionPoint)(blocker);
          
          // Snap back with a premium snappy spring recoil bounce
          progress.value = withSpring(0, {
            damping: 12,
            stiffness: 180,
            mass: 0.5,
          }, (fin2) => {
            if (fin2) runOnJS(onDone)(arrow.id);
          });
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startVal = useDerivedValue(() => {
    const offset = progress.value * slideDist;
    return totalLength > 0 ? (offset / totalLength) : 0;
  });

  const endVal = useDerivedValue(() => {
    const offset = progress.value * slideDist;
    return totalLength > 0 ? ((shaftLength + offset) / totalLength) : 0;
  });

  const headPath = useMemo(() => makeGenericHeadPath(cellSize), [cellSize]);

  const initialTransform = useMemo(() => {
    const cells = arrow.fullPath;
    if (cells.length === 0) return [{ translateX: 0 }, { translateY: 0 }, { rotate: 0 }];
    const head = cells[cells.length - 1]!;
    const center = centerOf(head, cellSize);
    const angle = getDirectionAngle(exitDir);
    return [
      { translateX: center.x },
      { translateY: center.y },
      { rotate: angle }
    ];
  }, [arrow, cellSize, exitDir]);

  const headTransform = useDerivedValue(() => {
    const offset = progress.value * slideDist;
    const distance = shaftLength + offset;
    const it = Skia.ContourMeasureIter(trackPath, false, 1);
    const contour = it.next();
    if (contour) {
      const length = contour.length();
      const clampedDistance = Math.max(0, Math.min(length, distance));
      const [pos, tan] = contour.getPosTan(clampedDistance);
      const angle = Math.atan2(tan.y, tan.x);
      return [
        { translateX: pos.x },
        { translateY: pos.y },
        { rotate: angle }
      ];
    }
    return initialTransform;
  });

  return (
    <>
      {/* Draw the moving shaft segment */}
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
      {/* Draw the moving arrowhead */}
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
  arrow,
  cellSize,
  strokeWidth: sw
}: {
  arrow: ArrowNode;
  cellSize: number;
  strokeWidth: number;
}) {
  const flashOpacity = useSharedValue(1);
  const shake = useSharedValue(0);

  const arrowPath = useMemo(() => makeArrowPath(arrow, cellSize), [arrow, cellSize]);

  useEffect(() => {
    // Hold bright red briefly, then fade out the red overlay
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 50, easing: Easing.out(Easing.quad) }),
      withDelay(50, withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 1, 0.5, 1) }))
    );

    // Organic decay shake animation on impact using spring
    shake.value = 6;
    shake.value = withSpring(0, {
      damping: 6,
      stiffness: 300,
      mass: 0.5
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
        path={arrowPath}
        color={theme.colors.arrowStroke}
        style="stroke"
        strokeCap="round"
        strokeJoin="round"
        strokeWidth={sw}
      />
      {/* 2. Red overlay that wiggles and fades out */}
      <Path
        path={arrowPath}
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

export function findArrowAtPoint(arrows: ArrowNode[], x: number, y: number, cellSize: number) {
  return arrows.find((arrow) =>
    getArrowCells(arrow).some((cell) => {
      const c = centerOf(cell, cellSize);
      return Math.hypot(c.x - x, c.y - y) <= cellSize * 0.6;
    })
  );
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

  useEffect(() => {
    scale.value = withTiming(1.3, { duration: 300, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) }, (fin) => {
      if (fin) runOnJS(onDone)(id);
    });
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
