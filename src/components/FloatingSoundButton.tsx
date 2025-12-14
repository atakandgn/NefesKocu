import React from "react";
import { TouchableOpacity, StyleSheet, View, Text } from "react-native";
import { Volume2, VolumeX } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSound } from "../context/SoundContext";

const COLORS = {
  background: "#121212",
  surface: "#1E1E1E",
  primary: "#22d3ee",
  muted: "#6b7280",
  white: "#FFFFFF",
};

interface FloatingSoundButtonProps {
  style?: object;
}

export default function FloatingSoundButton({
  style,
}: FloatingSoundButtonProps) {
  const { isAnyPlaying, isMuted, activeSoundsCount, toggleMute } = useSound();

  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (isAnyPlaying && !isMuted) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isAnyPlaying, isMuted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Don't show if no sounds are playing
  if (!isAnyPlaying) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <TouchableOpacity
        onPress={toggleMute}
        style={[
          styles.button,
          isMuted ? styles.buttonMuted : styles.buttonActive,
        ]}
        activeOpacity={0.8}
      >
        {isMuted ? (
          <VolumeX size={20} color={COLORS.muted} />
        ) : (
          <Volume2 size={20} color={COLORS.primary} />
        )}
        {activeSoundsCount > 0 && !isMuted && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeSoundsCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 100,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary + "50",
  },
  buttonMuted: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.muted + "30",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "700",
  },
});
