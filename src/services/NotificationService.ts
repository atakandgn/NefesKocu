import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { WeekDay } from "../context/SettingsContext";

// Notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_NOTIFICATION_ID = "breath-coach-daily-reminder";

interface ReminderConfig {
  enabled: boolean;
  frequency: "daily" | "custom";
  selectedDays: WeekDay[];
  hour: number;
  minute: number;
}

interface NotificationContent {
  title: string;
  body: string;
}

// Request local notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return false;
    }

    // Android-specific channel setup
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Hatırlatıcılar",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#22d3ee",
      });
    }

    return true;
  } catch (error) {
    // Handle Expo Go limitations silently
    console.log("Notification permission request skipped:", error);
    return false;
  }
}

// Cancel all scheduled reminder notifications
export async function cancelAllReminderNotifications(): Promise<void> {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduledNotifications) {
    if (notification.identifier.startsWith(REMINDER_NOTIFICATION_ID)) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }
  }
}

// Schedule reminder notifications based on settings
export async function scheduleReminderNotifications(
  config: ReminderConfig,
  content: NotificationContent
): Promise<void> {
  // First, cancel existing reminders
  await cancelAllReminderNotifications();

  // Don't schedule if disabled
  if (!config.enabled) {
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log("Notification permission not granted");
    return;
  }

  const daysToSchedule =
    config.frequency === "daily"
      ? [0, 1, 2, 3, 4, 5, 6] // All days
      : config.selectedDays;

  // Schedule a notification for each selected day
  for (const weekday of daysToSchedule) {
    const trigger: Notifications.NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: weekday === 0 ? 1 : weekday + 1, // Expo uses 1=Sunday, 2=Monday, etc.
      hour: config.hour,
      minute: config.minute,
    };

    await Notifications.scheduleNotificationAsync({
      identifier: `${REMINDER_NOTIFICATION_ID}-${weekday}`,
      content: {
        title: content.title,
        body: content.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });
  }

  console.log(
    `Scheduled ${daysToSchedule.length} reminder notifications at ${config.hour}:${config.minute}`
  );
}

// Get all scheduled notifications (for debugging)
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Send an immediate test notification
export async function sendTestNotification(
  content: NotificationContent
): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log("Notification permission not granted");
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: true,
    },
    trigger: null, // Immediate notification
  });
}
