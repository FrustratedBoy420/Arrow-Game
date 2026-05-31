import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CheckpointGateProgress } from '../systems/levelManagement';
import { theme } from '../theme/theme';

type Props = {
  visible: boolean;
  gate: CheckpointGateProgress | null;
  onClose: () => void;
};

function starLine(stars: number): string {
  if (stars <= 0) return '—';
  return '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
}

export function CheckpointLockModal({ visible, gate, onClose }: Props) {
  if (!gate) return null;

  const progressPct = Math.min(1, gate.currentStars / gate.requiredStars);
  const canUnlock = gate.starsNeeded === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.lockEmoji}>🔒</Text>
            <Text style={styles.title}>Level {gate.targetLevel} Locked</Text>
            <Text style={styles.subtitle}>
              Earn {gate.requiredStars} total stars from Levels {gate.gateStart}–{gate.gateEnd}
            </Text>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressValue}>
                {gate.currentStars}
                <Text style={styles.progressMax}> / {gate.requiredStars}</Text>
              </Text>
              <Text style={styles.starIcon}>⭐</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
            </View>
            {canUnlock ? (
              <Text style={styles.hintOk}>You have enough stars — finish Level {gate.gateEnd} to open!</Text>
            ) : (
              <Text style={styles.hint}>
                {gate.starsNeeded} more star{gate.starsNeeded === 1 ? '' : 's'} needed
              </Text>
            )}
          </View>

          <Text style={styles.breakdownTitle}>Your stars</Text>
          <ScrollView style={styles.breakdownScroll} showsVerticalScrollIndicator={false}>
            {gate.levelBreakdown.map(({ level, stars }) => (
              <View key={level} style={styles.breakdownRow}>
                <Text style={styles.breakdownLevel}>Level {level}</Text>
                <Text style={styles.breakdownStars}>{starLine(stars)}</Text>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.button} onPress={onClose} accessibilityRole="button">
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28
  },
  card: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 24,
    ...theme.shadows.lg
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  lockEmoji: {
    fontSize: 36,
    marginBottom: 8
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20
  },
  progressSection: {
    marginBottom: 16
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  progressMax: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textMuted
  },
  starIcon: {
    fontSize: 22
  },
  progressTrack: {
    height: 10,
    backgroundColor: theme.colors.borderSoft,
    borderRadius: 5,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accentGold,
    borderRadius: 5
  },
  hint: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 10
  },
  hintOk: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.difficultyEasy,
    textAlign: 'center',
    marginTop: 10
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  breakdownScroll: {
    maxHeight: 200,
    marginBottom: 16
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft
  },
  breakdownLevel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.arrowStroke
  },
  breakdownStars: {
    fontSize: 14,
    letterSpacing: 1
  },
  button: {
    backgroundColor: theme.colors.arrowStroke,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: '800'
  }
});
