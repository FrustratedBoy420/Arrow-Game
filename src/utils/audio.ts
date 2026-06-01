import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { useGameStore } from '../state/gameStore';

// Static imports for audio files
const correctSoundAsset = require('../../assets/music/arrow_move_sound.wav');
const wrongSoundAsset = require('../../assets/music/wrong_escape-negative-tone.wav');
const victorySoundAsset = require('../../assets/music/eaglaxle-gaming-victory-464016 (1).mp3');
const outOfMoveSoundAsset = require('../../assets/music/outofmoves_sound.mp3');
const bgMusicAsset = require('../../assets/music/bg_constant_sound.mp3');

console.log('Audio assets imported successfully');

class AudioManager {
  private bgMusic: Audio.Sound | null = null;
  private soundEffects: Record<string, Audio.Sound> = {};
  private isInitialized = false;
  private isInitializing = false;
  private subscriptionUnsubscribe: (() => void) | null = null;
  private lastMusicState: boolean | null = null;
  private lastMusicUrlsJson = '{}';

  private async loadAsset(
    assetOrUri: any,
    label: string,
    options: object
  ): Promise<Audio.Sound | null> {
    try {
      console.log(`Loading audio asset: ${label}`);
      
      const source = typeof assetOrUri === 'string' ? { uri: assetOrUri } : assetOrUri;
      
      const { sound } = await Audio.Sound.createAsync(
        source,
        options as any
      );

      console.log(`Successfully loaded asset: ${label}`);
      return sound;
    } catch (err: any) {
      console.error(`Failed to load audio asset: ${label}`, {
        message: err?.message,
      });

      return null;
    }
  }

  async init() {
    if (this.isInitialized) {
      console.log('Audio already initialized');
      return;
    }

    if (this.isInitializing) {
      console.log('Audio initialization already in progress');
      return;
    }

    this.isInitializing = true;

    try {
      console.log('Setting audio mode...');

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,

        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,

        shouldDuckAndroid: true,
        allowsRecordingIOS: false,
        playThroughEarpieceAndroid: false,
      });

