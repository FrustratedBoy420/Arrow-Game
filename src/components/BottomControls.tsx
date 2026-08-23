import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { theme } from '../theme/theme';
import { useGameStore } from '../state/gameStore';

type Props = {
  onUndo: () => void;
  onHint: () => void;
  onRestart: () => void;
  hintDisabled?: boolean;
};

export const BottomControls = memo(function BottomControls({
  onUndo,
  onHint,
  onRestart,
  hintDisabled = false
}: Props) {
  const extraHints = useGameStore((s) => s.inventory?.extraHints ?? 0);
  const extraUndos = useGameStore((s) => s.inventory?.extraUndos ?? 0);

  return (
    <View style={styles.container}>
      <ControlButton
        label="Undo"
        icon="↶"
        onPress={onUndo}
        badge={extraUndos > 0 ? `${extraUndos}` : undefined}
      />
      <ControlButton
        label="Hint"
        icon="💡"
        onPress={onHint}
        disabled={hintDisabled}
        badge={extraHints > 0 ? `${extraHints}` : undefined}
      />
      <ControlButton label="Restart" icon="↻" onPress={onRestart} />
    </View>
  );
});

function ControlButton({
  label,
  icon,
  onPress,
  disabled = false,
  badge
}: {
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: string | undefined;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.9, { damping: 10, stiffness: 350 });
      }}
      onPressOut={() => {
        if (!disabled) scale.value = withSpring(1, { damping: 10, stiffness: 350 });
      }}
      onPress={disabled ? undefined : onPress}
      style={styles.button}
    >
      <Animated.View style={[styles.iconContainer, disabled && styles.iconContainerDisabled, animatedStyle]}>
        <Text style={[styles.icon, disabled && styles.iconDisabled]}>{icon}</Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </Animated.View>
      <Text style={[styles.labelText, disabled && styles.labelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'center',
    paddingBottom: 24,
    paddingTop: 12
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: 'rgba(106, 68, 40, 0.12)',
    borderRadius: 18,
    borderWidth: 1.5,
    height: 48,
    justifyContent: 'center',
    width: 58,
    marginBottom: 6,
    ...theme.shadows.sm
  },
  iconContainerDisabled: {
    backgroundColor: 'rgba(200, 189, 174, 0.35)',
    borderColor: 'rgba(106, 68, 40, 0.08)',
    opacity: 0.55
  },
  icon: {
    color: theme.colors.arrowStroke,
    fontSize: 22,
    fontWeight: '700'
  },
  iconDisabled: {
    color: theme.colors.textMuted
  },
  labelText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  labelDisabled: {
    opacity: 0.45
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3D00',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#FFF',
    ...theme.shadows.sm
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900'
  }
});
