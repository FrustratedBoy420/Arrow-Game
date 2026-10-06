import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, useWindowDimensions, View, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { HINT_COIN_COST, useGameStore } from '../state/gameStore';
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
  const levelStartTime = useGameStore((s) => s.levelStartTime);
  const maxLives = useGameStore((s) => s.maxLives);
  // Shield Life: offered before the first tap, never on the practice levels 1-3 (wrong taps are free there)
  const canShield = useGameStore(
    (s) =>
      s.status === 'playing' &&
      s.gameStartTime === null &&
      s.maxLives === 3 &&
      (s.inventory?.extraLives ?? 0) > 0 &&
      (s.currentLevelId > 3 || !!s.dailyPuzzleState?.isDailyActive)
  );
  const insets = useSafeAreaInsets();

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
  const [alertSecondary, setAlertSecondary] = useState<{ text: string; run: () => void } | null>(null);
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

  // Clear animation queues and the combo on every new run (retry keeps the level id, so key on the start time too).
  useEffect(() => {
    setExitingArrows([]);
    setBlockedArrows([]);
    comboRef.current = 0;
    lastCorrectTapTimeRef.current = 0;
    setCombo(0);
    setComboBonusCoins(0);
  }, [currentLevelId, levelStartTime]);

  useEffect(() => {
    boardOpacity.value = 0;
    boardScale.value = 0.94;
    boardOpacity.value = withTiming(1, { duration: 400, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    boardScale.value = withSpring(1, { damping: 15, stiffness: 100, mass: 0.8 });
  }, [currentLevelId, levelStartTime]);

  // Stop the clock while the app is in the background (the web game does the same for a hidden tab).
  useEffect(() => {
    let pausedByBackground = false;
    const sub = AppState.addEventListener('change', (next) => {
      const store = useGameStore.getState();
      if (next !== 'active') {
        if (!store.isPaused) {
          store.pauseGame();
          pausedByBackground = useGameStore.getState().isPaused;
        }
      } else if (pausedByBackground) {
        pausedByBackground = false;
        store.resumeGame();
      }
    });
    return () => sub.remove();
  }, []);

  const showInfo = useCallback((title: string, description: string, icon: string) => {
    setAlertTitle(title);
    setAlertDescription(description);
    setAlertConfirmText('OK');
    setAlertOnConfirm(undefined);
    setAlertSecondary(null);
    setAlertIconName(icon);
    setAlertVisible(true);
  }, []);

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
      // an arrow put back by Undo earns no combo coins when cleared again (no farming)
      const replayed = useGameStore.getState().undoneArrowIds.includes(arrowId);
      const result = tapArrow(arrowId);

      if (result === 'REMOVED' && arrow) {
        const now = Date.now();
        const delta = now - lastCorrectTapTimeRef.current;
        lastCorrectTapTimeRef.current = now;

        const nextCombo = delta <= 1800 ? (comboRef.current || 0) + 1 : 1;
        comboRef.current = nextCombo;
        setCombo(nextCombo);

        let bonus = 0;
        if (replayed) bonus = 0;
        else if (nextCombo === 3) bonus = 2;
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
    if (state.status !== 'playing' || state.isPaused) return;
    const isAdminUser = !!state.iconsConfig?.unlockAllLevels;

    const currentBoard = state.board;
    const hintArrow = currentBoard.arrows.find((a) => isFrontClear(a, currentBoard));
    if (!hintArrow) {
      showInfo('No Hint', 'No valid move right now. Try Undo!', 'alert-circle-outline');
      return;
    }

    const triggerHint = (paid?: 'ad' | 'coins') => {
      // the board can change while an ad plays: animate the arrow the store actually removed
      const before = useGameStore.getState().board;
      const hintedId = useGameStore.getState().useHint(paid);
      const hinted = hintedId ? before.arrows.find((a) => a.id === hintedId) : undefined;
      if (hinted) {
        setExitingArrows((prev) => {
          if (prev.some((a) => a.id === hinted.id)) return prev;
          return [...prev, { ...hinted, color: '#43A047' }];
        });
        void playCorrectFeedback();
      }
    };

    // free hint, or a hint booster: use it straight away
    if (!state.hintUsedThisLevel || isAdminUser || (state.inventory?.extraHints ?? 0) > 0) {
      triggerHint();
      return;
    }

    const canPayCoins = state.coins >= HINT_COIN_COST;
    const adEnabled = adManager.isRewardedAdEnabled();
    const adReady = adEnabled && adManager.isRewardedAdReady();
    const watchAd = () => {
      setAlertVisible(false);
      adManager.showRewarded(
        () => triggerHint('ad'),
        () => {}
      );
    };

    if (!canPayCoins && !adReady) {
      showInfo(
        adEnabled ? 'Ad Loading' : 'Not Enough Coins',
        adEnabled
          ? `The reward video is still loading. Try again in a few seconds, or earn ${HINT_COIN_COST} coins for a hint.`
          : `A hint costs ${HINT_COIN_COST} coins and you have ${state.coins}. Get hint packs in the Shop.`,
        adEnabled ? 'hourglass-outline' : 'alert-circle-outline'
      );
      return;
    }

    setAlertTitle('Get Another Hint');
    setAlertDescription(
      `You used your free hint for this level. ${canPayCoins ? `Spend ${HINT_COIN_COST} coins (you have ${state.coins})` : 'Watch a short video'}${
        canPayCoins && adReady ? ' or watch a short video' : ''
      }?`
    );
    setAlertCancelText('Cancel');
    setAlertIconName(canPayCoins ? 'bulb-outline' : 'play-circle-outline');
    if (canPayCoins) {
      setAlertConfirmText(`Use ${HINT_COIN_COST} 🪙`);
      setAlertOnConfirm(() => () => {
        setAlertVisible(false);
        triggerHint('coins');
      });
      setAlertSecondary(adReady ? { text: 'Watch Ad', run: watchAd } : null);
    } else {
      setAlertConfirmText('Watch Ad');
      setAlertOnConfirm(() => watchAd);
      setAlertSecondary(null);
    }
    setAlertVisible(true);
  }, [showInfo]);

  const handleUndo = useCallback(() => {
    const before = useGameStore.getState().board;
    const restoredId = before.removedIds[before.removedIds.length - 1];
    const result = useGameStore.getState().undo();
    if (result === 'used' && restoredId) {
      // stop an exit animation still running for the restored arrow so it is not drawn twice
      setExitingArrows((prev) => prev.filter((a) => a.id !== restoredId));
      comboRef.current = 0;
    } else if (result === 'none') {
      showInfo('No Undos Left', 'Your free undo for this level is used. Get Extra Undos in the Shop.', 'arrow-undo-outline');
    }
  }, [showInfo]);

  const handleShield = useCallback(() => {
    useGameStore.getState().activateShield();
  }, []);

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
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
      <LivesIndicator livesLeft={board.livesLeft} maxLives={maxLives} />
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
        onUndo={handleUndo}
        onHint={handleHint}
        onRestart={retry}
        onShield={canShield ? handleShield : undefined}
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
        secondaryText={alertSecondary?.text}
        onSecondary={alertSecondary?.run}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  boardStage: { flex: 1, width: '100%', overflow: 'visible' }
});
