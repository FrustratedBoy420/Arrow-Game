import { Platform, AppState, AppStateStatus } from 'react-native';
import { useGameStore } from '../state/gameStore';

let mobileAds: any = null;
let InterstitialAdClass: any = null;
let AppOpenAdClass: any = null;
let RewardedAdClass: any = null;
let AdEventType: any = null;
let RewardedAdEventType: any = null;
let TestIds: any = {
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
};
let isAdMobAvailable = false;

try {
  const ads = require('react-native-google-mobile-ads');
  mobileAds = ads.default;
  InterstitialAdClass = ads.InterstitialAd;
  AppOpenAdClass = ads.AppOpenAd;
  RewardedAdClass = ads.RewardedAd;
  AdEventType = ads.AdEventType;
  RewardedAdEventType = ads.RewardedAdEventType;
  TestIds = ads.TestIds;
  isAdMobAvailable = true;
} catch (error) {
  console.log('⚠️ react-native-google-mobile-ads is not supported in Expo Go. Ads are disabled.');
}

class AdManager {
  private interstitial: any = null;
  private appOpenAd: any = null;
  private rewarded: any = null;
  private isAdLoading = false;
  private isAppOpenAdLoading = false;
  private isRewardedAdLoading = false;
  private isInitialized = false;
  private previousAppState: AppStateStatus = AppState.currentState;
  private isFullScreenAdShowing = false;
  private lastAdDismissedTime = 0;

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
      this.loadRewarded();

      // Listen to AppState changes for foregrounding App Open Ads
      this.previousAppState = AppState.currentState;
      AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        const wasBackground = this.previousAppState.match(/inactive|background/);
        this.previousAppState = nextAppState;

