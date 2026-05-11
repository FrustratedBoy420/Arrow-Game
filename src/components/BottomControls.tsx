import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

type Props = {
  onUndo: () => void;
  onHint: () => void;
  onRestart: () => void;
};

export function BottomControls({ onUndo, onHint, onRestart }: Props) {
  return (
    <View style={styles.container}>
      <ControlButton label="Undo" icon="↶" onPress={onUndo} />
      <ControlButton label="Hint" icon="?" onPress={onHint} />
      <ControlButton label="Restart" icon="↻" onPress={onRestart} />
    </View>
  );
}

function ControlButton({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.button}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.labelText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
    paddingBottom: 30,
    paddingTop: 18
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.bgPrimary,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 60,
    marginBottom: 6,
    ...theme.shadows.sm
  },
  icon: {
    color: theme.colors.arrowStroke,
    fontSize: 26,
    fontWeight: '700'
  },
  labelText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  }
});
