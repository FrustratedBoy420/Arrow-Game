import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import GearIcon from '../components/GearIcon';
import { SettingsModal } from '../components/SettingsModal';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../utils/audio';
import { theme } from '../theme/theme';
import { adManager } from '../utils/ads';
import type { AppNavigation } from '../types/navigation';
import { AdBanner } from '../components/AdBanner';


export function FailScreen() {
  const navigation = useNavigation<AppNavigation>();
  const insets = useSafeAreaInsets();
  const retry = useGameStore((state) => state.retry);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const btnScale = useSharedValue(1);

  useEffect(() => {
    audioManager.playSound('outOfMove');
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }]
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 24, height: 56 + (insets.top > 0 ? insets.top : 24) }]}>
        <View style={styles.headerSpacer} />
        <Pressable
          style={styles.settingsBtn}
          onPress={() => setSettingsVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <GearIcon size={28} color={theme.colors.arrowStroke} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={styles.icon}>✖</Text>
        <Text style={styles.title}>Out of Moves</Text>
        <Text style={styles.copy}>No more clear paths available. Rethink your strategy and try again!</Text>
        
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry level"
          onPressIn={() => { btnScale.value = withSpring(0.94, { damping: 10, stiffness: 350 }); }}
          onPressOut={() => { btnScale.value = withSpring(1, { damping: 10, stiffness: 350 }); }}
          onPress={() => {
            adManager.showInterstitial(() => {
              retry();
              navigation.replace('Gameplay');
            });
          }}
        >
          <Animated.View style={[styles.button, buttonStyle]}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Animated.View>
        </Pressable>
      </View>
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onRestart={() => {
          setSettingsVisible(false);
          retry();
          navigation.replace('Gameplay');
        }}
      />
      <AdBanner />
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: 'transparent',
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerSpacer: { flex: 1 },
  settingsBtn: {
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
    paddingHorizontal: 28
  },
  icon: {
    color: theme.colors.lifeRed,
    fontSize: 56,
    marginBottom: 20,
    fontWeight: '800'
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 16
  },
  copy: {
    color: theme.colors.textMuted,
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 36,
    maxWidth: 290,
    textAlign: 'center',
    fontWeight: '500'
  },
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: theme.colors.arrowStroke,
    borderRadius: 30,
    borderWidth: 2,
    minWidth: 180,
    paddingHorizontal: 32,
    paddingVertical: 16,
    ...theme.shadows.md
  },
  buttonText: {
    color: theme.colors.arrowStroke,
    fontSize: 18,
    fontWeight: '800'
  }
});
