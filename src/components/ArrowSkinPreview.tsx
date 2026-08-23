import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowSkin } from '../config/skins';

type Props = {
  skin: ArrowSkin;
  size?: number;
};

const TIER_COLORS = {
  STARTER: '#A1887F',
  RARE: '#00E5FF',
  EPIC: '#FFD700',
  LEGENDARY: '#D500F9',
  MYTHIC: '#00E676'
};

export function ArrowSkinPreview({ skin, size = 96 }: Props) {
  const color = skin.strokeColor;
  const glow = skin.glowColor || 'rgba(255,255,255,0.2)';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          shadowColor: color,
        }
      ]}
    >
      {/* Background radiant aura */}
      <View style={[styles.aura, { backgroundColor: glow }]} />

      {/* Outer tech ring with tier accent */}
      <View style={[styles.ring, { borderColor: `${color}44` }]} />

      {/* Styled Arrow Graphic (Diagonal pointing top-right ↗) */}
      <View style={styles.arrowFrame}>
        {/* Glow copy behind for neon shine */}
        <View style={[styles.shaftGlow, { backgroundColor: glow }]} />

        {/* Arrow Shaft (Diagonal 45deg) */}
        <View style={[styles.shaft, { backgroundColor: color }]} />

        {/* Arrowhead Chevron Top Wing */}
        <View style={[styles.headWingTop, { backgroundColor: color }]} />

        {/* Arrowhead Chevron Bottom Wing */}
        <View style={[styles.headWingBottom, { backgroundColor: color }]} />

        {/* Arrowhead Tip Core */}
        <View style={[styles.headTip, { backgroundColor: color }]} />

        {/* Arrow Tail Fletching 1 */}
        <View style={[styles.tailWing1, { backgroundColor: color }]} />

        {/* Arrow Tail Fletching 2 */}
        <View style={[styles.tailWing2, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8
  },
  aura: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 40,
    opacity: 0.35,
    transform: [{ scale: 1.1 }]
  },
  ring: {
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: 50,
    borderWidth: 1.5,
    borderStyle: 'dashed'
  },
  arrowFrame: {
    width: 54,
    height: 54,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  shaftGlow: {
    position: 'absolute',
    width: 36,
    height: 8,
    borderRadius: 4,
    transform: [{ rotate: '-45deg' }]
  },
  shaft: {
    position: 'absolute',
    width: 34,
    height: 4.5,
    borderRadius: 3,
    transform: [{ rotate: '-45deg' }]
  },
  headTip: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3
  },
  headWingTop: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 15,
    height: 4.5,
    borderRadius: 2.5,
    transform: [{ rotate: '45deg' }]
  },
  headWingBottom: {
    position: 'absolute',
    top: 19,
    right: 8,
    width: 15,
    height: 4.5,
    borderRadius: 2.5,
    transform: [{ rotate: '-135deg' }]
  },
  tailWing1: {
    position: 'absolute',
    bottom: 12,
    left: 8,
    width: 10,
    height: 3.5,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }]
  },
  tailWing2: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    width: 10,
    height: 3.5,
    borderRadius: 2,
    transform: [{ rotate: '-135deg' }]
  }
});
