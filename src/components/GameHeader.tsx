import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Difficulty } from '../game/types';
import { theme } from '../theme/theme';
import GearIcon from './GearIcon';

type Props = {
  title: string;
  difficulty?: Difficulty;
  arrowsLeft?: number;
  totalArrows?: number;
  showBack?: boolean;
  onBack?: () => void;
  onSettings?: () => void;
};

export function GameHeader({
  title,
  difficulty,
  arrowsLeft,
  totalArrows,
  showBack = true,
  onBack,
  onSettings
}: Props) {
  return (
    <View style={styles.container}>
      {/* Left: back button */}
      <View style={styles.side}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={styles.iconButton}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Center: title + arrow count */}
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        {arrowsLeft !== undefined && totalArrows !== undefined && (
          <Text style={styles.arrowCount}>
            {arrowsLeft} / {totalArrows} arrows left
          </Text>
        )}
      </View>

      {/* Right: settings gear */}
      <View style={[styles.side, styles.rightSide]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={onSettings}
          style={styles.iconButton}
        >
          <GearIcon size={26} color={theme.colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderBottomColor: theme.colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 100,
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 8
  },
  side: {
    flex: 1,
    alignItems: 'flex-start'
  },
  rightSide: {
    alignItems: 'flex-end'
  },
  center: {
    alignItems: 'center',
    flex: 1.5
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
    textAlign: 'center'
  },
  arrowCount: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  backIcon: {
    color: theme.colors.textMuted,
    fontSize: 50,
    fontWeight: '300',
    lineHeight: 50
  }
});
