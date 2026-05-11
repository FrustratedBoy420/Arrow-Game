import { useNavigation } from '@react-navigation/native';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';

export function VictoryScreen() {
  const navigation = useNavigation<AppNavigation>();
  const nextLevel = useGameStore((state) => state.nextLevel);

  const starScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    starScale.value = withSequence(
      withTiming(1.4, { duration: 400, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 12, stiffness: 100 })
    );
    textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
  }, []);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }]
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    alignItems: 'center' as const
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Animated.Text style={[styles.stars, starStyle]}>★ ★ ★</Animated.Text>
        <Animated.View style={textStyle}>
          <Text style={styles.title}>Level Complete</Text>
          <Text style={styles.reward}>+25 coins</Text>
        </Animated.View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next level"
          style={styles.button}
          onPress={() => {
            nextLevel();
            navigation.replace('Gameplay');
          }}
        >
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.bgPrimary,
    flex: 1
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  stars: {
    color: theme.colors.textPrimary,
    fontSize: 40,
    marginBottom: 16
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center'
  },
  reward: {
    color: theme.colors.textMuted,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 28
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.arrowStroke,
    borderRadius: theme.radius.sm,
    minWidth: 160,
    paddingHorizontal: 24,
    paddingVertical: 14
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '800'
  }
});
