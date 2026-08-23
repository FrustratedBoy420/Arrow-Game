import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Difficulty } from '../game/types';
import { theme } from '../theme/theme';
import GearIcon from './GearIcon';
import { useGameStore } from '../state/gameStore';

type Props = {
  title: string;
  difficulty?: Difficulty;
  arrowsLeft?: number;
  totalArrows?: number;
  showBack?: boolean;
  onBack?: () => void;
  onSettings?: () => void;
};

export const GameHeader = memo(function GameHeader({
  title,
  difficulty,
  arrowsLeft,
  totalArrows,
  showBack = true,
  onBack,
  onSettings
}: Props) {
  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0 ? insets.top : 24;
  const winStreak = useGameStore((s) => s.winStreak);

  return (
    <View style={[styles.container, { paddingTop: safeTop, minHeight: 56 + safeTop }]}>
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

      {/* Center: title + arrow count + streak badge */}
      <View style={styles.center}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {winStreak >= 2 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {winStreak}</Text>
            </View>
          )}
        </View>
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
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderBottomColor: theme.colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 24,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  streakBadge: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    ...theme.shadows.sm
  },
  streakText: {
    color: '#E65100',
    fontSize: 13,
    fontWeight: '900'
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
