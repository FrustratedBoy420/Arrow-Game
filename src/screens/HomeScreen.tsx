import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState, useCallback } from 'react';
import { BackHandler, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
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

export function HomeScreen() {
  const navigation = useNavigation<AppNavigation>();
  const hasSeenTutorial = useGameStore((s) => s.hasSeenTutorial);
  const iconsConfig = useGameStore((s) => s.iconsConfig);
  const fetchGameConfig = useGameStore((s) => s.fetchGameConfig);
  const levelProgressMap = useGameStore((s) => s.levelProgressMap);
  const coins = useGameStore((s) => s.coins);

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
  const [isNameLoaded, setIsNameLoaded] = useState(false);
  const [hasName, setHasName] = useState(false);
  const [profileName, setProfileName] = useState('');

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
      <View style={styles.header}>
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

        {/* Network / Fetching status badge */}
        {(!isConnected || !dynamicLevels || dynamicLevels.length === 0) && (
          <View style={[
            styles.statusBadge,
            styles.statusBadgeOffline
          ]}>
            <View style={[
              styles.statusDot,
              styles.statusDotOffline
            ]} />
            <Text style={styles.statusText}>
              Offline Mode
            </Text>
          </View>
        )}

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

      {/* ── Content ── */}
      <View style={styles.content}>
        <Animated.View style={[styles.arrowDeco, arrowStyle]}>
          <Text style={styles.arrowIcon}>{iconsConfig?.homeArrow || '➤'}</Text>
        </Animated.View>

        <Animated.View style={titleStyle}>
          <Text style={styles.title}>Arrow{'\n'}Verse</Text>
          <Text style={styles.subtitle}>Think · Tap · Escape</Text>
        </Animated.View>

        <Animated.View style={[btnStyle, { width: '100%', alignItems: 'center' }]}>
          {/* Start Now */}
          <Pressable
            style={{ width: '100%', alignItems: 'center' }}
            onPressIn={() => {
              startScale.value = withSpring(0.94, { damping: 10, stiffness: 350 });
            }}
            onPressOut={() => {
              startScale.value = withSpring(1, { damping: 10, stiffness: 350 });
            }}
            onPress={() =>
              navigation.replace(hasSeenTutorial ? 'Gameplay' : 'Tutorial')
            }
          >
            <Animated.View style={[styles.btn, startAnimStyle]}>
              <Text style={styles.btnText}>Start Now</Text>
              <Text style={styles.btnArrow}>→</Text>
            </Animated.View>
          </Pressable>

          {/* Level Select */}
          <Pressable
            style={{ width: '100%', alignItems: 'center' }}
            onPressIn={() => {
              selectScale.value = withSpring(0.94, { damping: 10, stiffness: 350 });
            }}
            onPressOut={() => {
              selectScale.value = withSpring(1, { damping: 10, stiffness: 350 });
            }}
            onPress={() => navigation.navigate('LevelSelect')}
          >
            <Animated.View style={[styles.btn, styles.levelSelectBtn, selectAnimStyle]}>
              <Text style={[styles.btnText, styles.levelSelectText]}>Level Select</Text>
            </Animated.View>
          </Pressable>

          {/* Multiplayer */}
          <Pressable
            style={{ width: '100%', alignItems: 'center' }}
            onPressIn={() => {
              multiScale.value = withSpring(0.94, { damping: 10, stiffness: 350 });
            }}
            onPressOut={() => {
              multiScale.value = withSpring(1, { damping: 10, stiffness: 350 });
            }}
            onPress={() => navigation.navigate('Multiplayer')}
          >
            <Animated.View style={[styles.btn, styles.multiplayerBtn, multiAnimStyle]}>
              <Text style={[styles.btnText, styles.multiplayerText]}>
                ⚔️ Multiplayer Mode ⚔️
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

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
    paddingTop: 44,
    height: 100
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
  profileEmoji: {
    fontSize: 18,
    marginRight: 6
  },
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
  starEmoji: {
    fontSize: 18,
    marginRight: 6
  },
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
  coinEmoji: {
    fontSize: 18,
    marginRight: 6
  },
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

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    ...theme.shadows.sm
  },
  statusBadgeOffline: {
    borderColor: 'rgba(211, 47, 47, 0.25)',
  },
  statusBadgeFetching: {
    borderColor: 'rgba(25, 118, 210, 0.25)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusDotOffline: {
    backgroundColor: '#D32F2F',
  },
  statusDotFetching: {
    backgroundColor: '#1976D2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -40
  },
  arrowDeco: { marginBottom: 20 },
  arrowIcon: {
    fontSize: 64,
    color: theme.colors.arrowStroke,
    opacity: 0.7
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    lineHeight: 58
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    letterSpacing: 2
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.arrowStroke,
    width: 250,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 36,
    gap: 12,
    ...theme.shadows.md
  },
  btnText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  btnArrow: { color: '#FFF', fontSize: 22, fontWeight: '800' },

  levelSelectBtn: {
    backgroundColor: '#FFF',
    marginTop: 16,
    ...theme.shadows.md
  },
  levelSelectText: { color: theme.colors.arrowStroke },

  multiplayerBtn: {
    backgroundColor: '#6A4428',
    borderWidth: 2,
    borderColor: '#FFD54F',
    marginTop: 16,
    ...theme.shadows.lg
  },
  multiplayerText: { color: '#FFD54F', fontWeight: '800' }
});
