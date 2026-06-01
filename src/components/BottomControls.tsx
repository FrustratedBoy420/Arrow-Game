import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { theme } from '../theme/theme';

type Props = {
  onUndo: () => void;
  onHint: () => void;
  onRestart: () => void;
};

export const BottomControls = memo(function BottomControls({ onUndo, onHint, onRestart }: Props) {
  return (
    <View style={styles.container}>
      <ControlButton label="Undo" icon="↶" onPress={onUndo} />
      <ControlButton label="Hint" icon="?" onPress={onHint} />
      <ControlButton label="Restart" icon="↻" onPress={onRestart} />
    </View>
  );
});

function ControlButton({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 10, stiffness: 350 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 350 }); }}
      onPress={onPress}
      style={styles.button}
    >
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <Text style={styles.icon}>{icon}</Text>
      </Animated.View>
      <Text style={styles.labelText}>{label}</Text>
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
  icon: {
    color: theme.colors.arrowStroke,
    fontSize: 22,
    fontWeight: '700'
  },
  labelText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});
