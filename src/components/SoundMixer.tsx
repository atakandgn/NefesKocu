import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Waves,
  TreePine,
  Flame,
  CloudRain,
  Wind,
  Train,
  Music,
  Bell,
} from "lucide-react-native";
import { useSound } from "../context/SoundContext";
import { useTranslation } from "../hooks";

const COLORS = {
  background: "#121212",
  surface: "#1E1E1E",
  surfaceLight: "#2E2E2E",
  primary: "#22d3ee",
  accent: "#a78bfa",
  secondary: "#4ade80",
  muted: "#6b7280",
  white: "#FFFFFF",
};

// Sound categories config (icons only, text from translations)
const SOUND_CATEGORIES_CONFIG = [
  {
    id: "nature",
    key: "nature" as const,
    icon: TreePine,
    sounds: [
      { id: "rain", key: "rain" as const, icon: CloudRain },
      { id: "ocean_waves", key: "ocean_waves" as const, icon: Waves },
      { id: "waves", key: "waves" as const, icon: Waves },
      { id: "forest", key: "forest" as const, icon: TreePine },
      { id: "forest_birds", key: "forest_birds" as const, icon: TreePine },
      { id: "fire", key: "fire" as const, icon: Flame },
    ],
  },
  {
    id: "city",
    key: "city" as const,
    icon: Train,
    sounds: [{ id: "train", key: "train" as const, icon: Train }],
  },
  {
    id: "zen",
    key: "zen" as const,
    icon: Music,
    sounds: [
      { id: "bowls", key: "bowls" as const, icon: Bell },
      { id: "chimes", key: "chimes" as const, icon: Wind },
    ],
  },
];

export default function SoundMixer() {
  const { t } = useTranslation();
  const {
    sounds,
    masterVolume,
    isMuted,
    activeSoundsCount,
    toggleSound,
    adjustVolume,
    setMasterVolume,
    toggleMute,
  } = useSound();

  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "nature"
  );

  const renderVolumeBar = (volume: number) => {
    const bars = 5;
    // Convert volume (0.2-1.0) to level (1-5)
    const level = Math.round(volume * 5);
    return (
      <View style={styles.volumeBars}>
        {Array.from({ length: bars }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.volumeBar,
              {
                backgroundColor:
                  i < level ? COLORS.primary : COLORS.surfaceLight,
                height: 8 + i * 3,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Volume2 size={24} color={COLORS.primary} />
        <Text style={styles.headerTitle}>{t.sounds.backgroundSounds}</Text>
        {activeSoundsCount > 0 && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>
              {activeSoundsCount} {t.sounds.active}
            </Text>
          </View>
        )}
      </View>

      {/* Master Controls */}
      <View style={styles.masterControls}>
        <TouchableOpacity
          onPress={toggleMute}
          style={styles.muteButton}
          activeOpacity={0.7}
        >
          {isMuted ? (
            <VolumeX size={20} color={COLORS.muted} />
          ) : (
            <Volume2 size={20} color={COLORS.primary} />
          )}
        </TouchableOpacity>
        <View style={styles.masterVolumeContainer}>
          <Text style={styles.masterLabel}>{t.sounds.masterVolume}</Text>
          <View style={styles.masterSlider}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setMasterVolume(level)}
                style={[
                  styles.masterDot,
                  masterVolume >= level && styles.masterDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Sound Categories */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        style={styles.scrollView}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.scrollViewContent}
      >
        {SOUND_CATEGORIES_CONFIG.map((category) => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategory === category.id;
          const categoryTitle = t.sounds.categories[category.key];

          return (
            <View key={category.id} style={styles.category}>
              <TouchableOpacity
                onPress={() =>
                  setExpandedCategory(isExpanded ? null : category.id)
                }
                style={styles.categoryHeader}
                activeOpacity={0.7}
              >
                <CategoryIcon size={18} color={COLORS.accent} />
                <Text style={styles.categoryTitle}>{categoryTitle}</Text>
                {isExpanded ? (
                  <ChevronUp size={16} color={COLORS.muted} />
                ) : (
                  <ChevronDown size={16} color={COLORS.muted} />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.soundsList}>
                  {category.sounds.map((sound) => {
                    const SoundIcon = sound.icon;
                    const soundState = sounds[sound.id];
                    const isPlaying = soundState?.isPlaying;
                    const volume = soundState?.volume || 0.5;
                    const soundName = t.sounds.items[sound.key];

                    return (
                      <View key={sound.id} style={styles.soundItem}>
                        <TouchableOpacity
                          onPress={() => toggleSound(sound.id)}
                          style={[
                            styles.soundButton,
                            isPlaying && styles.soundButtonActive,
                          ]}
                          activeOpacity={0.7}
                        >
                          <SoundIcon
                            size={16}
                            color={isPlaying ? COLORS.primary : COLORS.muted}
                          />
                          <Text
                            style={[
                              styles.soundName,
                              isPlaying && styles.soundNameActive,
                            ]}
                          >
                            {soundName}
                          </Text>
                        </TouchableOpacity>

                        {isPlaying && (
                          <View style={styles.volumeControls}>
                            <TouchableOpacity
                              onPress={() => adjustVolume(sound.id, -0.2)}
                              style={styles.volumeBtn}
                            >
                              <Text style={styles.volumeBtnText}>−</Text>
                            </TouchableOpacity>
                            {renderVolumeBar(volume)}
                            <TouchableOpacity
                              onPress={() => adjustVolume(sound.id, 0.2)}
                              style={styles.volumeBtn}
                            >
                              <Text style={styles.volumeBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Tip */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>💡 {t.sounds.tip}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  activeBadge: {
    backgroundColor: COLORS.primary + "30",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  masterControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    marginBottom: 12,
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  masterVolumeContainer: {
    flex: 1,
  },
  masterLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  masterSlider: {
    flexDirection: "row",
    gap: 8,
  },
  masterDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  masterDotActive: {
    backgroundColor: COLORS.primary,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollViewContent: {
    paddingBottom: 8,
  },
  category: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight + "50",
  },
  categoryTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  soundsList: {
    paddingLeft: 16,
    paddingTop: 8,
    gap: 6,
  },
  soundItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  soundButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    flex: 1,
    marginRight: 8,
  },
  soundButtonActive: {
    backgroundColor: COLORS.primary + "25",
    borderWidth: 1,
    borderColor: COLORS.primary + "50",
  },
  soundName: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  soundNameActive: {
    color: COLORS.primary,
  },
  volumeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  volumeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  volumeBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: -2,
  },
  volumeBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 20,
  },
  volumeBar: {
    width: 4,
    borderRadius: 2,
  },
  tipContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.accent + "20",
  },
  tipText: {
    color: COLORS.accent,
    fontSize: 12,
    textAlign: "center",
  },
});
