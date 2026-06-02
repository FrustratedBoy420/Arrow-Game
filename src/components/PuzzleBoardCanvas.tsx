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
  withTiming
} from 'react-native-reanimated';

import { getArrowCells, getArrowHead, getExitDirection } from '../game/engine';
import type { ArrowNode, BoardState, Direction } from '../game/types';
import { theme } from '../theme/theme';

type Props = {
  board: BoardState;
  exitingArrows: ArrowNode[];
  width: number;
  onArrowPress: (arrowId: string) => void;
  onExitDone: (arrowId: string) => void;
  /** When false, taps are handled by an outer zoom wrapper (Gameplay / Multiplayer). */
  enableTouch?: boolean;
};

const arrowHeadSize = 12;

/** How far past the head the arrow slides off-screen (in grid cells). */
const EXIT_EXTENSION_CELLS = 6;
/** Target slide speed — scales duration by path length so all arrows feel snappy but smooth. */
const EXIT_SPEED_PX_PER_SEC = 400; // Faster exit speed for smoother feel
const EXIT_DURATION_MIN_MS = 200; // Shorter minimum duration
const EXIT_DURATION_MAX_MS = 600; // Upper bound for longer arrows
// Adjusted speed and duration to improve animation smoothness

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
  exitingArrows,
  width,
  onArrowPress,
  onExitDone,
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

  const arrowPaths = useMemo(
    () => board.arrows.map((arrow) => {
      return {
        id: arrow.id,
        path: makeArrowPath(arrow, cellSize),
        color: theme.colors.arrowStroke
      };
    }),
    [board.arrows, cellSize]
  );

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Static arrows via Skia */}
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
        {arrowPaths.map(({ id, path, color }) => (
          <Path
            key={id}
            path={path}
            color={color}
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
      y: lastCenter.y + v.y * extensionLength,
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
        {/* Draw the moving body of the arrow */}
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
        {/* Draw the moving arrowhead */}

      </Canvas>
    </Animated.View>
  );
}

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

  // Draw polyline through every cell
  for (let i = 1; i < cells.length; i++) {
    const pt = centerOf(cells[i]!, cellSize);
    path.lineTo(pt.x, pt.y);
  }

  // Draw arrowhead at the tip
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
