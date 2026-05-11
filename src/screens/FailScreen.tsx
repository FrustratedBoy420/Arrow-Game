import { useNavigation } from '@react-navigation/native';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';

export function FailScreen() {
  const navigation = useNavigation<AppNavigation>();
  const retry = useGameStore((state) => state.retry);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.icon}>✖</Text>
        <Text style={styles.title}>Out of Moves</Text>
        <Text style={styles.copy}>No more clear paths available. Rethink your strategy and try again!</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry level"
          style={styles.button}
          onPress={() => {
            retry();
            navigation.replace('Gameplay');
          }}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.bgPrimary,
    flex: 1
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28
  },
  icon: {
    color: theme.colors.lifeRed,
    fontSize: 50,
    marginBottom: 16,
    fontWeight: '800'
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12
  },
  copy: {
    color: theme.colors.textMuted,
    fontSize: 18,
    lineHeight: 25,
    marginBottom: 28,
    maxWidth: 280,
    textAlign: 'center'
  },
  button: {
    alignItems: 'center',
    borderColor: theme.colors.arrowStroke,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    minWidth: 160,
    paddingHorizontal: 24,
    paddingVertical: 14
  },
  buttonText: {
    color: theme.colors.arrowStroke,
    fontSize: 18,
    fontWeight: '800'
  }
});
