import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  Easing
} from 'react-native-reanimated';

import { DAILY_REWARDS, DailyRewardDay } from '../config/skins';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import { audioManager } from '../utils/audio';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function DailyRewardModal({ visible, onClose }: Props) {
  const dailyStreakDay = useGameStore((s) => s.dailyStreakDay || 1);
  const lastDailyClaimDate = useGameStore((s) => s.lastDailyClaimDate);
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);

  const today = new Date().toISOString().split('T')[0]!;
  const hasClaimedToday = lastDailyClaimDate === today;

  const [claimedReward, setClaimedReward] = useState<DailyRewardDay | null>(null);

  const claimBtnScale = useSharedValue(1);
  const rewardScale = useSharedValue(0);

  const rewardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScale.value }]
  }));

  const handleClaim = () => {
    if (hasClaimedToday) return;

    audioManager.playSound('victory');
    const res = claimDailyReward();
    if (res.success && res.reward) {
      setClaimedReward(res.reward);
      rewardScale.value = withSequence(
        withTiming(1.2, { duration: 250, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }
  };

  const handleCollectAndClose = () => {
    setClaimedReward(null);
    rewardScale.value = 0;
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>📅 Daily Rewards</Text>
          <Text style={styles.subtitle}>
            {hasClaimedToday
              ? 'Come back tomorrow for your next gift!'
              : 'Claim your gift and keep your streak alive!'}
          </Text>

          {/* 7-Day Grid */}
          <View style={styles.grid}>
            {DAILY_REWARDS.map((item) => {
              const isPast = item.day < dailyStreakDay || (item.day === dailyStreakDay && hasClaimedToday);
              const isCurrent = item.day === dailyStreakDay && !hasClaimedToday;
              const isDay7 = item.day === 7;

              return (
                <View
                  key={item.day}
                  style={[
                    styles.dayCard,
                    isDay7 && styles.day7Card,
                    isCurrent && styles.dayCardActive,
                    isPast && styles.dayCardClaimed
                  ]}
                >
                  <Text style={[styles.dayLabel, isDay7 && styles.day7Label]}>
                    {item.title}
                  </Text>
                  <Text style={styles.rewardIcon}>{item.icon}</Text>
                  <Text style={[styles.rewardAmount, isDay7 && styles.day7Amount]}>
                    {item.coins} 🪙
                    {item.hints ? ` + ${item.hints}💡` : ''}
                  </Text>

                  {isPast && (
                    <View style={styles.claimedOverlay}>
                      <Text style={styles.claimedCheck}>✓</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Claim Action Button */}
          {!hasClaimedToday && !claimedReward && (
            <Pressable
              style={styles.claimBtn}
              onPressIn={() => {
                claimBtnScale.value = withSpring(0.95, { damping: 10, stiffness: 350 });
              }}
              onPressOut={() => {
                claimBtnScale.value = withSpring(1, { damping: 10, stiffness: 350 });
              }}
              onPress={handleClaim}
            >
              <Text style={styles.claimBtnText}>CLAIM DAY {dailyStreakDay} REWARD 🎁</Text>
            </Pressable>
          )}

          {hasClaimedToday && !claimedReward && (
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Done</Text>
            </Pressable>
          )}

          {/* Reward Popup */}
          {claimedReward && (
            <Animated.View style={[styles.claimedPopup, rewardAnimatedStyle]}>
              <Text style={styles.popupTitle}>🎁 REWARD CLAIMED!</Text>
              <Text style={styles.popupAmount}>+{claimedReward.coins} 🪙</Text>
              {claimedReward.hints && (
                <Text style={styles.popupSubAmount}>+{claimedReward.hints} Smart Hints</Text>
              )}
              {claimedReward.lives && (
                <Text style={styles.popupSubAmount}>+{claimedReward.lives} Shield Life</Text>
              )}

              <Pressable style={styles.collectBtn} onPress={handleCollectAndClose}>
                <Text style={styles.collectBtnText}>CONTINUE</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FDFBF7',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    borderColor: 'rgba(106, 68, 40, 0.2)',
    borderWidth: 2,
    ...theme.shadows.lg
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 16
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
    marginBottom: 16
  },
  dayCard: {
    width: '22%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(106, 68, 40, 0.12)',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    position: 'relative'
  },
  day7Card: {
    width: '47%',
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD54F',
    borderWidth: 2
  },
  dayCardActive: {
    borderColor: '#FF9800',
    borderWidth: 2,
    backgroundColor: '#FFF'
  },
  dayCardClaimed: {
    opacity: 0.6
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    marginBottom: 2
  },
  day7Label: {
    color: '#E65100',
    fontWeight: '900'
  },
  rewardIcon: {
    fontSize: 22,
    marginVertical: 2
  },
  rewardAmount: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },
  day7Amount: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '900'
  },
  claimedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  claimedCheck: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2E7D32'
  },

  claimBtn: {
    backgroundColor: '#FF9800',
    borderColor: '#F57C00',
    borderWidth: 2,
    borderRadius: 24,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    ...theme.shadows.md
  },
  claimBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900'
  },
  closeBtn: {
    backgroundColor: theme.colors.arrowStroke,
    borderRadius: 20,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center'
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800'
  },

  claimedPopup: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderColor: '#4CAF50',
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    zIndex: 40,
    ...theme.shadows.lg
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2E7D32',
    marginBottom: 6
  },
  popupAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  popupSubAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#388E3C',
    marginTop: 2
  },
  collectBtn: {
    backgroundColor: '#43A047',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
    width: '100%',
    alignItems: 'center'
  },
  collectBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900'
  }
});
