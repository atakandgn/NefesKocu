import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  AppState,
  AppStateStatus,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { X, RotateCcw, Clock } from "lucide-react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { FocusScreenProps } from "../types/navigation";
import {
  FloatingSoundButton,
  Confetti,
  FocusCompletionModal,
} from "../components";
import { useTranslation } from "../hooks";

const COLORS = {
  background: "#0a0a1a",
  gradientStart: "#0d1b2a",
  gradientMid: "#1b263b",
  gradientEnd: "#0a192f",
  primary: "#7dd3fc",
  accent: "#a78bfa",
  warm: "#fef3c7",
  muted: "#94a3b8",
  white: "#f8fafc",
  surface: "#1e293b",
};

const FOCUS_DURATIONS = [
  { label: "5 dk", value: 5 * 60 },
  { label: "15 dk", value: 15 * 60 },
  { label: "30 dk", value: 30 * 60 },
  { label: "45 dk", value: 45 * 60 },
];

const MOTIVATIONAL_MESSAGES_TR = [
  "Derin nefes al ve odaklan",
  "Şu ana odaklan",
  "Harika gidiyorsun",
  "Zihnini dinle",
  "Sakin kal",
  "Her an değerli",
  "Başarıyorsun",
  "Devam et, neredeyse oradasın",
  "Odaklanmış kal",
  "Nefesin ritmini hisset",
  "Rahatla ve devam et",
];

const MOTIVATIONAL_MESSAGES_EN = [
  "Take a deep breath and focus",
  "Stay in the moment",
  "You're doing great",
  "Listen to your mind",
  "Stay calm",
  "Every moment counts",
  "You got this",
  "Keep going, almost there",
  "Stay focused",
  "Feel the rhythm of your breath",
  "Relax and continue",
];

