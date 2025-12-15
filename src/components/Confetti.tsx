import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#22d3ee", // cyan
  "#4ade80", // green
  "#fbbf24", // amber
  "#a855f7", // purple
  "#ec4899", // pink
  "#ef4444", // red
  "#3b82f6", // blue
  "#f97316", // orange
];

const CONFETTI_COUNT = 50;

interface ConfettiPieceProps {
  index: number;
  onComplete?: () => void;
  isLast: boolean;
}

function ConfettiPiece({ index, onComplete, isLast }: ConfettiPieceProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const startX = Math.random() * SCREEN_WIDTH;
  const endX = startX + (Math.random() - 0.5) * 200;
  const size = Math.random() * 10 + 6;
  const isCircle = Math.random() > 0.5;
  const delay = Math.random() * 500;
  const duration = 2000 + Math.random() * 1000;

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(endX - startX + 30, { duration: duration / 3 }),
        withTiming(endX - startX - 30, { duration: duration / 3 }),
        withTiming(endX - startX, { duration: duration / 3 })
      )
    );

    rotate.value = withDelay(
      delay,
      withTiming(Math.random() * 720 - 360, {
        duration,
        easing: Easing.linear,
      })
    );

    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(
        0,
        {
          duration: duration * 0.3,
        },
        (finished) => {
          if (finished && isLast && onComplete) {
            runOnJS(onComplete)();
          }
        }
      )
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          width: size,
          height: isCircle ? size : size * 2,
          backgroundColor: color,
          borderRadius: isCircle ? size / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
}

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function Confetti({ isActive, onComplete }: ConfettiProps) {
  const confettiPieces = useMemo(() => {
    if (!isActive) return [];
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => i);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((index) => (
        <ConfettiPiece
          key={index}
          index={index}
          onComplete={onComplete}
          isLast={index === CONFETTI_COUNT - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confetti: {
    position: "absolute",
    top: 0,
  },
});
