import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Trophy, Clock, Target, Flame, X } from "lucide-react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

const { width } = Dimensions.get("window");

const COLORS = {
  background: "#121212",
  surface: "#1E1E1E",
  surfaceLight: "#2A2A2A",
  primary: "#22d3ee",
  secondary: "#4ade80",
  amber: "#fbbf24",
  white: "#FFFFFF",
  muted: "#6b7280",
};

interface CompletionModalProps {
  visible: boolean;
  onClose: () => void;
  patternName: string;
  rounds: number;
  duration: number; // seconds
  streak: number;
  t: {
    title: string;
    subtitle: string;
    rounds: string;
    duration: string;
    streak: string;
    close: string;
  };
}

export function CompletionModal({
  visible,
  onClose,
  patternName,
  rounds,
  duration,
  streak,
  t,
}: CompletionModalProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={ZoomIn.duration(400).springify()}
          exiting={FadeOut.duration(200)}
          style={styles.modalContainer}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color={COLORS.muted} />
          </TouchableOpacity>

          {/* Trophy Icon */}
          <View style={styles.trophyContainer}>
            <Trophy size={64} color={COLORS.amber} fill={COLORS.amber} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
          <Text style={styles.patternName}>{patternName}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: "rgba(34, 211, 238, 0.15)" },
                ]}
              >
                <Target size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{rounds}</Text>
              <Text style={styles.statLabel}>{t.rounds}</Text>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: "rgba(74, 222, 128, 0.15)" },
                ]}
              >
                <Clock size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.statValue}>{formatDuration(duration)}</Text>
              <Text style={styles.statLabel}>{t.duration}</Text>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: "rgba(251, 191, 36, 0.15)" },
                ]}
              >
                <Flame size={24} color={COLORS.amber} fill={COLORS.amber} />
              </View>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>{t.streak}</Text>
            </View>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButtonMain}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>{t.close}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    width: width - 48,
    maxWidth: 380,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  trophyContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: 8,
    textAlign: "center",
  },
  patternName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 8,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 28,
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
  closeButtonMain: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: "100%",
  },
  closeButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
