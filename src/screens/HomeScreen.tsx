import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import {
  Settings,
  Flame,
  Play,
  Pause,
  Square,
  Timer,
  ChevronDown,
  X,
  Minus,
  Plus,
  BarChart3,
} from "lucide-react-native";
import { HomeScreenProps } from "../types/navigation";
import {
  useBreathingSession,
  useStreak,
  BREATHING_PATTERNS,
  BreathingPattern,
  useTranslation,
} from "../hooks";
import { FloatingSoundButton, Confetti, CompletionModal } from "../components";
import { useSettings, useAnalytics } from "../context";

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = Math.min(width * 0.7, 280);
const PHASE_CIRCLE_SIZE = 70;

const COLORS = {
  background: "#121212",
  surface: "#1E1E1E",
  primary: "#22d3ee",
  secondary: "#4ade80",
  muted: "#6b7280",
  amber: "#fbbf24",
  purple: "#a855f7",
  red: "#ef4444",
  white: "#FFFFFF",
  gray700: "#374151",
  gray800: "#1f2937",
};

interface PhaseCircleProps {
  label: string;
  duration: number;
  progress: number;
  isActive: boolean;
  color: string;
}

function PhaseCircle({
  label,
  duration,
  progress,
  isActive,
  color,
}: PhaseCircleProps) {
  const size = PHASE_CIRCLE_SIZE;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - progress * circumference;

  if (duration === 0) return null;

  return (
    <View style={styles.phaseCircleContainer}>
      <View style={[styles.phaseCircleWrapper, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svgAbsolute}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isActive ? `${color}30` : "#2E2E2E"}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            opacity={isActive ? 1 : 0.3}
          />
        </Svg>
        <View style={styles.phaseCircleContent}>
          <Text
            style={[
              styles.phaseCircleDuration,
              { color: isActive ? color : COLORS.muted },
            ]}
          >
            {duration}s
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.phaseCircleLabel,
          { color: isActive ? color : COLORS.muted },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState<{
    rounds: number;
    duration: number;
  } | null>(null);
  const { hapticEnabled } = useSettings();
  const { t } = useTranslation();
  const { addSession } = useAnalytics();
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const hasCompletedRef = useRef(false);

  const {
    phase,
    phaseProgress,
    phaseDuration,
    phaseTimeRemaining,
    cycleCount,
    totalSessionTime,
    isPlaying,
    isPaused,
    pattern,
    targetRounds,
    start,
    pause,
    resume,
    stop,
    setPattern,
    setTargetRounds,
  } = useBreathingSession({ enableHaptics: hapticEnabled });

  const { streak, incrementStreak } = useStreak();
  const scale = useSharedValue(0.6);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isPaused) {
      // Pause animations by canceling ongoing animations
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      return;
    }

    if (phase === "idle") {
      scale.value = withSpring(0.6, { damping: 15 });
      glowOpacity.value = withTiming(0.3, { duration: 300 });
    } else if (phase === "inhale") {
      scale.value = withTiming(1, {
        duration: phaseDuration * 1000,
        easing: Easing.inOut(Easing.ease),
      });
      glowOpacity.value = withTiming(0.8, { duration: phaseDuration * 1000 });
    } else if (phase === "holdIn" || phase === "holdOut") {
      glowOpacity.value = withTiming(1, { duration: 500 });
    } else if (phase === "exhale") {
      scale.value = withTiming(0.6, {
        duration: phaseDuration * 1000,
        easing: Easing.inOut(Easing.ease),
      });
      glowOpacity.value = withTiming(0.3, { duration: phaseDuration * 1000 });
    }
  }, [phase, phaseDuration, isPaused]);

  // Check if target rounds completed
  useEffect(() => {
    if (isPlaying && cycleCount >= targetRounds && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      // Save completed session data before stopping
      const completedData = {
        rounds: cycleCount,
        duration: totalSessionTime,
      };
      setCompletedSessionData(completedData);

      // Save to analytics
      if (sessionStartTime) {
        addSession({
          date: sessionStartTime.toISOString(),
          patternId: pattern.id,
          patternName: pattern.name,
          duration: Math.round(totalSessionTime),
          rounds: cycleCount,
          type: "breathing",
        });
        setSessionStartTime(null);
      }

      // Increment streak
      incrementStreak();

      // Stop the session
      stop();

      // Show celebration
      setShowConfetti(true);
      setShowCompletionModal(true);
    }
  }, [cycleCount, targetRounds, isPlaying]);

  // Reset completion flag when starting new session
  useEffect(() => {
    if (isPlaying && cycleCount === 0) {
      hasCompletedRef.current = false;
    }
  }, [isPlaying, cycleCount]);

  useEffect(() => {
    // Only track manual stops (not auto-completion)
    if (!isPlaying && cycleCount > 0 && !hasCompletedRef.current) {
      incrementStreak();
      // Save session to analytics
      if (sessionStartTime) {
        addSession({
          date: sessionStartTime.toISOString(),
          patternId: pattern.id,
          patternName: pattern.name,
          duration: Math.round(totalSessionTime),
          rounds: cycleCount,
          type: "breathing",
        });
        setSessionStartTime(null);
      }
    }
  }, [isPlaying]);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const getPhaseColor = () => {
    switch (phase) {
      case "inhale":
        return COLORS.primary;
      case "holdIn":
        return COLORS.amber;
      case "exhale":
        return COLORS.secondary;
      case "holdOut":
        return COLORS.purple;
      default:
        return COLORS.muted;
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case "inhale":
        return t.phases.inhale;
      case "holdIn":
        return t.phases.holdIn;
      case "exhale":
        return t.phases.exhale;
      case "holdOut":
        return t.phases.holdOut;
      default:
        return t.phases.idle;
    }
  };

  const handlePlayPause = () => {
    if (!isPlaying) {
      setSessionStartTime(new Date());
      hasCompletedRef.current = false;
      start();
    } else if (isPaused) resume();
    else pause();
  };

  const handleCompletionClose = () => {
    setShowCompletionModal(false);
    setShowConfetti(false);
    setCompletedSessionData(null);
  };

  const selectPattern = (p: BreathingPattern) => {
    setPattern(p);
    setTargetRounds(p.recommendedRounds.min);
    setShowPatternModal(false);
  };

  const adjustRounds = (delta: number) => {
    const newRounds = Math.max(1, Math.min(99, targetRounds + delta));
    setTargetRounds(newRounds);
  };

  const getPhaseProgress = (targetPhase: string) => {
    if (phase === targetPhase) return phaseProgress;
    if (phase === "idle") return 0;
    const phaseOrder = ["inhale", "holdIn", "exhale", "holdOut"];
    const currentIdx = phaseOrder.indexOf(phase);
    const targetIdx = phaseOrder.indexOf(targetPhase);
    return currentIdx > targetIdx ? 1 : 0;
  };

  const cycleProgress = cycleCount / targetRounds;
  const totalCycleDuration =
    pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Confetti Animation */}
      <Confetti
        isActive={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Completion Modal */}
      <CompletionModal
        visible={showCompletionModal}
        onClose={handleCompletionClose}
        patternName={pattern.name}
        rounds={completedSessionData?.rounds || targetRounds}
        duration={completedSessionData?.duration || totalSessionTime}
        streak={streak}
        t={t.completion}
      />

      <View style={styles.content}>
        {/* Floating Sound Button */}
        <FloatingSoundButton style={styles.floatingSoundBtn} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Settings color={COLORS.muted} size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Statistics")}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <BarChart3 color={COLORS.primary} size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Focus")}
            style={styles.focusButton}
            activeOpacity={0.7}
          >
            <Timer color={COLORS.primary} size={22} />
            <Text style={styles.focusButtonText}>{t.home.focus}</Text>
          </TouchableOpacity>

          <View style={styles.streakContainer}>
            <Flame color={COLORS.secondary} size={24} fill={COLORS.secondary} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        </View>

        {/* Pattern Selector */}
        {!isPlaying && (
          <TouchableOpacity
            onPress={() => setShowPatternModal(true)}
            style={styles.patternSelector}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.patternSelectorTitle}>{pattern.name}</Text>
              <Text style={styles.patternSelectorDesc}>
                {pattern.description}
              </Text>
            </View>
            <ChevronDown color={COLORS.muted} size={20} />
          </TouchableOpacity>
        )}

        {/* Session Info - Cycle Counter & Time */}
        {isPlaying && (
          <View style={styles.sessionHeader}>
            <View style={styles.cycleCounter}>
              <Text style={styles.cycleCounterLabel}>{t.home.round}</Text>
              <Text style={styles.cycleCounterValue}>
                {cycleCount + 1} / {targetRounds}
              </Text>
            </View>
            <View style={styles.sessionTimer}>
              <Text style={styles.sessionTimerLabel}>{t.home.duration}</Text>
              <Text style={styles.sessionTimerValue}>
                {Math.floor(totalSessionTime / 60)}:
                {String(Math.floor(totalSessionTime % 60)).padStart(2, "0")}
              </Text>
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Main Breathing Circle */}
          <View
            style={[
              styles.circleContainer,
              { width: CIRCLE_SIZE, height: CIRCLE_SIZE },
            ]}
          >
            <Animated.View
              style={[
                styles.glowCircle,
                {
                  width: CIRCLE_SIZE - 40,
                  height: CIRCLE_SIZE - 40,
                  borderRadius: (CIRCLE_SIZE - 40) / 2,
                  backgroundColor: getPhaseColor(),
                },
                animatedGlowStyle,
              ]}
            />

            <Animated.View
              style={[
                styles.mainCircle,
                {
                  width: CIRCLE_SIZE - 40,
                  height: CIRCLE_SIZE - 40,
                  borderRadius: (CIRCLE_SIZE - 40) / 2,
                  backgroundColor: `${getPhaseColor()}15`,
                  borderColor: `${getPhaseColor()}40`,
                },
                animatedCircleStyle,
              ]}
            >
              <View style={styles.circleInner}>
                {phase !== "idle" && (
                  <Text style={styles.timerText}>
                    {Math.ceil(phaseTimeRemaining)}
                  </Text>
                )}
                <Text style={styles.phaseText}>{getPhaseText()}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Phase Progress Circles */}
          <View style={styles.phaseCirclesRow}>
            <PhaseCircle
              label={t.phaseLabels.inhale}
              duration={pattern.inhale}
              progress={getPhaseProgress("inhale")}
              isActive={phase === "inhale"}
              color={COLORS.primary}
            />
            {pattern.holdIn > 0 && (
              <PhaseCircle
                label={t.phaseLabels.holdIn}
                duration={pattern.holdIn}
                progress={getPhaseProgress("holdIn")}
                isActive={phase === "holdIn"}
                color={COLORS.amber}
              />
            )}
            <PhaseCircle
              label={t.phaseLabels.exhale}
              duration={pattern.exhale}
              progress={getPhaseProgress("exhale")}
              isActive={phase === "exhale"}
              color={COLORS.secondary}
            />
            {pattern.holdOut > 0 && (
              <PhaseCircle
                label={t.phaseLabels.holdOut}
                duration={pattern.holdOut}
                progress={getPhaseProgress("holdOut")}
                isActive={phase === "holdOut"}
                color={COLORS.purple}
              />
            )}
          </View>

          {/* Rounds Selector (when not playing) */}
          {!isPlaying && (
            <View style={styles.roundsSelector}>
              <Text style={styles.roundsSelectorLabel}>
                {t.home.targetRounds}
              </Text>
              <View style={styles.roundsSelectorControls}>
                <TouchableOpacity
                  onPress={() => adjustRounds(-1)}
                  style={styles.roundsButton}
                  activeOpacity={0.7}
                >
                  <Minus color={COLORS.white} size={20} />
                </TouchableOpacity>
                <Text style={styles.roundsValue}>{targetRounds}</Text>
                <TouchableOpacity
                  onPress={() => adjustRounds(1)}
                  style={styles.roundsButton}
                  activeOpacity={0.7}
                >
                  <Plus color={COLORS.white} size={20} />
                </TouchableOpacity>
              </View>
              <Text style={styles.roundsSelectorHint}>
                {t.home.recommended}: {pattern.recommendedRounds.min}-
                {pattern.recommendedRounds.max} {t.home.rounds}
              </Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlsRow}>
            {isPlaying && (
              <TouchableOpacity
                onPress={stop}
                style={styles.stopButton}
                activeOpacity={0.7}
              >
                <Square size={24} color={COLORS.red} fill={COLORS.red} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handlePlayPause}
              style={[
                styles.playButton,
                {
                  backgroundColor:
                    isPlaying && !isPaused ? COLORS.primary : COLORS.secondary,
                },
              ]}
              activeOpacity={0.8}
            >
              {isPlaying && !isPaused ? (
                <Pause
                  size={36}
                  color={COLORS.background}
                  fill={COLORS.background}
                />
              ) : (
                <Play
                  size={36}
                  color={COLORS.background}
                  fill={COLORS.background}
                  style={{ marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>
            {isPlaying && <View style={styles.spacer} />}
          </View>
        </View>

        {/* Banner Ad */}
        <View style={styles.bannerAd}>
          <Text style={styles.bannerAdText}>{t.home.bannerAd}</Text>
        </View>
      </View>

      {/* Pattern Selection Modal */}
      <Modal visible={showPatternModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.home.selectTechnique}</Text>
              <TouchableOpacity
                onPress={() => setShowPatternModal(false)}
                activeOpacity={0.7}
              >
                <X color={COLORS.muted} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {BREATHING_PATTERNS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => selectPattern(p)}
                  style={[
                    styles.patternOption,
                    pattern.id === p.id && styles.patternOptionActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.patternOptionHeader}>
                    <Text style={styles.patternOptionName}>{p.name}</Text>
                    <Text style={styles.patternOptionShort}>{p.nameShort}</Text>
                  </View>
                  <Text style={styles.patternOptionDesc}>{p.description}</Text>
                  <View style={styles.patternOptionTiming}>
                    <View
                      style={[
                        styles.timingBadge,
                        { backgroundColor: `${COLORS.primary}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timingBadgeText,
                          { color: COLORS.primary },
                        ]}
                      >
                        {p.inhale}s {t.home.inhaleShort}
                      </Text>
                    </View>
                    {p.holdIn > 0 && (
                      <View
                        style={[
                          styles.timingBadge,
                          { backgroundColor: `${COLORS.amber}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.timingBadgeText,
                            { color: COLORS.amber },
                          ]}
                        >
                          {p.holdIn}s {t.home.holdShort}
                        </Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.timingBadge,
                        { backgroundColor: `${COLORS.secondary}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timingBadgeText,
                          { color: COLORS.secondary },
                        ]}
                      >
                        {p.exhale}s {t.home.exhaleShort}
                      </Text>
                    </View>
                    {p.holdOut > 0 && (
                      <View
                        style={[
                          styles.timingBadge,
                          { backgroundColor: `${COLORS.purple}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.timingBadgeText,
                            { color: COLORS.purple },
                          ]}
                        >
                          {p.holdOut}s {t.home.holdShort}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  floatingSoundBtn: {
    bottom: 100,
    right: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  streakContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  streakText: { color: COLORS.secondary, fontWeight: "bold", fontSize: 20 },
  patternSelector: {
    marginHorizontal: 24,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  patternSelectorTitle: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
  patternSelectorDesc: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingVertical: 16,
  },
  cycleCounter: { alignItems: "center" },
  cycleCounterLabel: { color: COLORS.muted, fontSize: 12, marginBottom: 4 },
  cycleCounterValue: { color: COLORS.white, fontSize: 24, fontWeight: "bold" },
  sessionTimer: { alignItems: "center" },
  sessionTimerLabel: { color: COLORS.muted, fontSize: 12, marginBottom: 4 },
  sessionTimerValue: { color: COLORS.white, fontSize: 24, fontWeight: "bold" },
  mainContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  circleContainer: { alignItems: "center", justifyContent: "center" },
  glowCircle: { position: "absolute", opacity: 0.15 },
  mainCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  circleInner: { alignItems: "center", justifyContent: "center" },
  timerText: { fontSize: 56, fontWeight: "200", color: COLORS.white },
  phaseText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 4,
    marginTop: 8,
    color: COLORS.white,
  },
  phaseCirclesRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 16,
    paddingHorizontal: 16,
  },
  phaseCircleContainer: { alignItems: "center" },
  phaseCircleWrapper: { alignItems: "center", justifyContent: "center" },
  svgAbsolute: { position: "absolute" },
  phaseCircleContent: { alignItems: "center", justifyContent: "center" },
  phaseCircleDuration: { fontSize: 16, fontWeight: "bold" },
  phaseCircleLabel: { fontSize: 11, marginTop: 6, fontWeight: "500" },
  roundsSelector: { alignItems: "center", marginTop: 16, marginBottom: 16 },
  roundsSelectorLabel: { color: COLORS.muted, fontSize: 14, marginBottom: 8 },
  roundsSelectorControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  roundsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  roundsValue: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "bold",
    minWidth: 50,
    textAlign: "center",
  },
  roundsSelectorHint: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  controls: { alignItems: "center", paddingBottom: 16, paddingTop: 8 },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.gray700,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: { width: 64, height: 64 },
  focusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  focusButtonText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
  bannerAd: {
    width: "100%",
    height: 60,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
  },
  bannerAdText: { color: COLORS.muted, fontSize: 12, fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray800,
  },
  modalTitle: { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
  modalScroll: { paddingHorizontal: 16 },
  patternOption: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  patternOptionActive: { borderColor: COLORS.primary },
  patternOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patternOptionName: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
  patternOptionShort: { color: COLORS.muted, fontSize: 14 },
  patternOptionDesc: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  patternOptionTiming: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  timingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timingBadgeText: { fontSize: 12, fontWeight: "600" },
});