      console.log('Audio mode set successfully');
    } catch (e) {
      console.warn('⚠️ Failed to set audio mode:', e);
    }

    // Retrieve dynamic music/sound configurations from store
    const storeState = useGameStore.getState();
    const musicUrls = (storeState as any).musicUrls || {};

    const soundSources = [
      {
        name: 'correct',
        asset: musicUrls.correct || correctSoundAsset,
        options: {
          shouldPlay: false,
          volume: 1.0,
        },
      },
      {
        name: 'wrong',
        asset: musicUrls.wrong || wrongSoundAsset,
        options: {
          shouldPlay: false,
          volume: 1.0,
        },
      },
      {
        name: 'victory',
        asset: musicUrls.victory || victorySoundAsset,
        options: {
          shouldPlay: false,
          volume: 1.0,
        },
      },
      {
        name: 'outOfMove',
        asset: musicUrls.outOfMove || outOfMoveSoundAsset,
        options: {
          shouldPlay: false,
          volume: 1.0,
        },
      },
    ];

    // Load sound effects
    for (const item of soundSources) {
      const sound = await this.loadAsset(
        item.asset,
        item.name,
        item.options
      );

      if (sound) {
        this.soundEffects[item.name] = sound;
      } else {
        console.warn(`Skipping sound: ${item.name}`);
      }
    }

    // Load background music
    console.log('Loading background music...');
    const musicEnabled = storeState.musicEnabled;
    const bgMusicSource = musicUrls.bgMusic || bgMusicAsset;

    const bgSound = await this.loadAsset(
      bgMusicSource,
      'bgMusic',
      {
        shouldPlay: false,
        isLooping: true,
        volume: 0.2,
      }
    );

    if (bgSound) {
      this.bgMusic = bgSound;
      // Ensure looping and volume are set explicitly
      await this.bgMusic.setIsLoopingAsync(true);
      await this.bgMusic.setVolumeAsync(0.2);
    } else {
      console.warn('⚠️ Failed to load background music');
    }

    this.isInitialized = true;
    this.isInitializing = false;

    // Zustand subscription
    if (!this.subscriptionUnsubscribe) {
      console.log('Setting up music subscription');

      this.subscriptionUnsubscribe = useGameStore.subscribe(
        (state) => {
          // 1. Handle music toggle
          if (this.isInitialized && state.musicEnabled !== this.lastMusicState) {
            console.log(`Music enabled changed: ${state.musicEnabled}`);
            this.handleMusicToggle(state.musicEnabled);
          }

          // 2. Handle dynamic music config changes
          const currentUrlsJson = JSON.stringify((state as any).musicUrls || {});
          if (this.isInitialized && this.lastMusicUrlsJson !== currentUrlsJson) {
            console.log('Dynamic music URLs changed, reloading audio manager...');
            this.lastMusicUrlsJson = currentUrlsJson;
            // Reload asynchronously to prevent blocking the store state update
            setTimeout(() => {
              this.reload().catch(err => console.error('Failed to reload audio manager:', err));
            }, 0);
          }
        }
      );
    }

    // Explicitly sync music state on startup
    await this.handleMusicToggle(musicEnabled);
  }

  private async handleMusicToggle(enabled: boolean) {
    if (!this.bgMusic) {
      return;
    }

    if (this.lastMusicState === enabled) {
      return;
    }

    try {
      const status = await this.bgMusic.getStatusAsync();
      if (!status.isLoaded) {
        return;
      }

      if (enabled) {
        if (!status.isPlaying) {
          console.log('Playing background music');
          await this.bgMusic.playAsync();
        }
      } else {
        if (status.isPlaying) {
          console.log('Pausing background music');
          await this.bgMusic.pauseAsync();
        }
      }
      this.lastMusicState = enabled;
    } catch (e: any) {
      if (e?.message?.includes('AudioFocusNotAcquiredException')) {
        console.warn('⚠️ Audio focus could not be acquired from the OS at this time (call active / background).');
      } else {
        console.warn('⚠️ Failed to toggle music:', e?.message || e);
      }
    }
  }

  async playSound(
    name: 'correct' | 'wrong' | 'victory' | 'outOfMove'
  ) {
    const soundEnabled =
      useGameStore.getState().soundEnabled;

    if (!soundEnabled) {
      console.log('Sound disabled');
      return;
    }

    if (!this.isInitialized) {
      console.log('Initializing audio manager...');
      await this.init();
    }

    const sound = this.soundEffects[name];

    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return;
    }

    try {
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        console.warn(`Sound not loaded: ${name}`);
        return;
      }

      // Restart sound cleanly
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      await sound.playAsync();

      console.log(`Played sound: ${name}`);
    } catch (e: any) {
      console.warn(`⚠️ Failed to play sound: ${name}`, e?.message || e);
    }
  }

  async cleanup() {
    console.log('Cleaning up audio manager...');

    try {
      // Unload sound effects
      for (const sound of Object.values(this.soundEffects)) {
        await sound.unloadAsync();
      }

      this.soundEffects = {};

      // Unload background music
      if (this.bgMusic) {
        await this.bgMusic.unloadAsync();
        this.bgMusic = null;
      }

      // Remove Zustand subscription
      if (this.subscriptionUnsubscribe) {
        this.subscriptionUnsubscribe();
        this.subscriptionUnsubscribe = null;
      }

      this.isInitialized = false;
      this.lastMusicState = null;

      console.log('Audio manager cleaned successfully');
    } catch (e: any) {
      console.warn('⚠️ Failed to cleanup audio manager:', e?.message || e);
    }
  }

  async reload() {
    console.log('Reloading audio manager with potential new dynamic assets...');
    await this.cleanup();
    await this.init();
  }
}

export const audioManager = new AudioManager();