import React, { useState, useEffect, useMemo } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import { PuzzleBoardCanvas } from '../components/PuzzleBoardCanvas';
import { createInitialBoard } from '../game/engine';
import type { ArrowNode, LevelDefinition } from '../game/types';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';
import { audioManager } from '../utils/audio';

// ── Step 1 Level: 1 unblocked arrow pointing RIGHT ──
const TUTORIAL_STEP_1: LevelDefinition = {
  id: 9991,
  title: 'Step 1',
  difficulty: 'Easy',
  gridSize: { columns: 3, rows: 3 },
  arrows: [
    {
      id: 'tut_arrow_1',
      path: [{ x: 1, y: 1 }, { x: 2, y: 1 }],
      fullPath: [{ x: 1, y: 1 }, { x: 2, y: 1 }],
      color: '#43A047'
    }
  ]
};

// ── Step 2 Level: Arrow A blocked by Arrow B ──
const TUTORIAL_STEP_2: LevelDefinition = {
  id: 9992,
  title: 'Step 2',
  difficulty: 'Easy',
  gridSize: { columns: 3, rows: 3 },
  arrows: [
    {
      id: 'tut_arrow_blocked',
      path: [{ x: 0, y: 1 }, { x: 1, y: 1 }],
      fullPath: [{ x: 0, y: 1 }, { x: 1, y: 1 }],
      color: '#6A4428'
    },
    {
      id: 'tut_arrow_blocker',
      path: [{ x: 2, y: 0 }, { x: 2, y: 2 }],
      fullPath: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
      color: '#43A047'
    }
  ]
};

