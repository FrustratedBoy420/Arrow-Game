import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { getArrowCells, getArrowHead } from '../game/engine';
import type { ArrowNode, BoardState, Direction } from '../game/types';
import { theme } from '../theme/theme';

type Props = {
  board: BoardState;
  exitingArrows: ArrowNode[];
  width: number;
  onArrowPress: (arrowId: string) => void;
  onExitDone: (arrowId: string) => void;
};

const arrowHeadSize = 12;

const dirVec: Record<Direction, { x: number; y: number }> = {
  UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 }
};

export function getArrowColor(direction: Direction) {
  switch (direction) {
    case 'UP': return theme.colors.arrowUp;
    case 'DOWN': return theme.colors.arrowDown;
    case 'LEFT': return theme.colors.arrowLeft;
    case 'RIGHT': return theme.colors.arrowRight;
    default: return theme.colors.arrowStroke;
  }
}

export function PuzzleBoardCanvas({ board, exitingArrows, width, onArrowPress, onExitDone }: Props) {
  const cellSize = width / board.level.gridSize.columns;
  const height = cellSize * board.level.gridSize.rows;
  const strokeW = Math.max(3, cellSize * 0.13);

  const arrowPaths = useMemo(
    () => board.arrows.map((arrow) => ({
      id: arrow.id,
      path: makeArrowPath(arrow, cellSize),
      color: getArrowColor(arrow.direction)
    })),
    [board.arrows, cellSize]
  );

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Static arrows via Skia */}
      <Canvas style={StyleSheet.absoluteFill}>
        {Array.from({ length: board.level.gridSize.rows }).map((_, r) =>
          Array.from({ length: board.level.gridSize.columns }).map((_, c) => (
            <Circle
              key={`dot-${r}-${c}`}
              cx={c * cellSize + cellSize / 2}
              cy={r * cellSize + cellSize / 2}
              r={Math.max(2, cellSize * 0.05)}
              color={theme.colors.borderSoft}
            />
          ))
        )}
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

      {/* Touch layer */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={(event) => {
          const { locationX, locationY } = event.nativeEvent;
          const arrow = findArrowAtPoint(board.arrows, locationX, locationY, cellSize);
          if (arrow) onArrowPress(arrow.id);
        }}
      />
    </View>
  );
}

function ExitingArrow({
  arrow, cellSize, strokeWidth: sw, onDone
}: {
  arrow: ArrowNode; cellSize: number; strokeWidth: number; onDone: () => void;
}) {
  const v = dirVec[arrow.direction];
  const dist = cellSize * 10;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateX.value = withTiming(v.x * dist, { duration: 350, easing: Easing.in(Easing.cubic) });
    translateY.value = withTiming(v.y * dist, { duration: 350, easing: Easing.in(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 350 }, (fin) => {
      if (fin) runOnJS(onDone)();
    });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value
  }));

  const color = getArrowColor(arrow.direction);
  const path = useMemo(() => makeArrowPath(arrow, cellSize), [arrow, cellSize]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animStyle, { zIndex: 10 }]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={path}
          color={color}
          style="stroke"
          strokeCap="round"
          strokeJoin="round"
          strokeWidth={sw}
        />
      </Canvas>
    </Animated.View>
  );
}

function makeArrowPath(arrow: ArrowNode, cellSize: number) {
  const path = Skia.Path.Make();
  const cells = getArrowCells(arrow);
  const first = cells[0] ?? arrow.position;
  const head = getArrowHead(arrow);
  const start = centerOf(first, cellSize);
  const end = centerOf(head, cellSize);
  const headPoints = getHeadPoints(end, arrow.direction, cellSize);

  path.moveTo(start.x, start.y);
  path.lineTo(end.x, end.y);
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

function findArrowAtPoint(arrows: ArrowNode[], x: number, y: number, cellSize: number) {
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