        if (nextAppState === 'active' && wasBackground) {
          console.log('App came to foreground, checking for App Open ad...');
          // Check if user is in active gameplay to avoid showing ad mid-game
          const state = useGameStore.getState();
          const isSingleplayerActive = state.status === 'playing';
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

  private showAppOpenAd() {
    if (!this.appOpenAd) return;

    this.isFullScreenAdShowing = true;
    console.log('📺 Presenting App Open Ad...');

    try {
      const unsubscribeClosed = this.appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('🚪 App Open Ad Closed');
        unsubscribeClosed();
        this.appOpenAd = null;
        this.isFullScreenAdShowing = false;
        this.lastAdDismissedTime = Date.now();
      });

      this.appOpenAd.show().catch((err: any) => {
        console.warn('❌ Failed to show app open ad:', err);
        this.appOpenAd = null;
        this.isFullScreenAdShowing = false;
        this.lastAdDismissedTime = Date.now();
      });
    } catch (error) {
      console.warn('❌ Exception while showing App Open Ad:', error);
      this.appOpenAd = null;
      this.isFullScreenAdShowing = false;
      this.lastAdDismissedTime = Date.now();
    }
  }

  loadAndShowAppOpenAd() {
    if (!isAdMobAvailable) return;

    const adsConfig = useGameStore.getState().adsConfig;
    if (!adsConfig || !adsConfig.showAds || !adsConfig.showAppOpen) {
      return;
    }

    // Cooldown check: Do not show if another ad is showing or was dismissed within 5 seconds
    if (this.isFullScreenAdShowing || (Date.now() - this.lastAdDismissedTime < 5000)) {
      console.log('Skipping App Open ad: full-screen ad active or recently dismissed.');
      return;
    }

    if (this.isAppOpenAdLoading || (this.appOpenAd && this.appOpenAd.loaded)) {
      if (this.appOpenAd && this.appOpenAd.loaded) {
        this.showAppOpenAd();
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

        // Safety check: Do not auto-show if user is playing
        const state = useGameStore.getState();
        if (state.status === 'playing') {
          console.log('User is in active gameplay, not auto-showing loaded App Open ad.');
          return;
        }

        // Show it if everything is fine
        if (!this.isFullScreenAdShowing && (Date.now() - this.lastAdDismissedTime >= 5000)) {
          this.showAppOpenAd();
        }
      });

      const unsubscribeError = appOpenAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('❌ App Open Ad failed to load:', error);
        this.isAppOpenAdLoading = false;
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
    if (!adsConfig || !adsConfig.showAds || !adsConfig.showInterstitial) {
      console.log('Ads are disabled globally or interstitial is disabled.');
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
    if (!adsConfig || !adsConfig.showAds || !adsConfig.showInterstitial) {
      console.log('Ads are disabled globally or interstitial is disabled. Skipping interstitial.');
      onClose();
      return;
    }

    if (this.interstitial && this.interstitial.loaded) {
      console.log('📺 Showing Interstitial Ad...');
      this.isFullScreenAdShowing = true;
      
      try {
        const unsubscribeDismissed = this.interstitial.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            console.log('🚪 Interstitial Ad Closed');
            unsubscribeDismissed();
            this.interstitial = null;
            this.isFullScreenAdShowing = false;
            this.lastAdDismissedTime = Date.now();
            onClose();
            // Preload the next ad
            this.loadInterstitial();
          }
        );

        this.interstitial.show().catch((err: any) => {
          console.warn('❌ Failed to show interstitial ad:', err);
          this.interstitial = null;
          this.isFullScreenAdShowing = false;
          this.lastAdDismissedTime = Date.now();
          onClose();
          this.loadInterstitial();
        });
      } catch (error) {
        console.warn('❌ Exception while showing Interstitial Ad:', error);
        this.interstitial = null;
        this.isFullScreenAdShowing = false;
        this.lastAdDismissedTime = Date.now();
        onClose();
        this.loadInterstitial();
      }
    } else {
      onClose();
      // Try to load again
      this.loadInterstitial();
    }
  }

  loadRewarded() {
    if (!isAdMobAvailable) return;

    const adsConfig = useGameStore.getState().adsConfig;
    if (!adsConfig || !adsConfig.showAds || !adsConfig.showRewarded) {
      this.rewarded = null;
      return;
    }

    if (this.isRewardedAdLoading || (this.rewarded && this.rewarded.loaded)) {
      return;
    }

    this.isRewardedAdLoading = true;
    console.log('🔄 Loading Rewarded Ad...');

    try {
      const rewardedAdUnitId = __DEV__
        ? TestIds.REWARDED
        : Platform.OS === 'android'
          ? adsConfig.androidRewarded
          : adsConfig.iosRewarded;

      if (!rewardedAdUnitId) {
        this.isRewardedAdLoading = false;
        return;
      }

      const rewarded = RewardedAdClass.createForAdRequest(rewardedAdUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        console.log('✅ Rewarded Ad Loaded');
        this.isRewardedAdLoading = false;
        this.rewarded = rewarded;
      });

      const unsubscribeError = rewarded.addAdEventListener(RewardedAdEventType.ERROR, (error: any) => {
        console.warn('❌ Rewarded Ad failed to load:', error);
        this.isRewardedAdLoading = false;
        this.rewarded = null;
        // Retry loading after 15 seconds
        setTimeout(() => this.loadRewarded(), 15000);
      });

      rewarded.load();
    } catch (error) {
      console.warn('❌ Exception while loading Rewarded Ad:', error);
      this.isRewardedAdLoading = false;
    }
  }

  showRewarded(onRewardEarned: () => void, onClose: () => void) {
    if (!isAdMobAvailable || !this.isInitialized) {
      onClose();
      return;
    }

    const adsConfig = useGameStore.getState().adsConfig;
    if (!adsConfig || !adsConfig.showAds || !adsConfig.showRewarded) {
      console.log('Ads are disabled globally or rewarded is disabled. Skipping rewarded.');
      onClose();
      return;
    }

    if (this.rewarded && this.rewarded.loaded) {
      console.log('📺 Showing Rewarded Ad...');
      this.isFullScreenAdShowing = true;
      let earned = false;

      try {
        const unsubscribeReward = this.rewarded.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          (reward: any) => {
            console.log('✅ User earned reward:', reward);
            earned = true;
          }
        );

        const unsubscribeClosed = this.rewarded.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            console.log('🚪 Rewarded Ad Closed');
            unsubscribeReward();
            unsubscribeClosed();
            this.rewarded = null;
            this.isFullScreenAdShowing = false;
            this.lastAdDismissedTime = Date.now();
            
            if (earned) {
              onRewardEarned();
            }
            onClose();
            // Preload next rewarded ad
            this.loadRewarded();
          }
        );

        this.rewarded.show().catch((err: any) => {
          console.warn('❌ Failed to show rewarded ad:', err);
          unsubscribeReward();
          unsubscribeClosed();
          this.rewarded = null;
          this.isFullScreenAdShowing = false;
          this.lastAdDismissedTime = Date.now();
          onClose();
          this.loadRewarded();
        });
      } catch (error) {
        console.warn('❌ Exception while showing Rewarded Ad:', error);
        this.rewarded = null;
        this.isFullScreenAdShowing = false;
        this.lastAdDismissedTime = Date.now();
        onClose();
        this.loadRewarded();
      }
    } else {
      onClose();
      this.loadRewarded();
    }
  }

  isRewardedAdReady(): boolean {
    return isAdMobAvailable && this.isInitialized && !!this.rewarded && this.rewarded.loaded;
  }
}

export const adManager = new AdManager();


