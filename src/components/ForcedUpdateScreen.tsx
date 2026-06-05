import React from 'react';
import { Alert, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AmbientBackground } from './AmbientBackground';
import { theme } from '../theme/theme';

interface ForcedUpdateScreenProps {
  currentVersion: string;
  requiredVersion: string;
}

export function ForcedUpdateScreen({ currentVersion, requiredVersion }: ForcedUpdateScreenProps) {
  const handleUpdatePress = async () => {
    // Open a store link or fallback website
    const url = 'https://play.google.com/store/apps/details?id=com.arrowverse.multiplayer';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open app store link.');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while opening the store.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      <View style={styles.content}>
        
        {/* Animated Warning Icon Container */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(600).springify()}
          style={styles.iconContainer}
        >
          <View style={styles.iconBackground}>
            <Ionicons name="rocket-sharp" size={72} color="#D32F2F" />
          </View>
        </Animated.View>

        {/* Title & Description Card */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(600).springify()}
          style={styles.card}
        >
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.description}>
            A critical new update is available. You must install the latest version of ArrowVerse-Multiplayer to continue playing.
          </Text>

          {/* Versions Comparison Box */}
          <View style={styles.versionBox}>
            <View style={styles.versionColumn}>
              <Text style={styles.versionLabel}>YOUR VERSION</Text>
              <Text style={styles.versionValue}>{currentVersion}</Text>
            </View>
            <View style={styles.versionDivider} />
            <View style={styles.versionColumn}>
              <Text style={styles.versionLabel}>REQUIRED</Text>
              <Text style={[styles.versionValue, styles.requiredColor]}>{requiredVersion}</Text>
            </View>
          </View>

          {/* Update Button */}
          <Pressable
            style={styles.button}
            onPress={handleUpdatePress}
            accessibilityRole="button"
            accessibilityLabel="Update Now"
          >
            <Text style={styles.buttonText}>Update Now</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.buttonIcon} />
          </Pressable>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: -40,
    zIndex: 10,
    ...theme.shadows.md,
  },
  iconBackground: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(211, 47, 47, 0.15)',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingTop: 65,
    paddingBottom: 35,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(106, 68, 40, 0.1)',
    ...theme.shadows.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#6A4428',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    opacity: 0.85,
    fontWeight: '600',
  },
  versionBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(106, 68, 40, 0.05)',
    borderRadius: 20,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(106, 68, 40, 0.08)',
  },
  versionColumn: {
    flex: 1,
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B7355',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  versionValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
  },
  requiredColor: {
    color: '#D32F2F',
  },
  versionDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(106, 68, 40, 0.15)',
    alignSelf: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 25,
    ...theme.shadows.md,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
