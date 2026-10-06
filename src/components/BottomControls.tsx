import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { theme } from '../theme/theme';
import { HINT_COIN_COST, useGameStore } from '../state/gameStore';

type Props = {
  onUndo: () => void;
  onHint: () => void;
  onRestart: () => void;
  /** Shown before the first tap while a Shield Life booster is owned. */
  onShield?: (() => void) | undefined;
  hintDisabled?: boolean;
};

// Same order and badges as the web game: Hint, Undo, Restart (+ Shield before the first tap)
export const BottomControls = memo(function BottomControls({
  onUndo,
  onHint,
  onRestart,
  onShield,
  hintDisabled = false
}: Props) {
  const extraHints = useGameStore((s) => s.inventory?.extraHints ?? 0);
  const extraUndos = useGameStore((s) => s.inventory?.extraUndos ?? 0);
  const extraLives = useGameStore((s) => s.inventory?.extraLives ?? 0);
  const hintUsed = useGameStore((s) => s.hintUsedThisLevel);
  const undoUsed = useGameStore((s) => s.undoUsedThisLevel);
  const nothingToUndo = useGameStore((s) => s.board.removedIds.length === 0 || s.status !== 'playing');

  const hintBadge = !hintUsed ? 'Free' : extraHints > 0 ? `×${extraHints}` : `${HINT_COIN_COST}🪙`;
  const undoBadge = !undoUsed ? 'Free' : `×${extraUndos}`;

  return (
    <View style={styles.container}>
      <ControlButton
        label="Hint"
        icon="💡"
        onPress={onHint}
        disabled={hintDisabled}
        badge={hintBadge}
        free={!hintUsed}
      />
      <ControlButton label="Undo" icon="↶" onPress={onUndo} disabled={nothingToUndo} badge={undoBadge} free={!undoUsed} />
      <ControlButton label="Restart" icon="↻" onPress={onRestart} />
      {onShield ? <ControlButton label="Shield" icon="🛡️" onPress={onShield} badge={`×${extraLives}`} /> : null}
    </View>
  );
});

function ControlButton({
  label,
  icon,
  onPress,
  disabled = false,
  badge,
  free = false
}: {
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: string | undefined;
  free?: boolean;
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
          <View style={[styles.badge, free && styles.badgeFree]}>
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
    gap: 24,
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
  badgeFree: {
    backgroundColor: '#2E9D4F'
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900'
  }
});
