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

import { useEffect, useState } from 'react';
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
  // FIX 3: Pull setter from global store to sync final stars with VictoryScreen
  const setFinalStarsCalculated = useGameStore((s) => s.setFinalStarsCalculated);

  const [timeTaken, setTimeTaken] = useState(0);
  const [heartsLost, setHeartsLost] = useState(0);
  const [baseStars, setBaseStars] = useState(3);

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

    const interval = setInterval(() => {
      const elapsed = Math.round((Date.now() - gameStartTime) / 1000);
      setTimeTaken(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [gameStartTime]);

  // Track hearts lost based on 3 total lives
  useEffect(() => {
    const lost = Math.max(0, 3 - board.livesLeft);
    setHeartsLost(lost);
  }, [board.livesLeft]);

  // Calculate stars based on time AND hearts
  useEffect(() => {
    // FIX 2: Default to 3 stars (optimistic) — only step DOWN when threshold is explicitly crossed
    // Old bug: `let timeStars = 1` caused 1-star lock on first render when
    // levelBaselineSeconds hadn't populated yet (0 <= undefined = false → fell to default 1)
    let timeStars = 3;

    if (timeTaken > levelBaselineSeconds + 5) {
      // Beyond grace period
      timeStars = 1;
    } else if (timeTaken > levelBaselineSeconds) {
      // Inside grace period (levelBaselineSeconds+1 to +5)
      timeStars = 2;
    }
    // else: timeTaken <= levelBaselineSeconds → stays at 3

    setBaseStars(timeStars);

    // Apply Heart Penalty: any hearts lost = -1 star (floor 1)
    const penalty = heartsLost > 0 ? 1 : 0;
    const finalStars = Math.max(1, timeStars - penalty);

    // FIX 3: Push authoritative score to global store so VictoryScreen reads it instantly
    setFinalStarsCalculated(finalStars);

    // Visual Animations — fading stars based on time thresholds
    if (timeTaken <= levelBaselineSeconds) {
      // All 3 stars bright gold
      star3Opacity.value = withTiming(1, { duration: 200 });
      star2Opacity.value = withTiming(1, { duration: 200 });
    } else if (timeTaken <= levelBaselineSeconds + 5) {
      // Grace period: rightmost star (star3) dims
      star3Opacity.value = withTiming(0.3, { duration: 200 });
      star2Opacity.value = withTiming(1, { duration: 200 });
    } else {
      // Beyond grace: star3 and star2 both dim, star1 pulses
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
  }, [timeTaken, heartsLost, levelBaselineSeconds]);

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
      {/* Stars Display
          FIX 1: Correct left-to-right order: star1 (never dims) → star2 → star3 (dims first)
          Old bug had star3 → star2 → star1, so the LEFTMOST star was greying out first */}
      <View style={styles.statusRow}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 213, 79, 0.4)',
    ...theme.shadows.md
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center'
  },
  star: {
    fontSize: 30,
    textShadowColor: 'rgba(255, 213, 79, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  timer: {
    fontSize: 24,
    fontWeight: '900',
    fontVariant: ['tabular-nums']
  },
  baseline: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '700'
  }
});
