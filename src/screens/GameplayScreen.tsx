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
import { CustomAlertModal } from '../components/CustomAlertModal';
import { findBlockingArrow, isFrontClear } from '../game/engine';
import type { ArrowNode } from '../game/types';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';
import { playCorrectFeedback, playWrongFeedback } from '../utils/feedback';
import { adManager } from '../utils/ads';
import { AdBanner } from '../components/AdBanner';
import { ComboPopup } from '../components/ComboPopup';


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
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [alertConfirmText, setAlertConfirmText] = useState('OK');
  const [alertCancelText, setAlertCancelText] = useState('Cancel');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [alertIconName, setAlertIconName] = useState<any>('information-circle-outline');
  const [combo, setCombo] = useState(0);
  const [comboBonusCoins, setComboBonusCoins] = useState(0);
  const lastCorrectTapTimeRef = useRef<number>(0);
  const comboRef = useRef<number>(0);

  const pendingNav = useRef<'Victory' | 'Fail' | null>(null);
  const boardScale = useSharedValue(1);
  const boardOpacity = useSharedValue(1);

  const maxW = width * 0.92;
  const maxH = height * 0.52;
  const { columns, rows } = board.level.gridSize;
  const sizeFromWidth = maxW / Math.max(columns, 1);
  const sizeFromHeight = maxH / Math.max(rows, 1);
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

  // Track active gameplay for ad blocking
  useEffect(() => {
    useGameStore.setState({ isGameplayActive: true });
    return () => {
      useGameStore.setState({ isGameplayActive: false });
    };
  }, []);

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
        const now = Date.now();
        const delta = now - lastCorrectTapTimeRef.current;
        lastCorrectTapTimeRef.current = now;

        const nextCombo = delta <= 1800 ? (comboRef.current || 0) + 1 : 1;
        comboRef.current = nextCombo;
        setCombo(nextCombo);

        let bonus = 0;
        if (nextCombo === 3) bonus = 2;
        else if (nextCombo === 4) bonus = 5;
        else if (nextCombo >= 5) bonus = 10;
        setComboBonusCoins(bonus);

        if (bonus > 0) {
          useGameStore.setState((s) => ({ coins: s.coins + bonus }));
        }

        const boardAfter = useGameStore.getState().board;
        const blockedSetBefore = new Set(boardBefore.blockedAttemptIds || []);

        const removedArrowIds = new Set(
          boardBefore.arrows
            .filter((a) => !boardAfter.arrows.some((remaining) => remaining.id === a.id))
            .map((a) => a.id)
        );
        const exitingToTrigger = boardBefore.arrows
          .filter((a) => removedArrowIds.has(a.id))
          .map((a) => ({
            ...a,
            color: blockedSetBefore.has(a.id) ? '#EF5350' : '#43A047'
          }));

        setExitingArrows((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const toAdd = exitingToTrigger.filter((a) => !existingIds.has(a.id));
          return [...prev, ...toAdd];
        });
        void playCorrectFeedback(hapticsEnabled, nextCombo);
      } else if (result === 'BLOCKED' && arrow) {
        // Reset combo on mistake
        comboRef.current = 0;
        setCombo(0);
        setComboBonusCoins(0);

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
      const arrow = findArrowAtPoint(currentBoard.arrows, x, y, cellSize, currentBoard);
      if (arrow) handleArrowPress(arrow.id);
    },
    [cellSize, handleArrowPress]
  );

  const handleHint = useCallback(() => {
    const state = useGameStore.getState();
    const isAdminUser = !!state.iconsConfig?.unlockAllLevels;

    const currentBoard = useGameStore.getState().board;
    const hintArrow = currentBoard.arrows.find((a) => isFrontClear(a, currentBoard));
    if (!hintArrow) {
      setAlertTitle('No Hint');
      setAlertDescription('No valid move right now. Try Undo!');
      setAlertConfirmText('OK');
      setAlertOnConfirm(undefined);
      setAlertIconName('alert-circle-outline');
      setAlertVisible(true);
      return;
    }

    const triggerHint = (force = false) => {
      const hintedId = useHint(force);
      if (hintedId) {
        setExitingArrows((prev) => {
          if (prev.some((a) => a.id === hintArrow.id)) return prev;
          return [...prev, { ...hintArrow, color: '#43A047' }];
        });
        void playCorrectFeedback();
      }
    };

    const isRewardedAdEnabled = adManager.isRewardedAdEnabled();
    const hasExtraHints = (state.inventory?.extraHints ?? 0) > 0;

    if (state.hintUsedThisLevel && !isAdminUser && !hasExtraHints && isRewardedAdEnabled) {
      if (!adManager.isRewardedAdReady()) {
        setAlertTitle('Ad Loading');
        setAlertDescription('The reward video is still loading. Please try again in a few seconds.');
        setAlertConfirmText('OK');
        setAlertOnConfirm(undefined);
        setAlertIconName('hourglass-outline');
        setAlertVisible(true);
        return;
      }

      setAlertTitle('Get Another Hint');
      setAlertDescription('You used your free hint for this level. Watch a video or buy hints in the Shop?');
      setAlertConfirmText('Watch Ad');
      setAlertCancelText('Cancel');
      setAlertIconName('play-circle-outline');
      setAlertOnConfirm(() => () => {
        setAlertVisible(false);
        adManager.showRewarded(
          () => {
            triggerHint(true);
          },
          () => {}
        );
      });
      setAlertVisible(true);
      return;
    }

    triggerHint(state.hintUsedThisLevel);
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
      <ComboPopup combo={combo} bonusCoins={comboBonusCoins} onDone={() => setCombo(0)} />
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
        hintDisabled={false}
      />
      <AdBanner />

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
      <CustomAlertModal
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertTitle}
        description={alertDescription}
        confirmText={alertConfirmText}
        cancelText={alertCancelText}
        onConfirm={alertOnConfirm}
        iconName={alertIconName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  boardStage: { flex: 1, width: '100%', overflow: 'visible' }
});
