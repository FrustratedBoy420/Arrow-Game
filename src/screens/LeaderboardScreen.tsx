import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import { AVATAR_CATALOG } from '../config/achievements';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';
import { audioManager } from '../utils/audio';

type LeaderboardEntry = {
  rank: number;
  name: string;
  stars: number;
  highestUnlockedLevel: number;
  trophies: number;
  selectedAvatarId: string;
  title: string;
  score: number;
};

type LeaderboardData = {
  success: boolean;
  category: 'stars' | 'trophies';
  totalPlayers: number;
  userRank: LeaderboardEntry | null;
  podium: LeaderboardEntry[];
  leaderboard: LeaderboardEntry[];
};

export function LeaderboardScreen() {
  const navigation = useNavigation<AppNavigation>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<'stars' | 'trophies'>('stars');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<LeaderboardData | null>(null);

  const fetchLeaderboard = useGameStore((s) => s.fetchLeaderboard);
  const playerTrophies = useGameStore((s) => s.playerTrophies || 1000);
  const selectedAvatarId = useGameStore((s) => s.selectedAvatarId || 'archer_boy');

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const cacheKey = `leaderboard_cache_${activeTab}`;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached && !isRefresh) {
          setData(JSON.parse(cached));
        }
      } catch (e) {
        // ignore cache read error
      }

      const res = await fetchLeaderboard(activeTab);
      if (res && res.success) {
        setData(res);
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(res));
        } catch (e) {}
      }
      setLoading(false);
      setRefreshing(false);
    },
    [activeTab, fetchLeaderboard]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleTabChange = (tab: 'stars' | 'trophies') => {
    if (tab === activeTab) return;
    audioManager.playSound('correct');
    setActiveTab(tab);
  };

  const getAvatarEmoji = (avatarId?: string) => {
    const found = AVATAR_CATALOG.find((a) => a.id === avatarId);
    return found ? found.emoji : '🏹';
  };

  const podium = data?.podium || [];
  const listItems = data?.leaderboard || [];
  const first = podium[0];
  const second = podium[1];
  const third = podium[2];

  const userRank = data?.userRank;

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>🏆 LEADERBOARDS</Text>
          <Text style={styles.headerSubtitle}>Worldwide Tacticians & Champions</Text>
        </View>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Dual Tab Switcher */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === 'stars' && styles.tabButtonActive]}
          onPress={() => handleTabChange('stars')}
        >
          <Text style={[styles.tabText, activeTab === 'stars' && styles.tabTextActive]}>
            ⭐ Star Masters
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'trophies' && styles.tabButtonActive]}
          onPress={() => handleTabChange('trophies')}
        >
          <Text style={[styles.tabText, activeTab === 'trophies' && styles.tabTextActive]}>
            ⚔️ Arena Champions
          </Text>
        </Pressable>
      </View>

      {loading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD54F" />
          <Text style={styles.loadingText}>Summoning Global Tacticians...</Text>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => `rank-${item.rank}-${item.name}`}
          contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor="#FFD54F"
            />
          }
          ListHeaderComponent={
            <View style={styles.podiumSection}>
              {/* 3-Tier Podium */}
              <View style={styles.podiumRow}>
                {/* 2nd Place (Silver) */}
                {second && (
                  <View style={[styles.podiumColumn, styles.podiumColSilver]}>
                    <View style={styles.crownBadge}>
                      <Text style={styles.crownEmoji}>🥈</Text>
                    </View>
                    <View style={[styles.avatarCircle, styles.avatarSilver]}>
                      <Text style={styles.avatarEmoji}>{getAvatarEmoji(second.selectedAvatarId)}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {second.name}
                    </Text>
                    <Text style={styles.podiumTitle}>{second.title}</Text>
                    <View style={styles.scorePill}>
                      <Text style={styles.scorePillText}>
                        {activeTab === 'stars' ? `${second.score} ⭐` : `${second.score} 🏆`}
                      </Text>
                    </View>
                    <View style={[styles.podiumBase, styles.podiumBaseSilver]}>
                      <Text style={styles.podiumRankText}>#2</Text>
                    </View>
                  </View>
                )}

                {/* 1st Place (Gold) */}
                {first && (
                  <View style={[styles.podiumColumn, styles.podiumColGold]}>
                    <View style={styles.crownBadge}>
                      <Text style={styles.crownEmoji}>👑</Text>
                    </View>
                    <View style={[styles.avatarCircle, styles.avatarGold]}>
                      <Text style={styles.avatarEmoji}>{getAvatarEmoji(first.selectedAvatarId)}</Text>
                    </View>
                    <Text style={styles.podiumNameGold} numberOfLines={1}>
                      {first.name}
                    </Text>
                    <Text style={styles.podiumTitleGold}>{first.title}</Text>
                    <View style={[styles.scorePill, styles.scorePillGold]}>
                      <Text style={styles.scorePillTextGold}>
                        {activeTab === 'stars' ? `${first.score} ⭐` : `${first.score} 🏆`}
                      </Text>
                    </View>
                    <View style={[styles.podiumBase, styles.podiumBaseGold]}>
                      <Text style={styles.podiumRankTextGold}>#1</Text>
                    </View>
                  </View>
                )}

                {/* 3rd Place (Bronze) */}
                {third && (
                  <View style={[styles.podiumColumn, styles.podiumColBronze]}>
                    <View style={styles.crownBadge}>
                      <Text style={styles.crownEmoji}>🥉</Text>
                    </View>
                    <View style={[styles.avatarCircle, styles.avatarBronze]}>
                      <Text style={styles.avatarEmoji}>{getAvatarEmoji(third.selectedAvatarId)}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {third.name}
                    </Text>
                    <Text style={styles.podiumTitle}>{third.title}</Text>
                    <View style={styles.scorePill}>
                      <Text style={styles.scorePillText}>
                        {activeTab === 'stars' ? `${third.score} ⭐` : `${third.score} 🏆`}
                      </Text>
                    </View>
                    <View style={[styles.podiumBase, styles.podiumBaseBronze]}>
                      <Text style={styles.podiumRankText}>#3</Text>
                    </View>
                  </View>
                )}
              </View>

              {listItems.length > 0 && (
                <View style={styles.runnersUpDivider}>
                  <Text style={styles.runnersUpLabel}>TOP TACTICIANS</Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.rankCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankNumberText}>#{item.rank}</Text>
              </View>
              <View style={styles.itemAvatar}>
                <Text style={styles.itemAvatarEmoji}>{getAvatarEmoji(item.selectedAvatarId)}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
              </View>
              <View style={styles.itemScorePill}>
                <Text style={styles.itemScoreText}>
                  {activeTab === 'stars' ? `${item.score} ⭐` : `${item.score} 🏆`}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Sticky Bottom User Rank Bar */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.userRankCard}>
          <View style={styles.userAvatarBox}>
            <Text style={styles.userAvatarEmoji}>{getAvatarEmoji(selectedAvatarId)}</Text>
          </View>
          <View style={styles.userRankDetails}>
            <Text style={styles.userRankTitle}>YOUR STANDING</Text>
            <Text style={styles.userRankSub}>
              {userRank ? `Rank #${userRank.rank} Worldwide` : 'Unranked • Play to Climb!'}
            </Text>
          </View>
          <View style={styles.userScorePill}>
            <Text style={styles.userScoreText}>
              {activeTab === 'stars'
                ? `${userRank ? userRank.score : 0} ⭐`
                : `${playerTrophies} 🏆`}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1E1B18'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backText: {
    fontSize: 48,
    color: '#FFD54F',
    fontWeight: '300',
    lineHeight: 48
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFD54F',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1
  },
  headerSubtitle: {
    color: '#BCAAA4',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  headerRightSpacer: {
    width: 44
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#2A2421',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.15)'
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12
  },
  tabButtonActive: {
    backgroundColor: '#FFD54F',
    ...theme.shadows.sm
  },
  tabText: {
    color: '#BCAAA4',
    fontSize: 13,
    fontWeight: '800'
  },
  tabTextActive: {
    color: '#1E1B18',
    fontWeight: '900'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    color: '#FFD54F',
    fontSize: 13,
    fontWeight: '700'
  },
  listContent: {
    paddingHorizontal: 16
  },
  podiumSection: {
    marginTop: 8,
    marginBottom: 16
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingTop: 10
  },
  podiumColGold: {
    backgroundColor: 'rgba(255, 213, 79, 0.08)',
    borderWidth: 1.5,
    borderColor: '#FFD54F',
    transform: [{ translateY: -10 }]
  },
  podiumColSilver: {
    backgroundColor: 'rgba(224, 224, 224, 0.05)',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  podiumColBronze: {
    backgroundColor: 'rgba(205, 127, 50, 0.05)',
    borderWidth: 1,
    borderColor: '#CD7F32'
  },
  crownBadge: {
    marginBottom: 4
  },
  crownEmoji: {
    fontSize: 22
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3E2723',
    borderWidth: 2
  },
  avatarGold: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderColor: '#FFD54F'
  },
  avatarSilver: {
    borderColor: '#E0E0E0'
  },
  avatarBronze: {
    borderColor: '#CD7F32'
  },
  avatarEmoji: {
    fontSize: 24
  },
  podiumName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    paddingHorizontal: 4
  },
  podiumNameGold: {
    color: '#FFD54F',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 6,
    paddingHorizontal: 4
  },
  podiumTitle: {
    color: '#BCAAA4',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1
  },
  podiumTitleGold: {
    color: '#FFE082',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1
  },
  scorePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6
  },
  scorePillGold: {
    backgroundColor: 'rgba(255, 213, 79, 0.25)',
    borderWidth: 1,
    borderColor: '#FFD54F'
  },
  scorePillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800'
  },
  scorePillTextGold: {
    color: '#FFD54F',
    fontSize: 11,
    fontWeight: '900'
  },
  podiumBase: {
    width: '100%',
    height: 28,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14
  },
  podiumBaseGold: {
    backgroundColor: '#FFD54F'
  },
  podiumBaseSilver: {
    backgroundColor: '#B0BEC5'
  },
  podiumBaseBronze: {
    backgroundColor: '#A1887F'
  },
  podiumRankText: {
    color: '#1E1B18',
    fontSize: 13,
    fontWeight: '900'
  },
  podiumRankTextGold: {
    color: '#1E1B18',
    fontSize: 15,
    fontWeight: '900'
  },
  runnersUpDivider: {
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 213, 79, 0.15)',
    paddingBottom: 6
  },
  runnersUpLabel: {
    color: '#FFD54F',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2421',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  rankBadge: {
    width: 32,
    alignItems: 'center'
  },
  rankNumberText: {
    color: '#BCAAA4',
    fontSize: 13,
    fontWeight: '800'
  },
  itemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3E2723',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  itemAvatarEmoji: {
    fontSize: 18
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  itemTitle: {
    color: '#BCAAA4',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1
  },
  itemScorePill: {
    backgroundColor: 'rgba(255, 213, 79, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.3)'
  },
  itemScoreText: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: '800'
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#161311',
    borderTopWidth: 1.5,
    borderTopColor: '#FFD54F',
    paddingHorizontal: 16,
    paddingTop: 10,
    ...theme.shadows.lg
  },
  userRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2421',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFD54F'
  },
  userAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3E2723',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFD54F'
  },
  userAvatarEmoji: {
    fontSize: 20
  },
  userRankDetails: {
    flex: 1
  },
  userRankTitle: {
    color: '#FFD54F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  userRankSub: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1
  },
  userScorePill: {
    backgroundColor: '#FF6F00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  userScoreText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  }
});
