import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import { BottomControls } from '../components/BottomControls';
import { GameHeader } from '../components/GameHeader';
import { LivesIndicator } from '../components/LivesIndicator';
import { findArrowAtPoint, PuzzleBoardCanvas } from '../components/PuzzleBoardCanvas';
import { ZoomableBoardViewport } from '../components/ZoomableBoardViewport';
import { SettingsModal } from '../components/SettingsModal';
import { StarRatingDisplay } from '../components/StarRatingDisplay';
import { findBlockingArrow, isFrontClear } from '../game/engine';
import type { ArrowNode } from '../game/types';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';
import { playCorrectFeedback, playWrongFeedback } from '../utils/feedback';

type BlockedArrowEntry = { arrow: ArrowNode; blocker: ArrowNode | null };

export function GameplayScreen() {
  const navigation = useNavigation<AppNavigation>();
  const { width, height } = useWindowDimensions();
  const board = useGameStore((s) => s.board);
  const status = useGameStore((s) => s.status);
  const currentLevelId = useGameStore((s) => s.currentLevelId);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
  const tapArrow = useGameStore((s) => s.tapArrow);
  const retry = useGameStore((s) => s.retry);
  const undo = useGameStore((s) => s.undo);
  const useHint = useGameStore((s) => s.useHint);
  const hintUsedThisLevel = useGameStore((s) => s.hintUsedThisLevel);

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [exitingArrows, setExitingArrows] = useState<ArrowNode[]>([]);
  const [blockedArrows, setBlockedArrows] = useState<BlockedArrowEntry[]>([]);
  const [flashingArrows, setFlashingArrows] = useState<ArrowNode[]>([]);
  const pendingNav = useRef<'Victory' | 'Fail' | null>(null);
  const boardScale = useSharedValue(1);
  const boardOpacity = useSharedValue(1);

  const maxW = width * 0.95;
  const maxH = height * 0.45;
  const { columns, rows } = board.level.gridSize;
  const sizeFromWidth = maxW / columns;
  const sizeFromHeight = maxH / rows;
  const cellSize = Math.min(sizeFromWidth, sizeFromHeight, 50);
  const boardWidth = cellSize * columns;
  const boardHeight = cellSize * rows;

  const animatedBoardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
    opacity: boardOpacity.value
  }));

  useEffect(() => {
    if (status === 'won') pendingNav.current = 'Victory';
    if (status === 'failed') pendingNav.current = 'Fail';
    if ((status === 'won' || status === 'failed') && exitingArrows.length === 0) {
      const t = setTimeout(() => {
        if (pendingNav.current) navigation.replace(pendingNav.current);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [status, exitingArrows.length, navigation]);

  // Clear animation queues on level change (retry / next level).
  useEffect(() => {
    setExitingArrows([]);
    setBlockedArrows([]);
    setFlashingArrows([]);
  }, [currentLevelId]);

  useEffect(() => {
    boardOpacity.value = 0;
    boardScale.value = 0.96;
    boardOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
    boardScale.value = withSpring(1, { damping: 14, stiffness: 120 });
  }, [currentLevelId]);

  const handleExitDone = useCallback((arrowId: string) => {
    setExitingArrows((prev) => prev.filter((a) => a.id !== arrowId));
  }, []);

  const handleBlockedDone = useCallback((arrowId: string) => {
    setBlockedArrows((prev) => prev.filter((b) => b.arrow.id !== arrowId));
  }, []);

  /** Called at the collision moment in BlockedArrowOverlay — flash the blocker red. */
  const handleCollisionPoint = useCallback((blocker: ArrowNode | null) => {
    if (!blocker) return;
    setFlashingArrows((prev) => [...prev, blocker]);
    // Remove after the flash animation completes (~460ms total in FlashingArrowOverlay).
    setTimeout(() => {
      setFlashingArrows((prev) => prev.filter((a) => a.id !== blocker.id));
    }, 520);
  }, []);

  const handleArrowPress = useCallback(
    (arrowId: string) => {
      // Snapshot the board BEFORE the tap so we can find the blocker correctly.
      const boardBefore = useGameStore.getState().board;
      const arrow = boardBefore.arrows.find((a) => a.id === arrowId);
      const result = tapArrow(arrowId);

      if (result === 'REMOVED' && arrow) {
        setExitingArrows((prev) => [...prev, { ...arrow, color: '#43A047' }]);
        void playCorrectFeedback();
      } else if (result === 'BLOCKED' && arrow) {
        // Find which arrow is physically blocking, then start the red-slide animation.
        const blocker = findBlockingArrow(arrow, boardBefore) ?? null;
        setBlockedArrows((prev) => [...prev, { arrow, blocker }]);
        void playWrongFeedback(hapticsEnabled);
      }
    },
    [tapArrow, hapticsEnabled]
  );

  const handleBoardPress = useCallback(
    (x: number, y: number) => {
      const currentBoard = useGameStore.getState().board;
      const arrow = findArrowAtPoint(currentBoard.arrows, x, y, cellSize);
      if (arrow) handleArrowPress(arrow.id);
    },
    [cellSize, handleArrowPress]
  );

  const handleHint = useCallback(() => {
    if (useGameStore.getState().hintUsedThisLevel) {
      Alert.alert('Hint Used', 'You only get one hint per level.');
      return;
    }

    const currentBoard = useGameStore.getState().board;
    const hintArrow = currentBoard.arrows.find((a) => isFrontClear(a, currentBoard));
    const hintedId = useHint();
    if (hintedId && hintArrow) {
      setExitingArrows((prev) => [...prev, { ...hintArrow, color: '#43A047' }]);
      void playCorrectFeedback();
    } else {
      Alert.alert('No Hint', 'No valid move right now. Try Undo!');
    }
  }, [useHint]);

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />
      <GameHeader
        title={`Level ${currentLevelId}`}
        difficulty={board.level.difficulty}
        arrowsLeft={board.arrows.length}
        totalArrows={board.level.arrows.length}
        onBack={() => navigation.replace('Home')}
        onSettings={() => setSettingsVisible(true)}
      />
      <LivesIndicator livesLeft={board.livesLeft} />
      <StarRatingDisplay levelBaselineSeconds={board.level.arrows.length} />
      <View style={styles.boardStage}>
        <ZoomableBoardViewport
          key={currentLevelId}
          boardWidth={boardWidth}
          boardHeight={boardHeight}
          onBoardPress={handleBoardPress}
        >
          <Animated.View style={animatedBoardStyle}>
            <PuzzleBoardCanvas
              board={board}
              exitingArrows={exitingArrows}
              blockedArrows={blockedArrows}
              flashingArrows={flashingArrows}
              width={boardWidth}
              enableTouch={false}
              onArrowPress={handleArrowPress}
              onExitDone={handleExitDone}
              onBlockedDone={handleBlockedDone}
              onCollisionPoint={handleCollisionPoint}
            />
          </Animated.View>
        </ZoomableBoardViewport>
      </View>
      <BottomControls
        onUndo={undo}
        onHint={handleHint}
        onRestart={retry}
        hintDisabled={hintUsedThisLevel}
      />
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onRestart={() => {
          setSettingsVisible(false);
          retry();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  boardStage: { flex: 1, width: '100%' }
});
