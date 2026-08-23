import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { SPIN_SLICES, SpinSlice } from '../config/skins';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import { audioManager } from '../utils/audio';
import { adManager } from '../utils/ads';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const COOLDOWN_12H_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export function SpinWheelModal({ visible, onClose }: Props) {
  const { width } = useWindowDimensions();
  const wheelSize = Math.min(width * 0.76, 300);

  const claimSpinReward = useGameStore((s) => s.claimSpinReward);
  const lastFreeSpinTimestamp = useGameStore((s) => s.lastFreeSpinTimestamp);
  const isAdmin = useGameStore((s) => !!s.iconsConfig?.unlockAllLevels);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rewardSlice, setRewardSlice] = useState<SpinSlice | null>(null);
  const [now, setNow] = useState(Date.now());

  const rotation = useSharedValue(0);
  const pointerBounce = useSharedValue(1);
  const rewardModalScale = useSharedValue(0);

  const currentAngleRef = useRef(0);

  // Update timer every minute when open
  useEffect(() => {
    if (!visible) return;
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, [visible]);

  const timeSinceLastSpin = lastFreeSpinTimestamp ? now - lastFreeSpinTimestamp : COOLDOWN_12H_MS;
  const isFreeSpinReady = isAdmin || timeSinceLastSpin >= COOLDOWN_12H_MS;
  const remainingMs = Math.max(0, COOLDOWN_12H_MS - timeSinceLastSpin);
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.ceil((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  const wheelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  const pointerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pointerBounce.value }]
  }));

  const rewardModalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardModalScale.value }]
  }));

  const executeSpinAnimation = () => {
    setIsSpinning(true);
    setRewardSlice(null);

    // Pick winning slice using weighted probability
    const totalWeight = SPIN_SLICES.reduce((acc, s) => acc + s.weight, 0);
    let rand = Math.random() * totalWeight;
    let targetIndex = 0;
    for (let i = 0; i < SPIN_SLICES.length; i++) {
      const slice = SPIN_SLICES[i];
      if (slice && rand < slice.weight) {
        targetIndex = i;
        break;
      }
      if (slice) rand -= slice.weight;
    }

    const winningSlice = SPIN_SLICES[targetIndex] || SPIN_SLICES[0]!;

    // Calculate rotation angle
    const sliceAngle = 360 / SPIN_SLICES.length;
    const targetSliceCenter = targetIndex * sliceAngle;
    const fullSpins = 360 * 5; // 5 full rotations
    const finalAngle = currentAngleRef.current + fullSpins + (360 - (targetSliceCenter % 360));
    currentAngleRef.current = finalAngle;

    audioManager.playSound('correct');

    pointerBounce.value = withSequence(
      withTiming(1.3, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );

    // Run animation smoothly on UI thread without executing JS functions inside worklet
    rotation.value = withTiming(finalAngle, {
      duration: 3800,
      easing: Easing.out(Easing.cubic)
    });

    // Execute reward & sounds on JS thread
    setTimeout(() => {
      audioManager.playSound('victory');
      setIsSpinning(false);
      setRewardSlice(winningSlice);
      claimSpinReward(winningSlice);

      rewardModalScale.value = withSequence(
        withTiming(1.2, { duration: 250, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }, 3900);
  };

  const handleSpinPress = () => {
    if (isSpinning) return;

    if (isFreeSpinReady) {
      executeSpinAnimation();
    } else {
      // Ad required for extra spin during 12h cooldown
      adManager.showRewarded(
        () => {
          executeSpinAnimation();
        },
        () => {}
      );
    }
  };

  const handleClaimAndClose = () => {
    setRewardSlice(null);
    rewardModalScale.value = 0;
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>🎡 Lucky Spin</Text>
          <Text style={styles.subtitle}>
            {isFreeSpinReady
              ? 'Your Free Spin is ready! Win rewards!'
              : `Next Free Spin in ${remainingHours}h ${remainingMinutes}m`}
          </Text>

          {/* Wheel Stage */}
          <View style={[styles.wheelStage, { width: wheelSize, height: wheelSize }]}>
            {/* Pointer Indicator */}
            <Animated.View style={[styles.pointerContainer, pointerAnimatedStyle]}>
              <Text style={styles.pointerEmoji}>▼</Text>
            </Animated.View>

            {/* Rotating Wheel */}
            <Animated.View
              style={[
                styles.wheelCircle,
                { width: wheelSize, height: wheelSize, borderRadius: wheelSize / 2 },
                wheelAnimatedStyle
              ]}
            >
              {SPIN_SLICES.map((slice, index) => {
                const angle = index * (360 / SPIN_SLICES.length);
                return (
                  <View
                    key={slice.id}
                    style={[
                      styles.sliceItem,
                      {
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -(wheelSize / 2) + 26 }
                        ]
                      }
                    ]}
                  >
                    <View style={[styles.slicePill, { backgroundColor: slice.color }]}>
                      <Text style={styles.sliceLabel}>{slice.label}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Center Hub */}
              <View style={styles.wheelCenterHub}>
                <Text style={styles.hubEmoji}>🎯</Text>
              </View>
            </Animated.View>
          </View>

          {/* Spin Button */}
          {!rewardSlice && (
            <Pressable
              style={[
                styles.spinBtn,
                !isFreeSpinReady && styles.spinBtnAd,
                isSpinning && styles.spinBtnDisabled
              ]}
              onPress={handleSpinPress}
              disabled={isSpinning}
            >
              <Text style={styles.spinBtnText}>
                {isSpinning
                  ? 'Spinning...'
                  : isFreeSpinReady
                  ? 'SPIN FREE! ✨'
                  : '🎬 Watch Ad to Spin'}
              </Text>
            </Pressable>
          )}

          {/* Maybe later button */}
          {!isSpinning && !rewardSlice && (
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Maybe Later</Text>
            </Pressable>
          )}

          {/* Reward Win Popup */}
          {rewardSlice && (
            <Animated.View style={[styles.rewardModal, rewardModalAnimatedStyle]}>
              <Text style={styles.rewardCongrats}>🎉 CONGRATULATIONS! 🎉</Text>
              <Text style={styles.rewardAmount}>{rewardSlice.label}</Text>
              <Text style={styles.rewardDesc}>
                {rewardSlice.type === 'coins'
                  ? `${rewardSlice.amount} Coins added to your wallet!`
                  : rewardSlice.type === 'hints'
                  ? `${rewardSlice.amount} Smart Hint added to your inventory!`
                  : `${rewardSlice.amount} Shield Life added to your inventory!`}
              </Text>

              <Pressable style={styles.claimBtn} onPress={handleClaimAndClose}>
                <Text style={styles.claimBtnText}>COLLECT REWARD 🎁</Text>
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
    padding: 20
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FDFBF7',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderColor: 'rgba(106, 68, 40, 0.2)',
    borderWidth: 2,
    ...theme.shadows.lg
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 20,
    textAlign: 'center'
  },
  wheelStage: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  pointerContainer: {
    position: 'absolute',
    top: -16,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pointerEmoji: {
    fontSize: 26,
    color: '#D32F2F',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3
  },
  wheelCircle: {
    borderWidth: 6,
    borderColor: '#6A4428',
    backgroundColor: '#3E2723',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.md
  },
  sliceItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  slicePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm
  },
  sliceLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900'
  },
  wheelCenterHub: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#6A4428',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    ...theme.shadows.sm
  },
  hubEmoji: {
    fontSize: 22
  },
  spinBtn: {
    width: '100%',
    backgroundColor: '#FF6F00',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...theme.shadows.md
  },
  spinBtnAd: {
    backgroundColor: '#2E7D32'
  },
  spinBtnDisabled: {
    opacity: 0.6
  },
  spinBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  closeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  rewardModal: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD54F',
    ...theme.shadows.lg
  },
  rewardCongrats: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E65100',
    marginBottom: 12
  },
  rewardAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    marginBottom: 8
  },
  rewardDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 20
  },
  claimBtn: {
    backgroundColor: '#43A047',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
    ...theme.shadows.md
  },
  claimBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900'
  }
});
