import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface BreathingCircleProps {
  phase: "inhale" | "hold" | "exhale" | "idle";
  phaseProgress: number;
  phaseDuration: number;
  animatedScale: SharedValue<number>;
  size?: number;
}

export function BreathingCircle({
  phase,
  phaseProgress,
  animatedScale,
  size = 280,
}: BreathingCircleProps) {
  const center = size / 2;
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2 - 20;
  const circumference = 2 * Math.PI * radius;

  const innerCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.value }],
  }));

  const progressOffset = circumference - phaseProgress * circumference;

  const getPhaseColor = () => {
    switch (phase) {
      case "inhale":
        return "#22d3ee";
      case "hold":
        return "#fbbf24";
      case "exhale":
        return "#4ade80";
      default:
        return "#6b7280";
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case "inhale":
        return "INHALE";
      case "hold":
        return "HOLD";
      case "exhale":
        return "EXHALE";
      default:
        return "READY";
    }
  };

  const phaseColor = getPhaseColor();
  const innerSize = size - 80;
  const midSize = size - 120;
  const coreSize = size - 160;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={phaseColor} stopOpacity={1} />
            <Stop offset="100%" stopColor={phaseColor} stopOpacity={0.5} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#2E2E2E"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      <Animated.View
        style={[
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: phaseColor,
            opacity: 0.15,
          },
          styles.centered,
          innerCircleStyle,
        ]}
      >
        <View
          style={[
            {
              width: midSize,
              height: midSize,
              borderRadius: midSize / 2,
              backgroundColor: phaseColor,
              opacity: 0.25,
            },
            styles.centered,
          ]}
        >
          <View
            style={[
              {
                width: coreSize,
                height: coreSize,
                borderRadius: coreSize / 2,
                backgroundColor: phaseColor,
                opacity: 0.4,
              },
              styles.centered,
            ]}
          >
            <Text style={styles.phaseText}>{getPhaseText()}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  svg: { position: "absolute" },
  centered: { alignItems: "center", justifyContent: "center" },
  phaseText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 4,
  },
});
