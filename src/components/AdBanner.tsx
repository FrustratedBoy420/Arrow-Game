import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useGameStore } from '../state/gameStore';

let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
};
let isAdMobAvailable = false;

try {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
  isAdMobAvailable = true;
} catch (error) {
  console.log('⚠️ react-native-google-mobile-ads is not supported in Expo Go. Ads are disabled.');
}

export function AdBanner() {
  const [adLoaded, setAdLoaded] = useState(true);
  const adsConfig = useGameStore((state) => state.adsConfig);

  if (!isAdMobAvailable || !adLoaded || !adsConfig || !adsConfig.showAds) {
    return null;
  }

  // Dynamic selection of unitId: Google Test IDs in dev, backend real IDs in preview/release
  const bannerAdUnitId = __DEV__
    ? TestIds.BANNER
    : Platform.OS === 'android'
      ? adsConfig.androidBanner
      : adsConfig.iosBanner;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={bannerAdUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(err: any) => {
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

