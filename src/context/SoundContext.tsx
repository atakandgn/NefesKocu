import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Sound file mappings
const SOUND_FILES: Record<string, any> = {
  rain: require("../../assets/sounds/rain.mp3"),
  ocean_waves: require("../../assets/sounds/ocean_waves.mp3"),
  waves: require("../../assets/sounds/waves.mp3"),
  forest: require("../../assets/sounds/forest.mp3"),
  forest_birds: require("../../assets/sounds/forest_birds.mp3"),
  fire: require("../../assets/sounds/fireburn.mp3"),
  train: require("../../assets/sounds/train_interior.mp3"),
  bowls: require("../../assets/sounds/tibetan_bowl.mp3"),
  chimes: require("../../assets/sounds/wind_chimes.mp3"),
};

export interface SoundState {
  id: string;
  volume: number;
  isPlaying: boolean;
}

interface SoundContextType {
  sounds: Record<string, SoundState>;
  masterVolume: number;
  isMuted: boolean;
  isAnyPlaying: boolean;
  activeSoundsCount: number;
  toggleSound: (soundId: string) => Promise<void>;
  adjustVolume: (soundId: string, delta: number) => void;
  setMasterVolume: (volume: number) => void;
  toggleMute: () => void;
  stopAllSounds: () => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const STORAGE_KEY = "@sound_preferences";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [sounds, setSounds] = useState<Record<string, SoundState>>({});
  const [masterVolume, setMasterVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const soundObjectsRef = useRef<Record<string, Audio.Sound>>({});

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
    setupAudio();

    return () => {
      // Cleanup all sounds on unmount
      Object.values(soundObjectsRef.current).forEach(async (sound) => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {}
      });
    };
  }, []);

  const setupAudio = async () => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  };

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const prefs = JSON.parse(saved);
        setMasterVolumeState(prefs.masterVolume ?? 0.7);
        // Don't auto-play sounds on load, just restore volume settings
        if (prefs.soundVolumes) {
          const restoredSounds: Record<string, SoundState> = {};
          Object.entries(prefs.soundVolumes).forEach(([id, volume]) => {
            // Ensure volume is between 0.2 and 1.0
            const safeVolume = Math.max(0.2, Math.min(1, volume as number));
            restoredSounds[id] = {
              id,
              volume: safeVolume,
              isPlaying: false,
            };
          });
          setSounds(restoredSounds);
        }
      }
    } catch (e) {
      console.log("Error loading sound preferences:", e);
    }
  };

  const savePreferences = async () => {
    try {
      const soundVolumes: Record<string, number> = {};
      Object.entries(sounds).forEach(([id, state]) => {
        soundVolumes[id] = state.volume;
      });
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ masterVolume, soundVolumes })
      );
    } catch (e) {
      console.log("Error saving sound preferences:", e);
    }
  };

  // Save preferences when they change
  useEffect(() => {
    savePreferences();
  }, [masterVolume, sounds]);

  const toggleSound = useCallback(
    async (soundId: string) => {
      const currentSound = sounds[soundId];
      const soundObject = soundObjectsRef.current[soundId];

      if (currentSound?.isPlaying && soundObject) {
        // Stop the sound
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
          delete soundObjectsRef.current[soundId];
        } catch (e) {}

        setSounds((prev) => ({
          ...prev,
          [soundId]: { ...prev[soundId], isPlaying: false },
        }));
      } else {
        // Start the sound
        try {
          const soundFile = SOUND_FILES[soundId];
          if (!soundFile) {
            console.log("Sound file not found:", soundId);
            return;
          }

          const { sound } = await Audio.Sound.createAsync(soundFile, {
            isLooping: true,
            volume: isMuted
              ? 0
              : (sounds[soundId]?.volume || 0.6) * masterVolume,
          });

          soundObjectsRef.current[soundId] = sound;
          await sound.playAsync();

          setSounds((prev) => ({
            ...prev,
            [soundId]: {
              id: soundId,
              volume: prev[soundId]?.volume || 0.6,
              isPlaying: true,
            },
          }));
        } catch (error) {
          console.log("Sound loading error:", error);
        }
      }
    },
    [sounds, masterVolume, isMuted]
  );

  const adjustVolume = useCallback(
    (soundId: string, delta: number) => {
      setSounds((prev) => {
        const current = prev[soundId];
        if (!current) return prev;

        // Min 0.2 (level 1), Max 1.0 (level 5)
        const newVolume = Math.max(0.2, Math.min(1, current.volume + delta));

        // Don't do anything if already at min/max
        if (newVolume === current.volume) return prev;

        // Update actual sound volume
        const soundObject = soundObjectsRef.current[soundId];
        if (soundObject) {
          soundObject.setVolumeAsync(isMuted ? 0 : newVolume * masterVolume);
        }

        return {
          ...prev,
          [soundId]: { ...current, volume: newVolume },
        };
      });
    },
    [masterVolume, isMuted]
  );

  const setMasterVolume = useCallback(
    async (volume: number) => {
      setMasterVolumeState(volume);
      // Update all playing sounds
      const promises: Promise<unknown>[] = [];
      Object.entries(sounds).forEach(([id, state]) => {
        const soundObject = soundObjectsRef.current[id];
        if (soundObject && state.isPlaying) {
          promises.push(
            soundObject.setVolumeAsync(isMuted ? 0 : state.volume * volume)
          );
        }
      });

      try {
        await Promise.all(promises);
      } catch (e) {
        console.log("Error setting master volume:", e);
      }
    },
    [sounds, isMuted]
  );

  const toggleMute = useCallback(async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    // Mute/unmute all playing sounds
    const promises: Promise<unknown>[] = [];
    Object.entries(sounds).forEach(([id, state]) => {
      const soundObject = soundObjectsRef.current[id];
      if (soundObject && state.isPlaying) {
        promises.push(
          soundObject.setVolumeAsync(newMuted ? 0 : state.volume * masterVolume)
        );
      }
    });

    try {
      await Promise.all(promises);
    } catch (e) {
      console.log("Error toggling mute:", e);
    }
  }, [isMuted, sounds, masterVolume]);

  const stopAllSounds = useCallback(async () => {
    for (const [id, soundObject] of Object.entries(soundObjectsRef.current)) {
      try {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
      } catch (e) {}
    }
    soundObjectsRef.current = {};

    setSounds((prev) => {
      const updated: Record<string, SoundState> = {};
      Object.entries(prev).forEach(([id, state]) => {
        updated[id] = { ...state, isPlaying: false };
      });
      return updated;
    });
  }, []);

  const activeSoundsCount = Object.values(sounds).filter(
    (s) => s.isPlaying
  ).length;
  const isAnyPlaying = activeSoundsCount > 0;

  return (
    <SoundContext.Provider
      value={{
        sounds,
        masterVolume,
        isMuted,
        isAnyPlaying,
        activeSoundsCount,
        toggleSound,
        adjustVolume,
        setMasterVolume,
        toggleMute,
        stopAllSounds,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
