import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { theme } from '../theme/theme';
import { AmbientBackground } from '../components/AmbientBackground';
import { useGameStore } from '../state/gameStore';
import { AdBanner } from '../components/AdBanner';


type PrivacyPolicyModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Privacy Policy</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.sectionTitle}>1. Data We Collect</Text>
            <Text style={styles.paragraph}>
              We only collect a randomly generated anonymous System ID on your device to track your game progress, stars, unlocked levels, and multiplayer outcomes.
            </Text>

            <Text style={styles.sectionTitle}>2. Data We Do NOT Collect</Text>
            <Text style={styles.paragraph}>
              We do not collect any personal information. We do not ask for or store your name, email, phone number, contacts, or device-specific hardware metadata.
            </Text>

            <Text style={styles.sectionTitle}>3. Storage & Third-Parties</Text>
            <Text style={styles.paragraph}>
              Your progress is saved securely on our servers and is automatically deleted after 30 days of inactivity. We use Pusher for real-time multiplayer coordination (no personal data is shared).
            </Text>
          </ScrollView>

          <Pressable style={styles.modalAcceptBtn} onPress={onClose}>
            <Text style={styles.modalAcceptText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type TermsScreenProps = {
  onAccept: () => void;
  onReject: () => void;
};
export function TermsScreen({ onAccept, onReject }: TermsScreenProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const openDetailedTerms = async () => {
    const versionConfig = useGameStore.getState().versionConfig;
    const url = versionConfig?.termsUrl || 'https://arrow-game-terms-policies.vercel.app/';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn(`Cannot open URL: ${url}`);
      }
    } catch (err) {
      console.warn(`Error opening URL: ${err}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Terms & Consent</Text>
          <Text style={styles.cardText}>
            We use an anonymous System ID to save your progress. By continuing, you agree to our{' '}
            <Text style={styles.linkTextInline} onPress={() => setModalVisible(true)}>
              Privacy Policy
            </Text>{' '}
            and{' '}
            <Text style={styles.linkTextInline} onPress={openDetailedTerms}>
              Terms & Conditions
            </Text>
            .
          </Text>

          <View style={styles.buttonRow}>
            <Pressable style={styles.declineBtnSmall} onPress={onReject}>
              <Text style={styles.declineBtnTextSmall}>Decline</Text>
            </Pressable>
            <Pressable style={styles.acceptBtnSmall} onPress={onAccept}>
              <Text style={styles.acceptBtnTextSmall}>Accept</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <PrivacyPolicyModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  linkTextInline: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  declineBtnSmall: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D32F2F',
    backgroundColor: 'transparent',
  },
  declineBtnTextSmall: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '700',
  },
  acceptBtnSmall: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.arrowStroke,
    ...theme.shadows.sm,
  },
  acceptBtnTextSmall: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.bgPrimary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 34,
    height: '75%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 22,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  modalAcceptBtn: {
    backgroundColor: theme.colors.arrowStroke,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  modalAcceptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
