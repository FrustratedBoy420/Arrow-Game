import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { theme } from '../theme/theme';

interface Props {
  opponentName: string;
  opponentArrowsLeft: number;
  totalArrows: number;
}

export function OpponentHUD({ opponentName, opponentArrowsLeft, totalArrows }: Props) {
  const scoreScale = useSharedValue(1);
  const cleared = totalArrows - opponentArrowsLeft;
  
  // Pulse score when it changes
  useEffect(() => {
    scoreScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
  }, [cleared]);

  const scoreAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }]
  }));

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.avatar}>👤</Text>
        <View>
          <Text style={styles.name}>{opponentName}</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        <Text style={styles.scoreLabel}>Cleared</Text>
        <Animated.View style={[styles.scoreBadge, scoreAnimStyle]}>
          <Text style={styles.scoreText}>
            {cleared} / {totalArrows}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    fontSize: 24,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  }
});
