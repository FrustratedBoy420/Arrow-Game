import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Alert, Pressable, SafeAreaView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue
} from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import GearIcon from '../components/GearIcon';
import { SettingsModal } from '../components/SettingsModal';
import { getTotalStarsEarned, getUnlockedLevelCount, getCheckpointRequiredStars, getCheckpointGateProgress, CheckpointGateProgress } from '../systems/levelManagement';
import { ensureLevelProgressMap, isLevelLocked } from '../systems/levelManagementStore';
import { getNextLevelId } from '../levels/levels';
import { useGameStore } from '../state/gameStore';
import { CheckpointLockModal } from '../components/CheckpointLockModal';
import { SpinWheelModal } from '../components/SpinWheelModal';
import { getSkinById } from '../config/skins';
import { audioManager } from '../utils/audio';
import { theme } from '../theme/theme';
import { adManager } from '../utils/ads';
import type { AppNavigation } from '../types/navigation';
import { AdBanner } from '../components/AdBanner';


export function VictoryScreen() {
  const navigation = useNavigation<AppNavigation>();
  const insets = useSafeAreaInsets();
  const nextLevel = useGameStore((state) => state.nextLevel);
  const retry = useGameStore((state) => state.retry);
  const recordLevelCompletion = useGameStore((state) => state.recordLevelCompletion);
  const recordDailyChallengeCompletion = useGameStore((state) => state.recordDailyChallengeCompletion);
  const dailyPuzzleState = useGameStore((state) => state.dailyPuzzleState);
  const doubleCoinsEarned = useGameStore((state) => state.doubleCoinsEarned);
  const board = useGameStore((state) => state.board);
  const gameStartTime = useGameStore((state) => state.gameStartTime);
  const levelStartTime = useGameStore((state) => state.levelStartTime);
  const levelProgressMap = useGameStore((state) => state.levelProgressMap);
  const finalStarsCalculated = useGameStore((state) => state.finalStarsCalculated);
  const coins = useGameStore((state) => state.coins);
  const coinsEarnedThisLevel = useGameStore((state) => state.coinsEarnedThisLevel);
  const winStreak = useGameStore((state) => state.winStreak);

  const isDaily = !!dailyPuzzleState?.isDailyActive;

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [checkpointGate, setCheckpointGate] = useState<CheckpointGateProgress | null>(null);
  const [spinModalVisible, setSpinModalVisible] = useState(false);
  const [hasDoubledCoins, setHasDoubledCoins] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(isDaily ? null : 4);
  const [isAdLoading, setIsAdLoading] = useState(false);

  const progressMap = ensureLevelProgressMap(levelProgressMap);
  const totalStars = getTotalStarsEarned(progressMap);
  const maxPossibleStars = getUnlockedLevelCount(progressMap) * 3;

  const starScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const btnScale = useSharedValue(1);
  const doubleBtnScale = useSharedValue(1);
  const confettiProgress = useSharedValue(0);

  const hasRecordedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Confetti particles generator
  const confettiParticles = useMemo(() => {
    const colors = ['#FFD54F', '#43A047', '#FF5722', '#29B6F6', '#AB47BC', '#FFF'];
    return Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * 2 * Math.PI + (Math.random() - 0.5) * 0.4;
      const distance = 80 + Math.random() * 140;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 20;
      const size = 6 + Math.random() * 6;
      const color = colors[i % colors.length]!;
      const rotation = Math.random() * 360;
      return { id: i, x, y, size, color, rotation };
    });
  }, []);

  const handleNextLevel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(null);

    if (isDaily) {
      navigation.replace('Home');
      return;
    }

    const currentLevelId = useGameStore.getState().currentLevelId;
    const nextId = getNextLevelId(currentLevelId);
    const pMap = ensureLevelProgressMap(useGameStore.getState().levelProgressMap);

    if (isLevelLocked(pMap, nextId)) {
      const gate = getCheckpointGateProgress(pMap, nextId);
      setCheckpointGate(gate);
    } else {
      adManager.showInterstitial(() => {
        nextLevel();
        navigation.replace('Gameplay');
      });
    }
  }, [navigation, nextLevel, isDaily]);

  // Handle countdown auto-advance
  useEffect(() => {
    if (isDaily) return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleNextLevel();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleNextLevel, isDaily]);

  const cancelCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(null);
  };

  useEffect(() => {
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    audioManager.playSound('victory');

    const startTime = gameStartTime ?? levelStartTime;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const heartsLost = Math.max(0, 3 - board.livesLeft);

    if (isDaily) {
      recordDailyChallengeCompletion(timeTaken);
    } else {
      recordLevelCompletion(timeTaken, heartsLost);
    }

    starScale.value = withSequence(
      withTiming(1.4, { duration: 400, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 12, stiffness: 100 })
    );
    textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    confettiProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.quad)
    });

    // Trigger Lucky Spin on every 10th level (Milestone Reward)
    const currentLevelId = useGameStore.getState().currentLevelId;
    if (!isDaily && currentLevelId % 10 === 0) {
      cancelCountdown();
      const spinTimer = setTimeout(() => {
        setSpinModalVisible(true);
      }, 1000);
      return () => clearTimeout(spinTimer);
    }
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
  const doubleButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: doubleBtnScale.value }]
  }));

  const handleDoubleCoins = () => {
    cancelCountdown();
    if (hasDoubledCoins || isAdLoading) return;

    if (!adManager.isRewardedAdReady()) {
      setIsAdLoading(true);
      adManager.loadRewarded();
      setTimeout(() => {
        setIsAdLoading(false);
        if (adManager.isRewardedAdReady()) {
          playRewardedDouble();
        } else {
          Alert.alert('Ad Loading', 'Reward video is still loading, please try again in 2 seconds.');
        }
      }, 1500);
      return;
    }

    playRewardedDouble();
  };

  const playRewardedDouble = () => {
    adManager.showRewarded(
      () => {
        doubleCoinsEarned();
        setHasDoubledCoins(true);
      },
      () => {
        Alert.alert('Ad Failed', 'Could not load rewarded video.');
      }
    );
  };

  const starDisplay = '⭐'.repeat(finalStarsCalculated) || '⭐';
  const hasStreak = winStreak >= 3;
  const streakMultiplierText = winStreak >= 5 ? '2.0x' : winStreak >= 3 ? '1.5x' : null;

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />

      {/* ── Top Header ── */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 24, height: 56 + (insets.top > 0 ? insets.top : 24) }]}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              cancelCountdown();
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
            onPress={() => {
              cancelCountdown();
              setSettingsVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <GearIcon size={28} color={theme.colors.arrowStroke} />
          </Pressable>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Confetti Explosion Layer */}
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiParticles.map((p) => {
            return (
              <ConfettiParticleItem
                key={p.id}
                progress={confettiProgress}
                particle={p}
              />
            );
          })}
        </View>

        <Animated.Text style={[styles.stars, starStyle]}>{starDisplay}</Animated.Text>
        <Animated.View style={textStyle}>
          <Text style={styles.title}>Level Complete!</Text>
          <Text style={styles.reward}>+{coinsEarnedThisLevel} coins</Text>

          {hasStreak && streakMultiplierText && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>
                🔥 {streakMultiplierText} Streak Bonus Applied! ({winStreak} in a row)
              </Text>
            </View>
          )}
        </Animated.View>

        {/* 🎬 2x Rewarded Ad Button */}
        {!hasDoubledCoins && coinsEarnedThisLevel > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Watch Ad for 2x Coins"
            onPressIn={() => {
              doubleBtnScale.value = withSpring(0.95, { damping: 10, stiffness: 350 });
            }}
            onPressOut={() => {
              doubleBtnScale.value = withSpring(1, { damping: 10, stiffness: 350 });
            }}
            onPress={handleDoubleCoins}
            style={styles.doubleCoinsContainer}
          >
            <Animated.View style={[styles.doubleCoinsBtn, doubleButtonStyle]}>
              <Text style={styles.doubleCoinsText}>
                🎬 Double Coins (+{coinsEarnedThisLevel} 🪙)
              </Text>
            </Animated.View>
          </Pressable>
        )}

        {hasDoubledCoins && (
          <View style={styles.doubledBadge}>
            <Text style={styles.doubledBadgeText}>✨ Coins Doubled!</Text>
          </View>
        )}

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
              cancelCountdown();
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
            onPress={handleNextLevel}
          >
            <Animated.View style={[styles.button, styles.nextButton, buttonStyle]}>
              <Text style={styles.buttonText}>
                Next Level {countdown !== null ? `(${countdown}s)` : ''}
              </Text>
            </Animated.View>
          </Pressable>
        </View>

        {/* 📸 Share Victory Button */}
        <Pressable
          style={styles.shareBtn}
          onPress={async () => {
            cancelCountdown();
            try {
              const currentLevelId = useGameStore.getState().currentLevelId;
              const startTime = gameStartTime ?? levelStartTime;
              const timeTaken = Math.round((Date.now() - startTime) / 1000);
              const activeSkinId = useGameStore.getState().activeSkinId;
              const skin = getSkinById(activeSkinId);

              const message =
                `🏹 I just conquered Level ${currentLevelId} with ⭐⭐⭐ in ${timeTaken}s in ArrowVerse!\n` +
                `🔥 Win Streak: ${winStreak} | 🎨 Skin: ${skin ? skin.name : 'Classic Cedar'}\n` +
                `Think you can beat my record? Play now! 👉 https://arrowgame.app`;

              await Share.share({
                title: `ArrowVerse Victory - Level ${currentLevelId}`,
                message
              });
            } catch (err) {
              console.log('Share error:', err);
            }
          }}
        >
          <Text style={styles.shareBtnText}>📸 Share Victory</Text>
        </Pressable>
      </View>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
      <CheckpointLockModal
        visible={checkpointGate !== null}
        gate={checkpointGate}
        onClose={() => {
          setCheckpointGate(null);
          navigation.navigate('Home');
        }}
      />
      <SpinWheelModal
        visible={spinModalVisible}
        onClose={() => setSpinModalVisible(false)}
      />
      <AdBanner />
    </SafeAreaView>
  );
}

