import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, useWindowDimensions, View, BackHandler } from 'react-native';
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
import { ExitConfirmModal } from '../components/ExitConfirmModal';
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
  const isAdmin = useGameStore((s) => !!s.iconsConfig?.unlockAllLevels);

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backModalVisible, setBackModalVisible] = useState(false);
  const [exitingArrows, setExitingArrows] = useState<ArrowNode[]>([]);
  const [blockedArrows, setBlockedArrows] = useState<BlockedArrowEntry[]>([]);
  const [lastTap, setLastTap] = useState<{ x: number; y: number; timestamp: number } | undefined>(undefined);
  const pendingNav = useRef<'Victory' | 'Fail' | null>(null);
  const boardScale = useSharedValue(1);
  const boardOpacity = useSharedValue(1);

  const maxW = width * 0.92;
  const maxH = height * 0.52;
  const { columns, rows } = board.level.gridSize;
  // Cap the reference layout divisor to 10 so larger levels do not look too dense/compact on start.
  // The board will overflow the screen container comfortably and can be panned or zoomed out by the user.
  const referenceCols = Math.min(columns, 10);
  const referenceRows = Math.min(rows, 10);
  const sizeFromWidth = maxW / referenceCols;
  const sizeFromHeight = maxH / referenceRows;
  const cellSize = Math.min(sizeFromWidth, sizeFromHeight, 52);
  const boardWidth = cellSize * columns;
  const boardHeight = cellSize * rows;

  const animatedBoardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
    opacity: boardOpacity.value,
    overflow: 'visible'
  }));

  useEffect(() => {
    if (status === 'failed') {
      navigation.replace('Fail');
      return;
    }

    if (status === 'won' && exitingArrows.length === 0) {
      navigation.replace('Victory');
      return;
    }
  }, [status, navigation, exitingArrows.length]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        useGameStore.getState().pauseGame();
        setBackModalVisible(true);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  // Clear animation queues on level change (retry / next level).
  useEffect(() => {
    setExitingArrows([]);
    setBlockedArrows([]);
  }, [currentLevelId]);

  useEffect(() => {
    boardOpacity.value = 0;
    boardScale.value = 0.94;
    boardOpacity.value = withTiming(1, { duration: 400, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    boardScale.value = withSpring(1, { damping: 15, stiffness: 100, mass: 0.8 });
  }, [currentLevelId]);

  const handleExitDone = useCallback((arrowId: string) => {
    setExitingArrows((prev) => {
      const next = prev.filter((a) => a.id !== arrowId);
      // Only navigate to Victory after all exiting arrows have completed their animations
      // AND the game status is 'won'
      if (useGameStore.getState().status === 'won' && next.length === 0) {
        // Add small delay to allow UI to fully settle after final animation
        setTimeout(() => {
          navigation.replace('Victory');
        }, 100);
      }
      return next;
    });
  }, [navigation]);

  const handleBlockedDone = useCallback((arrowId: string) => {
    setBlockedArrows((prev) => prev.filter((b) => b.arrow.id !== arrowId));
  }, []);



  const handleArrowPress = useCallback(
    (arrowId: string) => {
      const { isPaused } = useGameStore.getState();
      if (isPaused) return;

      // Snapshot the board BEFORE the tap so we can find the blocker correctly.
      const boardBefore = useGameStore.getState().board;
      const arrow = boardBefore.arrows.find((a) => a.id === arrowId);
      const result = tapArrow(arrowId);

      if (result === 'REMOVED' && arrow) {
        setExitingArrows((prev) => {
          if (prev.some((a) => a.id === arrow.id)) return prev;
          return [...prev, { ...arrow, color: '#43A047' }];
        });
        void playCorrectFeedback();
      } else if (result === 'BLOCKED' && arrow) {
        // Find which arrow is physically blocking, then start the red-slide animation.
        const blocker = findBlockingArrow(arrow, boardBefore) ?? null;
        setBlockedArrows((prev) => {
          if (prev.some((b) => b.arrow.id === arrow.id)) return prev;
          return [...prev, { arrow, blocker }];
        });
        void playWrongFeedback(hapticsEnabled);
      }
    },
    [tapArrow, hapticsEnabled]
  );

  const handleBoardPress = useCallback(
    (x: number, y: number) => {
      const { isPaused } = useGameStore.getState();
      if (isPaused) return;

      setLastTap({ x, y, timestamp: Date.now() });
      const currentBoard = useGameStore.getState().board;
      const arrow = findArrowAtPoint(currentBoard.arrows, x, y, cellSize);
      if (arrow) handleArrowPress(arrow.id);
    },
    [cellSize, handleArrowPress]
  );

  const handleHint = useCallback(() => {
    const state = useGameStore.getState();
    const isAdminUser = !!state.iconsConfig?.unlockAllLevels;
    if (state.hintUsedThisLevel && !isAdminUser) {
      Alert.alert('Hint Used', 'You only get one hint per level.');
      return;
    }

    const currentBoard = useGameStore.getState().board;
    const hintArrow = currentBoard.arrows.find((a) => isFrontClear(a, currentBoard));
    const hintedId = useHint();
    if (hintedId && hintArrow) {
      setExitingArrows((prev) => {
        if (prev.some((a) => a.id === hintArrow.id)) return prev;
        return [...prev, { ...hintArrow, color: '#43A047' }];
      });
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
        onBack={() => {
          useGameStore.getState().pauseGame();
          setBackModalVisible(true);
        }}
        onSettings={() => {
          useGameStore.getState().pauseGame();
          setSettingsVisible(true);
        }}
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
              width={boardWidth}
              enableTouch={false}
              onArrowPress={handleArrowPress}
              onExitDone={handleExitDone}
              onBlockedDone={handleBlockedDone}
              lastTap={lastTap}
            />
          </Animated.View>
        </ZoomableBoardViewport>
      </View>
      <BottomControls
        onUndo={undo}
        onHint={handleHint}
        onRestart={retry}
        hintDisabled={hintUsedThisLevel && !isAdmin}
      />
      <SettingsModal
        visible={settingsVisible}
        onClose={() => {
          setSettingsVisible(false);
          useGameStore.getState().resumeGame();
        }}
        onRestart={() => {
          setSettingsVisible(false);
          retry();
        }}
      />
      <ExitConfirmModal
        visible={backModalVisible}
        onClose={() => {
          setBackModalVisible(false);
          useGameStore.getState().resumeGame();
        }}
        onConfirm={() => {
          setBackModalVisible(false);
          useGameStore.getState().resumeGame();
          navigation.replace('Home');
        }}
        title="Exit Level"
        description="Are you sure you want to exit? Your progress in this level will be lost."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  boardStage: { flex: 1, width: '100%', overflow: 'visible' }
});
