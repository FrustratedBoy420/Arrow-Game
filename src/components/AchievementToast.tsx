import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import { audioManager } from '../utils/audio';

export function AchievementToast() {
  const insets = useSafeAreaInsets();
  const toast = useGameStore((s) => s.activeAchievementToast);
  const dismiss = useGameStore((s) => s.dismissAchievementToast);

  const translateY = useSharedValue(-150);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (toast) {
      audioManager.playSound('victory');

      translateY.value = withSpring(insets.top + 8, {
        damping: 14,
        stiffness: 140
      });
      scale.value = withSequence(
        withTiming(1.04, { duration: 250 }),
        withSpring(1, { damping: 12 })
      );

      const timer = setTimeout(() => {
        handleDismiss();
      }, 3800);

      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-150, { duration: 250 });
    }
  }, [toast, insets.top]);

  const handleDismiss = () => {
    translateY.value = withTiming(-150, { duration: 250 });
    setTimeout(() => {
      dismiss();
    }, 260);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }]
  }));

  if (!toast) return null;

  return (
    <Animated.View style={[styles.container, animStyle]} pointerEvents="box-none">
      <Pressable style={styles.toastCard} onPress={handleDismiss}>
        {/* Left Icon Badge */}
        <View style={styles.iconContainer}>
          <Text style={styles.achievementEmoji}>{toast.icon}</Text>
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <Text style={styles.headerLabel}>🏆 ACHIEVEMENT UNLOCKED!</Text>
          <Text style={styles.titleText}>{toast.title}</Text>
          <Text style={styles.descText} numberOfLines={1}>
            {toast.description}
          </Text>
        </View>

        {/* Coin Reward Pill */}
        <View style={styles.rewardPill}>
          <Text style={styles.rewardText}>+{toast.rewardCoins} 🪙</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center'
  },
  toastCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E1B18',
    borderColor: '#FFD54F',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.lg
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 213, 79, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  achievementEmoji: {
    fontSize: 22
  },
  textContainer: {
    flex: 1,
    marginRight: 8
  },
  headerLabel: {
    color: '#FFD54F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  descText: {
    color: '#D7CCC8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1
  },
  rewardPill: {
    backgroundColor: '#FF6F00',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFA000'
  },
  rewardText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900'
  }
});
