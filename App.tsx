import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { audioManager } from './src/utils/audio';
import { initializeLevelManagement } from './src/systems/levelManagementInit';

import { FailScreen } from './src/screens/FailScreen';
import { GameplayScreen } from './src/screens/GameplayScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LevelSelectScreen } from './src/screens/LevelSelectScreen';
import { MultiplayerScreen } from './src/screens/MultiplayerScreen';
import { TutorialScreen } from './src/screens/TutorialScreen';
import { VictoryScreen } from './src/screens/VictoryScreen';
import { TermsScreen } from './src/screens/TermsScreen';
import { theme } from './src/theme/theme';

import { useGameStore } from './src/state/gameStore';
import { CURRENT_APP_VERSION, isVersionOlder } from './src/config/version';
import { ForcedUpdateScreen } from './src/components/ForcedUpdateScreen';

export type RootStackParamList = {
  Home: undefined;
  Tutorial: undefined;
  Gameplay: undefined;
  LevelSelect: undefined;
  Victory: undefined;
  Fail: undefined;
  Multiplayer: { roomCode?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import { registerUserProfile } from './src/utils/userRegistration';

import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding until we finish loading resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const versionConfig = useGameStore((s) => s.versionConfig);

  const [appIsReady, setAppIsReady] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean | null>(null);

  useEffect(() => {
    const prepare = async () => {
      try {
        await audioManager.init();
        await initializeLevelManagement();

        // Check if terms and privacy policy have been accepted
        const acceptedValue = await AsyncStorage.getItem('has_accepted_terms_v1');
        const accepted = acceptedValue === 'true';
        setHasAcceptedTerms(accepted);

        if (accepted) {
          // Register user profile only after terms acceptance is verified
          await registerUserProfile();
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    };
    void prepare();
  }, []);

  const handleTermsAccept = async () => {
    try {
      await AsyncStorage.setItem('has_accepted_terms_v1', 'true');
      setHasAcceptedTerms(true);
      // Register profile immediately after acceptance
      await registerUserProfile();
    } catch (e) {
      console.warn(e);
    }
  };

  // Determine if a critical forced update is required
  const isForcedUpdateRequired = 
    versionConfig && 
    versionConfig.critical && 
    isVersionOlder(CURRENT_APP_VERSION, versionConfig.critical);

  if (isForcedUpdateRequired) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ForcedUpdateScreen 
          currentVersion={CURRENT_APP_VERSION} 
          requiredVersion={versionConfig!.critical} 
        />
      </GestureHandlerRootView>
    );
  }

  if (!appIsReady || hasAcceptedTerms === null) {
    return null;
  }

  // Display terms consent screen if not accepted yet
  if (!hasAcceptedTerms) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TermsScreen onAccept={handleTermsAccept} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor={theme.colors.bgPrimary} />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bgPrimary },
            animation: 'fade'
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Tutorial" component={TutorialScreen} />
          <Stack.Screen name="LevelSelect" component={LevelSelectScreen} />
          <Stack.Screen name="Gameplay" component={GameplayScreen} />
          <Stack.Screen name="Victory" component={VictoryScreen} />
          <Stack.Screen name="Fail" component={FailScreen} />
          <Stack.Screen name="Multiplayer" component={MultiplayerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
