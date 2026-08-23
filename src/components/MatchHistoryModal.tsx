import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { MatchRecord } from '../config/achievements';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function MatchHistoryModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const history = useGameStore((s) => s.multiplayerHistory || []);
  const playerTrophies = useGameStore((s) => s.playerTrophies || 1000);

  const totalMatches = history.length;
  const wins = history.filter((m) => m.outcome === 'WIN').length;
  const losses = history.filter((m) => m.outcome === 'LOSS').length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>⚔️ Battle History</Text>
              <Text style={styles.trophiesSubtitle}>
                🏆 {playerTrophies} Multiplayer Trophies
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.colors.arrowStroke} />
            </Pressable>
          </View>

          {/* Quick Overview Summary Banner */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{totalMatches}</Text>
              <Text style={styles.summaryLabel}>Battles</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>{wins}</Text>
              <Text style={styles.summaryLabel}>Victories</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryValue, { color: '#C62828' }]}>{losses}</Text>
              <Text style={styles.summaryLabel}>Defeats</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryValue, { color: '#FF8F00' }]}>{winRate}%</Text>
              <Text style={styles.summaryLabel}>Win Rate</Text>
            </View>
          </View>

          {/* Matches List */}
          {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>⚔️</Text>
              <Text style={styles.emptyTitle}>No Battles Recorded Yet</Text>
              <Text style={styles.emptyDesc}>
                Jump into 1v1 Friends or Random Match to test your tactical arrow solving skills!
              </Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => <MatchCard match={item} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function MatchCard({ match }: { match: MatchRecord }) {
  const isWin = match.outcome === 'WIN';
  const dateStr = new Date(match.timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <View style={[styles.matchCard, isWin ? styles.cardWin : styles.cardLoss]}>
      {/* Left Outcome Badge */}
      <View style={[styles.outcomeBadge, isWin ? styles.badgeWin : styles.badgeLoss]}>
        <Text style={styles.outcomeEmoji}>{isWin ? '🏆' : '💔'}</Text>
        <Text style={[styles.outcomeText, isWin ? styles.textWin : styles.textLoss]}>
          {isWin ? 'VICTORY' : 'DEFEAT'}
        </Text>
      </View>

      {/* Center Details */}
      <View style={styles.matchDetails}>
        <Text style={styles.opponentName}>vs {match.opponentName || 'Challenger'}</Text>
        <Text style={styles.matchTimeText}>{dateStr}</Text>
        <Text style={styles.arrowsSolvedText}>
          🏹 {match.arrowsCleared}/{match.totalArrows} arrows • ⏱️ {match.durationSeconds}s
        </Text>
      </View>

      {/* Right Trophy Delta */}
      <View style={styles.trophyDeltaArea}>
        <Text style={[styles.trophyDeltaText, isWin ? styles.deltaWin : styles.deltaLoss]}>
          {match.trophyDelta > 0 ? `+${match.trophyDelta}` : match.trophyDelta} 🏆
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end'
  },
  container: {
    backgroundColor: '#FDFBF7',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '86%',
    minHeight: '60%',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderColor: 'rgba(106, 68, 40, 0.2)',
    borderWidth: 1.5,
    ...theme.shadows.lg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  trophiesSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF8F00',
    marginTop: 2
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(106, 68, 40, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.12)',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...theme.shadows.sm
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase'
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(106, 68, 40, 0.1)'
  },
  listContent: {
    paddingBottom: 24
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    ...theme.shadows.sm
  },
  cardWin: {
    borderColor: 'rgba(67, 160, 71, 0.3)',
    backgroundColor: '#F9FDF9'
  },
  cardLoss: {
    borderColor: 'rgba(229, 57, 53, 0.25)',
    backgroundColor: '#FDF9F9'
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    marginRight: 12
  },
  badgeWin: {
    backgroundColor: 'rgba(67, 160, 71, 0.15)'
  },
  badgeLoss: {
    backgroundColor: 'rgba(229, 57, 53, 0.12)'
  },
  outcomeEmoji: {
    fontSize: 18,
    marginBottom: 2
  },
  outcomeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  textWin: {
    color: '#2E7D32'
  },
  textLoss: {
    color: '#C62828'
  },
  matchDetails: {
    flex: 1
  },
  opponentName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },
  matchTimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 1
  },
  arrowsSolvedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5D4037',
    marginTop: 3
  },
  trophyDeltaArea: {
    paddingLeft: 8
  },
  trophyDeltaText: {
    fontSize: 15,
    fontWeight: '900'
  },
  deltaWin: {
    color: '#2E7D32'
  },
  deltaLoss: {
    color: '#C62828'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
    marginBottom: 6
  },
  emptyDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18
  }
});
