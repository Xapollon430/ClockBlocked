import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

type Alarm = {
  userId: string;
  hours: number;
  minutes: number;
  selectedDays: number[];
  isEnabled: boolean;
  createdAt: admin.firestore.Timestamp;
};

// Check notifications every minute
export const checkNotifications = onSchedule(
  {
    schedule: "every minute 1 * * * *",
    timeZone: "America/New_York",
    memory: "256MiB",
    maxInstances: 1,
  },
  async (event): Promise<void> => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentWeekday = now.getDay(); // Sunday = 0, Monday = 1, etc.

    logger.info(
      `Checking notifications for ${currentHour
        .toString()
        .padStart(2, "0")}:${currentMinute
        .toString()
        .padStart(2, "0")} on weekday ${currentWeekday}`
    );

    try {
      // Normal mode: Query for enabled alarms that should trigger now
      const alarmsSnapshot = await admin
        .firestore()
        .collection("alarms")
        .where("isEnabled", "==", true)
        .where("hours", "==", currentHour)
        .where("minutes", "==", currentMinute)
        .get();

      logger.info(`Found ${alarmsSnapshot.size} alarms to check`);

      const notifications: Promise<any>[] = [];

      for (const doc of alarmsSnapshot.docs) {
        const alarm = doc.data() as Alarm;

        // Check if today is one of the selected days
        const shouldTrigger = alarm.selectedDays.includes(currentWeekday);

        if (shouldTrigger) {
          logger.info(
            `Triggering notification for alarm ${doc.id} (user: ${alarm.userId})`
          );
          notifications.push(
            triggerNotification(alarm.userId, alarm.hours, alarm.minutes)
          );
        }
      }

      // Wait for all notifications to be processed
      await Promise.allSettled(notifications);

      logger.info("Notification check completed successfully");
    } catch (error) {
      logger.error("Error checking notifications:", error);
      throw error;
    }
  }
);

// Callable function for testing specific alarms
export const testNotification = onCall(async (request) => {
  const alarmId = request.data.id;

  if (!alarmId) {
    throw new Error("Missing alarm ID. Call with {id: 'your-alarm-id'}");
  }

  try {
    logger.info(`Test mode: triggering specific alarm ID: ${alarmId}`);

    const alarmDoc = await admin
      .firestore()
      .collection("alarms")
      .doc(alarmId)
      .get();

    if (!alarmDoc.exists) {
      logger.warn(`Test alarm ${alarmId} not found`);
      return { success: false, error: `Alarm ${alarmId} not found` };
    }

    const alarm = alarmDoc.data() as Alarm;
    logger.info(
      `Triggering test notification for alarm ${alarmDoc.id} (user: ${alarm.userId})`
    );

    await triggerNotification(alarm.userId, alarm.hours, alarm.minutes);

    logger.info("Test notification completed successfully");
    return {
      success: true,
      message: `Test notification sent for alarm ${alarmId}`,
      alarm: {
        id: alarmDoc.id,
        userId: alarm.userId,
        hours: alarm.hours,
        minutes: alarm.minutes,
      },
    };
  } catch (error) {
    logger.error("Error in test notification:", error);
    return { success: false, error: "Internal server error", details: error };
  }
});

// Trigger notification for a user
async function triggerNotification(
  userId: string,
  hours: number,
  minutes: number
): Promise<void> {
  try {
    // Get user document to retrieve push token
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      logger.warn(`User ${userId} not found`);
      return;
    }

    const user = userDoc.data();

    if (!user.expoPushToken) {
      logger.warn(`No push token found for user ${userId}`);
      return;
    }

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: user.expoPushToken,
        sound: "alarm.wav",
        title: "ClockBlocked Alarm",
        body: "Wake Up Or Lose Money!",
        priority: "high",
      }),
    });

    const result = await response.json();
    if (result.data.status === "error") {
      logger.error(
        `Failed to send notification to ${user.expoPushToken}:`,
        result.data.message
      );
    } else {
      logger.info(`Successfully sent notification to ${user.expoPushToken}`);
    }
  } catch (error) {
    logger.error(`Error triggering notification for user ${userId}:`, error);
  }
}
