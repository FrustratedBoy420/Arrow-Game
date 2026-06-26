import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { theme } from '../theme/theme';

interface CustomAlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  buttonText?: string;
}

export function CustomAlertModal({ 
  visible, 
  onClose, 
  title, 
  description,
  iconName = 'alert-circle-outline',
  buttonText = 'OK'
}: CustomAlertModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View 
          entering={FadeIn.duration(250)}
          style={StyleSheet.absoluteFillObject}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
        </Animated.View>

        <Animated.View 
          entering={ZoomIn.duration(200)}
          style={styles.modalCard}
        >
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name={iconName} size={32} color="#FFF" />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Description */}
          <Text style={styles.description}>
            {description}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.btn, styles.btnPrimary]} 
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={buttonText}
            >
              <Text style={styles.btnTextPrimary}>{buttonText}</Text>
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
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.borderSoft,
    ...theme.shadows.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.arrowStroke,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
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
  btnTextPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
