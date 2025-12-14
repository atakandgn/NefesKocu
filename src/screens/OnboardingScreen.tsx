import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Wind, Timer, Sparkles, ChevronRight } from "lucide-react-native";
import { OnboardingScreenProps } from "../types/navigation";
import { useTranslation } from "../hooks";

const { width } = Dimensions.get("window");
const ONBOARDING_KEY = "@breath_coach_onboarded";

const COLORS = {
  background: "#121212",
  muted: "#6b7280",
  white: "#FFFFFF",
};

// Slide icon and color mapping
const SLIDE_CONFIG = [
  { key: "breatheBetter" as const, icon: Wind, color: "#22d3ee" },
  { key: "stayFocused" as const, icon: Timer, color: "#4ade80" },
  { key: "buildHabits" as const, icon: Sparkles, color: "#fbbf24" },
];

export default function OnboardingScreen({
  navigation,
}: OnboardingScreenProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleNext = async () => {
    if (currentIndex < SLIDE_CONFIG.length - 1) {
      scale.value = withSpring(0.9);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        translateX.value = withSpring((currentIndex + 1) * -width);
        scale.value = withSpring(1);
      }, 100);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      navigation.replace("Home");
    } catch (error) {
      console.error("Error saving onboarding state:", error);
      navigation.replace("Home");
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const currentConfig = SLIDE_CONFIG[currentIndex];
  const currentSlide = t.onboarding.slides[currentConfig.key];
  const IconComponent = currentConfig.icon;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={completeOnboarding}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>{t.onboarding.skip}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Animated.View style={[styles.slideContent, animatedStyle]}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${currentConfig.color}20` },
              ]}
            >
              <IconComponent color={currentConfig.color} size={64} />
            </View>
            <Text style={styles.title}>{currentSlide.title}</Text>
            <Text style={styles.description}>{currentSlide.description}</Text>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <View style={styles.dotsContainer}>
            {SLIDE_CONFIG.map((config, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: index === currentIndex ? 24 : 8,
                    backgroundColor:
                      index === currentIndex ? currentConfig.color : "#3E3E3E",
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.nextButton,
              { backgroundColor: currentConfig.color },
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.nextText}>
              {currentIndex === SLIDE_CONFIG.length - 1
                ? t.onboarding.getStarted
                : t.onboarding.next}
            </Text>
            <ChevronRight color={COLORS.background} size={24} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipButton: { paddingVertical: 8, paddingHorizontal: 16 },
  skipText: { color: COLORS.muted, fontWeight: "500" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  slideContent: { alignItems: "center" },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    color: COLORS.muted,
    fontSize: 18,
    textAlign: "center",
    lineHeight: 28,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  dot: { height: 8, borderRadius: 4 },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextText: {
    color: COLORS.background,
    fontWeight: "bold",
    fontSize: 18,
    marginRight: 8,
  },
});
