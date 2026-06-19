import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { theme } from '../theme/theme';

interface Props {
  isMatchFound: boolean;
  opponentData: { name: string; level: number; winStreak: number } | null;
}

const fakeNames = [
  'Rahul_99', 'xPlayer', 'ArrowMaster', 'Ninja_22', 'ProSniper', 'CoolDude',
  'PriyaGamer', 'Bot_Slayer', 'GhostRider', 'King_Arjun'
];

export function FakeMatchmakingUI({ isMatchFound, opponentData }: Props) {
  // Pulse animation for searching
  const pulse1Scale = useSharedValue(1);
  const pulse1Opacity = useSharedValue(0.8);
  const pulse2Scale = useSharedValue(1);
  const pulse2Opacity = useSharedValue(0.8);

  const [flashingName, setFlashingName] = useState(fakeNames[0]);

  // Match found animations
  const matchScale = useSharedValue(0);
  const matchOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isMatchFound) {
      // Searching animations
      pulse1Scale.value = withRepeat(
        withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      pulse1Opacity.value = withRepeat(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );

      pulse2Scale.value = withDelay(
        750,
        withRepeat(
          withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
          -1,
          false
        )
      );
      pulse2Opacity.value = withDelay(
        750,
        withRepeat(
          withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
          -1,
          false
        )
      );

      // Flashing names
      const nameInterval = setInterval(() => {
        setFlashingName(fakeNames[Math.floor(Math.random() * fakeNames.length)]);
      }, 400);

      return () => clearInterval(nameInterval);
    } else {
      // Match found! Stop pulsing and pop the opponent data
      matchScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      matchOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isMatchFound]);

  const p1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1Scale.value }],
    opacity: pulse1Opacity.value,
  }));

  const p2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2Scale.value }],
    opacity: pulse2Opacity.value,
  }));

  const matchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: matchScale.value }],
    opacity: matchOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {!isMatchFound ? (
        <View style={styles.searchingContainer}>
          <View style={styles.radarCenter}>
            <Animated.View style={[styles.pulseCircle, p1Style]} />
            <Animated.View style={[styles.pulseCircle, p2Style]} />
            <Text style={styles.radarIcon}>📡</Text>
          </View>
          <Text style={styles.searchingText}>Finding players near you...</Text>
          <Text style={styles.flashingName}>{flashingName}</Text>
        </View>
      ) : (
        <Animated.View style={[styles.matchContainer, matchStyle]}>
          <Text style={styles.matchTitle}>MATCH FOUND!</Text>
          
          <View style={styles.opponentCard}>
            <Text style={styles.opponentAvatar}>👤</Text>
            <Text style={styles.opponentName}>{opponentData?.name}</Text>
            <View style={styles.opponentStats}>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>Lvl {opponentData?.level}</Text>
              </View>
              {opponentData && opponentData.winStreak > 1 && (
                <View style={[styles.statBadge, styles.streakBadge]}>
                  <Text style={styles.streakText}>🔥 {opponentData.winStreak} Streak</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingContainer: {
    alignItems: 'center',
  },
  radarCenter: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.arrowStroke,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 10,
  },
  radarIcon: {
    fontSize: 32,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.arrowStroke,
    zIndex: -1,
  },
  searchingText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
    marginBottom: 10,
  },
  flashingName: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontWeight: '600',
    opacity: 0.6,
  },
  matchContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 30,
    borderRadius: 20,
    ...theme.shadows.lg,
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#43A047',
    marginBottom: 20,
    letterSpacing: 1,
  },
  opponentCard: {
    alignItems: 'center',
  },
  opponentAvatar: {
    fontSize: 50,
    marginBottom: 10,
  },
  opponentName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
    marginBottom: 10,
  },
  opponentStats: {
    flexDirection: 'row',
    gap: 10,
  },
  statBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.arrowStroke,
  },
  streakBadge: {
    backgroundColor: '#FFECB3',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
  }
});
