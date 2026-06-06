/**
 * Real-Time Star Rating Display
 *
 * Shows 3 stars during gameplay that fade as time passes and hearts are lost.
 * - 0 to levelBaselineSeconds:       All ⭐⭐⭐ bright gold
 * - levelBaselineSeconds+1 to +5:    Third star grey (grace period)
 * - levelBaselineSeconds+6+:         Second star grey (⭐ flashing)
 * - Hearts lost:                      -1 star penalty applied immediately
 *
 * FIXES APPLIED:
 *  FIX 1: Star render order corrected to left-to-right (star1 → star2 → star3)
 *  FIX 2: Default timeStars changed to 3; steps DOWN only on explicit threshold crossing
 *  FIX 3: Dispatches finalStarsCalculated to Zustand store for VictoryScreen sync
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring
} from 'react-native-reanimated';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';

interface StarRatingDisplayProps {
  levelBaselineSeconds: number;
}

export function StarRatingDisplay({ levelBaselineSeconds }: StarRatingDisplayProps) {
  const board = useGameStore((s) => s.board);
  const gameStartTime = useGameStore((s) => s.gameStartTime);
  const status = useGameStore((s) => s.status);
  // FIX 3: Pull setter from global store to sync final stars with VictoryScreen
  const setFinalStarsCalculated = useGameStore((s) => s.setFinalStarsCalculated);

  const [timeTaken, setTimeTaken] = useState(0);
  const [heartsLost, setHeartsLost] = useState(0);

  // Calculate current stars for display
  let currentTimeStars = 3;
  if (timeTaken > levelBaselineSeconds + 5) {
    currentTimeStars = 1;
  } else if (timeTaken > levelBaselineSeconds) {
    currentTimeStars = 2;
  }
  const currentFinalStars = Math.max(1, currentTimeStars - (heartsLost > 0 ? 1 : 0));

  // Animated values for star opacity and color
  const star3Opacity = useSharedValue(1);
  const star2Opacity = useSharedValue(1);
  const star1Scale = useSharedValue(1);
  const timerScale = useSharedValue(1);

  // Update time every 100ms
  useEffect(() => {
    if (gameStartTime === null) {
      setTimeTaken(0);
      return;
    }

    if (status === 'won' || status === 'failed') {
      return;
    }

    const interval = setInterval(() => {
      const { isPaused, pausedAt, accumulatedPausedTime } = useGameStore.getState();
      let elapsedMs = 0;
      if (isPaused && pausedAt !== null) {
        elapsedMs = pausedAt - gameStartTime - accumulatedPausedTime;
      } else {
        elapsedMs = Date.now() - gameStartTime - accumulatedPausedTime;
      }
      const elapsed = Math.round(Math.max(0, elapsedMs) / 1000);
      setTimeTaken(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [gameStartTime, status]);

  // Track hearts lost based on 3 total lives
  useEffect(() => {
    const lost = Math.max(0, 3 - board.livesLeft);
    setHeartsLost(lost);
  }, [board.livesLeft]);

  // Calculate stars based on time AND hearts
  useEffect(() => {
    // Push authoritative score to global store so VictoryScreen reads it instantly
    setFinalStarsCalculated(currentFinalStars);

    // Visual Animations — fading stars based on FINAL result (Time + Health)
    if (currentFinalStars === 3) {
      // All 3 stars bright gold
      star3Opacity.value = withTiming(1, { duration: 200 });
      star2Opacity.value = withTiming(1, { duration: 200 });
    } else if (currentFinalStars === 2) {
      // 2 stars: dim the rightmost star (star3)
      star3Opacity.value = withTiming(0.3, { duration: 200 });
      star2Opacity.value = withTiming(1, { duration: 200 });
    } else {
      // 1 star: dim star3 and star2, pulse star1
      star3Opacity.value = withTiming(0.3, { duration: 200 });
      star2Opacity.value = withTiming(0.3, { duration: 200 });

      star1Scale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 300, easing: Easing.inOut(Easing.ease) })
      );
    }

    if (heartsLost > 0) {
      timerScale.value = withSequence(
        withSpring(1.15, { damping: 6, stiffness: 100 }),
        withSpring(1.0, { damping: 6, stiffness: 100 })
      );
    }
  }, [currentFinalStars, heartsLost]);

  // Animated styles
  // FIX 1: star1 is leftmost and never dims — it's the last star standing
  const star1Style = useAnimatedStyle(() => ({
    transform: [{ scale: star1Scale.value }],
    opacity: 1
  }));

  const star2Style = useAnimatedStyle(() => ({
    opacity: star2Opacity.value,
    color: star2Opacity.value < 0.5 ? '#888888' : '#FFD54F'
  }));

  // FIX 1: star3 is rightmost and dims first
  const star3Style = useAnimatedStyle(() => ({
    opacity: star3Opacity.value,
    color: star3Opacity.value < 0.5 ? '#888888' : '#FFD54F'
  }));

  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }]
  }));

  // Timer colour: red → orange → green
  const timeColor =
    timeTaken > levelBaselineSeconds + 5
      ? '#FF6B6B'
      : timeTaken > levelBaselineSeconds
        ? '#FFA500'
        : '#6AC844';

  const timeDisplay = `${timeTaken}s`;
  const baselineDisplay = `/ ${levelBaselineSeconds}s`;

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        <Animated.Text style={[styles.star, star1Style]}>⭐</Animated.Text>
        <Animated.Text style={[styles.star, star2Style]}>⭐</Animated.Text>
        <Animated.Text style={[styles.star, star3Style]}>⭐</Animated.Text>
      </View>

      <Animated.View style={[styles.timerContainer, timerStyle]}>
        <Text style={[styles.timer, { color: timeColor }]}>{timeDisplay}</Text>
        <Text style={styles.baseline}>{baselineDisplay}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
    ...theme.shadows.sm
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center'
  },
  star: {
    fontSize: 28,
    textShadowColor: 'rgba(255, 213, 79, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2
  },
  timer: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums']
  },
  baseline: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '600'
  }
});
