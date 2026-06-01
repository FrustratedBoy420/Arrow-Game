import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Pusher from 'pusher-js';
import { useGameStore } from '../state/gameStore';
import { setAllLevelsUnlocked } from '../systems/levelManagementStore';

// Pusher instance for real-time level access updates
let userChannel: any = null;
let pusherInstance: Pusher | null = null;

export async function getOrCreateSystemId(): Promise<string> {
  let systemId = await AsyncStorage.getItem('game_system_id');
  if (!systemId) {
    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestampPart = Date.now().toString(36);
    systemId = `SYS-${randomPart.toUpperCase()}-${timestampPart.toUpperCase()}`;
    await AsyncStorage.setItem('game_system_id', systemId);
  }
  return systemId;
}

export async function registerUserProfile() {
  try {
    const systemId = await getOrCreateSystemId();
    const storeState = useGameStore.getState();
    const name = await AsyncStorage.getItem('multiplayer_name') || 'Guest';
    const highestLevel = storeState.highestUnlockedLevel;

    const savedUrl = await AsyncStorage.getItem('multiplayer_url');
    let baseUrl = savedUrl?.trim() || 'https://arrow-game-backend.vercel.app';
    baseUrl = baseUrl.replace(/\/$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    // 1. Send profile registration to backend
    const payload = {
      systemId,
      name,
      os: Platform.OS,
      osVersion: String(Platform.Version),
      highestUnlockedLevel: highestLevel
    };

    console.log('📡 Registering user profile:', payload);

    const response = await fetch(`${baseUrl}/api/register-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const resData = await response.json();
      console.log('✅ Registration response:', resData);
      
      const allLevelsUnlocked = !!resData.allLevelsUnlocked;
      setAllLevelsUnlocked(allLevelsUnlocked);
      
      // Update store value so that UI renders correctly if needed
      useGameStore.setState((state) => ({
        iconsConfig: {
          ...state.iconsConfig,
          unlockAllLevels: allLevelsUnlocked
        }
      }));
    } else {
      console.warn('⚠️ Failed to register user profile, status:', response.status);
    }

    // 2. Setup real-time Pusher listener for this user
    await setupUserPusherListener(systemId);

  } catch (err) {
    console.warn('❌ Failed to register user:', err);
  }
}

async function setupUserPusherListener(systemId: string) {
  if (pusherInstance) return; // Already setup

  try {
    const savedPusherKey = await AsyncStorage.getItem('multiplayer_pusher_key');
    const keyToUse = savedPusherKey?.trim() || '1d9ae595090f679858b4';

    console.log(`📡 Connecting user Pusher for channel: user-${systemId}`);
    const PusherConstructor: any = (Pusher as any).Pusher || Pusher;
    const pusher = new PusherConstructor(keyToUse, {
      cluster: 'ap2',
      forceTLS: true,
    });

    pusherInstance = pusher;

    const channel = pusher.subscribe(`user-${systemId}`);
    userChannel = channel;

    channel.bind('level_access_changed', (data: any) => {
      console.log('⚡ Received level access change event:', data);
      const allLevelsUnlocked = !!data.allLevelsUnlocked;
      setAllLevelsUnlocked(allLevelsUnlocked);
      
      // Update iconsConfig state to match
      useGameStore.setState((state) => ({
        iconsConfig: {
          ...state.iconsConfig,
          unlockAllLevels: allLevelsUnlocked
        }
      }));
    });

  } catch (err) {
    console.error('❌ Failed to setup user Pusher listener:', err);
  }
}
