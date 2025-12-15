import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  Target,
  Heart,
  Activity,
  Flame,
  BarChart3,
  Award,
  Zap,
  Calendar,
} from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useAnalyticsData } from "../hooks/useAnalyticsData";
import { useAnalytics } from "../context/AnalyticsContext";
import { useTranslation, useStreak } from "../hooks";
import {
  BarChart,
  LineChart,
  PieChart,
  ProgressRing,
} from "../components/Charts";

type StatisticsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Statistics"
>;

const COLORS = {
  background: "#121212",
  surface: "#1E1E1E",
  surfaceLight: "#2A2A2A",
  primary: "#22d3ee",
  secondary: "#4ade80",
  accent: "#a855f7",
  amber: "#fbbf24",
  red: "#ef4444",
  muted: "#6b7280",
  white: "#FFFFFF",
};

const PATTERN_COLORS = [
  "#22d3ee",
  "#4ade80",
  "#a855f7",
  "#fbbf24",
  "#ef4444",
  "#ec4899",
  "#3b82f6",
  "#14b8a6",
];

export default function StatisticsScreen({
  navigation,
}: StatisticsScreenProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"week" | "month">("week");
  const { streak } = useStreak(); // Use the same streak source as HomeScreen
  const {
    summary,
    weeklySessionsChart,
    weeklyDurationChart,
    monthlySessionsChart,
    monthlyDurationChart,
    patternAnalysis,
    stressTrend,
    heartRateTrend,
    isLoading,
  } = useAnalyticsData();
  const { isHealthConnected, connectHealth } = useAnalytics();

  // Format seconds to display with hour/min/sec labels
  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}${t.statistics.hourShort} ${minutes}${t.statistics.minShort} ${seconds}${t.statistics.secShort}`;
    }
    if (minutes > 0) {
      return `${minutes}${t.statistics.minShort} ${seconds}${t.statistics.secShort}`;
    }
    return `${seconds}${t.statistics.secShort}`;
  };

  // Translate day labels in chart data
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const translateChartDays = (chartData: typeof weeklySessionsChart) => {
    const today = new Date().getDay();
    return chartData.map((item, index) => {
      const dayIndex = (today - 6 + index + 7) % 7;
      const dayKey = dayKeys[dayIndex];
      return {
        ...item,
        label: t.statistics.days[dayKey],
      };
    });
  };

  // Translate week labels in monthly chart
  const translateMonthlyChart = (chartData: typeof monthlySessionsChart) => {
    return chartData.map((item, index) => ({
      ...item,
      label: `${t.statistics.weekLabel} ${index + 1}`,
    }));
  };

  const translatedWeeklySessionsChart = translateChartDays(weeklySessionsChart);
  const translatedWeeklyDurationChart = translateChartDays(weeklyDurationChart);
  const translatedMonthlySessionsChart =
    translateMonthlyChart(monthlySessionsChart);
  const translatedMonthlyDurationChart =
    translateMonthlyChart(monthlyDurationChart);

  const handleConnectHealth = async () => {
    const message = Platform.select({
      ios: t.statistics.healthKitMessage,
      android: t.statistics.googleFitMessage,
      default: t.statistics.healthConnectMessage,
    });

    Alert.alert(t.statistics.connectHealth, message, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.statistics.connect,
        onPress: async () => {
          const success = await connectHealth();
          if (success) {
            Alert.alert(t.common.success, t.statistics.healthConnected);
          } else {
            Alert.alert(t.common.error, t.statistics.healthConnectionFailed);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.statistics.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardWide]}>
            <View style={styles.summaryIconContainer}>
              <Flame size={24} color={COLORS.amber} />
            </View>
            <Text style={styles.summaryValue}>{streak}</Text>
            <Text style={styles.summaryLabel}>
              {t.statistics.currentStreak}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardWide]}>
            <View style={styles.summaryIconContainer}>
              <Award size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.summaryValue}>
              {Math.max(summary.longestStreak, streak)}
            </Text>
            <Text style={styles.summaryLabel}>
              {t.statistics.longestStreak}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Target size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.summaryValue}>{summary.totalSessions}</Text>
            <Text style={styles.summaryLabel}>
              {t.statistics.totalSessions}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Clock size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.summaryValue}>
              {formatDuration(summary.todaySeconds)}
            </Text>
            <Text style={styles.summaryLabel}>
              {t.statistics.todayDuration}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Activity size={20} color={COLORS.red} />
            </View>
            <Text style={styles.summaryValue}>
              {summary.avgStressReduction > 0 ? "-" : ""}
              {summary.avgStressReduction.toFixed(1)}
            </Text>
            <Text style={styles.summaryLabel}>
              {t.statistics.stressReduction}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.statistics.progress}</Text>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "week" && styles.tabActive]}
                onPress={() => setActiveTab("week")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "week" && styles.tabTextActive,
                  ]}
                >
                  {t.statistics.week}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "month" && styles.tabActive]}
                onPress={() => setActiveTab("month")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "month" && styles.tabTextActive,
                  ]}
                >
                  {t.statistics.month}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chartCard}>
            <BarChart
              data={
                activeTab === "week"
                  ? translatedWeeklySessionsChart
                  : translatedMonthlySessionsChart
              }
              title={
                activeTab === "week"
                  ? t.statistics.sessionsPerDay
                  : t.statistics.sessionsPerWeek
              }
              barColor={COLORS.primary}
              noDataText={t.statistics.noData}
            />
          </View>

          <View style={styles.chartCard}>
            <BarChart
              data={
                activeTab === "week"
                  ? translatedWeeklyDurationChart
                  : translatedMonthlyDurationChart
              }
              title={
                activeTab === "week"
                  ? t.statistics.minutesPerDay
                  : t.statistics.minutesPerWeek
              }
              barColor={COLORS.secondary}
              unit={t.statistics.min}
              noDataText={t.statistics.noData}
            />
          </View>
        </View>

        {/* Comparison */}
        {summary.improvementFromLastWeek !== 0 && (
          <View style={styles.comparisonCard}>
            <TrendingUp
              size={24}
              color={
                summary.improvementFromLastWeek > 0
                  ? COLORS.secondary
                  : COLORS.red
              }
            />
            <View style={styles.comparisonContent}>
              <Text style={styles.comparisonText}>
                {summary.improvementFromLastWeek > 0
                  ? t.statistics.improvedBy
                  : t.statistics.decreasedBy}
              </Text>
              <Text
                style={[
                  styles.comparisonValue,
                  {
                    color:
                      summary.improvementFromLastWeek > 0
                        ? COLORS.secondary
                        : COLORS.red,
                  },
                ]}
              >
                {Math.abs(summary.improvementFromLastWeek)}%
              </Text>
              <Text style={styles.comparisonSubtext}>
                {t.statistics.comparedToLastWeek}
              </Text>
            </View>
          </View>
        )}

        {/* Pattern Distribution */}
        {patternAnalysis.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t.statistics.techniqueAnalysis}
            </Text>
            <View style={styles.chartCard}>
              <PieChart
                data={patternAnalysis.slice(0, 5).map((p, i) => ({
                  label: p.patternName,
                  value: p.totalSessions,
                  color: PATTERN_COLORS[i % PATTERN_COLORS.length],
                }))}
                title={t.statistics.mostUsedTechniques}
                noDataText={t.statistics.noData}
              />
            </View>

            {/* Top Patterns List */}
            <View style={styles.patternList}>
              {patternAnalysis.slice(0, 3).map((pattern, index) => (
                <View key={pattern.patternId} style={styles.patternItem}>
                  <View
                    style={[
                      styles.patternRank,
                      { backgroundColor: PATTERN_COLORS[index] },
                    ]}
                  >
                    <Text style={styles.patternRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.patternInfo}>
                    <Text style={styles.patternName}>
                      {pattern.patternName}
                    </Text>
                    <Text style={styles.patternStats}>
                      {pattern.totalSessions} {t.statistics.sessions} •{" "}
                      {Math.round(pattern.totalDuration / 60)}{" "}
                      {t.statistics.min}
                    </Text>
                  </View>
                  <View style={styles.patternPercentage}>
                    <ProgressRing
                      progress={pattern.percentage}
                      size={60}
                      strokeWidth={4}
                      color={PATTERN_COLORS[index]}
                      value={`${Math.round(pattern.percentage)}%`}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stress Level Trend */}
        {stressTrend.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.statistics.stressTrend}</Text>
            <View style={styles.chartCard}>
              <LineChart
                data={stressTrend}
                title={t.statistics.stressAfterSessions}
                lineColor={COLORS.accent}
                fillColor="rgba(168, 85, 247, 0.1)"
                noDataText={t.statistics.noData}
              />
            </View>
          </View>
        )}

        {/* Health Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.statistics.healthData}</Text>

          {!isHealthConnected ? (
            <TouchableOpacity
              style={styles.connectHealthCard}
              onPress={handleConnectHealth}
            >
              <View style={styles.healthIconContainer}>
                <Heart size={32} color={COLORS.red} />
              </View>
              <View style={styles.connectHealthContent}>
                <Text style={styles.connectHealthTitle}>
                  {Platform.OS === "ios"
                    ? t.statistics.connectHealthKit
                    : t.statistics.connectGoogleFit}
                </Text>
                <Text style={styles.connectHealthSubtitle}>
                  {t.statistics.trackHeartRate}
                </Text>
              </View>
              <Zap size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.chartCard}>
              {heartRateTrend.length > 0 ? (
                <LineChart
                  data={heartRateTrend}
                  title={t.statistics.heartRateTrend}
                  lineColor={COLORS.red}
                  fillColor="rgba(239, 68, 68, 0.1)"
                  noDataText={t.statistics.noData}
                />
              ) : (
                <View style={styles.emptyHealthData}>
                  <Heart size={32} color={COLORS.muted} />
                  <Text style={styles.emptyHealthText}>
                    {t.statistics.noHeartRateData}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Average Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.statistics.averages}</Text>
          <View style={styles.averageRow}>
            <View style={styles.averageCard}>
              <Clock size={24} color={COLORS.primary} />
              <Text style={styles.averageValue}>
                {summary.avgSessionMinutes} {t.statistics.min}
              </Text>
              <Text style={styles.averageLabel}>
                {t.statistics.avgSessionDuration}
              </Text>
            </View>
            <View style={styles.averageCard}>
              <Calendar size={24} color={COLORS.secondary} />
              <Text style={styles.averageValue}>
                {summary.sessionsThisWeek}
              </Text>
              <Text style={styles.averageLabel}>
                {t.statistics.sessionsThisWeek}
              </Text>
            </View>
          </View>
        </View>

        {/* Favorite Pattern */}
        {summary.favoritePattern && (
          <View style={styles.favoritePatternCard}>
            <View style={styles.favoritePatternIcon}>
              <BarChart3 size={24} color={COLORS.primary} />
            </View>
            <View style={styles.favoritePatternContent}>
              <Text style={styles.favoritePatternLabel}>
                {t.statistics.favoritePattern}
              </Text>
              <Text style={styles.favoritePatternName}>
                {summary.favoritePattern.name}
              </Text>
              <Text style={styles.favoritePatternCount}>
                {summary.favoritePattern.count} {t.statistics.sessions}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  summaryCardWide: {
    paddingVertical: 20,
  },
  summaryIconContainer: {
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  comparisonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  comparisonContent: {
    marginLeft: 16,
    flex: 1,
  },
  comparisonText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  comparisonValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 4,
  },
  comparisonSubtext: {
    fontSize: 12,
    color: COLORS.muted,
  },
  patternList: {
    gap: 12,
  },
  patternItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  patternRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  patternRankText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  patternInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patternName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  patternStats: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
  patternPercentage: {
    marginLeft: 12,
  },
  connectHealthCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderStyle: "dashed",
  },
  healthIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  connectHealthContent: {
    flex: 1,
    marginLeft: 16,
  },
  connectHealthTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  connectHealthSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  emptyHealthData: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyHealthText: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 12,
  },
  averageRow: {
    flexDirection: "row",
    gap: 12,
  },
  averageCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  averageValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: 12,
  },
  averageLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: "center",
  },
  favoritePatternCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
  favoritePatternIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  favoritePatternContent: {
    marginLeft: 16,
  },
  favoritePatternLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  favoritePatternName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: 4,
  },
  favoritePatternCount: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
  },
});
