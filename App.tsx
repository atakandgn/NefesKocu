import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import AppNavigator from "./src/navigation/AppNavigator";
import { SoundProvider } from "./src/context/SoundContext";
import { SettingsProvider } from "./src/context/SettingsContext";

// Configure notification handler for local notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request local notification permissions on app start
async function requestLocalNotificationPermissions() {
  try {
    // Check existing permission status
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not already granted, request permission
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    // Android-specific: Create notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Hatırlatıcılar",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#22d3ee",
        sound: "default",
      });
    }

    console.log("Local notification permissions granted");
  } catch (error) {
    // Silently handle errors in Expo Go
    console.log("Notification setup skipped:", error);
  }
}

export default function App() {
  // Request local notification permissions on mount
  useEffect(() => {
    requestLocalNotificationPermissions();
  }, []);

  // Handle notification responses (when user taps on notification)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification tapped:", response);
        // Could navigate to a specific screen here
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <SoundProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </SoundProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
