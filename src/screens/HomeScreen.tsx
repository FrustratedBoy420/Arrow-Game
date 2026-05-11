import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';

export function HomeScreen() {
  const navigation = useNavigation<AppNavigation>();
  const hasSeenTutorial = useGameStore((s) => s.hasSeenTutorial);

  const titleScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);
  const btnTranslateY = useSharedValue(30);
  const arrowBounce = useSharedValue(0);

  useEffect(() => {
    titleScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.4)) });
    titleOpacity.value = withTiming(1, { duration: 500 });
    btnOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    btnTranslateY.value = withDelay(400, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
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
  }, []);

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

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Animated.View style={[styles.arrowDeco, arrowStyle]}>
          <Text style={styles.arrowIcon}>➤</Text>
        </Animated.View>

        <Animated.View style={titleStyle}>
          <Text style={styles.title}>Arrow{'\n'}Escape</Text>
          <Text style={styles.subtitle}>Tap · Think · Escape</Text>
        </Animated.View>

        <Animated.View style={btnStyle}>
          <Pressable
            style={styles.startBtn}
            onPress={() => navigation.replace(hasSeenTutorial ? 'Gameplay' : 'Tutorial')}
          >
            <Text style={styles.startBtnText}>Start Now</Text>
            <Text style={styles.startBtnArrow}>→</Text>
          </Pressable>

          <Pressable
            style={[styles.startBtn, styles.levelSelectBtn]}
            onPress={() => navigation.navigate('LevelSelect')}
          >
            <Text style={[styles.startBtnText, styles.levelSelectText]}>Level Select</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[btnStyle, { marginTop: 24 }]}>
          <Text style={styles.versionText}>v1.1 · 50 Levels</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bgPrimary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  arrowDeco: { marginBottom: 20 },
  arrowIcon: { fontSize: 64, color: theme.colors.arrowStroke, opacity: 0.7 },
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
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.arrowStroke,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 48,
    gap: 12,
    ...theme.shadows.md
  },
  startBtnText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  startBtnArrow: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  levelSelectBtn: {
    backgroundColor: theme.colors.bgPrimary,
    borderWidth: 2,
    borderColor: theme.colors.arrowStroke,
    marginTop: 16,
    ...theme.shadows.sm
  },
  levelSelectText: {
    color: theme.colors.arrowStroke,
  },
  versionText: { color: theme.colors.textMuted, fontSize: 13, opacity: 0.6 }
});
