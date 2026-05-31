import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface Props {
  size?: number;
  color?: string;
}

export default function GearIcon({ size = 24, color = '#6A4428' }: Props) {
  return (
    <Text style={[styles.icon, { fontSize: size, color }]}>
      ⚙️
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
