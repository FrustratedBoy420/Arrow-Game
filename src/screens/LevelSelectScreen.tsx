import { useNavigation } from '@react-navigation/native';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GameHeader } from '../components/GameHeader';
import { getLevel, getTotalLevels } from '../levels/levels';
import { useGameStore } from '../state/gameStore';
import { difficultyColor, theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';

export function LevelSelectScreen() {
  const navigation = useNavigation<AppNavigation>();
  const highestUnlockedLevel = useGameStore((state) => state.highestUnlockedLevel);
  const startLevel = useGameStore((state) => state.startLevel);

  const totalLevels = getTotalLevels();
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  const handleSelectLevel = (id: number) => {
    if (id <= highestUnlockedLevel) {
      startLevel(id);
      navigation.replace('Gameplay');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <GameHeader
        title="Select Level"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {levels.map((levelId) => {
            const isUnlocked = levelId <= highestUnlockedLevel;
            const difficulty = getLevel(levelId).difficulty;
            const color = isUnlocked ? difficultyColor[difficulty] : theme.colors.levelLocked;
            
            return (
              <Pressable
                key={levelId}
                style={[
                  styles.levelBox,
                  { borderColor: isUnlocked ? color : theme.colors.levelLocked },
                  !isUnlocked && styles.levelBoxLocked
                ]}
                onPress={() => handleSelectLevel(levelId)}
              >
                <Text style={[styles.levelNumber, { color: isUnlocked ? color : '#FFF' }]}>
                  {levelId}
                </Text>
                {isUnlocked && (
                  <View style={[styles.badge, { backgroundColor: color }]}>
                    <Text style={styles.badgeText}>{difficulty[0]}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  levelBox: {
    width: 72,
    height: 72,
    borderWidth: 3,
    borderRadius: 16,
    backgroundColor: theme.colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  levelBoxLocked: {
    backgroundColor: theme.colors.levelLocked,
  },
  levelNumber: {
    fontSize: 26,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  }
});
