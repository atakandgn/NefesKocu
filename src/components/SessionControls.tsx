import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Play, Pause, Square } from "lucide-react-native";

interface SessionControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function SessionControls({
  isPlaying,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
}: SessionControlsProps) {
  const handlePlayPausePress = () => {
    if (!isPlaying) onStart();
    else if (isPaused) onResume();
    else onPause();
  };

  return (
    <View style={styles.container}>
      {isPlaying && (
        <TouchableOpacity
          onPress={onStop}
          style={styles.stopButton}
          activeOpacity={0.7}
        >
          <Square size={24} color="#ef4444" fill="#ef4444" />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={handlePlayPausePress}
        style={[
          styles.playButton,
          { backgroundColor: isPlaying && !isPaused ? "#22d3ee" : "#4ade80" },
        ]}
        activeOpacity={0.8}
      >
        {isPlaying && !isPaused ? (
          <Pause size={36} color="#121212" fill="#121212" />
        ) : (
          <Play
            size={36}
            color="#121212"
            fill="#121212"
            style={{ marginLeft: 4 }}
          />
        )}
      </TouchableOpacity>
      {isPlaying && <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#374151",
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
});
