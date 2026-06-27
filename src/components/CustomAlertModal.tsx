import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { theme } from '../theme/theme';

interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  description: string;
  onClose: () => void;
  confirmText?: string | undefined;
  cancelText?: string | undefined;
  onConfirm?: (() => void) | undefined;
  iconName?: keyof typeof Ionicons.glyphMap | undefined;
  buttonText?: string | undefined;
}

export function CustomAlertModal({
  visible,
  title,
  description,
  onClose,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  iconName = "alert-circle-outline",
  buttonText
}: CustomAlertModalProps) {
  // Use buttonText if provided (backward compatibility), otherwise confirmText
  const singleButtonText = buttonText || confirmText;

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

        {/* Modal Card */}
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
            {onConfirm ? (
              <>
                <Pressable 
                  style={[styles.btn, styles.btnSecondary]} 
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={cancelText}
                >
                  <Text style={styles.btnTextSecondary}>{cancelText}</Text>
                </Pressable>

                <Pressable 
                  style={[styles.btn, styles.btnPrimary]} 
                  onPress={onConfirm}
                  accessibilityRole="button"
                  accessibilityLabel={confirmText}
                >
                  <Text style={styles.btnTextPrimary}>{confirmText}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable 
                style={[styles.btn, styles.btnPrimary, { width: '100%' }]} 
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={singleButtonText}
              >
                <Text style={styles.btnTextPrimary}>{singleButtonText}</Text>
              </Pressable>
            )}
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
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
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
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
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
    borderWidth: 1,
    borderColor: 'rgba(106, 68, 40, 0.15)',
  },
  btnTextPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  btnTextSecondary: {
    color: theme.colors.arrowStroke,
    fontSize: 16,
    fontWeight: '800',
  },
});
