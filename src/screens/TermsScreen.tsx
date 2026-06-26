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
        {/* Decorative arrow matching HomeScreen */}
        <View style={styles.arrowDeco}>
          <Text style={styles.arrowIcon}>➤</Text>
        </View>

        <Text style={styles.title}>ArrowVerse{'\n'}Multiplayer</Text>
        <Text style={styles.subtitle}>Think · Tap · Escape</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Terms & Consent</Text>
          <Text style={styles.cardText}>
            We only use an anonymous System ID to save your level progress. No personal data is ever collected or tracked.
          </Text>

          <View style={styles.linksRow}>
            <Pressable
              style={styles.linkButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.linkDivider}>|</Text>
            <Pressable
              style={styles.linkButton}
              onPress={openDetailedTerms}
            >
              <Text style={styles.linkText}>Terms & Conditions</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.acceptBtn} onPress={onAccept}>
          <Text style={styles.acceptBtnText}>Accept & Play</Text>
        </Pressable>

        <Pressable style={styles.declineBtn} onPress={onReject}>
          <Text style={styles.declineBtnText}>Decline & Exit</Text>
        </Pressable>
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
  arrowDeco: {
    marginBottom: 10,
  },
  arrowIcon: {
    fontSize: 48,
    color: theme.colors.arrowStroke,
    opacity: 0.6,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...theme.shadows.md,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8
  },
  linkDivider: {
    color: theme.colors.textMuted,
    fontSize: 14,
    opacity: 0.5
  },
  linkButton: {
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  acceptBtn: {
    backgroundColor: theme.colors.arrowStroke,
    width: 250,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  acceptBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  declineBtn: {
    marginTop: 12,
    width: 250,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D32F2F',
    backgroundColor: 'transparent',
  },
  declineBtnText: {
    color: '#D32F2F',
    fontSize: 16,
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
