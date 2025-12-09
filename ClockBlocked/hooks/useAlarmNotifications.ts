/**
 * Alarm Notifications Hook
 *
 * Manages notification lifecycle and alarm verification modal triggering.
 *
 * NOTIFICATION HANDLING:
 * - First notification → Creates pending challenge in DB, opens modal with random phrase
 * - Subsequent notifications → Reuses existing pending challenge, modal stays open (no reopen)
 * - Notification tap → Same behavior as above
 *
 * MODAL STATE PROTECTION:
 * - Checks if modal already active before opening (prevents phrase changes mid-challenge)
 * - Phrase generated locally on first trigger only=
 * - All repeat notifications reference same pending challenge ID
 */

import { useEffect, useRef, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import { useStore } from "../store/useStore";
import {
  Alarm,
  getUserAlarms,
  logAlarmSentOut,
} from "../services/alarmService";
import {
  rescheduleAllAlarms,
  scheduleAlarmNotifications,
  cancelAlarmNotifications,
  requestNotificationPermissions,
} from "../services/notificationService";
import { getRandomMotivationalPhrase } from "../constants";

/**
 * Type definition for the alarm notification hook return value
 */
export type AlarmNotificationState = {
  stopAlarmSound: () => Promise<void>;
  scheduleAlarm: (alarm: Alarm) => Promise<string[]>;
  cancelAlarm: (alarmId: string) => Promise<void>;
  rescheduleAll: (alarms: Alarm[]) => Promise<void>;
};

/**
 * Configure how notifications are handled when received
 * Sets the behavior for incoming notifications including sound, alerts, and display
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Custom hook for managing local alarm notifications
 * Handles notification permissions, scheduling, cancellation, and sound playback
 * @returns {AlarmNotificationState} Object containing alarm notification functions
 */
export const useAlarmNotifications = (): AlarmNotificationState => {
  const { user, setActiveAlarm, activeAlarmId } = useStore();

  // Refs for managing notification listeners and sound object
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);
  const soundObject = useRef<Audio.Sound>(null);

  /**
   * Plays the alarm sound in a loop (for foreground)
   */
  const playAlarmSound = async () => {
    try {
      // Ensure audio mode is set correctly before playing
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });

      // Unload if exists
      if (soundObject.current) {
        try {
          await soundObject.current.stopAsync();
          await soundObject.current.unloadAsync();
        } catch (e) {
          // Ignore error if already unloaded
        }
      }

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/alarm.wav"),
        { isLooping: true }
      );

      soundObject.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error("Error playing alarm sound:", error);
    }
  };

  /**
   * Stops the alarm sound
   */
  const stopAlarmSound = useCallback(async () => {
    try {
      if (soundObject.current) {
        await soundObject.current.stopAsync();
        await soundObject.current.unloadAsync();
        soundObject.current = null;
      }
    } catch (error) {
      console.error("Error stopping alarm:", error);
    }
  }, []);

  /**
   * Watch for activeAlarmId changes to stop sound when alarm is cleared
   */
  useEffect(() => {
    if (!activeAlarmId) {
      stopAlarmSound();
    }
  }, [activeAlarmId, stopAlarmSound]);

  /**
   * Schedule notifications for a single alarm
   */
  const scheduleAlarm = useCallback(async (alarm: Alarm): Promise<string[]> => {
    return await scheduleAlarmNotifications(alarm);
  }, []);

  /**
   * Cancel notifications for a single alarm
   */
  const cancelAlarm = useCallback(async (alarmId: string): Promise<void> => {
    await cancelAlarmNotifications(alarmId);
  }, []);

  /**
   * Reschedule all alarms
   */
  const rescheduleAll = useCallback(async (alarms: Alarm[]): Promise<void> => {
    await rescheduleAllAlarms(alarms);
  }, []);

  /**
   * Initialize the notification system and set up event listeners
   */
  useEffect(() => {
    // Remove any existing listeners first to prevent memory leaks
    if (notificationListener.current) {
      notificationListener.current.remove();
    }
    if (responseListener.current) {
      responseListener.current.remove();
    }

    // Configure audio mode to ensure sound plays even in silent mode (iOS)
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    // Request notification permissions
    requestNotificationPermissions();

    // When user is logged in, fetch and schedule all their alarms
    const initializeAlarms = async () => {
      if (user?.uid) {
        try {
          const alarms = await getUserAlarms(user.uid);
          await rescheduleAllAlarms(alarms);
        } catch (error) {
          console.error("Error initializing alarms:", error);
        }
      }
    };

    initializeAlarms();

    // Helper function to handle notification logic
    const handleNotificationAction = async (alarmId: string) => {
      if (alarmId && user?.uid) {
        try {
          // Log alarm as pending (or get existing pending challenge ID)
          const sentOutId = await logAlarmSentOut(user.uid, alarmId);

          // Only set modal if not already active (prevents reopening with new phrase)
          if (!useStore.getState().activeAlarmId) {
            const phrase = getRandomMotivationalPhrase();
            setActiveAlarm(alarmId, phrase, sentOutId);

            // ALWAYS start playing alarm sound when modal opens
            // This ensures looping audio whether from foreground or background tap
            await playAlarmSound();
          }
        } catch (error) {
          console.error("Error handling notification action:", error);
        }
      }
    };

    // Check if app was launched by a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const alarmId = response.notification.request.content.data
          ?.alarmId as string;
        handleNotificationAction(alarmId);
      }
    });

    // Listen for incoming notifications and trigger modal
    notificationListener.current =
      Notifications.addNotificationReceivedListener(async (notification) => {
        const alarmId = notification.request.content.data?.alarmId as string;
        handleNotificationAction(alarmId);
      });

    // Listen for notification interactions (taps)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          const alarmId = response.notification.request.content.data
            ?.alarmId as string;
          handleNotificationAction(alarmId);
        }
      );

    // Cleanup: remove listeners and unload sound on component unmount
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();

      if (soundObject.current) {
        soundObject.current.unloadAsync();
      }
    };
  }, [user?.uid]);

  return {
    stopAlarmSound,
    scheduleAlarm,
    cancelAlarm,
    rescheduleAll,
  };
};
