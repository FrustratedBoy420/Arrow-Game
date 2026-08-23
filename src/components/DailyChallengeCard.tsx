import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';
import { audioManager } from '../utils/audio';

export function DailyChallengeCard() {
  const navigation = useNavigation<AppNavigation>();
  const dailyPuzzleState = useGameStore((s) => s.dailyPuzzleState);
  const fetchDailyPuzzle = useGameStore((s) => s.fetchDailyPuzzle);
  const startDailyChallenge = useGameStore((s) => s.startDailyChallenge);

  const [remainingTime, setRemainingTime] = useState<string>('--:--:--');
  const [loading, setLoading] = useState(false);

  const glowOpacity = useSharedValue(0.7);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.6, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 213, 79, ${glowOpacity.value})`
  }));

  // Live Countdown to Midnight UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrowUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));
      const diffMs = Math.max(0, tomorrowUTC.getTime() - now.getTime());

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setRemainingTime(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().split('T')[0]!;
  const isCompletedToday = dailyPuzzleState?.lastCompletedDate === today;
  const currentStreak = dailyPuzzleState?.currentStreak || 0;

  const handlePlayDaily = async () => {
    audioManager.playSound('correct');
    setLoading(true);

    const res = await fetchDailyPuzzle();
    setLoading(false);

    if (res && res.success && res.level) {
      startDailyChallenge(res.level);
      navigation.navigate('Gameplay');
    } else {
      Alert.alert(
        'World Challenge',
        'Could not load today’s puzzle. Please check your internet connection and try again.'
      );
    }
  };

  return (
    <Animated.View style={[styles.card, animatedCardStyle]}>
      {/* Top Badge Row */}
      <View style={styles.topRow}>
        <View style={styles.worldBadge}>
          <Text style={styles.worldBadgeText}>🌌 WORLD CHALLENGE</Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>⏱️ {remainingTime}</Text>
        </View>
      </View>

      {/* Main Info */}
      <View style={styles.infoRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🎯</Text>
        </View>
        <View style={styles.textDetails}>
          <Text style={styles.title}>Daily Global Puzzle</Text>
          <Text style={styles.subtitle}>
            {isCompletedToday
              ? `Completed! Best: ${dailyPuzzleState?.bestTimeSeconds ?? '--'}s`
              : 'Same puzzle for every tactician globally'}
          </Text>
        </View>
      </View>

      {/* Reward / Streak Pills */}
      <View style={styles.rewardsRow}>
        <View style={styles.rewardPill}>
          <Text style={styles.rewardPillText}>+100 🪙</Text>
        </View>
        <View style={styles.rewardPill}>
          <Text style={styles.rewardPillText}>+25 🏆</Text>
        </View>
        {currentStreak > 0 && (
          <View style={[styles.rewardPill, styles.streakPill]}>
            <Text style={styles.streakPillText}>🔥 {currentStreak} Day Streak</Text>
          </View>
        )}
      </View>

      {/* Action Button */}
      {isCompletedToday ? (
        <View style={styles.completedBanner}>
          <Text style={styles.completedText}>✅ COMPLETED TODAY • RESET AT MIDNIGHT</Text>
        </View>
      ) : (
        <Pressable
          style={styles.playButton}
          onPress={handlePlayDaily}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1E1B18" size="small" />
          ) : (
            <Text style={styles.playButtonText}>⚡ PLAY TODAY'S PUZZLE</Text>
          )}
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2A2421',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD54F',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    ...theme.shadows.md
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  worldBadge: {
    backgroundColor: 'rgba(255, 213, 79, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.4)'
  },
  worldBadgeText: {
    color: '#FFD54F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  timerBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  timerText: {
    color: '#FFE082',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums']
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3E2723',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#FFD54F'
  },
  iconEmoji: {
    fontSize: 22
  },
  textDetails: {
    flex: 1
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  subtitle: {
    color: '#BCAAA4',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14
  },
  rewardPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  rewardPillText: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: '800'
  },
  streakPill: {
    backgroundColor: 'rgba(255, 111, 0, 0.2)',
    borderColor: '#FF6F00'
  },
  streakPillText: {
    color: '#FFB74D',
    fontSize: 12,
    fontWeight: '800'
  },
  playButton: {
    backgroundColor: '#FFD54F',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm
  },
  playButtonText: {
    color: '#1E1B18',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  completedBanner: {
    backgroundColor: 'rgba(67, 160, 71, 0.2)',
    borderColor: '#43A047',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center'
  },
  completedText: {
    color: '#81C784',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  }
});
