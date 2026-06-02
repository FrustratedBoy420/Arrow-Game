import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';

import { audioManager } from './src/utils/audio';
import { initializeLevelManagement } from './src/systems/levelManagementInit';

import { FailScreen } from './src/screens/FailScreen';
import { GameplayScreen } from './src/screens/GameplayScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LevelSelectScreen } from './src/screens/LevelSelectScreen';
import { MultiplayerScreen } from './src/screens/MultiplayerScreen';
import { TutorialScreen } from './src/screens/TutorialScreen';
import { VictoryScreen } from './src/screens/VictoryScreen';
import { theme } from './src/theme/theme';

export type RootStackParamList = {
  Home: undefined;
  Tutorial: undefined;
  Gameplay: undefined;
  LevelSelect: undefined;
  Victory: undefined;
  Fail: undefined;
  Multiplayer: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import { registerUserProfile } from './src/utils/userRegistration';

// Removed SplashScreen import and usage as the package is missing
// import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding until we finish loading resources
// SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await audioManager.init();
        await initializeLevelManagement();
        await registerUserProfile();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        // await SplashScreen.hideAsync();
      }
    };
    void prepare();
  }, []);


  if (!appIsReady) {
    return null;
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
