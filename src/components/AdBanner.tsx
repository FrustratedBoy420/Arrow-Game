import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const bannerAdUnitId = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      android: 'ca-app-pub-2101586602209482/8247764481', // Production Android banner ad unit ID
      ios: 'ca-app-pub-3940256099942544/2934735716',     // Google official test ID (replace with production iOS unit ID)
      default: TestIds.BANNER,
    });

export function AdBanner() {
  const [adLoaded, setAdLoaded] = useState(true);

  if (!adLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={bannerAdUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(err) => {
          console.warn('❌ Banner ad failed to load:', err);
          setAdLoaded(false);
        }}
        onAdLoaded={() => {
          console.log('✅ Banner ad loaded successfully');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
});
