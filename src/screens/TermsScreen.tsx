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
            <Text style={styles.sectionTitle}>1. Our Promise to You</Text>
            <Text style={styles.paragraph}>
              We promise that we will never steal your personal data, sell it, or engage in any harmful activity. Your privacy is our priority. Ham aapka koi bhi data nahi churayenge aur kuch harmful nahi karenge.
            </Text>

            <Text style={styles.sectionTitle}>2. What We Collect</Text>
            <Text style={styles.paragraph}>
              We only collect a randomly generated anonymous System ID on your device. This identifier is necessary to track your game progress, stars, unlocked levels, and multiplayer match outcomes.
            </Text>

            <Text style={styles.sectionTitle}>3. What We Do NOT Collect</Text>
            <Text style={styles.paragraph}>
              We do not collect any personal information. This means we do not ask for, collect, or store your name, email address, phone number, physical location, contacts, or device-specific hardware metadata.
            </Text>

            <Text style={styles.sectionTitle}>4. Data Storage & Deletion</Text>
            <Text style={styles.paragraph}>
              Your anonymous System ID and game progress are stored securely on our backend server database. If your profile remains inactive for more than 30 days, your record will be automatically deleted from our server.
            </Text>

            <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
            <Text style={styles.paragraph}>
              We use Pusher for real-time multiplayer connections. Pusher only routes real-time events based on your anonymous System ID and does not receive any personal identifiers.
            </Text>

            <Text style={styles.sectionTitle}>6. Contact & Changes</Text>
            <Text style={styles.paragraph}>
              We may update this policy periodically. The latest version will always be viewable from the game settings. If you have any questions, you can contact the developer.
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
    const url = versionConfig?.termsUrl || 'https://arrow-game-backend.vercel.app/terms-and-conditions';
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
            Welcome to ArrowVerse-Multiplayer! Before starting your journey, please accept our terms.
          </Text>
          <Text style={styles.cardTextHighlight}>
            We do not collect your personal data or track your device. We only use a basic anonymous System ID to save your level progress.
          </Text>

          <Pressable
            style={styles.linkButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.linkText}>Read detailed Privacy Policy</Text>
          </Pressable>

          <Pressable
            style={[styles.linkButton, { marginTop: 8 }]}
            onPress={openDetailedTerms}
          >
            <Text style={styles.linkText}>Detailed Terms & Conditions</Text>
          </Pressable>
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
    marginBottom: 32,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...theme.shadows.md,
    marginBottom: 32,
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
  cardTextHighlight: {
    fontSize: 14,
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 16,
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
