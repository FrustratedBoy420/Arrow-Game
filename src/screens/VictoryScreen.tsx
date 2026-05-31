import { useNavigation } from '@react-navigation/native';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

import { AmbientBackground } from '../components/AmbientBackground';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../utils/audio';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';

export function VictoryScreen() {
  const navigation = useNavigation<AppNavigation>();
  const nextLevel = useGameStore((state) => state.nextLevel);
  const retry = useGameStore((state) => state.retry);
  const recordLevelCompletion = useGameStore((state) => state.recordLevelCompletion);
  const board = useGameStore((state) => state.board);
  const gameStartTime = useGameStore((state) => state.gameStartTime);
  const levelStartTime = useGameStore((state) => state.levelStartTime);

  // FIX 3: Read the authoritative star score synced in real-time by StarRatingDisplay
  const finalStarsCalculated = useGameStore((state) => state.finalStarsCalculated);

  const starScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    audioManager.playSound('victory');
    
    // Calculate time taken using the same logic as the HUD (gameStartTime)
    // Fallback to levelStartTime if gameStartTime is somehow null
    const startTime = gameStartTime ?? levelStartTime;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const heartsLost = 3 - board.livesLeft;
    
    recordLevelCompletion(timeTaken, heartsLost);
    
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

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }]
  }));

  // FIX 3: Use finalStarsCalculated from the global store (pushed by StarRatingDisplay HUD)
  // Old code used starsEarnedThisLevel which was a separate async calculation — caused 1-star lock
  const starDisplay = '⭐'.repeat(finalStarsCalculated) || '○';

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />
      <View style={styles.content}>
        <Animated.Text style={[styles.stars, starStyle]}>{starDisplay}</Animated.Text>
        <Animated.View style={textStyle}>
          <Text style={styles.title}>Level Complete</Text>
          <Text style={styles.reward}>+25 coins</Text>
        </Animated.View>
        
        <View style={styles.buttonContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Replay level"
            onPressIn={() => { btnScale.value = withSpring(0.94, { damping: 10, stiffness: 350 }); }}
            onPressOut={() => { btnScale.value = withSpring(1, { damping: 10, stiffness: 350 }); }}
            onPress={() => {
              retry();
              navigation.replace('Gameplay');
            }}
          >
            <Animated.View style={[styles.button, styles.replayButton, buttonStyle]}>
              <Text style={styles.buttonText}>Replay</Text>
            </Animated.View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next level"
            onPressIn={() => { btnScale.value = withSpring(0.94, { damping: 10, stiffness: 350 }); }}
            onPressOut={() => { btnScale.value = withSpring(1, { damping: 10, stiffness: 350 }); }}
            onPress={() => {
              nextLevel();
              navigation.replace('Gameplay');
            }}
          >
            <Animated.View style={[styles.button, styles.nextButton, buttonStyle]}>
              <Text style={styles.buttonText}>Next Level</Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: 'transparent',
    flex: 1
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  stars: {
    color: '#FFD54F',
    fontSize: 48,
    marginBottom: 20,
    textShadowColor: 'rgba(106, 68, 40, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6
  },
  title: {
    color: theme.colors.arrowStroke,
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center'
  },
  reward: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 36
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.arrowStroke,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 130,
    ...theme.shadows.lg
  },
  replayButton: {
    backgroundColor: '#A0826D'
  },
  nextButton: {
    backgroundColor: theme.colors.arrowStroke
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '800'
  }
});
