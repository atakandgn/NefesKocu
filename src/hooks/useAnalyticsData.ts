import { useMemo } from "react";
import {
  useAnalytics,
  PeriodStats,
  SessionData,
} from "../context/AnalyticsContext";
import { BREATHING_PATTERNS } from "./useBreathingSession";

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalMinutes: number;
  todaySeconds: number;
  todaySessions: number;
  avgSessionMinutes: number;
  avgStressReduction: number;
  currentStreak: number;
  longestStreak: number;
  favoritePattern: {
    id: string;
    name: string;
    count: number;
  } | null;
  sessionsThisWeek: number;
  minutesThisWeek: number;
  improvementFromLastWeek: number; // percentage
}

export interface PatternAnalysis {
  patternId: string;
  patternName: string;
  totalSessions: number;
  totalDuration: number;
  avgDuration: number;
  percentage: number;
}

export function useAnalyticsData() {
  const {
    sessions,
    getWeeklyStats,
    getMonthlyStats,
    getPatternStats,
    getAverageStressReduction,
    isLoading,
  } = useAnalytics();

  // Get summary statistics
  const summary = useMemo((): AnalyticsSummary => {
    const weeklyStats = getWeeklyStats();
    const monthlyStats = getMonthlyStats();
    const patternStats = getPatternStats();

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = sessions.filter((s) => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
    const todaySeconds = Math.round(
      todaySessions.reduce((sum, s) => sum + s.duration, 0)
    );

    // Calculate last week's stats for comparison
    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekSessions = sessions.filter((s) => {
      const date = new Date(s.date);
      return date >= lastWeekStart && date < lastWeekEnd;
    });
    const lastWeekMinutes =
      lastWeekSessions.reduce((sum, s) => sum + s.duration, 0) / 60;

    const thisWeekMinutes = weeklyStats.totalDuration / 60;
    const improvementFromLastWeek =
      lastWeekMinutes > 0
        ? ((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100
        : thisWeekMinutes > 0
        ? 100
        : 0;

    // Find favorite pattern
    let favoritePattern: AnalyticsSummary["favoritePattern"] = null;
    if (weeklyStats.mostUsedPattern) {
      const pattern = BREATHING_PATTERNS.find(
        (p) => p.id === weeklyStats.mostUsedPattern
      );
      favoritePattern = {
        id: weeklyStats.mostUsedPattern,
        name: pattern?.name || weeklyStats.mostUsedPattern,
        count: patternStats[weeklyStats.mostUsedPattern]?.count || 0,
      };
    }

    // Calculate streak
    const { currentStreak, longestStreak } = calculateStreak(sessions);

    return {
      totalSessions: sessions.length,
      totalMinutes: Math.round(
        sessions.reduce((sum, s) => sum + s.duration, 0) / 60
      ),
      todaySeconds,
      todaySessions: todaySessions.length,
      avgSessionMinutes: Math.round(monthlyStats.avgSessionDuration / 60),
      avgStressReduction: getAverageStressReduction(),
      currentStreak,
      longestStreak,
      favoritePattern,
      sessionsThisWeek: weeklyStats.totalSessions,
      minutesThisWeek: Math.round(weeklyStats.totalDuration / 60),
      improvementFromLastWeek: Math.round(improvementFromLastWeek),
    };
  }, [
    sessions,
    getWeeklyStats,
    getMonthlyStats,
    getPatternStats,
    getAverageStressReduction,
  ]);

  // Get chart data for sessions per day (last 7 days)
  const weeklySessionsChart = useMemo((): ChartDataPoint[] => {
    const stats = getWeeklyStats();
    const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const today = new Date().getDay();

    return stats.sessionsPerDay.map((value, index) => {
      const dayIndex = (today - 6 + index + 7) % 7;
      return {
        label: days[dayIndex],
        value,
      };
    });
  }, [getWeeklyStats]);

  // Get chart data for duration per day (last 7 days)
  const weeklyDurationChart = useMemo((): ChartDataPoint[] => {
    const stats = getWeeklyStats();
    const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const today = new Date().getDay();

    return stats.durationPerDay.map((value, index) => {
      const dayIndex = (today - 6 + index + 7) % 7;
      return {
        label: days[dayIndex],
        value: Math.round(value / 60), // Convert to minutes
      };
    });
  }, [getWeeklyStats]);

  // Get chart data for monthly sessions
  const monthlySessionsChart = useMemo((): ChartDataPoint[] => {
    const stats = getMonthlyStats();
    // Group by weeks (4 weeks)
    const weeksData: ChartDataPoint[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = i * 7;
      const weekEnd = (i + 1) * 7;
      const weekSessions = stats.sessionsPerDay
        .slice(weekStart, weekEnd)
        .reduce((sum, v) => sum + v, 0);
      weeksData.push({
        label: `Hafta ${i + 1}`,
        value: weekSessions,
      });
    }
    return weeksData;
  }, [getMonthlyStats]);

  // Get chart data for monthly duration (minutes per week)
  const monthlyDurationChart = useMemo((): ChartDataPoint[] => {
    const stats = getMonthlyStats();
    // Group by weeks (4 weeks)
    const weeksData: ChartDataPoint[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = i * 7;
      const weekEnd = (i + 1) * 7;
      const weekDuration = stats.durationPerDay
        .slice(weekStart, weekEnd)
        .reduce((sum, v) => sum + v, 0);
      weeksData.push({
        label: `Hafta ${i + 1}`,
        value: Math.round(weekDuration / 60), // Convert to minutes
      });
    }
    return weeksData;
  }, [getMonthlyStats]);

  // Get pattern analysis
  const patternAnalysis = useMemo((): PatternAnalysis[] => {
    const patternStats = getPatternStats();
    const totalSessions = sessions.length;

    return Object.entries(patternStats)
      .map(([patternId, stats]) => {
        const pattern = BREATHING_PATTERNS.find((p) => p.id === patternId);
        return {
          patternId,
          patternName: pattern?.name || patternId,
          totalSessions: stats.count,
          totalDuration: stats.totalDuration,
          avgDuration: stats.count > 0 ? stats.totalDuration / stats.count : 0,
          percentage:
            totalSessions > 0 ? (stats.count / totalSessions) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalSessions - a.totalSessions);
  }, [sessions, getPatternStats]);

  // Get stress level trend
  const stressTrend = useMemo((): ChartDataPoint[] => {
    const sessionsWithStress = sessions
      .filter((s) => s.stressLevelAfter !== undefined)
      .slice(0, 14) // Last 14 sessions with stress data
      .reverse();

    return sessionsWithStress.map((s, index) => ({
      label: `${index + 1}`,
      value: s.stressLevelAfter || 0,
    }));
  }, [sessions]);

  // Get heart rate trend
  const heartRateTrend = useMemo((): ChartDataPoint[] => {
    const sessionsWithHR = sessions
      .filter((s) => s.heartRateAfter !== undefined)
      .slice(0, 14)
      .reverse();

    return sessionsWithHR.map((s, index) => ({
      label: `${index + 1}`,
      value: s.heartRateAfter || 0,
    }));
  }, [sessions]);

  return {
    summary,
    weeklySessionsChart,
    weeklyDurationChart,
    monthlySessionsChart,
    monthlyDurationChart,
    patternAnalysis,
    stressTrend,
    heartRateTrend,
    isLoading,
  };
}

// Helper function to calculate streak
function calculateStreak(sessions: SessionData[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique dates with sessions
  const sessionDates = new Set(
    sessions.map((s) => new Date(s.date).toDateString())
  );

  const sortedDates = Array.from(sessionDates)
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    const sessionDate = new Date(sortedDates[i]);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else if (
      i === 0 &&
      sessionDate.getTime() === expectedDate.getTime() - 86400000
    ) {
      // Yesterday counts if we haven't broken the streak yet today
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff =
      (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) /
      (1000 * 60 * 60 * 24);

    if (Math.round(diff) === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}
