import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState, useCallback } from 'react';
import { BackHandler, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';
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

import { AmbientBackground } from '../components/AmbientBackground';
import GearIcon from '../components/GearIcon';
import { SettingsModal } from '../components/SettingsModal';
import { OptionalUpdateModal } from '../components/OptionalUpdateModal';
import { ExitConfirmModal } from '../components/ExitConfirmModal';
import { CURRENT_APP_VERSION, isVersionOlder } from '../config/version';
import { getTotalStarsEarned, getUnlockedLevelCount } from '../systems/levelManagement';
import { ensureLevelProgressMap } from '../systems/levelManagementStore';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';
import { registerUserProfile } from '../utils/userRegistration';
import { ProfileNameModal } from '../components/ProfileNameModal';
import { SpinWheelModal } from '../components/SpinWheelModal';
import { DailyRewardModal } from '../components/DailyRewardModal';
import { DailyChallengeCard } from '../components/DailyChallengeCard';
import { AdBanner } from '../components/AdBanner';

export function HomeScreen() {
  const navigation = useNavigation<AppNavigation>();
  const insets = useSafeAreaInsets();
  const hasSeenTutorial = useGameStore((s) => s.hasSeenTutorial);
  const iconsConfig = useGameStore((s) => s.iconsConfig);
  const fetchGameConfig = useGameStore((s) => s.fetchGameConfig);
  const levelProgressMap = useGameStore((s) => s.levelProgressMap);
  const coins = useGameStore((s) => s.coins);
  const lastDailyClaimDate = useGameStore((s) => s.lastDailyClaimDate);

  const isFetchingConfig = useGameStore((s) => s.isFetchingConfig);
  const dynamicLevels = useGameStore((s) => s.dynamicLevels);
  const versionConfig = useGameStore((s) => s.versionConfig);
  const fetchVersionConfig = useGameStore((s) => s.fetchVersionConfig);

  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected ?? true;

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [hasDismissedUpdate, setHasDismissedUpdate] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [spinModalVisible, setSpinModalVisible] = useState(false);
  const [dailyModalVisible, setDailyModalVisible] = useState(false);
  const [isNameLoaded, setIsNameLoaded] = useState(false);
  const [hasName, setHasName] = useState(false);
  const [profileName, setProfileName] = useState('');

  // Auto-prompt daily rewards if not claimed today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]!;
    if (lastDailyClaimDate !== today) {
      const timer = setTimeout(() => {
        setDailyModalVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lastDailyClaimDate]);

  useEffect(() => {
    if (
      versionConfig &&
      versionConfig.latest &&
      !hasDismissedUpdate &&
      isVersionOlder(CURRENT_APP_VERSION, versionConfig.latest) &&
      !isVersionOlder(CURRENT_APP_VERSION, versionConfig.critical)
    ) {
      setUpdateModalVisible(true);
    } else {
      setUpdateModalVisible(false);
    }
  }, [versionConfig, hasDismissedUpdate]);

  const progressMap = ensureLevelProgressMap(levelProgressMap);
  const totalStars = getTotalStarsEarned(progressMap);
  const maxPossibleStars = getUnlockedLevelCount(progressMap) * 3;

  // Animations
  const titleScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);
  const btnTranslateY = useSharedValue(30);
  const arrowBounce = useSharedValue(0);
  const startScale = useSharedValue(1);
  const selectScale = useSharedValue(1);
  const multiScale = useSharedValue(1);

  const loadConfig = useCallback(async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('multiplayer_url');
      await fetchGameConfig(savedUrl || undefined);
    } catch (err) {
      await fetchGameConfig();
    }
  }, [fetchGameConfig]);

  useEffect(() => {
    loadConfig();

    titleScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.4)) });
    titleOpacity.value = withTiming(1, { duration: 500 });
    btnOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    btnTranslateY.value = withDelay(
      400,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
    arrowBounce.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 600, easing: Easing.inOut(Easing.quad) }),
          withTiming(8, { duration: 600, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, [loadConfig]);

  useEffect(() => {
    const checkProfileName = async () => {
      const name = await AsyncStorage.getItem('user_profile_name');
      if (!name) {
        setProfileModalVisible(true);
        setHasName(false);
      } else {
        setHasName(true);
        setProfileName(name);
      }
      setIsNameLoaded(true);
    };
    void checkProfileName();
  }, []);

  const handleProfileSubmit = async (name: string) => {
    try {
      await AsyncStorage.setItem('user_profile_name', name);
      setProfileModalVisible(false);
      setHasName(true);
      setProfileName(name);
      await registerUserProfile();
    } catch (err) {
      console.warn('Failed to save profile name:', err);
    }
  };

  useEffect(() => {
    if (isConnected) {
      // On reconnect: only do a lightweight version check (not full config reload)
      // This avoids re-downloading levels on every internet reconnect
      void (async () => {
        try {
          const savedUrl = await AsyncStorage.getItem('multiplayer_url');
          await fetchVersionConfig(savedUrl || undefined);
        } catch {
          await fetchVersionConfig();
        }
      })();
    }
  }, [isConnected, fetchVersionConfig]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setExitModalVisible(true);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value
  }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnTranslateY.value }]
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowBounce.value }]
  }));
  const startAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startScale.value }]
  }));
  const selectAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectScale.value }]
  }));
  const multiAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: multiScale.value }]
  }));

  if (!isNameLoaded) {
    return null;
  }

  if (!hasName) {
    return (
      <SafeAreaView style={styles.screen}>
        <AmbientBackground />
        <ProfileNameModal
          visible={profileModalVisible}
          onSubmit={handleProfileSubmit}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />

      {/* ── Top Header ── */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 24, height: 56 + (insets.top > 0 ? insets.top : 24) }]}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {/* Profile Badge */}
          <View style={styles.profileBadge}>
            <Text style={styles.profileEmoji}>👤</Text>
            <Text style={styles.profileNameText} numberOfLines={1} ellipsizeMode="tail">
              {profileName}
            </Text>
          </View>

          {/* Star counter: earned / max-possible */}
          <View style={styles.starCounter}>
            <Text style={styles.starEmoji}>⭐</Text>
            <Text style={styles.starText}>
              {totalStars}
              <Text style={styles.starMax}> / {maxPossibleStars}</Text>
            </Text>
          </View>

          {/* Coin counter */}
          <View style={styles.coinCounter}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinText}>{coins}</Text>
          </View>
        </View>

        {/* Gear settings button */}
        <Pressable
          style={styles.settingsBtn}
          onPress={() => setSettingsVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <GearIcon size={28} color={theme.colors.arrowStroke} />
        </Pressable>
      </View>

      {/* ── Scrollable Content Area ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (insets.bottom > 0 ? insets.bottom : 16) + 64 }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero Brand Section ── */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.arrowDeco, arrowStyle]}>
            <Text style={styles.arrowIcon}>{iconsConfig?.homeArrow || '➤'}</Text>
          </Animated.View>

          <Animated.View style={[titleStyle, styles.titleWrapper]}>
            <Text style={styles.title}>
              Arrow<Text style={styles.titleAccent}>Verse</Text>
            </Text>
            <View style={styles.taglinePill}>
              <Text style={styles.subtitle}>THINK · TAP · ESCAPE</Text>
            </View>
          </Animated.View>
        </View>

        {/* ── Main Action Hub ── */}
        <Animated.View style={[btnStyle, styles.actionHub]}>
          {/* Primary CTA: Play Now */}
          <Pressable
            style={styles.primaryPlayTouch}
            onPressIn={() => {
              startScale.value = withSpring(0.96, { damping: 12, stiffness: 350 });
            }}
            onPressOut={() => {
              startScale.value = withSpring(1, { damping: 12, stiffness: 350 });
            }}
            onPress={() =>
              navigation.replace(hasSeenTutorial ? 'Gameplay' : 'Tutorial')
            }
          >
            <Animated.View style={[styles.primaryPlayBtn, startAnimStyle]}>
              <View style={styles.playIconWrap}>
                <Text style={styles.playIconText}>▶</Text>
              </View>
              <View style={styles.playTextWrap}>
                <Text style={styles.primaryPlayTitle}>PLAY NOW</Text>
                <Text style={styles.primaryPlaySubtitle}>
                  {hasSeenTutorial ? 'Continue Journey' : 'Start Tutorial'}
                </Text>
              </View>
              <Text style={styles.primaryPlayArrow}>→</Text>
            </Animated.View>
          </Pressable>

          {/* 2-Column Mode Grid: Level Select + Multiplayer */}
          <View style={styles.modeGridRow}>
            {/* Level Select */}
            <Pressable
              style={styles.modeGridItem}
              onPressIn={() => {
                selectScale.value = withSpring(0.95, { damping: 12, stiffness: 350 });
              }}
              onPressOut={() => {
                selectScale.value = withSpring(1, { damping: 12, stiffness: 350 });
              }}
              onPress={() => navigation.navigate('LevelSelect')}
            >
              <Animated.View style={[styles.modeCard, styles.levelSelectCard, selectAnimStyle]}>
                <Text style={styles.modeCardIcon}>🗺️</Text>
                <Text style={styles.modeCardTitle}>Levels</Text>
                <Text style={styles.modeCardSub}>{totalStars} ⭐ Earned</Text>
              </Animated.View>
            </Pressable>

            {/* Multiplayer Arena */}
            <Pressable
              style={styles.modeGridItem}
              onPressIn={() => {
                multiScale.value = withSpring(0.95, { damping: 12, stiffness: 350 });
              }}
              onPressOut={() => {
                multiScale.value = withSpring(1, { damping: 12, stiffness: 350 });
              }}
              onPress={() => navigation.navigate('MultiplayerModeSelect')}
            >
              <Animated.View style={[styles.modeCard, styles.multiplayerCard, multiAnimStyle]}>
                <Text style={styles.modeCardIcon}>⚔️</Text>
                <Text style={[styles.modeCardTitle, styles.multiplayerTitle]}>1v1 Arena</Text>
                <Text style={[styles.modeCardSub, styles.multiplayerSub]}>Live Battles</Text>
              </Animated.View>
            </Pressable>
          </View>

          {/* ── Daily Challenge World Puzzle Card ── */}
          <View style={styles.dailyChallengeWrap}>
            <DailyChallengeCard />
          </View>

          {/* ── Quick Actions Grid (Dock) ── */}
          <View style={styles.dockContainer}>
            <Pressable
              style={styles.dockItem}
              onPress={() => navigation.navigate('Profile')}
              accessibilityRole="button"
              accessibilityLabel="Profile"
            >
              <View style={styles.dockIconBox}>
                <Text style={styles.dockIcon}>👤</Text>
              </View>
              <Text style={styles.dockLabel}>Profile</Text>
            </Pressable>

            <Pressable
              style={styles.dockItem}
              onPress={() => navigation.navigate('Shop')}
              accessibilityRole="button"
              accessibilityLabel="Shop"
            >
              <View style={styles.dockIconBox}>
                <Text style={styles.dockIcon}>🛍️</Text>
              </View>
              <Text style={styles.dockLabel}>Shop</Text>
            </Pressable>

            <Pressable
              style={styles.dockItem}
              onPress={() => navigation.navigate('Leaderboard')}
              accessibilityRole="button"
              accessibilityLabel="Leaderboards"
            >
              <View style={styles.dockIconBox}>
                <Text style={styles.dockIcon}>🏆</Text>
              </View>
              <Text style={styles.dockLabel}>Ranks</Text>
            </Pressable>

            <Pressable
              style={styles.dockItem}
              onPress={() => setSpinModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Lucky Spin"
            >
              <View style={[styles.dockIconBox, styles.dockIconHighlight]}>
                <Text style={styles.dockIcon}>🎡</Text>
              </View>
              <Text style={styles.dockLabel}>Spin</Text>
            </Pressable>

            <Pressable
              style={styles.dockItem}
              onPress={() => setDailyModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Daily Gifts"
            >
              <View style={[styles.dockIconBox, styles.dockIconHighlight]}>
                <Text style={styles.dockIcon}>📅</Text>
              </View>
              <Text style={styles.dockLabel}>Daily</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />

      <OptionalUpdateModal
        visible={updateModalVisible}
        latestVersion={versionConfig?.latest || ''}
        onClose={() => {
          setUpdateModalVisible(false);
          setHasDismissedUpdate(true);
        }}
      />

      <ExitConfirmModal
        visible={exitModalVisible}
        onClose={() => setExitModalVisible(false)}
        onConfirm={() => {
          setExitModalVisible(false);
          BackHandler.exitApp();
        }}
      />

      <ProfileNameModal
        visible={profileModalVisible}
        onSubmit={handleProfileSubmit}
      />

      <SpinWheelModal
        visible={spinModalVisible}
        onClose={() => setSpinModalVisible(false)}
      />

      <DailyRewardModal
        visible={dailyModalVisible}
        onClose={() => setDailyModalVisible(false)}
      />

      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10
  },

  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(106, 68, 40, 0.1)',
    ...theme.shadows.sm
  },
  profileEmoji: {
    fontSize: 16,
    marginRight: 5
  },
  profileNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
    maxWidth: 75
  },
  starCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.3)',
    ...theme.shadows.sm
  },
  starEmoji: {
    fontSize: 15,
    marginRight: 4
  },
  starText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },
  starMax: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted
  },
  coinCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.3)',
    ...theme.shadows.sm
  },
  coinEmoji: {
    fontSize: 15,
    marginRight: 4
  },
  coinText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },

  settingsBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(106, 68, 40, 0.1)',
    ...theme.shadows.sm
  },

  scrollView: {
    flex: 1
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8
  },

  // ── Hero Section ──
  heroSection: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  arrowDeco: {
    marginBottom: 4
  },
  arrowIcon: {
    fontSize: 42,
    color: theme.colors.arrowStroke,
    opacity: 0.85
  },
  titleWrapper: {
    alignItems: 'center'
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 42
  },
  titleAccent: {
    color: '#D87A36'
  },
  taglinePill: {
    backgroundColor: 'rgba(106, 68, 40, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(106, 68, 40, 0.12)'
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.arrowStroke,
    fontWeight: '800',
    letterSpacing: 1.5
  },

  // ── Action Hub ──
  actionHub: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center'
  },

  // ── Primary Play Button ──
  primaryPlayTouch: {
    width: '100%',
    marginBottom: 12
  },
  primaryPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.arrowStroke,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#E8A76B',
    ...theme.shadows.md
  },
  playIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8A76B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  playIconText: {
    color: '#3B2314',
    fontSize: 18,
    marginLeft: 2,
    fontWeight: '900'
  },
  playTextWrap: {
    flex: 1
  },
  primaryPlayTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1
  },
  primaryPlaySubtitle: {
    color: '#E8C5A8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1
  },
  primaryPlayArrow: {
    color: '#E8A76B',
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 8
  },

  // ── 2-Column Mode Grid ──
  modeGridRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 12
  },
  modeGridItem: {
    flex: 1
  },
  modeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.12)',
    ...theme.shadows.sm
  },
  levelSelectCard: {
    backgroundColor: '#FFFFFF'
  },
  multiplayerCard: {
    backgroundColor: '#3E2723',
    borderColor: '#FFD54F'
  },
  modeCardIcon: {
    fontSize: 26,
    marginBottom: 4
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  modeCardSub: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginTop: 2
  },
  multiplayerTitle: {
    color: '#FFD54F'
  },
  multiplayerSub: {
    color: '#FFE082'
  },

  // ── Daily Challenge Container ──
  dailyChallengeWrap: {
    width: '100%',
    marginBottom: 14
  },

  // ── Quick Actions Dock ──
  dockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.1)',
    ...theme.shadows.sm
  },
  dockItem: {
    flex: 1,
    alignItems: 'center'
  },
  dockIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(240, 235, 227, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(106, 68, 40, 0.08)'
  },
  dockIconHighlight: {
    backgroundColor: 'rgba(255, 248, 225, 0.9)',
    borderColor: 'rgba(255, 213, 79, 0.4)'
  },
  dockIcon: {
    fontSize: 20
  },
  dockLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  }
});
