import * as Haptics from 'expo-haptics';
import { audioManager } from './audio';

export async function playCorrectFeedback(hapticsEnabled: boolean = false, comboCount: number = 1) {
  // Musical pitch escalation rate: 1.0 -> 1.12 -> 1.24 -> 1.36 -> 1.50 -> 1.60
  const rate = Math.min(1.60, 1.00 + Math.max(0, comboCount - 1) * 0.12);
  await audioManager.playSound('correct', rate);

  if (hapticsEnabled) {
    if (comboCount >= 5) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (comboCount >= 3) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (comboCount >= 2) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }
}

export async function playWrongFeedback(hapticsEnabled: boolean = false) {
  await audioManager.playSound('wrong', 1.0);
  if (hapticsEnabled) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}
