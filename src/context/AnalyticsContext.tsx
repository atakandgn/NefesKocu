import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Session data structure
export interface SessionData {
  id: string;
  date: string; // ISO string
  patternId: string;
  patternName: string;
  duration: number; // seconds
  rounds: number;
  stressLevelBefore?: number; // 1-5 scale
  stressLevelAfter?: number; // 1-5 scale
  heartRateBefore?: number;
  heartRateAfter?: number;
  type: "breathing" | "focus";
}

// Daily summary
export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalSessions: number;
  totalDuration: number; // seconds
  avgStressReduction: number;
  patterns: Record<string, number>; // patternId -> count
  heartRateAvg?: number;
}

// Weekly/Monthly stats
export interface PeriodStats {
  totalSessions: number;
  totalDuration: number;
  avgSessionDuration: number;
  avgStressReduction: number;
  mostUsedPattern: string | null;
  sessionsPerDay: number[];
  durationPerDay: number[];
  stressLevels: number[];
  heartRates: number[];
  patternDistribution: Record<string, number>;
}

// Health data from HealthKit/Google Fit
export interface HealthData {
  date: string;
  heartRate?: number;
  steps?: number;
  sleepHours?: number;
  source: "healthkit" | "googlefit" | "manual";
}

interface AnalyticsContextType {
  // Session tracking
  sessions: SessionData[];
  addSession: (session: Omit<SessionData, "id">) => Promise<void>;

  // Statistics
  getWeeklyStats: () => PeriodStats;
  getMonthlyStats: () => PeriodStats;
  getDailyStats: (date: string) => DailySummary | null;
  getPatternStats: () => Record<
    string,
    { count: number; totalDuration: number }
  >;

  // Stress tracking
  logStressLevel: (
    level: number,
    sessionId?: string,
    timing?: "before" | "after"
  ) => Promise<void>;
  getAverageStressReduction: () => number;

  // Health integration
  healthData: HealthData[];
  addHealthData: (data: Omit<HealthData, "date">) => Promise<void>;
  isHealthConnected: boolean;
  connectHealth: () => Promise<boolean>;

  // Loading state
  isLoading: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined
);

