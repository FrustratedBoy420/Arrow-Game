import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import GearIcon from '../components/GearIcon';
import { SettingsModal } from '../components/SettingsModal';
import { getTotalStarsEarned, getUnlockedLevelCount } from '../systems/levelManagement';
import { ensureLevelProgressMap } from '../systems/levelManagementStore';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../utils/audio';
import { theme } from '../theme/theme';
import { adManager } from '../utils/ads';
import type { AppNavigation } from '../types/navigation';

export function VictoryScreen() {
  const navigation = useNavigation<AppNavigation>();
  const nextLevel = useGameStore((state) => state.nextLevel);
  const retry = useGameStore((state) => state.retry);
  const recordLevelCompletion = useGameStore((state) => state.recordLevelCompletion);
  const board = useGameStore((state) => state.board);
  const gameStartTime = useGameStore((state) => state.gameStartTime);
  const levelStartTime = useGameStore((state) => state.levelStartTime);
  const levelProgressMap = useGameStore((state) => state.levelProgressMap);
  const finalStarsCalculated = useGameStore((state) => state.finalStarsCalculated);
  const coins = useGameStore((state) => state.coins);
  const coinsEarnedThisLevel = useGameStore((state) => state.coinsEarnedThisLevel);

  const [settingsVisible, setSettingsVisible] = useState(false);

  const progressMap = ensureLevelProgressMap(levelProgressMap);
  const totalStars = getTotalStarsEarned(progressMap);
  const maxPossibleStars = getUnlockedLevelCount(progressMap) * 3;

  const starScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    audioManager.playSound('victory');

    const startTime = gameStartTime ?? levelStartTime;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const heartsLost = Math.max(0, 3 - board.livesLeft);

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

  const starDisplay = '⭐'.repeat(finalStarsCalculated) || '⭐';

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              adManager.showInterstitial(() => {
                navigation.navigate('Home');
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
          >
            <Ionicons name="arrow-back" size={26} color={theme.colors.arrowStroke} />
          </Pressable>
        </View>

        <View style={styles.headerCenter}>

          <View style={styles.starCounter}>
            <Text style={styles.starEmoji}>⭐</Text>
            <Text style={styles.starText}>
              {totalStars}
              <Text style={styles.starMax}> / {maxPossibleStars}</Text>
            </Text>
          </View>
          <View style={styles.coinCounter}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinText}>{coins}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => setSettingsVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <GearIcon size={28} color={theme.colors.arrowStroke} />
          </Pressable>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        <Animated.Text style={[styles.stars, starStyle]}>{starDisplay}</Animated.Text>
        <Animated.View style={textStyle}>
          <Text style={styles.title}>Level Complete!</Text>
          {coinsEarnedThisLevel > 0 ? (
            <Text style={styles.reward}>+{coinsEarnedThisLevel} coins</Text>
          ) : null}
        </Animated.View>

        <View style={styles.buttonContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Replay level"
            onPressIn={() => {
              btnScale.value = withSpring(0.94, { damping: 10, stiffness: 350 });
            }}
            onPressOut={() => {
              btnScale.value = withSpring(1, { damping: 10, stiffness: 350 });
            }}
            onPress={() => {
              adManager.showInterstitial(() => {
                retry();
                navigation.replace('Gameplay');
              });
            }}
          >
            <Animated.View style={[styles.button, styles.replayButton, buttonStyle]}>
              <Text style={styles.buttonText}>Replay</Text>
            </Animated.View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next level"
            onPressIn={() => {
              btnScale.value = withSpring(0.94, { damping: 10, stiffness: 350 });
            }}
            onPressOut={() => {
              btnScale.value = withSpring(1, { damping: 10, stiffness: 350 });
            }}
            onPress={() => {
              adManager.showInterstitial(() => {
                nextLevel();
                navigation.replace('Gameplay');
              });
            }}
          >
            <Animated.View style={[styles.button, styles.nextButton, buttonStyle]}>
              <Text style={styles.buttonText}>Next Level</Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: 'transparent', flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    height: 100
  },
  headerLeft: {
    width: 44,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },

  starCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 22,
    ...theme.shadows.sm
  },
  starEmoji: { fontSize: 18, marginRight: 6 },
  starText: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },
  starMax: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted
  },
  coinCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 22,
    ...theme.shadows.sm
  },
  coinEmoji: { fontSize: 18, marginRight: 6 },
  coinText: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },
  settingsBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 22,
    ...theme.shadows.sm
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 22,
    ...theme.shadows.sm
  },

  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: -60
  },
  stars: {
    fontSize: 52,
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
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 130,
    ...theme.shadows.lg
  },
  replayButton: { backgroundColor: '#A0826D' },
  nextButton: { backgroundColor: theme.colors.arrowStroke },
  buttonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '800'
  }
});
