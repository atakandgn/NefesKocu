import React from "react";
import { View, StyleSheet } from "react-native";

interface BannerAdPlaceholderProps {
  height?: number;
}

export function BannerAdPlaceholder({ height = 50 }: BannerAdPlaceholderProps) {
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E1E1E",
    borderTopWidth: 1,
    borderTopColor: "#2E2E2E",
  },
  placeholder: {
    backgroundColor: "#374151",
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    opacity: 0.5,
    width: 320,
    height: 32,
  },
});
