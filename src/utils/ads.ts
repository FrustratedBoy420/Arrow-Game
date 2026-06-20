import { Platform } from 'react-native';
import { useGameStore } from '../state/gameStore';

let mobileAds: any = null;
let InterstitialAdClass: any = null;
let AdEventType: any = null;
let TestIds: any = {
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
};
let isAdMobAvailable = false;

try {
  const ads = require('react-native-google-mobile-ads');
  mobileAds = ads.default;
  InterstitialAdClass = ads.InterstitialAd;
  AdEventType = ads.AdEventType;
  TestIds = ads.TestIds;
  isAdMobAvailable = true;
} catch (error) {
  console.log('⚠️ react-native-google-mobile-ads is not supported in Expo Go. Ads are disabled.');
}

class AdManager {
  private interstitial: any = null;
  private isAdLoading = false;
  private isInitialized = false;

  async initialize() {
    if (!isAdMobAvailable) {
      return;
    }
    if (this.isInitialized) return;
    try {
      const adapterStatuses = await mobileAds().initialize();
      console.log('✨ Google Mobile Ads SDK Initialized!', adapterStatuses);
      this.isInitialized = true;
      this.loadInterstitial();
    } catch (error) {
      console.warn('❌ Failed to initialize Google Mobile Ads SDK:', error);
    }
  }

  loadInterstitial() {
    if (!isAdMobAvailable) return;

    // Check if ads are enabled dynamically
    const adsConfig = useGameStore.getState().adsConfig;
    if (!adsConfig || !adsConfig.showAds) {
      console.log('Ads are disabled globally via config.');
      this.interstitial = null;
      return;
    }

    if (this.isAdLoading || (this.interstitial && this.interstitial.loaded)) {
      return;
    }

    this.isAdLoading = true;
    console.log('🔄 Loading Interstitial Ad...');

    try {
      // Dynamic selection of unitId: Google Test IDs in dev, backend real IDs in preview/release
      const interstitialAdUnitId = __DEV__
        ? TestIds.INTERSTITIAL
        : Platform.OS === 'android'
          ? adsConfig.androidInterstitial
          : adsConfig.iosInterstitial;

      // Create a new instance
      const interstitial = InterstitialAdClass.createForAdRequest(interstitialAdUnitId, {
        requestNonPersonalizedAdsOnly: true, // Configured for privacy laws (GDPR/CCPA compliant)
      });

      const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log('✅ Interstitial Ad Loaded');
        this.isAdLoading = false;
        this.interstitial = interstitial;
      });

      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('❌ Interstitial Ad failed to load:', error);
        this.isAdLoading = false;
        this.interstitial = null;
        // Retry loading after 15 seconds
        setTimeout(() => this.loadInterstitial(), 15000);
      });

      interstitial.load();
    } catch (error) {
      console.warn('❌ Exception while loading Interstitial Ad:', error);
      this.isAdLoading = false;
    }
  }

  showInterstitial(onClose: () => void) {
    if (!isAdMobAvailable || !this.isInitialized) {
      onClose();
      return;
    }

    // Check if ads are enabled dynamically
    const adsConfig = useGameStore.getState().adsConfig;
    if (!adsConfig || !adsConfig.showAds) {
      console.log('Ads are disabled globally via config. Skipping interstitial.');
      onClose();
      return;
    }

    if (this.interstitial && this.interstitial.loaded) {
      console.log('📺 Showing Interstitial Ad...');
      
      try {
        const unsubscribeDismissed = this.interstitial.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            console.log('🚪 Interstitial Ad Closed');
            unsubscribeDismissed();
            this.interstitial = null;
            onClose();
            // Preload the next ad
            this.loadInterstitial();
          }
        );

        this.interstitial.show().catch((err: any) => {
          console.warn('❌ Failed to show interstitial ad:', err);
          this.interstitial = null;
          onClose();
          this.loadInterstitial();
        });
      } catch (error) {
        console.warn('❌ Exception while showing Interstitial Ad:', error);
        this.interstitial = null;
        onClose();
        this.loadInterstitial();
      }
    } else {
      onClose();
      // Try to load again
      this.loadInterstitial();
    }
  }
}

export const adManager = new AdManager();