export default function FocusScreen({ navigation }: FocusScreenProps) {
  const { t, language } = useTranslation();
  const [initialDuration, setInitialDuration] = useState(30 * 60);
  const [seconds, setSeconds] = useState(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHours, setSelectedHours] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [messageIndex, setMessageIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Breathing animation
  const breathScale = useSharedValue(1);
  const breathOpacity = useSharedValue(0);
  const messageOpacity = useSharedValue(0.6);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [isActive, seconds]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/active/) &&
      nextAppState.match(/inactive|background/)
    ) {
      if (isActive) backgroundTime.current = Date.now();
    } else if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      if (isActive && backgroundTime.current) {
        const elapsed = Math.floor(
          (Date.now() - backgroundTime.current) / 1000
        );
        setSeconds((prev) => Math.max(0, prev - elapsed));
        backgroundTime.current = null;
      }
    }
    appState.current = nextAppState;
  };

  useEffect(() => {
    if (isActive && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  // Rotate motivational messages every 10 seconds
  useEffect(() => {
    if (isActive) {
      const messages =
        language === "tr" ? MOTIVATIONAL_MESSAGES_TR : MOTIVATIONAL_MESSAGES_EN;
      const msgInterval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 10000);
      return () => clearInterval(msgInterval);
    }
  }, [isActive, language]);

  // Calm breathing animation - organic and soothing
  useEffect(() => {
    if (isActive) {
      // Soft glow pulse
      breathOpacity.value = withRepeat(
        withTiming(0.4, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      // Gentle scale breathing
      glowScale.value = withRepeat(
        withTiming(1.05, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      // Message text breathing
      messageOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      breathOpacity.value = withTiming(0, { duration: 500 });
      glowScale.value = withTiming(1, { duration: 500 });
      messageOpacity.value = withTiming(0.6, { duration: 500 });
    }
  }, [isActive]);

  const ambientStyle = useAnimatedStyle(() => ({
    opacity: breathOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const messageAnimStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  const handleTimerComplete = useCallback(() => {
    setIsActive(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowConfetti(true);
    setShowCompletionModal(true);
  }, []);

  const handleCompletionClose = () => {
    setShowCompletionModal(false);
    setShowConfetti(false);
    navigation.goBack();
  };

  const handleCompletionAgain = () => {
    setShowCompletionModal(false);
    setShowConfetti(false);
    resetTimer();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    if (!hasStarted) setHasStarted(true);
    setIsActive(!isActive);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const resetTimer = () => {
    setIsActive(false);
    setHasStarted(false);
    setSeconds(initialDuration);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectDuration = (value: number) => {
    if (!isActive) {
      setInitialDuration(value);
      setSeconds(value);
      setHasStarted(false);
      setShowTimePicker(false);
      Haptics.selectionAsync();
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      setSelectedHours(hours);
      setSelectedMinutes(minutes);
    }
  };

  const applyCustomDuration = () => {
    const totalSeconds = selectedHours * 3600 + selectedMinutes * 60;
    if (totalSeconds > 0) {
      setInitialDuration(totalSeconds);
      setSeconds(totalSeconds);
      setHasStarted(false);
      setShowTimePicker(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const formatPickerTime = () => {
    if (selectedHours > 0) {
      return language === "tr"
        ? `${selectedHours} saat ${selectedMinutes} dakika`
        : `${selectedHours}h ${selectedMinutes}m`;
    }
    return language === "tr"
      ? `${selectedMinutes} dakika`
      : `${selectedMinutes} min`;
  };

  const getPickerDate = () => {
    const date = new Date();
    date.setHours(selectedHours, selectedMinutes, 0, 0);
    return date;
  };

  const handleEndSession = () => {
    if (isActive || hasStarted) {
      Alert.alert(
        language === "tr" ? "Oturumu Bitir?" : "End Session?",
        language === "tr"
          ? "Bu odak oturumunu bitirmek istediğinden emin misin?"
          : "Are you sure you want to end this focus session?",
        [
          { text: t.common.cancel, style: "cancel" },
          {
            text: language === "tr" ? "Bitir" : "End",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      {/* Confetti Animation */}
      <Confetti
        isActive={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Focus Completion Modal */}
      <FocusCompletionModal
        visible={showCompletionModal}
        onClose={handleCompletionClose}
        onAgain={handleCompletionAgain}
        focusTime={initialDuration}
        t={t.focusCompletion}
      />

      {/* Floating Sound Button */}
      <FloatingSoundButton style={styles.floatingSoundBtn} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleEndSession}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X color={COLORS.muted} size={20} />
          </TouchableOpacity>
        </View>

        {!hasStarted && (
          <View style={styles.durationContainer}>
            <View style={styles.durationSelector}>
              {FOCUS_DURATIONS.map((duration) => (
                <TouchableOpacity
                  key={duration.value}
                  onPress={() => selectDuration(duration.value)}
                  style={[
                    styles.durationButton,
                    initialDuration === duration.value &&
                      !showTimePicker &&
                      styles.durationButtonActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.durationText,
                      initialDuration === duration.value &&
                        !showTimePicker &&
                        styles.durationTextActive,
                    ]}
                  >
                    {duration.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customDurationRow}>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={styles.customButton}
                activeOpacity={0.7}
              >
                <Clock color={COLORS.muted} size={16} />
                <Text style={styles.customButtonText}>
                  {language === "tr" ? "Zaman Seç" : "Select Time"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableWithoutFeedback onPress={toggleTimer}>
          <View style={styles.mainContent}>
            {/* Organic ambient glow */}
            {isActive && (
              <Animated.View style={[styles.ambientGlow, ambientStyle]}>
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(125, 211, 252, 0.15)",
                    "rgba(167, 139, 250, 0.1)",
                    "transparent",
                  ]}
                  style={styles.glowGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </Animated.View>
            )}
            {hasStarted && !isActive && (
              <View style={styles.progressRing}>
                <View style={styles.progressRingInner} />
              </View>
            )}
            <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            {isActive ? (
              <Animated.Text style={[styles.statusText, messageAnimStyle]}>
                {
                  (language === "tr"
                    ? MOTIVATIONAL_MESSAGES_TR
                    : MOTIVATIONAL_MESSAGES_EN)[messageIndex]
                }
              </Animated.Text>
            ) : (
              <Text style={styles.statusText}>
                {hasStarted
                  ? language === "tr"
                    ? "Duraklatıldı"
                    : "Paused"
                  : language === "tr"
                  ? "Başlamak için dokun"
                  : "Tap to start"}
              </Text>
            )}
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.bottomControls}>
          {hasStarted && (
            <TouchableOpacity
              onPress={resetTimer}
              style={styles.resetButton}
              activeOpacity={0.7}
            >
              <RotateCcw color={COLORS.muted} size={18} />
              <Text style={styles.resetText}>
                {language === "tr" ? "Sıfırla" : "Reset"}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleEndSession}
            style={styles.endSessionButton}
            activeOpacity={0.5}
          >
            <Text style={styles.endSessionText}>{t.focus.endSession}</Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker Overlay */}
        {showTimePicker && (
          <View style={styles.timePickerOverlay}>
            <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
              <View style={styles.timePickerBackdrop} />
            </TouchableWithoutFeedback>
            <View style={styles.timePickerContainer}>
              <Text style={styles.pickerTitle}>
                {language === "tr" ? "Zaman Seç" : "Select Time"}
              </Text>

              <View style={styles.timePickerWrapper}>
                <DateTimePicker
                  value={getPickerDate()}
                  mode="countdown"
                  display="spinner"
                  onChange={onTimeChange}
                  textColor={COLORS.white}
                  themeVariant="dark"
                  style={styles.timePicker}
                  minuteInterval={1}
                />
              </View>
              <Text style={styles.selectedTimeText}>
                {language === "tr" ? "Seçilen" : "Selected"}:{" "}
                {formatPickerTime()}
              </Text>
              <View style={styles.timePickerButtonsRow}>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  style={styles.timePickerCancelButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timePickerCancelText}>
                    {t.common.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={applyCustomDuration}
                  style={[
                    styles.timePickerDoneButton,
                    selectedHours === 0 &&
                      selectedMinutes === 0 &&
                      styles.timePickerDoneButtonDisabled,
                  ]}
                  activeOpacity={0.7}
                  disabled={selectedHours === 0 && selectedMinutes === 0}
                >
                  <Text style={styles.timePickerDoneText}>
                    {language === "tr" ? "Uygula" : "Apply"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  floatingSoundBtn: {
    bottom: 120,
    right: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  durationSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  durationButtonActive: { backgroundColor: COLORS.primary },
  durationText: { color: "#9ca3af", fontWeight: "500" },
  durationTextActive: { color: COLORS.background },
  mainContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  ambientGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    overflow: "hidden",
  },
  progressRing: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 2,
    borderColor: "rgba(34,211,238,0.2)",
  },
  progressRingInner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 160,
    borderWidth: 2,
    borderColor: COLORS.primary,
    opacity: 0.4,
  },
  timerText: {
    color: COLORS.warm,
    fontSize: 96,
    fontWeight: "200",
    letterSpacing: -2,
    zIndex: 10,
    textShadowColor: "rgba(254, 243, 199, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 15,
    marginTop: 28,
    textTransform: "uppercase",
    letterSpacing: 3,
    zIndex: 10,
    fontWeight: "500",
  },
  durationContainer: {
    alignItems: "center",
    marginTop: 32,
  },
  customDurationRow: {
    marginTop: 16,
    alignItems: "center",
  },
  customButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.muted,
    borderStyle: "dashed",
  },
  customButtonText: {
    color: COLORS.muted,
    fontWeight: "500",
    fontSize: 14,
  },
  pickerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  timePickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  timePickerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  timePickerContainer: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    width: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  timePickerLabel: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  timePickerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  timePicker: {
    width: 260,
    height: 150,
  },
  selectedTimeText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  timePickerButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
    justifyContent: "center",
  },
  timePickerCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  timePickerCancelText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "600",
  },
  timePickerDoneButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  timePickerDoneButtonDisabled: {
    backgroundColor: COLORS.muted,
    opacity: 0.5,
  },
  timePickerDoneText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "600",
  },
  bottomControls: { paddingBottom: 32, paddingHorizontal: 24 },
  resetButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  resetText: { color: "#9ca3af", fontWeight: "500" },
  endSessionButton: { alignSelf: "center", marginTop: 16, paddingVertical: 12 },
  endSessionText: { color: "#64748b", fontSize: 14 },
  glowGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 180,
  },
});
