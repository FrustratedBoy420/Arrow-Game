import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export async function playCorrectFeedback(soundEnabled: boolean) {
  if (!soundEnabled) {
    return;
  }

  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
}

export async function playWrongFeedback(hapticsEnabled: boolean) {
  if (hapticsEnabled) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}
