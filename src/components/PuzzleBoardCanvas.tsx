import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo, memo } from 'react';
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
import type { ArrowNode, BoardState, Direction } from '../game/types';
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
};

const arrowHeadSize = 12;

/** How far past the head the arrow slides off-screen (in grid cells). */
const EXIT_EXTENSION_CELLS = 6;
/** Target slide speed — scales duration by path length so all arrows feel snappy but smooth. */
const EXIT_SPEED_PX_PER_SEC = 400;
const EXIT_DURATION_MIN_MS = 200;
const EXIT_DURATION_MAX_MS = 600;

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
  enableTouch = true
}: Props) {
  const cellSize = width / board.level.gridSize.columns;
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
      {/* Static arrows via Skia — skip blocked & flashing ones (they're animated in overlays) */}
      <Canvas style={StyleSheet.absoluteFill}>
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
      </Canvas>

      {/* Exiting arrow overlays with slide animation */}
      {exitingArrows.map((arrow) => (
        <ExitingArrow
          key={`exit-${arrow.id}`}
          arrow={arrow}
          cellSize={cellSize}
          strokeWidth={strokeW}
          onDone={() => onExitDone(arrow.id)}
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
          onDone={() => onBlockedDone(arrow.id)}
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

      {enableTouch ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={(event) => {
            const { locationX, locationY } = event.nativeEvent;
            const arrow = findArrowAtPoint(board.arrows, locationX, locationY, cellSize);
            if (arrow) onArrowPress(arrow.id);
          }}
        />
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
// ExitingArrow — slides the removed arrow off the grid.
// ---------------------------------------------------------------------------
function ExitingArrow({
  arrow, cellSize, strokeWidth: sw, onDone
}: {
  arrow: ArrowNode; cellSize: number; strokeWidth: number; onDone: () => void;
}) {
  const animProgress = useSharedValue(0);
  const opacity = useSharedValue(1);

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
    const exitDir = getExitDirection(arrow);
    const v = dirVec[exitDir];
    const lastCenter = centerOf(head, cellSize);

    const extensionLength = cellSize * EXIT_EXTENSION_CELLS;
    const exitEnd = {
      x: lastCenter.x + v.x * extensionLength,
      y: lastCenter.y + v.y * extensionLength
    };
    path.lineTo(exitEnd.x, exitEnd.y);

    return path;
  }, [arrow, cellSize]);

  const { totalLength, arrowLength, contour } = useMemo(() => {
    const it = Skia.ContourMeasureIter(trackPath, false, 1);
    const contourVal = it.next();
    const trackLen = contourVal ? contourVal.length() : 0;
    const arrowLen = Math.max(0, trackLen - cellSize * EXIT_EXTENSION_CELLS);
    return { totalLength: trackLen, arrowLength: arrowLen, contour: contourVal };
  }, [trackPath, cellSize]);

  useEffect(() => {
    const duration = computeExitDurationMs(totalLength);
    const moveEasing = Easing.bezier(0.22, 1, 0.36, 1);
    const fadeDelay = Math.round(duration * 0.38);
    const fadeDuration = Math.max(120, duration - fadeDelay);

    animProgress.value = 0;
    opacity.value = 1;

    animProgress.value = withTiming(
      1,
      { duration, easing: moveEasing },
      (finished) => {
        if (finished) runOnJS(onDone)();
      }
    );

    opacity.value = withDelay(
      fadeDelay,
      withTiming(0, {
        duration: fadeDuration,
        easing: Easing.out(Easing.quad)
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per mounted exit arrow
  }, [totalLength]);

  const startVal = useDerivedValue(() => {
    const t = animProgress.value;
    return (t * (totalLength - arrowLength)) / totalLength;
  });

  const endVal = useDerivedValue(() => {
    const t = animProgress.value;
    return (arrowLength + t * (totalLength - arrowLength)) / totalLength;
  });

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animStyle, { zIndex: 10 }]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={trackPath}
          start={startVal}
          end={endVal}
          color={theme.colors.arrowStroke}
          style="stroke"
          strokeCap="round"
          strokeJoin="round"
          strokeWidth={sw}
        />
      </Canvas>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// BlockedArrowOverlay — turns arrow red, slides it forward into the blocker,
// then snaps it back. Fires onCollisionPoint at the forward-most point.
// ---------------------------------------------------------------------------
function BlockedArrowOverlay({
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
  onDone: () => void;
  onCollisionPoint: (blocker: ArrowNode | null) => void;
}) {
  const progress = useSharedValue(0);

  const exitDir = getExitDirection(arrow);
  const v = dirVec[exitDir];
  
  // Calculate cell steps to blocker
  const cellsDistance = getCollisionDistance(arrow, board);
  // Slide all the way to touch the blocker (offset 0.1 to avoid overlapping/clipping)
  const slideDist = cellSize * Math.max(0.2, cellsDistance - 0.1);

  const arrowPath = useMemo(() => makeArrowPath(arrow, cellSize), [arrow, cellSize]);

  // Adjust timing organically based on distance
  const forwardDuration = Math.max(140, Math.min(300, cellsDistance * 80));

  useEffect(() => {
    // Slide forward, then at the collision point fire the callback, then slide back.
    progress.value = withTiming(
      1,
      { duration: forwardDuration, easing: Easing.out(Easing.quad) },
      (fin) => {
        if (fin) {
          runOnJS(onCollisionPoint)(blocker);
          
          // Snap back with a premium spring recoil bounce
          progress.value = withSpring(0, {
            damping: 14,
            stiffness: 100,
            mass: 0.8,
          }, (fin2) => {
            if (fin2) runOnJS(onDone)();
          });
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * slideDist * v.x },
      { translateY: progress.value * slideDist * v.y }
    ]
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, animStyle, { zIndex: 20 }]}
      pointerEvents="none"
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={arrowPath}
          color="#FF3B30"
          style="stroke"
          strokeCap="round"
          strokeJoin="round"
          strokeWidth={sw}
        />
      </Canvas>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// FlashingArrowOverlay — briefly shows the blocker in red, then fades away.
// ---------------------------------------------------------------------------
function FlashingArrowOverlay({
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
      withTiming(1, { duration: 60 }),
      withDelay(80, withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) }))
    );

    // Dynamic high-frequency decay shake animation on impact
    shake.value = withSequence(
      withTiming(-5, { duration: 40, easing: Easing.linear }),
      withTiming(5, { duration: 40, easing: Easing.linear }),
      withTiming(-3.5, { duration: 40, easing: Easing.linear }),
      withTiming(3.5, { duration: 40, easing: Easing.linear }),
      withTiming(-2, { duration: 40, easing: Easing.linear }),
      withTiming(2, { duration: 40, easing: Easing.linear }),
      withTiming(-1, { duration: 40, easing: Easing.linear }),
      withTiming(1, { duration: 40, easing: Easing.linear }),
      withTiming(0, { duration: 40, easing: Easing.linear })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value },
      { translateY: shake.value * 0.5 } // Shake slightly diagonally for a organic shockwave feel
    ]
  }));

  const redOverlayStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, animStyle, { zIndex: 15 }]}
      pointerEvents="none"
    >
      {/* 1. Base arrow in normal color so it stays visible while flashing/shaking */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={arrowPath}
          color={theme.colors.arrowStroke}
          style="stroke"
          strokeCap="round"
          strokeJoin="round"
          strokeWidth={sw}
        />
      </Canvas>

      {/* 2. Red overlay that wiggles and fades out */}
      <Animated.View style={[StyleSheet.absoluteFill, redOverlayStyle]} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill}>
          <Path
            path={arrowPath}
            color="#FF3B30"
            style="stroke"
            strokeCap="round"
            strokeJoin="round"
            strokeWidth={sw}
          />
        </Canvas>
      </Animated.View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a Skia path that traces through all fullPath cells and draws an arrowhead at the tip.
 */
function makeArrowPath(arrow: ArrowNode, cellSize: number) {
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
  return { x: pos.x * cellSize + cellSize / 2, y: pos.y * cellSize + cellSize / 2 };
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
  container: { overflow: 'visible' }
});
