import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';

export function MultiplayerModeSelectScreen() {
  const navigation = useNavigation<AppNavigation>();

  // Animations
  const titleScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);
  const btnTranslateY = useSharedValue(30);
  const friendsScale = useSharedValue(1);
  const randomScale = useSharedValue(1);
  const backScale = useSharedValue(1);

  useEffect(() => {
    titleScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.4)) });
    titleOpacity.value = withTiming(1, { duration: 500 });
    btnOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    btnTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
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
  const friendsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: friendsScale.value }]
  }));
  const randomAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: randomScale.value }]
  }));
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }]
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />
      
      <View style={styles.content}>
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>Multiplayer</Text>
          <Text style={styles.subtitle}>Choose your mode</Text>
        </Animated.View>

        <Animated.View style={[btnStyle, { width: '100%', alignItems: 'center', marginTop: 40 }]}>
          
          {/* Play with Random */}
          <Pressable
            style={{ width: '100%', alignItems: 'center' }}
            onPressIn={() => {
              randomScale.value = withSpring(0.94, { damping: 10, stiffness: 350 });
            }}
            onPressOut={() => {
              randomScale.value = withSpring(1, { damping: 10, stiffness: 350 });
            }}
            onPress={() => navigation.navigate('MultiplayerRandom')}
          >
            <Animated.View style={[styles.btn, styles.randomBtn, randomAnimStyle]}>
              <Text style={styles.btnIcon}>🌎</Text>
              <Text style={styles.randomText}>Play with Random</Text>
            </Animated.View>
          </Pressable>

          {/* Play with Friends */}
          <Pressable
            style={{ width: '100%', alignItems: 'center' }}
            onPressIn={() => {
              friendsScale.value = withSpring(0.94, { damping: 10, stiffness: 350 });
            }}
            onPressOut={() => {
              friendsScale.value = withSpring(1, { damping: 10, stiffness: 350 });
            }}
            onPress={() => navigation.navigate('MultiplayerFriends')}
          >
            <Animated.View style={[styles.btn, styles.friendsBtn, friendsAnimStyle]}>
              <Text style={styles.btnIcon}>👥</Text>
              <Text style={styles.friendsText}>Play with Friends</Text>
            </Animated.View>
          </Pressable>

          {/* Back Button */}
          <Pressable
            style={{ width: '100%', alignItems: 'center', marginTop: 20 }}
            onPressIn={() => {
              backScale.value = withSpring(0.94, { damping: 10, stiffness: 350 });
            }}
            onPressOut={() => {
              backScale.value = withSpring(1, { damping: 10, stiffness: 350 });
            }}
            onPress={() => navigation.goBack()}
          >
            <Animated.View style={[styles.btn, styles.backBtn, backAnimStyle]}>
              <Text style={styles.backText}>Back</Text>
            </Animated.View>
          </Pressable>

        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -40
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    lineHeight: 50
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    letterSpacing: 1
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 20,
    gap: 12,
    ...theme.shadows.md
  },
  btnIcon: {
    fontSize: 24
  },
  randomBtn: {
    backgroundColor: '#6A4428',
    borderWidth: 2,
    borderColor: '#FFD54F',
    ...theme.shadows.lg
  },
  randomText: { color: '#FFD54F', fontSize: 20, fontWeight: '800' },
  
  friendsBtn: {
    backgroundColor: theme.colors.arrowStroke,
  },
  friendsText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  
  backBtn: {
    backgroundColor: '#FFF',
    width: 140,
    marginTop: 30
  },
  backText: { color: theme.colors.arrowStroke, fontSize: 18, fontWeight: '700' },
});
