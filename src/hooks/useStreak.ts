import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STREAK_KEY = "@breath_coach_streak";
const LAST_SESSION_KEY = "@breath_coach_last_session";

interface UseStreakReturn {
  streak: number;
  incrementStreak: () => Promise<void>;
  resetStreak: () => Promise<void>;
  isLoading: boolean;
}

export function useStreak(): UseStreakReturn {
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      const [streakValue, lastSession] = await Promise.all([
        AsyncStorage.getItem(STREAK_KEY),
        AsyncStorage.getItem(LAST_SESSION_KEY),
      ]);

      const currentStreak = streakValue ? parseInt(streakValue, 10) : 0;

      if (lastSession) {
        const lastDate = new Date(lastSession);
        const today = new Date();
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Reset streak if more than 1 day has passed
        if (diffDays > 1) {
          setStreak(0);
          await AsyncStorage.setItem(STREAK_KEY, "0");
        } else {
          setStreak(currentStreak);
        }
      } else {
        setStreak(currentStreak);
      }
    } catch (error) {
      console.error("Error loading streak:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const incrementStreak = useCallback(async () => {
    try {
      const lastSession = await AsyncStorage.getItem(LAST_SESSION_KEY);
      const today = new Date().toDateString();

      if (lastSession) {
        const lastDate = new Date(lastSession).toDateString();

        // Only increment if not already practiced today
        if (lastDate !== today) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());
        }
      } else {
        setStreak(1);
        await AsyncStorage.setItem(STREAK_KEY, "1");
      }

      await AsyncStorage.setItem(LAST_SESSION_KEY, new Date().toISOString());
    } catch (error) {
      console.error("Error incrementing streak:", error);
    }
  }, [streak]);

  const resetStreak = useCallback(async () => {
    try {
      setStreak(0);
      await AsyncStorage.setItem(STREAK_KEY, "0");
    } catch (error) {
      console.error("Error resetting streak:", error);
    }
  }, []);

  return {
    streak,
    incrementStreak,
    isLoading,
    resetStreak,
  };
}
