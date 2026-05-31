import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import { CheckpointLockModal } from '../components/CheckpointLockModal';
import { GameHeader } from '../components/GameHeader';
import { SettingsModal } from '../components/SettingsModal';
import { getTotalLevels } from '../levels/levels';
import { useGameStore } from '../state/gameStore';
import {
  checkLevelUnlocks,
  getCheckpointGateProgress,
  getCheckpointRequiredStars,
  isCheckpointLevel,
  type CheckpointGateProgress
} from '../systems/levelManagement';
import { isLevelLocked, saveLevelProgress } from '../systems/levelManagementStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';

export function LevelSelectScreen() {
  const navigation = useNavigation<AppNavigation>();
  const levelProgressMap = useGameStore((state) => state.levelProgressMap);
  const startLevel = useGameStore((state) => state.startLevel);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [checkpointGate, setCheckpointGate] = useState<CheckpointGateProgress | null>(null);
  const [, setLockRevision] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const map = new Map(useGameStore.getState().levelProgressMap);
      if (map.size > 0) {
        checkLevelUnlocks(map);
        void saveLevelProgress(map);
        useGameStore.setState({ levelProgressMap: map });
        setLockRevision((n) => n + 1);
      }
    }, [])
  );

  const totalLevels = getTotalLevels();
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  const handleSelectLevel = (id: number) => {
    const isUnlocked = !isLevelLocked(levelProgressMap, id);

    if (isUnlocked) {
      startLevel(id);
      navigation.replace('Gameplay');
      return;
    }

    if (isCheckpointLevel(id)) {
      const gate = getCheckpointGateProgress(levelProgressMap, id);
      if (gate) {
        setCheckpointGate(gate);
        return;
      }
    }

    Alert.alert('🔒 Level Locked', `Complete Level ${id - 1} to unlock.`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />
      <GameHeader
        title="Select Level"
        showBack={true}
        onBack={() => navigation.goBack()}
        onSettings={() => setSettingsVisible(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {levels.map((levelId) => {
            const progress = levelProgressMap.get(levelId);
            const isUnlocked = !isLevelLocked(levelProgressMap, levelId);
            const stars = progress?.starsEarned || 0;
            const isCompleted = progress?.isCompleted || false;
            const isStarGate = !isUnlocked && isCheckpointLevel(levelId);

            return (
              <LevelBoxButton
                key={levelId}
                levelId={levelId}
                isUnlocked={isUnlocked}
                isCompleted={isCompleted}
                stars={stars}
                isStarGate={isStarGate}
                starGateRequired={isStarGate ? getCheckpointRequiredStars(levelId) : 0}
                onPress={() => handleSelectLevel(levelId)}
              />
            );
          })}
        </View>
      </ScrollView>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />

      <CheckpointLockModal
        visible={checkpointGate !== null}
        gate={checkpointGate}
        onClose={() => setCheckpointGate(null)}
      />
    </SafeAreaView>
  );
}

function LevelBoxButton({
  levelId,
  isUnlocked,
  isCompleted,
  stars,
  isStarGate,
  starGateRequired,
  onPress
}: {
  levelId: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  stars: number;
  isStarGate: boolean;
  starGateRequired: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.91, { damping: 10, stiffness: 350 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 350 });
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.levelBox,
          isUnlocked ? styles.levelBoxUnlocked : styles.levelBoxLocked,
          isCompleted && styles.levelBoxCompleted,
          animatedStyle
        ]}
      >
        {isUnlocked ? (
          <>
            <Text style={styles.levelNumber}>{levelId}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3].map((s) => (
                <Text key={s} style={styles.starChar}>
                  {s <= stars ? '⭐' : '☆'}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.lockedContent}>
            <Ionicons name="lock-closed" size={16} color="#9A8575" style={styles.lockIcon} />
            <Text style={styles.lockedLevelNum}>{levelId}</Text>
            {isStarGate && starGateRequired > 0 && (
              <View style={styles.gateBadge}>
                <Text style={styles.gateBadgeText}>{starGateRequired}</Text>
                <Text style={styles.gateBadgeStar}>★</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center'
  },
  levelBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm
  },
  levelBoxUnlocked: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(106, 68, 40, 0.25)'
  },
  levelBoxLocked: {
    backgroundColor: '#E8E0D4',
    borderColor: 'rgba(106, 68, 40, 0.14)',
    overflow: 'hidden'
  },
  levelBoxCompleted: {
    borderColor: '#FFD54F',
    borderWidth: 2
  },
  levelNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    lineHeight: 30
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 1
  },
  starChar: {
    fontSize: 13
  },
  lockedContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 4
  },
  lockIcon: {
    marginBottom: 2,
    opacity: 0.85
  },
  lockedLevelNum: {
    fontSize: 24,
    fontWeight: '900',
    color: '#8B7355',
    lineHeight: 28
  },
  gateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(106, 68, 40, 0.14)'
  },
  gateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6A4428'
  },
  gateBadgeStar: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C9A227',
    marginLeft: 2
  }
});