export function TutorialScreen() {
  const navigation = useNavigation<AppNavigation>();
  const { width } = useWindowDimensions();
  const completeTutorial = useGameStore((s) => s.completeTutorial);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [exitingArrows, setExitingArrows] = useState<ArrowNode[]>([]);
  const [heartsCount, setHeartsCount] = useState(3);
  const [heartsShaking, setHeartsShaking] = useState(false);

  const handTranslateY = useSharedValue(0);
  const stepScale = useSharedValue(1);

  useEffect(() => {
    handTranslateY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 600 }),
        withTiming(0, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);

  const handAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: handTranslateY.value }]
  }));

  const boardSize = Math.min(width * 0.55, 240);

  const step1Board = useMemo(() => createInitialBoard(TUTORIAL_STEP_1, 3), []);
  const [board2, setBoard2] = useState(() => createInitialBoard(TUTORIAL_STEP_2, 3));

  const handleSkip = () => {
    audioManager.playSound('correct');
    completeTutorial();
    navigation.replace('Gameplay');
  };

  const handleNextStep = (next: 1 | 2 | 3 | 4) => {
    audioManager.playSound('correct');
    stepScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 12 })
    );
    setCurrentStep(next);
  };

  const handleStep1Tap = (arrowId: string) => {
    const arrow = step1Board.arrows.find((a) => a.id === arrowId);
    if (arrow) {
      audioManager.playSound('correct');
      setExitingArrows([arrow]);
      setTimeout(() => {
        setExitingArrows([]);
        handleNextStep(2);
      }, 700);
    }
  };

  const handleStep2Tap = (arrowId: string) => {
    const arrow = board2.arrows.find((a) => a.id === arrowId);
    if (!arrow) return;

    if (arrowId === 'tut_arrow_blocker') {
      audioManager.playSound('correct');
      setExitingArrows((prev) => [...prev, arrow]);
      setTimeout(() => {
        setBoard2((prev) => ({
          ...prev,
          arrows: prev.arrows.filter((a) => a.id !== 'tut_arrow_blocker')
        }));
      }, 400);
    } else if (arrowId === 'tut_arrow_blocked') {
      const isStillBlocked = board2.arrows.some((a) => a.id === 'tut_arrow_blocker');
      if (isStillBlocked) {
        audioManager.playSound('wrong');
      } else {
        audioManager.playSound('correct');
        setExitingArrows((prev) => [...prev, arrow]);
        setTimeout(() => {
          setExitingArrows([]);
          handleNextStep(3);
        }, 700);
      }
    }
  };

  const handleStep3TapMistake = () => {
    audioManager.playSound('wrong');
    setHeartsShaking(true);
    setHeartsCount((h) => Math.max(1, h - 1));
    setTimeout(() => {
      setHeartsShaking(false);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />

      {/* Top Bar with Step Indicators & Skip */}
      <View style={styles.topBar}>
        <View style={styles.stepDots}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.dot,
                s === currentStep && styles.dotActive,
                s < currentStep && styles.dotCompleted
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepCounterText}>Step {currentStep} of 4</Text>
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip ➔</Text>
        </Pressable>
      </View>

      {/* Content Body */}
      <View style={styles.content}>
        {/* STEP 1 */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>🏹 The Escape</Text>
            <Text style={styles.stepDesc}>
              Tap the arrow that has an open exit path. It will fly out of the board!
            </Text>

            <View style={styles.boardWrapper}>
              <PuzzleBoardCanvas
                board={step1Board}
                width={boardSize}
                exitingArrows={exitingArrows}
                onArrowPress={handleStep1Tap}
                onExitDone={() => {}}
              />
              <Animated.Text style={[styles.handPointer, handAnimStyle]}>☝</Animated.Text>
            </View>

            <View style={styles.tipPill}>
              <Text style={styles.tipText}>💡 Tip: Look at arrow directions</Text>
            </View>
          </View>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>🛑 The Blockers</Text>
            <Text style={styles.stepDesc}>
              Some arrows are blocked by others. Clear the blocker arrow first!
            </Text>

            <View style={styles.boardWrapper}>
              <PuzzleBoardCanvas
                board={board2}
                width={boardSize}
                exitingArrows={exitingArrows}
                onArrowPress={handleStep2Tap}
                onExitDone={() => {}}
              />
            </View>

            <View style={styles.tipPill}>
              <Text style={styles.tipText}>Tap the GREEN arrow pointing down first!</Text>
            </View>
          </View>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>❤️ Lives & Resilience</Text>
            <Text style={styles.stepDesc}>
              You have 3 Hearts. Tapping a blocked arrow in higher levels costs a life!
            </Text>

            <View style={styles.heartsRow}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Text
                  key={i}
                  style={[
                    styles.heartIcon,
                    i >= heartsCount && styles.heartIconEmpty,
                    heartsShaking && styles.heartShaking
                  ]}
                >
                  {i < heartsCount ? '❤' : '♡'}
                </Text>
              ))}
            </View>

            <Pressable style={styles.mistakeButton} onPress={handleStep3TapMistake}>
              <Text style={styles.mistakeButtonText}>💥 Test Wrong Tap Feedback</Text>
            </Pressable>

            <Pressable
              style={styles.continueStepButton}
              onPress={() => handleNextStep(4)}
            >
              <Text style={styles.continueStepButtonText}>I Understand! ➔</Text>
            </Pressable>
          </View>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>⚡ Tactical Arsenal</Text>
            <Text style={styles.stepDesc}>
              Use Undo ↶ to take back moves and Hint 💡 when you are stuck.
            </Text>

            <View style={styles.toolsPreviewRow}>
              <View style={styles.toolCard}>
                <Text style={styles.toolEmoji}>↶</Text>
                <Text style={styles.toolName}>Undo</Text>
                <Text style={styles.toolDesc}>Step back</Text>
              </View>
              <View style={styles.toolCard}>
                <Text style={styles.toolEmoji}>💡</Text>
                <Text style={styles.toolName}>Hint</Text>
                <Text style={styles.toolDesc}>Reveal free arrow</Text>
              </View>
              <View style={styles.toolCard}>
                <Text style={styles.toolEmoji}>↻</Text>
                <Text style={styles.toolName}>Restart</Text>
                <Text style={styles.toolDesc}>Fresh board</Text>
              </View>
            </View>

            <Pressable style={styles.finalLaunchButton} onPress={handleSkip}>
              <Text style={styles.finalLaunchButtonText}>🚀 START PLAYING LEVEL 1</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1E1B18'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FFD54F'
  },
  dotCompleted: {
    backgroundColor: '#43A047'
  },
  stepCounterText: {
    color: '#BCAAA4',
    fontSize: 12,
    fontWeight: '800'
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  skipText: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: '800'
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center'
  },
  stepTitle: {
    color: '#FFD54F',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center'
  },
  stepDesc: {
    color: '#EFEBE9',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10
  },
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    backgroundColor: '#2A2421',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 213, 79, 0.3)',
    ...theme.shadows.md
  },
  handPointer: {
    fontSize: 48,
    position: 'absolute',
    bottom: -16,
    right: 24
  },
  tipPill: {
    backgroundColor: 'rgba(255, 213, 79, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.4)',
    marginTop: 16
  },
  tipText: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: '800'
  },
  heartsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 24
  },
  heartIcon: {
    color: '#FF3D00',
    fontSize: 42
  },
  heartIconEmpty: {
    color: 'rgba(255, 255, 255, 0.2)'
  },
  heartShaking: {
    transform: [{ scale: 1.2 }]
  },
  mistakeButton: {
    backgroundColor: 'rgba(239, 83, 80, 0.2)',
    borderColor: '#EF5350',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20
  },
  mistakeButtonText: {
    color: '#EF5350',
    fontSize: 13,
    fontWeight: '800'
  },
  continueStepButton: {
    backgroundColor: '#FFD54F',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    ...theme.shadows.sm
  },
  continueStepButtonText: {
    color: '#1E1B18',
    fontSize: 14,
    fontWeight: '900'
  },
  toolsPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 24
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#2A2421',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  toolEmoji: {
    fontSize: 26,
    color: '#FFD54F',
    marginBottom: 4
  },
  toolName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  toolDesc: {
    color: '#BCAAA4',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center'
  },
  finalLaunchButton: {
    backgroundColor: '#FFD54F',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    ...theme.shadows.md
  },
  finalLaunchButtonText: {
    color: '#1E1B18',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5
  }
});
