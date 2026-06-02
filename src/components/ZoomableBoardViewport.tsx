import { ReactNode, useCallback } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const MIN_SCALE = 1;
const MAX_SCALE = 3;

type Props = {
  boardWidth: number;
  boardHeight: number;
  children: ReactNode;
  onBoardPress: (x: number, y: number) => void;
};

function clampWorklet(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

function getPanLimits(
  boardW: number,
  boardH: number,
  s: number,
  vpW: number,
  vpH: number
) {
  'worklet';
  if (s <= 1 || vpW <= 0 || vpH <= 0) {
    return { maxTx: 0, maxTy: 0 };
  }

  const scaledW = boardW * s;
  const scaledH = boardH * s;
  const overflowX = Math.max(0, (scaledW - vpW) / 2);
  const overflowY = Math.max(0, (scaledH - vpH) / 2);
  const zoomSlackX = boardW * (s - 1) * 0.5;
  const zoomSlackY = boardH * (s - 1) * 0.5;

  return {
    maxTx: Math.max(overflowX, zoomSlackX),
    maxTy: Math.max(overflowY, zoomSlackY)
  };
}

function clampTranslation(
  tx: number,
  ty: number,
  boardW: number,
  boardH: number,
  s: number,
  vpW: number,
  vpH: number
) {
  'worklet';
  const { maxTx, maxTy } = getPanLimits(boardW, boardH, s, vpW, vpH);
  return {
    x: clampWorklet(tx, -maxTx, maxTx),
    y: clampWorklet(ty, -maxTy, maxTy)
  };
}

export function ZoomableBoardViewport({
  boardWidth,
  boardHeight,
  children,
  onBoardPress
}: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const viewportW = useSharedValue(0);
  const viewportH = useSharedValue(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    viewportW.value = width;
    viewportH.value = height;
  }, [viewportH, viewportW]);

  const applyClampedTranslation = () => {
    'worklet';
    const clamped = clampTranslation(
      translateX.value,
      translateY.value,
      boardWidth,
      boardHeight,
      scale.value,
      viewportW.value,
      viewportH.value
    );
    translateX.value = clamped.x;
    translateY.value = clamped.y;
    savedTranslateX.value = clamped.x;
    savedTranslateY.value = clamped.y;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        applyClampedTranslation();
      }
    });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX([-4, 4])
    .activeOffsetY([-4, 4])
    .onBegin(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      const nextX = savedTranslateX.value + e.translationX;
      const nextY = savedTranslateY.value + e.translationY;
      const clamped = clampTranslation(
        nextX,
        nextY,
        boardWidth,
        boardHeight,
        scale.value,
        viewportW.value,
        viewportH.value
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      applyClampedTranslation();
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(250)
    .onEnd((e) => {
      const vw = viewportW.value;
      const vh = viewportH.value;
      if (vw <= 0 || vh <= 0) return;

      const s = scale.value;
      const cx = vw / 2 + translateX.value;
      const cy = vh / 2 + translateY.value;
      const boardX = (e.x - cx) / s + boardWidth / 2;
      const boardY = (e.y - cy) / s + boardHeight / 2;
      runOnJS(onBoardPress)(boardX, boardY);
    });

  const boardGesture = Gesture.Simultaneous(
    pinch,
    Gesture.Exclusive(pan, singleTap)
  );

  const stageTransformStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

  return (
    <View style={styles.root} onLayout={onLayout}>
      <GestureDetector gesture={boardGesture}>
        <View style={styles.viewport}>
          <Animated.View style={[styles.stage, stageTransformStyle]}>
            <View style={{ width: boardWidth, height: boardHeight }}>{children}</View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%'
  },
  viewport: {
    flex: 1,
    overflow: 'hidden'
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
