import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
  visible: boolean;
  onSubmit: (name: string) => void;
};

export function ProfileNameModal({ visible, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handlePress = () => {
    if (!name.trim()) {
      setError('Please enter a valid name');
      return;
    }
    setError('');
    onSubmit(name.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Welcome to ArrowVerse!</Text>
          <Text style={styles.subtitle}>Enter your profile name to start playing and save your progress.</Text>
          
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Your Name"
            placeholderTextColor={theme.colors.textMuted + '80'}
            value={name}
            onChangeText={(val) => {
              setName(val);
              if (error) setError('');
            }}
            maxLength={18}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={styles.submitBtn} onPress={handlePress}>
            <Text style={styles.submitBtnText}>Let's Play</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(230, 220, 210, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    marginBottom: 10,
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginLeft: 4,
  },
  submitBtn: {
    backgroundColor: theme.colors.arrowStroke,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...theme.shadows.md,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
});
