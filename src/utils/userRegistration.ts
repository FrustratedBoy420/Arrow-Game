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

    let savedUrl = await AsyncStorage.getItem('multiplayer_url');
    if (savedUrl && savedUrl.includes('arrow-game-backend.vercel.app')) {
      savedUrl = 'https://arrow-game-be.vercel.app';
      await AsyncStorage.setItem('multiplayer_url', savedUrl);
    }
    let baseUrl = savedUrl?.trim() || 'https://arrow-game-be.vercel.app';
    baseUrl = baseUrl.replace(/\/$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    const profileName = await AsyncStorage.getItem('user_profile_name') || 'Guest';

    // 1. Send profile registration to backend (systemId, name, os, osVersion)
    const payload = {
      systemId,
      name: profileName,
      os: Platform.OS,
      osVersion: String(Platform.Version),
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

      if (allLevelsUnlocked) {
        // Admin: always fetch ALL levels from DB — initial 20-batch is not enough
        console.log('👑 Admin access detected — fetching all levels from DB...');
        useGameStore.getState().fetchAllLevelsForAdmin();
      }
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
    let savedPusherKey = await AsyncStorage.getItem('multiplayer_pusher_key');
    if (!savedPusherKey || savedPusherKey.trim() === '1d9ae595090f679858b4') {
      savedPusherKey = 'f9b17011ec538bf95e08';
      await AsyncStorage.setItem('multiplayer_pusher_key', savedPusherKey);
    }
    const keyToUse = savedPusherKey.trim();

    let savedPusherCluster = await AsyncStorage.getItem('multiplayer_pusher_cluster');
    if (!savedPusherCluster) {
      savedPusherCluster = 'ap2';
    }
    const clusterToUse = savedPusherCluster.trim();

    console.log(`📡 Connecting user Pusher for channel: user-${systemId} with key: ${keyToUse} and cluster: ${clusterToUse}`);
    const PusherConstructor: any = (Pusher as any).Pusher || Pusher;
    const pusher = new PusherConstructor(keyToUse, {
      cluster: clusterToUse,
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

      if (allLevelsUnlocked) {
        // Admin: always fetch ALL levels — initial 20-batch is not enough
        console.log('👑 Real-time admin grant — fetching all levels from DB...');
        useGameStore.getState().fetchAllLevelsForAdmin();
      }
    });

    // Listen to global configuration updates (e.g. version updates, assets, levels)
    const globalChannel = pusher.subscribe('global-config');
    globalChannel.bind('config_updated', (data: any) => {
      console.log('⚡ Received global config update event:', data);
      // Trigger config refresh in real-time
      useGameStore.getState().fetchGameConfig();
    });

  } catch (err) {
    console.error('❌ Failed to setup user Pusher listener:', err);
  }
}

export async function deleteUserAccount(): Promise<boolean> {
  try {
    const systemId = await AsyncStorage.getItem('game_system_id');
    if (!systemId) return false;

    let savedUrl = await AsyncStorage.getItem('multiplayer_url');
    if (savedUrl && savedUrl.includes('arrow-game-backend.vercel.app')) {
      savedUrl = 'https://arrow-game-be.vercel.app';
      await AsyncStorage.setItem('multiplayer_url', savedUrl);
    }
    let baseUrl = savedUrl?.trim() || 'https://arrow-game-be.vercel.app';
    baseUrl = baseUrl.replace(/\/$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    console.log('📡 Requesting account deletion for:', systemId);

    const response = await fetch(`${baseUrl}/api/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ systemId }),
    });

    if (response.ok) {
      console.log('✅ Account successfully deleted from backend.');
      
      // Clear local storage associated with the user
      await AsyncStorage.removeItem('game_system_id');
      await AsyncStorage.removeItem('user_profile_name');
      await AsyncStorage.removeItem('has_accepted_terms_v1');
      await AsyncStorage.removeItem('arrowverse-multiplayer-level-progress');
      await AsyncStorage.removeItem('arrowverse-multiplayer-all-levels-unlocked');
      
      // Reset the Zustand store progress and coins
      useGameStore.getState().resetAllProgress();
      useGameStore.setState({ coins: 0 });

      // Trigger redirection to terms and startup flow
      const resetApp = useGameStore.getState().resetAppFlow;
      if (resetApp) {
        resetApp();
      }

      return true;
    } else {
      console.warn('⚠️ Backend failed to delete user account, status:', response.status);
      return false;
    }
  } catch (err) {
    console.error('❌ Failed to delete account:', err);
    return false;
  }
}