const STORAGE_KEYS = {
  SESSIONS: "@analytics_sessions",
  HEALTH_DATA: "@analytics_health_data",
  HEALTH_CONNECTED: "@analytics_health_connected",
};

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [isHealthConnected, setIsHealthConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessionsData, healthDataStr, healthConnected] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.HEALTH_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.HEALTH_CONNECTED),
      ]);

      if (sessionsData) {
        setSessions(JSON.parse(sessionsData));
      }
      if (healthDataStr) {
        setHealthData(JSON.parse(healthDataStr));
      }
      if (healthConnected) {
        setIsHealthConnected(JSON.parse(healthConnected));
      }
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new session
  const addSession = useCallback(async (session: Omit<SessionData, "id">) => {
    const newSession: SessionData = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    setSessions((prev) => {
      const updated = [newSession, ...prev];
      // Keep only last 365 days of data
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 365);
      const filtered = updated.filter((s) => new Date(s.date) > cutoffDate);
      AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  // Log stress level
  const logStressLevel = useCallback(
    async (level: number, sessionId?: string, timing?: "before" | "after") => {
      if (sessionId) {
        setSessions((prev) => {
          const updated = prev.map((s) => {
            if (s.id === sessionId) {
              return {
                ...s,
                [timing === "before"
                  ? "stressLevelBefore"
                  : "stressLevelAfter"]: level,
              };
            }
            return s;
          });
          AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
          return updated;
        });
      }
    },
    []
  );

  // Get sessions for a specific period
  const getSessionsInPeriod = useCallback(
    (startDate: Date, endDate: Date): SessionData[] => {
      return sessions.filter((s) => {
        const sessionDate = new Date(s.date);
        return sessionDate >= startDate && sessionDate <= endDate;
      });
    },
    [sessions]
  );

  // Calculate period stats
  const calculatePeriodStats = useCallback(
    (periodSessions: SessionData[], days: number): PeriodStats => {
      const totalSessions = periodSessions.length;
      const totalDuration = periodSessions.reduce(
        (sum, s) => sum + s.duration,
        0
      );
      const avgSessionDuration =
        totalSessions > 0 ? totalDuration / totalSessions : 0;

      // Calculate stress reduction
      const sessionsWithStress = periodSessions.filter(
        (s) =>
          s.stressLevelBefore !== undefined && s.stressLevelAfter !== undefined
      );
      const avgStressReduction =
        sessionsWithStress.length > 0
          ? sessionsWithStress.reduce(
              (sum, s) =>
                sum + ((s.stressLevelBefore || 0) - (s.stressLevelAfter || 0)),
              0
            ) / sessionsWithStress.length
          : 0;

      // Pattern distribution
      const patternDistribution: Record<string, number> = {};
      periodSessions.forEach((s) => {
        patternDistribution[s.patternId] =
          (patternDistribution[s.patternId] || 0) + 1;
      });

      // Most used pattern
      let mostUsedPattern: string | null = null;
      let maxCount = 0;
      Object.entries(patternDistribution).forEach(([pattern, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostUsedPattern = pattern;
        }
      });

      // Sessions and duration per day
      const sessionsPerDay: number[] = new Array(days).fill(0);
      const durationPerDay: number[] = new Array(days).fill(0);
      const stressLevels: number[] = [];
      const heartRates: number[] = [];

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      periodSessions.forEach((s) => {
        const sessionDate = new Date(s.date);
        const daysDiff = Math.floor(
          (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const index = days - 1 - daysDiff;
        if (index >= 0 && index < days) {
          sessionsPerDay[index]++;
          durationPerDay[index] += s.duration;
        }

        if (s.stressLevelAfter !== undefined) {
          stressLevels.push(s.stressLevelAfter);
        }
        if (s.heartRateAfter !== undefined) {
          heartRates.push(s.heartRateAfter);
        }
      });

      return {
        totalSessions,
        totalDuration,
        avgSessionDuration,
        avgStressReduction,
        mostUsedPattern,
        sessionsPerDay,
        durationPerDay,
        stressLevels,
        heartRates,
        patternDistribution,
      };
    },
    []
  );

  // Get weekly stats
  const getWeeklyStats = useCallback((): PeriodStats => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const periodSessions = getSessionsInPeriod(startDate, endDate);
    return calculatePeriodStats(periodSessions, 7);
  }, [getSessionsInPeriod, calculatePeriodStats]);

  // Get monthly stats
  const getMonthlyStats = useCallback((): PeriodStats => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const periodSessions = getSessionsInPeriod(startDate, endDate);
    return calculatePeriodStats(periodSessions, 30);
  }, [getSessionsInPeriod, calculatePeriodStats]);

  // Get daily stats
  const getDailyStats = useCallback(
    (dateStr: string): DailySummary | null => {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const daySessions = getSessionsInPeriod(date, endDate);
      if (daySessions.length === 0) return null;

      const patterns: Record<string, number> = {};
      daySessions.forEach((s) => {
        patterns[s.patternId] = (patterns[s.patternId] || 0) + 1;
      });

      const sessionsWithStress = daySessions.filter(
        (s) =>
          s.stressLevelBefore !== undefined && s.stressLevelAfter !== undefined
      );
      const avgStressReduction =
        sessionsWithStress.length > 0
          ? sessionsWithStress.reduce(
              (sum, s) =>
                sum + ((s.stressLevelBefore || 0) - (s.stressLevelAfter || 0)),
              0
            ) / sessionsWithStress.length
          : 0;

      const heartRates = daySessions
        .filter((s) => s.heartRateAfter !== undefined)
        .map((s) => s.heartRateAfter as number);
      const heartRateAvg =
        heartRates.length > 0
          ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length
          : undefined;

      return {
        date: dateStr,
        totalSessions: daySessions.length,
        totalDuration: daySessions.reduce((sum, s) => sum + s.duration, 0),
        avgStressReduction,
        patterns,
        heartRateAvg,
      };
    },
    [getSessionsInPeriod]
  );

  // Get pattern stats
  const getPatternStats = useCallback(() => {
    const stats: Record<string, { count: number; totalDuration: number }> = {};
    sessions.forEach((s) => {
      if (!stats[s.patternId]) {
        stats[s.patternId] = { count: 0, totalDuration: 0 };
      }
      stats[s.patternId].count++;
      stats[s.patternId].totalDuration += s.duration;
    });
    return stats;
  }, [sessions]);

  // Get average stress reduction
  const getAverageStressReduction = useCallback((): number => {
    const sessionsWithStress = sessions.filter(
      (s) =>
        s.stressLevelBefore !== undefined && s.stressLevelAfter !== undefined
    );
    if (sessionsWithStress.length === 0) return 0;
    return (
      sessionsWithStress.reduce(
        (sum, s) =>
          sum + ((s.stressLevelBefore || 0) - (s.stressLevelAfter || 0)),
        0
      ) / sessionsWithStress.length
    );
  }, [sessions]);

  // Add health data
  const addHealthData = useCallback(async (data: Omit<HealthData, "date">) => {
    const newData: HealthData = {
      ...data,
      date: new Date().toISOString(),
    };

    setHealthData((prev) => {
      const updated = [newData, ...prev];
      // Keep only last 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      const filtered = updated.filter((d) => new Date(d.date) > cutoffDate);
      AsyncStorage.setItem(STORAGE_KEYS.HEALTH_DATA, JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  // Connect to health services (placeholder - actual implementation depends on native modules)
  const connectHealth = useCallback(async (): Promise<boolean> => {
    try {
      // This is a placeholder. In a real implementation, you would:
      // 1. Request permissions for HealthKit (iOS) or Google Fit (Android)
      // 2. Set up listeners for health data
      // 3. Fetch initial data

      // For now, we'll simulate a successful connection
      setIsHealthConnected(true);
      await AsyncStorage.setItem(
        STORAGE_KEYS.HEALTH_CONNECTED,
        JSON.stringify(true)
      );
      return true;
    } catch (error) {
      console.error("Failed to connect health services:", error);
      return false;
    }
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{
        sessions,
        addSession,
        getWeeklyStats,
        getMonthlyStats,
        getDailyStats,
        getPatternStats,
        logStressLevel,
        getAverageStressReduction,
        healthData,
        addHealthData,
        isHealthConnected,
        connectHealth,
        isLoading,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}
