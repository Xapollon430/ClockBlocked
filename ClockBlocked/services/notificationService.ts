import * as Notifications from "expo-notifications";
import { Alarm } from "./alarmService";

// Number of repeat notifications per alarm (in case user doesn't wake up)
const NOTIFICATION_REPEATS = 10;
// Interval between repeat notifications (in seconds)
const REPEAT_INTERVAL_SECONDS = 17.5;

/**
 * Generate a deterministic notification identifier for an alarm
 * This allows us to cancel specific notifications later
 */
const getNotificationId = (alarmId: string, index: number): string => {
  return `alarm-${alarmId}-${index}`;
};

/**
 * Calculate the next occurrence of an alarm based on its time and selected days
 * @param alarm - The alarm to calculate the next occurrence for
 * @returns Date object for the next alarm time, or null if no valid time
 */
const getNextAlarmDate = (alarm: Alarm): Date | null => {
  const now = new Date();
  const alarmDate = new Date();
  alarmDate.setHours(alarm.hours, alarm.minutes, 0, 0);

  // Find the next day that matches selectedDays
  // selectedDays: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
    const checkDate = new Date(alarmDate);
    checkDate.setDate(checkDate.getDate() + daysAhead);
    const dayOfWeek = checkDate.getDay();

    if (alarm.selectedDays.includes(dayOfWeek)) {
      // If it's today but the time has passed, skip to next occurrence
      if (daysAhead === 0 && checkDate <= now) {
        continue;
      }
      return checkDate;
    }
  }
};

/**
 * Schedule notifications for a single alarm
 * Schedules multiple notifications (NOTIFICATION_REPEATS) spaced apart
 * @param alarm - The alarm to schedule notifications for
 * @returns Array of scheduled notification identifiers
 */
export const scheduleAlarmNotifications = async (
  alarm: Alarm
): Promise<string[]> => {
  if (!alarm.isEnabled) {
    return [];
  }

  const baseDate = getNextAlarmDate(alarm);
  if (!baseDate) {
    console.warn(`Could not calculate next date for alarm ${alarm.id}`);
    return [];
  }

  const scheduledIds: string[] = [];

  for (let i = 0; i < NOTIFICATION_REPEATS; i++) {
    const notificationDate = new Date(baseDate);
    notificationDate.setSeconds(
      notificationDate.getSeconds() + i * REPEAT_INTERVAL_SECONDS
    );

    // Don't schedule if the date is in the past
    if (notificationDate <= new Date()) {
      continue;
    }

    const identifier = getNotificationId(alarm.id, i);

    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: "ClockBlocked Alarm",
          body:
            i === 0
              ? "Wake Up And Conquer Constantinople!"
              : `Still sleeping? Wake up! (${i + 1}/${NOTIFICATION_REPEATS})`,
          sound: "alarm.wav",
          data: { type: "alarm", alarmId: alarm.id, repeatIndex: i },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
        },
      });

      scheduledIds.push(identifier);
      console.log(
        `Scheduled notification ${identifier} for ${notificationDate}`
      );
    } catch (error) {
      console.error(`Error scheduling notification ${identifier}:`, error);
    }
  }

  return scheduledIds;
};

/**
 * Cancel all scheduled notifications for a specific alarm
 * @param alarmId - The ID of the alarm to cancel notifications for
 */
export const cancelAlarmNotifications = async (
  alarmId: string
): Promise<void> => {
  for (let i = 0; i < NOTIFICATION_REPEATS; i++) {
    const identifier = getNotificationId(alarmId, i);
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log(`Cancelled notification ${identifier}`);
    } catch (error) {
      // Notification might not exist, that's okay
      console.log(`Could not cancel notification ${identifier}:`, error);
    }
  }
};

/**
 * Cancel all scheduled notifications and reschedule all enabled alarms
 * Call this when the app loads or when alarms change significantly
 * @param alarms - Array of all user alarms
 */
export const rescheduleAllAlarms = async (alarms: Alarm[]): Promise<void> => {
  console.log("Rescheduling all alarms...");

  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("Cancelled all existing notifications");

  // Schedule notifications for all enabled alarms
  const enabledAlarms = alarms.filter((alarm) => alarm.isEnabled);

  for (const alarm of enabledAlarms) {
    await scheduleAlarmNotifications(alarm);
  }

  console.log(
    `Scheduled notifications for ${enabledAlarms.length} enabled alarms`
  );
};

/**
 * Request notification permissions if not already granted
 * @returns true if permissions are granted, false otherwise
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const settings = await Notifications.getPermissionsAsync();

  if (settings.granted) {
    return true;
  }

  if (!settings.canAskAgain) {
    console.warn(
      "Cannot request notification permissions - user has denied permanently"
    );
    return false;
  }

  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
};
