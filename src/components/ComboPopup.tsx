import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';

import { theme } from '../theme/theme';

type Props = {
  combo: number;
  bonusCoins?: number;
  onDone?: () => void;
};

export function ComboPopup({ combo, bonusCoins = 0, onDone }: Props) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(10);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1.0, { damping: 10 })
    );

    translateY.value = withTiming(-30, { duration: 900 });

    opacity.value = withSequence(
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onDone) {
          runOnJS(onDone)();
        }
      })
    );
  }, [combo]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }]
  }));

  if (combo < 2) return null;

  let label = `🔥 COMBO x${combo}!`;
  let badgeColor = '#FFB74D';
  let glowColor = 'rgba(255, 183, 77, 0.4)';

  if (combo === 3) {
    label = `⚡ MEGA COMBO x3!`;
    badgeColor = '#FFD54F';
    glowColor = 'rgba(255, 213, 79, 0.5)';
  } else if (combo === 4) {
    label = `💥 ULTRA COMBO x4!`;
    badgeColor = '#FF3D00';
    glowColor = 'rgba(255, 61, 0, 0.5)';
  } else if (combo >= 5) {
    label = `👑 UNSTOPPABLE x${combo}!`;
    badgeColor = '#D500F9';
    glowColor = 'rgba(213, 0, 249, 0.55)';
  }

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.badge,
          { backgroundColor: 'rgba(30, 27, 24, 0.92)', borderColor: badgeColor, shadowColor: glowColor },
          animStyle
        ]}
      >
        <Text style={[styles.comboText, { color: badgeColor }]}>{label}</Text>
        {bonusCoins > 0 && (
          <Text style={styles.bonusText}>+{bonusCoins} 🪙 Bonus</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  },
  badge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8
  },
  comboText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  bonusText: {
    color: '#FFE082',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2
  }
});
