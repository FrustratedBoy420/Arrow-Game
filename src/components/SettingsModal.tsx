import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useGameStore } from '../state/gameStore';
import { CURRENT_APP_VERSION } from '../config/version';
import { theme } from '../theme/theme';
import { PrivacyPolicyModal } from '../screens/TermsScreen';
import { deleteUserAccount } from '../utils/userRegistration';

type Props = {
  visible: boolean;
  onClose: () => void;
  onRestart?: () => void;
};

export function SettingsModal({ visible, onClose, onRestart }: Props) {
  const { soundEnabled, hapticsEnabled, musicEnabled, toggleSound, toggleHaptics, toggleMusic } = useGameStore();
  const [privacyVisible, setPrivacyVisible] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'Are you sure you want to delete your account? This will permanently delete your progress and database records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteUserAccount();
            if (success) {
              Alert.alert('Success', 'Your account and data have been successfully deleted.');
              onClose();
            } else {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
            
            <Text style={styles.title}>Settings</Text>

            <View style={styles.settingsGroup}>
              <View style={styles.settingRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="volume-medium-outline" size={22} color={theme.colors.textMuted} style={styles.icon} />
                  <Text style={styles.settingLabel}>Sound</Text>
                </View>
                <Switch 
                  value={soundEnabled} 
                  onValueChange={toggleSound} 
                  trackColor={{ false: theme.colors.borderSoft, true: theme.colors.arrowStroke }}
                />
              </View>
              <View style={styles.settingRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="phone-portrait-outline" size={22} color={theme.colors.textMuted} style={styles.icon} />
                  <Text style={styles.settingLabel}>Vibration</Text>
                </View>
                <Switch 
                  value={hapticsEnabled} 
                  onValueChange={toggleHaptics} 
                  trackColor={{ false: theme.colors.borderSoft, true: theme.colors.arrowStroke }}
                />
              </View>
              <View style={styles.settingRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="musical-notes-outline" size={22} color={theme.colors.textMuted} style={styles.icon} />
                  <Text style={styles.settingLabel}>Music</Text>
                </View>
                <Switch 
                  value={musicEnabled} 
                  onValueChange={toggleMusic} 
                  trackColor={{ false: theme.colors.borderSoft, true: theme.colors.arrowStroke }}
                />
              </View>

              {/* Privacy Policy Link */}
              <Pressable 
                style={styles.settingRow} 
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    setPrivacyVisible(true);
                  }, 350);
                }}
              >
                <View style={styles.labelContainer}>
                  <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.textMuted} style={styles.icon} />
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={theme.colors.textMuted} />
              </Pressable>

              {/* Dynamic Terms & Conditions Link */}
              <Pressable 
                style={styles.settingRow} 
                onPress={async () => {
                  onClose();
                  const versionConfig = useGameStore.getState().versionConfig;
                  const url = versionConfig?.termsUrl || 'https://arrow-game-backend.vercel.app/terms-and-conditions';
                  try {
                    await Linking.openURL(url);
                  } catch (err) {
                    console.warn(`Failed to open terms URL: ${err}`);
                  }
                }}
              >
                <View style={styles.labelContainer}>
                  <Ionicons name="document-text-outline" size={22} color={theme.colors.textMuted} style={styles.icon} />
                  <Text style={styles.settingLabel}>Terms & Conditions</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={theme.colors.textMuted} style={{ opacity: 0.7 }} />
              </Pressable>

              {/* Delete Account */}
              <Pressable 
                style={styles.settingRow} 
                onPress={handleDeleteAccount}
              >
                <View style={styles.labelContainer}>
                  <Ionicons name="trash-outline" size={22} color="#D32F2F" style={styles.icon} />
                  <Text style={[styles.settingLabel, { color: '#D32F2F' }]}>Delete Account</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color="#D32F2F" />
              </Pressable>
            </View>

            {onRestart && (
              <Pressable style={styles.restartButton} onPress={onRestart}>
                <Text style={styles.restartText}>Restart</Text>
              </Pressable>
            )}

            {/* App version badge */}
            <View style={styles.versionBadge}>
              <Ionicons name="information-circle-outline" size={14} color={theme.colors.textMuted} style={{ marginRight: 5, opacity: 0.6 }} />
              <Text style={styles.versionText}>v{CURRENT_APP_VERSION}</Text>
            </View>
          </View>
        </View>
      </Modal>

      <PrivacyPolicyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  closeText: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  settingsGroup: {
    backgroundColor: 'rgba(230, 220, 210, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  restartButton: {
    backgroundColor: theme.colors.arrowStroke,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restartText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    opacity: 0.6,
    letterSpacing: 0.5,
  },
});
