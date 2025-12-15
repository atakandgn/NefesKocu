import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { Target, Clock } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  background: "rgba(0, 0, 0, 0.85)",
  surface: "#1E1E1E",
  surfaceLight: "#2A2A2A",
  primary: "#7dd3fc",
  accent: "#a78bfa",
  white: "#FFFFFF",
  muted: "#9ca3af",
};

interface FocusCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onAgain: () => void;
  focusTime: number; // in seconds
  t: {
    title: string;
    subtitle: string;
    focusTime: string;
    close: string;
    again: string;
  };
}

export function FocusCompletionModal({
  visible,
  onClose,
  onAgain,
  focusTime,
  t,
}: FocusCompletionModalProps) {
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <Animated.View
          entering={ZoomIn.duration(400).springify()}
          style={styles.modalContainer}
        >
          {/* Trophy Icon */}
          <View style={styles.trophyContainer}>
            <Target size={48} color={COLORS.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: `${COLORS.primary}20` },
                ]}
              >
                <Clock size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{formatTime(focusTime)}</Text>
              <Text style={styles.statLabel}>{t.focusTime}</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.againButton}
              onPress={onAgain}
              activeOpacity={0.8}
            >
              <Text style={styles.againButtonText}>{t.again}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    width: SCREEN_WIDTH - 48,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  trophyContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 28,
    width: "100%",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.muted,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  againButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  againButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  closeButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0a0a1a",
  },
});

export default FocusCompletionModal;
