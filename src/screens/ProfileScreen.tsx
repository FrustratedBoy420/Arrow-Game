import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AmbientBackground } from '../components/AmbientBackground';
import {
  ACHIEVEMENTS_CATALOG,
  Achievement,
  AVATAR_CATALOG,
  AvatarDefinition,
  calculateSunkCostScore,
  getPlayerTitle
} from '../config/achievements';
import { useGameStore } from '../state/gameStore';
import { getTotalStarsEarned } from '../systems/levelManagement';
import { ensureLevelProgressMap } from '../systems/levelManagementStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';
import { MatchHistoryModal } from '../components/MatchHistoryModal';
import { AdBanner } from '../components/AdBanner';

export function ProfileScreen() {
  const navigation = useNavigation<AppNavigation>();
  const insets = useSafeAreaInsets();

  const coins = useGameStore((s) => s.coins);
  const highestUnlockedLevel = useGameStore((s) => s.highestUnlockedLevel);
  const levelProgressMap = useGameStore((s) => s.levelProgressMap);
  const winStreak = useGameStore((s) => s.winStreak);
  const bestWinStreak = useGameStore((s) => s.bestWinStreak);
  const totalArrowsCleared = useGameStore((s) => s.totalArrowsCleared || 0);
  const totalFlawlessWins = useGameStore((s) => s.totalFlawlessWins || 0);
  const fastestClearSeconds = useGameStore((s) => s.fastestClearSeconds);
  const ownedSkins = useGameStore((s) => s.ownedSkins || ['classic']);
  const selectedAvatarId = useGameStore((s) => s.selectedAvatarId || 'archer_boy');
  const setPlayerAvatar = useGameStore((s) => s.setPlayerAvatar);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements || []);
  const claimedAchievements = useGameStore((s) => s.claimedAchievements || []);
  const claimAchievementReward = useGameStore((s) => s.claimAchievementReward);
  const multiplayerHistory = useGameStore((s) => s.multiplayerHistory || []);
  const playerTrophies = useGameStore((s) => s.playerTrophies || 1000);
  const dailyStreakDay = useGameStore((s) => s.dailyStreakDay || 1);

  const [matchHistoryVisible, setMatchHistoryVisible] = useState(false);
  const [playerName, setPlayerName] = useState('Tactician');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('Tactician');

  React.useEffect(() => {
    AsyncStorage.getItem('user_profile_name').then((name) => {
      if (name) {
        setPlayerName(name);
        setTempName(name);
      }
    });
  }, []);

  const handleSaveName = async () => {
    if (tempName.trim()) {
      setPlayerName(tempName.trim());
      await AsyncStorage.setItem('user_profile_name', tempName.trim());
    }
    setIsEditingName(false);
  };

  const pMap = ensureLevelProgressMap(levelProgressMap);
  const totalStars = getTotalStarsEarned(pMap);
  const levelsWonCount = Array.from(pMap.values()).filter((p) => p.isCompleted).length;

  const playerTitle = getPlayerTitle(highestUnlockedLevel, totalStars);
  const sunkCostScore = calculateSunkCostScore(
    levelsWonCount,
    totalStars,
    totalArrowsCleared,
    ownedSkins.length
  );

  const activeAvatar =
    AVATAR_CATALOG.find((a) => a.id === selectedAvatarId) || AVATAR_CATALOG[0]!;

  const evaluatorState = {
    levelProgressMap: pMap,
    highestUnlockedLevel,
    bestWinStreak,
    winStreak,
    totalArrowsCleared,
    totalFlawlessWins,
    fastestClearSeconds,
    ownedSkins,
    playerTrophies,
    multiplayerHistory,
    dailyStreakDay
  };

  const mpWins = multiplayerHistory.filter((m) => m.outcome === 'WIN').length;
  const mpLosses = multiplayerHistory.filter((m) => m.outcome === 'LOSS').length;
  const mpTotal = multiplayerHistory.length;
  const mpWinRate = mpTotal > 0 ? Math.round((mpWins / mpTotal) * 100) : 0;

  const handleClaim = (achievement: Achievement) => {
    const res = claimAchievementReward(achievement.id);
    if (res.success) {
      Alert.alert('🎉 Reward Claimed!', `+${res.coinsAwarded} Coins added to your wallet!`);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 4 : 20 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.arrowStroke} />
        </Pressable>

        <Text style={styles.headerTitle}>👤 Career Profile</Text>

        <View style={styles.coinBadge}>
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.coinText}>{coins}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Identity & Rank Card */}
        <View style={styles.identityCard}>
          <View style={[styles.avatarCircle, { borderColor: activeAvatar.borderGlow }]}>
            <Text style={styles.avatarEmoji}>{activeAvatar.emoji}</Text>
          </View>

          <View style={styles.identityDetails}>
            <View style={styles.nameRow}>
              {isEditingName ? (
                <View style={styles.editRow}>
                  <TextInput
                    value={tempName}
                    onChangeText={setTempName}
                    style={styles.nameInput}
                    autoFocus
                    maxLength={16}
                  />
                  <Pressable style={styles.saveNameBtn} onPress={handleSaveName}>
                    <Text style={styles.saveNameText}>✓</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text style={styles.playerName}>{playerName}</Text>
                  <Pressable onPress={() => setIsEditingName(true)} hitSlop={8}>
                    <Ionicons name="pencil" size={16} color={theme.colors.textMuted} />
                  </Pressable>
                </>
              )}
            </View>

            {/* Title Badge */}
            <View style={[styles.titleBadge, { backgroundColor: `${playerTitle.color}22` }]}>
              <Text style={styles.titleBadgeIcon}>{playerTitle.badge}</Text>
              <Text style={[styles.titleBadgeText, { color: playerTitle.color }]}>
                {playerTitle.title}
              </Text>
            </View>

            {/* Sunk Cost Investment Score */}
            <Text style={styles.sunkCostText}>
              🌟 {sunkCostScore.toLocaleString()} Tactician Career Points
            </Text>
          </View>
        </View>

        {/* 2. Avatar Selection Showcase */}
        <Text style={styles.sectionHeader}>🎭 Choose Your Avatar</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarRow}
        >
          {AVATAR_CATALOG.map((avatar) => {
            const isUnlocked = avatar.isUnlocked(evaluatorState);
            const isSelected = selectedAvatarId === avatar.id;

            return (
              <Pressable
                key={avatar.id}
                style={[
                  styles.avatarCard,
                  isSelected && styles.avatarCardSelected,
                  !isUnlocked && styles.avatarCardLocked
                ]}
                onPress={() => {
                  if (isUnlocked) {
                    setPlayerAvatar(avatar.id);
                  } else {
                    Alert.alert('Avatar Locked', avatar.unlockReqText);
                  }
                }}
              >
                <View
                  style={[
                    styles.avatarItemCircle,
                    { borderColor: isUnlocked ? avatar.borderGlow : '#BDBDBD' }
                  ]}
                >
                  <Text style={styles.avatarItemEmoji}>{avatar.emoji}</Text>
                  {!isUnlocked && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.avatarItemName} numberOfLines={1}>
                  {avatar.name}
                </Text>
                <Text style={styles.avatarItemStatus}>
                  {isSelected ? '✓ ACTIVE' : isUnlocked ? 'EQUIP' : 'LOCKED'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 3. Lifetime Career Matrix (2x3 Grid) */}
        <Text style={styles.sectionHeader}>📊 Career Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="🏆"
            label="Levels Cleared"
            value={`${levelsWonCount} / 100`}
            subtext={`${highestUnlockedLevel} Highest Unlocked`}
          />
          <StatCard
            icon="⭐"
            label="Total Stars"
            value={`${totalStars}`}
            subtext={`${Math.round((totalStars / Math.max(1, levelsWonCount * 3)) * 100)}% Mastery`}
          />
          <StatCard
            icon="🏹"
            label="Arrows Solved"
            value={`${totalArrowsCleared}`}
            subtext="Lifetime Clears"
          />
          <StatCard
            icon="🔥"
            label="Best Win Streak"
            value={`${bestWinStreak}`}
            subtext={`Current: ${winStreak}`}
          />
          <StatCard
            icon="⏱️"
            label="Fastest Solve"
            value={fastestClearSeconds ? `${fastestClearSeconds}s` : 'N/A'}
            subtext="Personal Record"
          />
          <StatCard
            icon="🛡️"
            label="Flawless Wins"
            value={`${totalFlawlessWins}`}
            subtext="0 Hearts Lost"
          />
        </View>

        {/* 4. Multiplayer Record Banner */}
        <View style={styles.mpBanner}>
          <View style={styles.mpLeft}>
            <Text style={styles.mpTitle}>⚔️ 1v1 Multiplayer Record</Text>
            <Text style={styles.mpStats}>
              {mpWins}W - {mpLosses}L • {mpWinRate}% Win Rate • 🏆 {playerTrophies} Trophies
            </Text>
          </View>
          <Pressable
            style={styles.mpLogBtn}
            onPress={() => setMatchHistoryVisible(true)}
          >
            <Text style={styles.mpLogBtnText}>View Logs →</Text>
          </Pressable>
        </View>

        {/* 5. Achievements & Badges Showcase */}
        <View style={styles.achievementsHeaderRow}>
          <Text style={styles.sectionHeader}>🏆 Achievements ({unlockedAchievements.length}/16)</Text>
        </View>

        {ACHIEVEMENTS_CATALOG.map((achievement) => {
          const { current, max, isComplete } = achievement.getProgress(evaluatorState);
          const isClaimed = claimedAchievements.includes(achievement.id);

          return (
            <View key={achievement.id} style={styles.achievementCard}>
              <View style={styles.achievementIconCircle}>
                <Text style={styles.achievementIconEmoji}>{achievement.icon}</Text>
              </View>

              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, (current / max) * 100)}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {current} / {max}
                </Text>
              </View>

              {/* Action area */}
              <View style={styles.achievementAction}>
                {isClaimed ? (
                  <View style={styles.claimedPill}>
                    <Text style={styles.claimedText}>✓ CLAIMED</Text>
                  </View>
                ) : isComplete ? (
                  <Pressable
                    style={styles.claimBtn}
                    onPress={() => handleClaim(achievement)}
                  >
                    <Text style={styles.claimBtnText}>CLAIM {achievement.rewardCoins} 🪙</Text>
                  </Pressable>
                ) : (
                  <View style={styles.rewardPreviewPill}>
                    <Text style={styles.rewardPreviewText}>+{achievement.rewardCoins} 🪙</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Match History Modal */}
      <MatchHistoryModal
        visible={matchHistoryVisible}
        onClose={() => setMatchHistoryVisible(false)}
      />

      <AdBanner />
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext
}: {
  icon: string;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSubtext}>{subtext}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.12)',
    ...theme.shadows.sm
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.12)',
    ...theme.shadows.sm
  },
  coinEmoji: { fontSize: 18, marginRight: 6 },
  coinText: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  identityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.14)',
    marginBottom: 20,
    ...theme.shadows.md
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3E2723',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginRight: 14,
    ...theme.shadows.md
  },
  avatarEmoji: {
    fontSize: 36
  },
  identityDetails: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  playerName: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  nameInput: {
    backgroundColor: '#F5F0EA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.arrowStroke,
    minWidth: 120
  },
  saveNameBtn: {
    backgroundColor: '#43A047',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  saveNameText: {
    color: '#FFF',
    fontWeight: '900'
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6
  },
  titleBadgeIcon: {
    fontSize: 13,
    marginRight: 4
  },
  titleBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  sunkCostText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    marginBottom: 12,
    marginTop: 8
  },
  avatarRow: {
    paddingBottom: 16,
    gap: 12
  },
  avatarCard: {
    width: 86,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.12)',
    ...theme.shadows.sm
  },
  avatarCardSelected: {
    borderColor: '#FFD700',
    borderWidth: 2.5,
    backgroundColor: '#FFFDF5'
  },
  avatarCardLocked: {
    opacity: 0.65
  },
  avatarItemCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3E2723',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 6,
    position: 'relative'
  },
  avatarItemEmoji: {
    fontSize: 24
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 2
  },
  lockIcon: {
    fontSize: 10
  },
  avatarItemName: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    marginBottom: 4
  },
  avatarItemStatus: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF8F00'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.12)',
    alignItems: 'center',
    ...theme.shadows.sm
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginTop: 2,
    textAlign: 'center'
  },
  statSubtext: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#8D6E63',
    marginTop: 3,
    textAlign: 'center'
  },
  mpBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.sm
  },
  mpLeft: {
    flex: 1
  },
  mpTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  mpStats: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 2
  },
  mpLogBtn: {
    backgroundColor: '#F5F0EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(106, 68, 40, 0.12)'
  },
  mpLogBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },
  achievementsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.12)',
    ...theme.shadows.sm
  },
  achievementIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 213, 79, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  achievementIconEmoji: {
    fontSize: 22
  },
  achievementInfo: {
    flex: 1,
    marginRight: 10
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },
  achievementDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#EFEBE9',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#43A047',
    borderRadius: 3
  },
  progressText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginTop: 2
  },
  achievementAction: {
    alignItems: 'center'
  },
  claimedPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  claimedText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2E7D32'
  },
  claimBtn: {
    backgroundColor: '#FF6F00',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    ...theme.shadows.sm
  },
  claimBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF'
  },
  rewardPreviewPill: {
    backgroundColor: '#F5F0EA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10
  },
  rewardPreviewText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF8F00'
  }
});
