import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import { ArrowSkinPreview } from '../components/ArrowSkinPreview';
import { ARROW_SKINS, BOOSTER_ITEMS, ArrowSkin, BoosterItem } from '../config/skins';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';
import { AdBanner } from '../components/AdBanner';

const BOOSTER_IMAGE_MAP: Record<string, any> = {
  extra_hints: require('../../assets/boosters/hint.png'),
  extra_undos: require('../../assets/boosters/undo.png'),
  extra_lives: require('../../assets/boosters/shield.png')
};

type TabType = 'skins' | 'boosters';

export function ShopScreen() {
  const navigation = useNavigation<AppNavigation>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<TabType>('skins');

  const coins = useGameStore((s) => s.coins);
  const activeSkinId = useGameStore((s) => s.activeSkinId);
  const ownedSkins = useGameStore((s) => s.ownedSkins);
  const inventory = useGameStore((s) => s.inventory);
  const highestUnlockedLevel = useGameStore((s) => s.highestUnlockedLevel);
  const isAdmin = useGameStore((s) => !!s.iconsConfig?.unlockAllLevels);
  const buySkin = useGameStore((s) => s.buySkin);
  const equipSkin = useGameStore((s) => s.equipSkin);
  const buyBooster = useGameStore((s) => s.buyBooster);

  const handleSkinAction = (skin: ArrowSkin) => {
    if (activeSkinId === skin.id) return;

    if (ownedSkins.includes(skin.id)) {
      equipSkin(skin.id);
      return;
    }

    const res = buySkin(skin.id);
    if (!res.success) {
      Alert.alert('Cannot Purchase', res.message || 'Not enough coins!');
    }
  };

  const handleBoosterBuy = (item: BoosterItem) => {
    const res = buyBooster(item);
    if (!res.success) {
      Alert.alert('Cannot Purchase', res.message || 'Not enough coins!');
    } else {
      Alert.alert('Purchased!', `Added ${item.name} to your inventory.`);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 4 : 20 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.arrowStroke} />
        </Pressable>

        <Text style={styles.headerTitle}>🛍️ Arrow Emporium</Text>

        <View style={styles.coinBadge}>
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.coinText}>{coins}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === 'skins' && styles.tabButtonActive]}
          onPress={() => setActiveTab('skins')}
        >
          <Text style={[styles.tabText, activeTab === 'skins' && styles.tabTextActive]}>
            🏹 Skins
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'boosters' && styles.tabButtonActive]}
          onPress={() => setActiveTab('boosters')}
        >
          <Text style={[styles.tabText, activeTab === 'boosters' && styles.tabTextActive]}>
            ⚡ Boosters
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'skins' ? (
          <FlatList
            key="skins-grid"
            data={ARROW_SKINS}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isEquipped = activeSkinId === item.id;
              const isOwned = ownedSkins.includes(item.id);
              const isLockedByLevel =
                !isAdmin && !!item.unlockLevelReq && highestUnlockedLevel < item.unlockLevelReq;

              return (
                <SkinCard
                  skin={item}
                  isEquipped={isEquipped}
                  isOwned={isOwned}
                  isLockedByLevel={isLockedByLevel}
                  onPress={() => handleSkinAction(item)}
                />
              );
            }}
          />
        ) : (
          <FlatList
            key="boosters-list"
            data={BOOSTER_ITEMS}
            keyExtractor={(item) => item.id}
            numColumns={1}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              let count = 0;
              if (item.id === 'extra_hints') count = inventory.extraHints;
              else if (item.id === 'extra_undos') count = inventory.extraUndos;
              else if (item.id === 'extra_lives') count = inventory.extraLives;

              return (
                <BoosterCard
                  item={item}
                  ownedCount={count}
                  canAfford={coins >= item.price}
                  onBuy={() => handleBoosterBuy(item)}
                />
              );
            }}
          />
        )}
      </View>

      <AdBanner />
    </SafeAreaView>
  );
}

function getTierBg(tier: ArrowSkin['tier']) {
  switch (tier) {
    case 'MYTHIC': return 'rgba(0, 230, 118, 0.2)';
    case 'LEGENDARY': return 'rgba(213, 0, 249, 0.2)';
    case 'EPIC': return 'rgba(255, 215, 0, 0.2)';
    case 'RARE': return 'rgba(0, 229, 255, 0.2)';
    default: return 'rgba(121, 85, 72, 0.15)';
  }
}

function getTierTextColor(tier: ArrowSkin['tier']) {
  switch (tier) {
    case 'MYTHIC': return '#00C853';
    case 'LEGENDARY': return '#AA00FF';
    case 'EPIC': return '#FF8F00';
    case 'RARE': return '#0097A7';
    default: return '#5D4037';
  }
}

