import { Platform, AppState, AppStateStatus } from 'react-native';
import { useGameStore } from '../state/gameStore';

let mobileAds: any = null;
let InterstitialAdClass: any = null;
let AppOpenAdClass: any = null;
let AdEventType: any = null;
let TestIds: any = {
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
};
let isAdMobAvailable = false;

try {
  const ads = require('react-native-google-mobile-ads');
  mobileAds = ads.default;
  InterstitialAdClass = ads.InterstitialAd;
  AppOpenAdClass = ads.AppOpenAd;
  AdEventType = ads.AdEventType;
  TestIds = ads.TestIds;
  isAdMobAvailable = true;
} catch (error) {
  console.log('⚠️ react-native-google-mobile-ads is not supported in Expo Go. Ads are disabled.');
}

class AdManager {
  private interstitial: any = null;
  private appOpenAd: any = null;
  private isAdLoading = false;
  private isAppOpenAdLoading = false;
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
      
      // Load and show App Open ad at startup
      this.loadAndShowAppOpenAd();

      this.loadInterstitial();

      // Listen to AppState changes for foregrounding App Open Ads
      AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          console.log('App came to foreground, checking for App Open ad...');
          // Check if user is in active gameplay to avoid showing ad mid-game
          const state = useGameStore.getState();
          const isSingleplayerActive = state.status === 'playing' && state.currentLevelId > 1;
          if (isSingleplayerActive) {
            console.log('User is in active gameplay, skipping App Open ad.');
            return;
          }
          this.loadAndShowAppOpenAd();
        }
      });
    } catch (error) {
      console.warn('❌ Failed to initialize Google Mobile Ads SDK:', error);
    }
  }

  loadAndShowAppOpenAd() {
    if (!isAdMobAvailable) return;

    const adsConfig = useGameStore.getState().adsConfig;
    if (!adsConfig || !adsConfig.showAds) {
      return;
    }

    if (this.isAppOpenAdLoading || (this.appOpenAd && this.appOpenAd.loaded)) {
      if (this.appOpenAd && this.appOpenAd.loaded) {
        this.appOpenAd.show().catch((err: any) => console.log('Failed to show app open ad:', err));
      }
      return;
    }

    this.isAppOpenAdLoading = true;
    console.log('🔄 Loading App Open Ad...');

    try {
      const appOpenAdUnitId = __DEV__
        ? TestIds.APP_OPEN
        : Platform.OS === 'android'
          ? adsConfig.androidAppOpen
          : adsConfig.iosAppOpen;

      if (!appOpenAdUnitId) {
        this.isAppOpenAdLoading = false;
        return;
      }

      const appOpenAd = AppOpenAdClass.createForAdRequest(appOpenAdUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribeLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('✅ App Open Ad Loaded');
        this.isAppOpenAdLoading = false;
        this.appOpenAd = appOpenAd;
        appOpenAd.show().catch((err: any) => {
          console.warn('❌ Failed to show app open ad:', err);
          this.appOpenAd = null;
        });
      });

      const unsubscribeError = appOpenAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('❌ App Open Ad failed to load:', error);
        this.isAppOpenAdLoading = false;
        this.appOpenAd = null;
      });

      appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('🚪 App Open Ad Closed');
        this.appOpenAd = null;
      });

      appOpenAd.load();
    } catch (error) {
      console.warn('❌ Exception while loading App Open Ad:', error);
      this.isAppOpenAdLoading = false;
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


