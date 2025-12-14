import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  scheduleReminderNotifications,
  cancelAllReminderNotifications,
} from "../services/NotificationService";
import { getTranslations } from "../i18n";

export type ReminderFrequency = "daily" | "custom";

// Desteklenen diller
export type Language = "tr" | "en";

export const LANGUAGES: Record<
  Language,
  { name: string; nativeName: string; flag: string }
> = {
  tr: { name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  en: { name: "English", nativeName: "English", flag: "🇬🇧" },
};

// 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface ReminderSettings {
  enabled: boolean;
  frequency: ReminderFrequency;
  selectedDays: WeekDay[]; // Seçili günler (custom modunda kullanılır)
  hour: number;
  minute: number;
}

interface SettingsContextType {
  hapticEnabled: boolean;
  setHapticEnabled: (enabled: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  reminderSettings: ReminderSettings;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderFrequency: (frequency: ReminderFrequency) => void;
  setReminderDays: (days: WeekDay[]) => void;
  toggleReminderDay: (day: WeekDay) => void;
  setReminderTime: (hour: number, minute: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

const STORAGE_KEYS = {
  HAPTIC_ENABLED: "@settings_haptic_enabled",
  REMINDER_SETTINGS: "@settings_reminder",
  LANGUAGE: "@settings_language",
};

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  frequency: "daily",
  selectedDays: [1, 2, 3, 4, 5], // Varsayılan: Hafta içi
  hour: 9,
  minute: 0,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [hapticEnabled, setHapticEnabledState] = useState(true);
  const [language, setLanguageState] = useState<Language>("tr");
  const [reminderSettings, setReminderSettingsState] =
    useState<ReminderSettings>(DEFAULT_REMINDER);
  const [isLoaded, setIsLoaded] = useState(false);

  // Schedule notifications whenever reminder settings or language change
  const updateNotifications = useCallback(
    async (settings: ReminderSettings, lang: Language) => {
      const t = getTranslations(lang);
      await scheduleReminderNotifications(
        {
          enabled: settings.enabled,
          frequency: settings.frequency,
          selectedDays: settings.selectedDays,
          hour: settings.hour,
          minute: settings.minute,
        },
        {
          title: t.notifications.reminderTitle,
          body: t.notifications.reminderBody,
        }
      );
    },
    []
  );

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [hapticValue, reminderValue, languageValue] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.HAPTIC_ENABLED),
          AsyncStorage.getItem(STORAGE_KEYS.REMINDER_SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
        ]);

        if (hapticValue !== null) {
          setHapticEnabledState(JSON.parse(hapticValue));
        }
        if (languageValue !== null) {
          setLanguageState(languageValue as Language);
        }
        if (reminderValue !== null) {
          // Eski kayıtlı ayarları varsayılanlarla birleştir (yeni alanlar için)
          const savedReminder = JSON.parse(reminderValue);
          setReminderSettingsState({
            ...DEFAULT_REMINDER,
            ...savedReminder,
            // selectedDays yoksa varsayılanı kullan
            selectedDays:
              savedReminder.selectedDays || DEFAULT_REMINDER.selectedDays,
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Update notifications when settings are loaded and whenever they change
  useEffect(() => {
    if (isLoaded) {
      updateNotifications(reminderSettings, language);
    }
  }, [isLoaded, reminderSettings, language, updateNotifications]);

  // Helper to save reminder settings
  const saveReminderSettings = async (settings: ReminderSettings) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.REMINDER_SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error("Failed to save reminder settings:", error);
    }
  };

  // Wrapper functions that also persist to AsyncStorage
  const setHapticEnabled = async (enabled: boolean) => {
    setHapticEnabledState(enabled);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.HAPTIC_ENABLED,
        JSON.stringify(enabled)
      );
    } catch (error) {
      console.error("Failed to save haptic setting:", error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (error) {
      console.error("Failed to save language setting:", error);
    }
  };

  const setReminderEnabled = (enabled: boolean) => {
    const newSettings = { ...reminderSettings, enabled };
    setReminderSettingsState(newSettings);
    saveReminderSettings(newSettings);
  };

  const setReminderFrequency = (frequency: ReminderFrequency) => {
    const newSettings = { ...reminderSettings, frequency };
    setReminderSettingsState(newSettings);
    saveReminderSettings(newSettings);
  };

  const setReminderDays = (days: WeekDay[]) => {
    const newSettings = { ...reminderSettings, selectedDays: days };
    setReminderSettingsState(newSettings);
    saveReminderSettings(newSettings);
  };

  const toggleReminderDay = (day: WeekDay) => {
    const currentDays =
      reminderSettings.selectedDays || DEFAULT_REMINDER.selectedDays;
    let newDays: WeekDay[];

    if (currentDays.includes(day)) {
      // En az bir gün seçili kalmalı
      if (currentDays.length > 1) {
        newDays = currentDays.filter((d) => d !== day);
      } else {
        return; // Tek gün kaldıysa kaldırmaya izin verme
      }
    } else {
      newDays = [...currentDays, day].sort((a, b) => a - b);
    }

    const newSettings = { ...reminderSettings, selectedDays: newDays };
    setReminderSettingsState(newSettings);
    saveReminderSettings(newSettings);
  };

  const setReminderTime = (hour: number, minute: number) => {
    const newSettings = { ...reminderSettings, hour, minute };
    setReminderSettingsState(newSettings);
    saveReminderSettings(newSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        hapticEnabled,
        setHapticEnabled,
        language,
        setLanguage,
        reminderSettings,
        setReminderEnabled,
        setReminderFrequency,
        setReminderDays,
        toggleReminderDay,
        setReminderTime,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