function SkinCard({
  skin,
  isEquipped,
  isOwned,
  isLockedByLevel,
  onPress
}: {
  skin: ArrowSkin;
  isEquipped: boolean;
  isOwned: boolean;
  isLockedByLevel: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 10, stiffness: 350 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 350 });
      }}
      onPress={onPress}
      style={styles.skinCardWrapper}
    >
      <Animated.View
        style={[
          styles.skinCard,
          isEquipped && styles.skinCardEquipped,
          animStyle
        ]}
      >
        {/* Tier Badge */}
        <View style={[styles.tierBadge, { backgroundColor: getTierBg(skin.tier) }]}>
          <Text style={[styles.tierText, { color: getTierTextColor(skin.tier) }]}>
            {skin.tier}
          </Text>
        </View>

        {/* Real Arrow Visual Graphic Preview */}
        <View style={styles.skinPreview}>
          <ArrowSkinPreview skin={skin} size={72} />
        </View>

        <Text style={styles.skinName}>{skin.name}</Text>
        <Text style={styles.skinDesc} numberOfLines={2}>
          {skin.description}
        </Text>

        <View style={styles.skinActionArea}>
          {isEquipped ? (
            <View style={styles.equippedBadge}>
              <Text style={styles.equippedText}>✓ EQUIPPED</Text>
            </View>
          ) : isOwned ? (
            <View style={styles.equipBtn}>
              <Text style={styles.equipBtnText}>EQUIP</Text>
            </View>
          ) : isLockedByLevel ? (
            <View style={styles.lockedBtn}>
              <Text style={styles.lockedBtnText}>🔒 Lvl {skin.unlockLevelReq}+</Text>
            </View>
          ) : (
            <View style={styles.buyBtn}>
              <Text style={styles.buyBtnText}>{skin.price} 🪙</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

function BoosterCard({
  item,
  ownedCount,
  canAfford,
  onBuy
}: {
  item: BoosterItem;
  ownedCount: number;
  canAfford: boolean;
  onBuy: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View style={styles.boosterCard}>
      <View style={styles.boosterLeft}>
        <View style={styles.boosterIconContainer}>
          {BOOSTER_IMAGE_MAP[item.id] ? (
            <Image
              source={BOOSTER_IMAGE_MAP[item.id]}
              style={styles.booster3DImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.boosterIcon}>{item.icon}</Text>
          )}
        </View>
        <View style={styles.boosterInfo}>
          <Text style={styles.boosterName}>{item.name}</Text>
          <Text style={styles.boosterDesc}>{item.description}</Text>
          <Text style={styles.boosterOwned}>In Inventory: {ownedCount}</Text>
        </View>
      </View>

      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.94, { damping: 10, stiffness: 350 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 10, stiffness: 350 });
        }}
        onPress={onBuy}
      >
        <Animated.View
          style={[
            styles.boosterBuyBtn,
            !canAfford && styles.boosterBuyBtnDisabled,
            animStyle
          ]}
        >
          <Text style={styles.boosterBuyText}>{item.price} 🪙</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 22,
    ...theme.shadows.sm
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    ...theme.shadows.sm
  },
  coinEmoji: { fontSize: 18, marginRight: 6 },
  coinText: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(106, 68, 40, 0.1)'
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12
  },
  tabButtonActive: {
    backgroundColor: theme.colors.arrowStroke,
    ...theme.shadows.sm
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMuted
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '800'
  },

  content: {
    flex: 1
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  columnWrapper: {
    justifyContent: 'space-between'
  },

  skinCardWrapper: {
    width: '48%',
    marginBottom: 14
  },
  skinCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(106, 68, 40, 0.12)',
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    ...theme.shadows.md
  },
  skinCardEquipped: {
    borderColor: '#FFD700',
    borderWidth: 2.5,
    backgroundColor: '#FFFDF5',
    ...theme.shadows.lg
  },
  tierBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  tierText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  skinPreview: {
    width: 78,
    height: 78,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4
  },
  skinName: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    marginBottom: 2,
    textAlign: 'center'
  },
  skinDesc: {
    fontSize: 10.5,
    fontWeight: '500',
    color: theme.colors.textMuted,
    textAlign: 'center',
    height: 28,
    marginBottom: 8
  },
  skinActionArea: {
    width: '100%'
  },
  equippedBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 7,
    alignItems: 'center'
  },
  equippedText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '900'
  },
  equipBtn: {
    backgroundColor: '#FFF',
    borderColor: theme.colors.arrowStroke,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 7,
    alignItems: 'center'
  },
  equipBtnText: {
    color: theme.colors.arrowStroke,
    fontSize: 11,
    fontWeight: '800'
  },
  lockedBtn: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderColor: 'rgba(0,0,0,0.12)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 7,
    alignItems: 'center'
  },
  lockedBtnText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  buyBtn: {
    backgroundColor: theme.colors.arrowStroke,
    borderRadius: 14,
    paddingVertical: 7,
    alignItems: 'center',
    ...theme.shadows.sm
  },
  buyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900'
  },

  boosterCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderColor: 'rgba(106, 68, 40, 0.12)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.sm
  },
  boosterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  boosterIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E1B18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFD54F',
    ...theme.shadows.md
  },
  booster3DImage: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  boosterIcon: {
    fontSize: 24
  },
  boosterInfo: {
    flex: 1
  },
  boosterName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },
  boosterDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2
  },
  boosterOwned: {
    fontSize: 11,
    fontWeight: '700',
    color: '#43A047',
    marginTop: 4
  },
  boosterBuyBtn: {
    backgroundColor: theme.colors.arrowStroke,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    ...theme.shadows.sm
  },
  boosterBuyBtnDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.6
  },
  boosterBuyText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900'
  }
});
