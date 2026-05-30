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

  private async loadAsset(
    asset: any,
    label: string,
    options: object
  ): Promise<Audio.Sound | null> {
    try {
      console.log(`Loading audio asset: ${label}`);
      
      const { sound } = await Audio.Sound.createAsync(
        asset,
        options as any
      );

      console.log(`Successfully loaded local asset: ${label}`);
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
      console.error('Failed to set audio mode', e);
    }

    const soundSources = [
      {
        name: 'correct',
        asset: correctSoundAsset,
        options: {
          shouldPlay: false,
          volume: 1.0,
        },
      },
      {
        name: 'wrong',
        asset: wrongSoundAsset,
        options: {
          shouldPlay: false,
          volume: 1.0,
        },
      },
      {
        name: 'victory',
        asset: victorySoundAsset,
        options: {
          shouldPlay: false,
          volume: 1.0,
        },
      },
      {
        name: 'outOfMove',
        asset: outOfMoveSoundAsset,
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
    const musicEnabled = useGameStore.getState().musicEnabled;

    const bgSound = await this.loadAsset(
      bgMusicAsset,
      'bgMusic',
      {
        shouldPlay: false,
        isLooping: true,
        volume: 0.4,
      }
    );

    if (bgSound) {
      this.bgMusic = bgSound;
      // Ensure looping and volume are set explicitly
      await this.bgMusic.setIsLoopingAsync(true);
      await this.bgMusic.setVolumeAsync(0.4);
    } else {
      console.error('Failed to load background music');
    }

    this.isInitialized = true;
    this.isInitializing = false;

    // Zustand subscription
    if (!this.subscriptionUnsubscribe) {
      console.log('Setting up music subscription');

      this.subscriptionUnsubscribe = useGameStore.subscribe(
        (state) => {
          // Only trigger if manager is ready and the state actually changed
          if (this.isInitialized && state.musicEnabled !== this.lastMusicState) {
            console.log(`Music enabled changed: ${state.musicEnabled}`);
            this.handleMusicToggle(state.musicEnabled);
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
      if (enabled) {
        console.log('Playing background music');
        await this.bgMusic.playAsync();
      } else {
        console.log('Pausing background music');
        await this.bgMusic.pauseAsync();
      }
      this.lastMusicState = enabled;
    } catch (e) {
      console.error('Failed to toggle music', e);
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
    } catch (e) {
      console.error(`Failed to play sound: ${name}`, e);
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
    } catch (e) {
      console.error('Failed to cleanup audio manager', e);
    }
  }
}

export const audioManager = new AudioManager();