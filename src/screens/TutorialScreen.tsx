import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AmbientBackground } from '../components/AmbientBackground';
import { GameHeader } from '../components/GameHeader';
import { SettingsModal } from '../components/SettingsModal';
import { HintBubble } from '../components/HintBubble';
import { PuzzleBoardCanvas } from '../components/PuzzleBoardCanvas';
import { createInitialBoard } from '../game/engine';
import { getLevel, LOADING_LEVEL } from '../levels/levels';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';

// TutorialScreen is always Level 1 — resolved lazily so we don't crash
// when level.json is empty (levels come from DB on first fetch).

export function TutorialScreen() {
  const navigation = useNavigation<AppNavigation>();
  const completeTutorial = useGameStore((state) => state.completeTutorial);
  const storeBoard = useGameStore((state) => state.board);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(width * 0.44, 220);

  // Use level 1 from DB if loaded, otherwise fall back to the current store board
  const level1 = getLevel(1);
  const tutorialBoard = level1 ? createInitialBoard(level1) : storeBoard;

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />
      <GameHeader
        title="Level 1"
        showBack={false}
        onSettings={() => setSettingsVisible(true)}
      />
      <View style={styles.content}>
        <HintBubble text="Tap an arrow" />
        <View style={styles.boardRow}>
          <PuzzleBoardCanvas
            board={tutorialBoard}
            width={boardWidth}
            exitingArrows={[]}
            onExitDone={() => {}}
            onArrowPress={() => {
              completeTutorial();
              navigation.replace('Gameplay');
            }}
          />
          <Text style={styles.hand}>☝</Text>
        </View>
      </View>
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: 'transparent',
    flex: 1
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 180
  },
  boardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 48
  },
  hand: {
    color: theme.colors.arrowStroke,
    fontSize: 58,
    marginLeft: -6,
    marginTop: 48,
    transform: [{ rotate: '-25deg' }]
  }
});
