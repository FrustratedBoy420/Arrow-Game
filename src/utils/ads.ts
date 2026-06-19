import mobileAds, { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const interstitialAdUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      android: 'ca-app-pub-2101586602209482/6861275013', // Production Android interstitial ad unit ID
      ios: 'ca-app-pub-3940256099942544/4411468910',     // Google official test ID (replace with production iOS unit ID)
      default: TestIds.INTERSTITIAL,
    });

class AdManager {
  private interstitial: InterstitialAd | null = null;
  private isAdLoading = false;
  private isInitialized = false;

  async initialize() {
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
    if (this.isAdLoading || (this.interstitial && this.interstitial.loaded)) {
      return;
    }

    this.isAdLoading = true;
    console.log('🔄 Loading Interstitial Ad...');

    // Create a new instance
    const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
      requestNonPersonalizedAdsOnly: true, // Configured for privacy laws (GDPR/CCPA compliant)
    });

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('✅ Interstitial Ad Loaded');
      this.isAdLoading = false;
      this.interstitial = interstitial;
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('❌ Interstitial Ad failed to load:', error);
      this.isAdLoading = false;
      this.interstitial = null;
      // Retry loading after 15 seconds
      setTimeout(() => this.loadInterstitial(), 15000);
    });

    interstitial.load();
  }

  showInterstitial(onClose: () => void) {
    if (!this.isInitialized) {
      console.log('⚠️ Ads not initialized. Proceeding without ad.');
      onClose();
      return;
    }

    if (this.interstitial && this.interstitial.loaded) {
      console.log('📺 Showing Interstitial Ad...');
      
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

      this.interstitial.show().catch((err) => {
        console.warn('❌ Failed to show interstitial ad:', err);
        this.interstitial = null;
        onClose();
        this.loadInterstitial();
      });
    } else {
      console.log('⚠️ Interstitial Ad not loaded yet. Proceeding immediately.');
      onClose();
      // Try to load again
      this.loadInterstitial();
    }
  }
}

export const adManager = new AdManager();