function ConfettiParticleItem({
  progress,
  particle
}: {
  progress: SharedValue<number>;
  particle: { id: number; x: number; y: number; size: number; color: string; rotation: number };
}) {
  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const currentX = particle.x * p;
    const currentY = particle.y * p + p * p * 80; // gravity effect
    const opacity = 1 - p * p;
    const scale = 1 - p * 0.3;

    return {
      transform: [
        { translateX: currentX },
        { translateY: currentY },
        { rotate: `${particle.rotation * p}deg` },
        { scale }
      ],
      opacity
    };
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: particle.size,
          height: particle.size * 1.4,
          backgroundColor: particle.color,
          borderRadius: 2
        },
        animStyle
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: 'transparent', flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 22,
    ...theme.shadows.sm
  },
  profileEmoji: { fontSize: 18, marginRight: 6 },
  profileNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
    maxWidth: 70
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
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  confettiPiece: {
    position: 'absolute'
  },
  streakBadge: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: -20,
    marginBottom: 24,
    ...theme.shadows.sm
  },
  streakBadgeText: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '800'
  },
  doubleCoinsContainer: {
    marginBottom: 24,
    width: '100%',
    alignItems: 'center'
  },
  doubleCoinsBtn: {
    backgroundColor: '#FFB300',
    borderColor: '#FFA000',
    borderWidth: 2,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    ...theme.shadows.md
  },
  doubleCoinsText: {
    color: '#3E2723',
    fontSize: 16,
    fontWeight: '900'
  },
  doubledBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    ...theme.shadows.sm
  },
  doubledBadgeText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '800'
  },
  shareBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  }
});
