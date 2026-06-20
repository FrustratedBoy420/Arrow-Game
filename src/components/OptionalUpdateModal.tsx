import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { theme } from '../theme/theme';

interface OptionalUpdateModalProps {
  visible: boolean;
  latestVersion: string;
  onClose: () => void;
}

export function OptionalUpdateModal({ visible, latestVersion, onClose }: OptionalUpdateModalProps) {
  const handleUpdatePress = async () => {
    const url = 'https://play.google.com/store/apps/details?id=com.app.arrow_verse';
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
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Semi-transparent Backdrop with Animation */}
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={StyleSheet.absoluteFillObject}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
        </Animated.View>

        {/* Modal Window */}
        <Animated.View 
          entering={SlideInDown.duration(400).springify().damping(15)}
          style={styles.modalCard}
        >
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles-sharp" size={32} color="#FFD54F" />
          </View>

          {/* Title */}
          <Text style={styles.title}>New Update Available!</Text>
          <Text style={styles.versionTag}>Version {latestVersion}</Text>

          {/* Description */}
          <Text style={styles.description}>
            A new version of ArrowVerse-Multiplayer is ready. Update now to enjoy the latest levels, features, and performance enhancements!
          </Text>

          {/* Actions Button Row */}
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.btn, styles.btnSecondary]} 
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Maybe Later"
            >
              <Text style={styles.btnTextSecondary}>Maybe Later</Text>
            </Pressable>

            <Pressable 
              style={[styles.btn, styles.btnPrimary]} 
              onPress={handleUpdatePress}
              accessibilityRole="button"
              accessibilityLabel="Update Now"
            >
              <Text style={styles.btnTextPrimary}>Update</Text>
              <Ionicons name="cloud-download-outline" size={18} color="#FFF" style={styles.btnIcon} />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(106, 68, 40, 0.08)',
    ...theme.shadows.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#6A4428',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    marginBottom: 4,
  },
  versionTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B7355',
    backgroundColor: 'rgba(106, 68, 40, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  description: {
    fontSize: 14,
    color: '#6A4428',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    opacity: 0.85,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
  },
  btnPrimary: {
    backgroundColor: theme.colors.arrowStroke,
    ...theme.shadows.sm,
  },
  btnSecondary: {
    backgroundColor: 'rgba(106, 68, 40, 0.08)',
  },
  btnTextPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  btnTextSecondary: {
    color: '#6A4428',
    fontSize: 16,
    fontWeight: '800',
  },
  btnIcon: {
    marginLeft: 6,
  },
});
