/**
 * Alarm Service
 *
 * Manages alarm CRUD operations and alarm verification challenge tracking.
 *
 * ALARM CHALLENGE FLOW:
 * 1. When first notification fires → Log to alarms_sent_out with status "pending"
 * 2. Subsequent notifications for same alarm → Reuse existing pending entry (no new DB writes)
 * 3. User completes challenge → Update status to "success" + cancel remaining notifications
 * 4. 15-minute timer expires → Update status to "failed"
 * 5. App restart → Check for pending challenges and restore modal if found
 *
 * KEY BEHAVIORS:
 * - Phrase is generated locally (not stored in DB)
 * - Only ONE pending entry per alarm (prevents duplicate logging)
 * - Modal stays open across multiple notifications (doesn't reopen with new phrase)
 * - Failed status only set on timeout, not on incorrect attempts
 */

import {
  getFirestore,
  collection,
  addDoc,
  where,
  query,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import {
  scheduleAlarmNotifications,
  cancelAlarmNotifications,
} from "./notificationService";

export type Alarm = {
  id: string;
  userId: string;
  hours: number;
  minutes: number;
  selectedDays: number[];
  isEnabled: boolean;
  createdAt: Date;
};

export type AlarmSentOut = {
  id?: string;
  userId: string;
  alarmId: string;
  sentAt: Date;
  challengeStatus: "pending" | "success" | "failed";
  completedAt?: Date;
  attemptsMade?: number;
};

const ALARMS_COLLECTION = "alarms";
const ALARMS_SENT_OUT_COLLECTION = "alarms_sent_out";

/**
 * Create a new alarm in Firestore
 */
export const createAlarm = async (
  userId: string,
  hours: number,
  minutes: number,
  selectedDays: number[]
): Promise<string> => {
  try {
    const db = getFirestore();
    const alarmData = {
      userId,
      hours,
      minutes,
      selectedDays,
      isEnabled: true,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, ALARMS_COLLECTION), alarmData);

    // Schedule notifications for the new alarm
    const newAlarm: Alarm = {
      id: docRef.id,
      userId,
      hours,
      minutes,
      selectedDays,
      isEnabled: true,
      createdAt: new Date(),
    };
    await scheduleAlarmNotifications(newAlarm);

    return docRef.id;
  } catch (error) {
    console.error("Error creating alarm:", error);
    throw error;
  }
};

/**
 * Get all alarms for a specific user
 */
export const getUserAlarms = async (userId: string): Promise<Alarm[]> => {
  try {
    const db = getFirestore();
    const q = query(
      collection(db, ALARMS_COLLECTION),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);

    const alarms: Alarm[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          hours: data.hours,
          minutes: data.minutes,
          selectedDays: data.selectedDays || [],
          isEnabled: data.isEnabled ?? true,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return alarms;
  } catch (error) {
    console.error("Error fetching alarms:", error);
    throw error;
  }
};

/**
 * Delete all alarms for a specific user
 * Used during account deletion
 */
export const deleteUserAlarms = async (userId: string): Promise<void> => {
  try {
    const alarms = await getUserAlarms(userId);
    const deletePromises = alarms.map((alarm) => deleteAlarm(alarm.id));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting user alarms:", error);
    throw error;
  }
};

/**
 * Delete an alarm by ID
 */
export const deleteAlarm = async (alarmId: string): Promise<void> => {
  try {
    // Cancel scheduled notifications first
    await cancelAlarmNotifications(alarmId);

    const db = getFirestore();
    await deleteDoc(doc(db, ALARMS_COLLECTION, alarmId));
  } catch (error) {
    console.error("Error deleting alarm:", error);
    throw error;
  }
};

/**
 * Toggle alarm enabled/disabled state
 */
export const toggleAlarmEnabled = async (
  alarmId: string,
  isEnabled: boolean
): Promise<void> => {
  try {
    const db = getFirestore();
    await updateDoc(doc(db, ALARMS_COLLECTION, alarmId), { isEnabled });
  } catch (error) {
    console.error("Error toggling alarm:", error);
    throw error;
  }
};

/**
 * Get a single alarm by ID
 */
export const getAlarmById = async (alarmId: string): Promise<Alarm | null> => {
  try {
    const db = getFirestore();
    const docRef = doc(db, ALARMS_COLLECTION, alarmId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    if (!data) {
      return null;
    }

    return {
      id: docSnap.id,
      userId: data.userId,
      hours: data.hours,
      minutes: data.minutes,
      selectedDays: data.selectedDays || [],
      isEnabled: data.isEnabled ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error fetching alarm:", error);
    throw error;
  }
};

/**
 * Update an existing alarm
 */
export const updateAlarm = async (
  alarmId: string,
  updates: {
    hours: number;
    minutes: number;
    selectedDays: number[];
  }
): Promise<void> => {
  try {
    const db = getFirestore();
    await updateDoc(doc(db, ALARMS_COLLECTION, alarmId), {
      hours: updates.hours,
      minutes: updates.minutes,
      selectedDays: updates.selectedDays,
    });

    // Reschedule notifications for the updated alarm
    // First cancel old notifications
    await cancelAlarmNotifications(alarmId);

    // Fetch the updated alarm to get all fields
    const updatedAlarm = await getAlarmById(alarmId);
    if (updatedAlarm && updatedAlarm.isEnabled) {
      await scheduleAlarmNotifications(updatedAlarm);
    }
  } catch (error) {
    console.error("Error updating alarm:", error);
    throw error;
  }
};

/**
 * Listen to real-time updates for user's alarms
 */
export const subscribeToUserAlarms = (
  userId: string,
  callback: (alarms: Alarm[]) => void
): (() => void) => {
  if (!userId) {
    console.error("subscribeToUserAlarms: userId is required");
    return () => {}; // Return empty unsubscribe function
  }

  const db = getFirestore();
  const q = query(
    collection(db, ALARMS_COLLECTION),
    where("userId", "==", userId)
  );
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const alarms: Alarm[] = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            hours: data.hours,
            minutes: data.minutes,
            selectedDays: data.selectedDays || [],
            isEnabled: data.isEnabled ?? true,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort in memory instead
      callback(alarms);
    },
    (error) => {
      console.error("Error listening to alarms:", error);
    }
  );

  return unsubscribe;
};

/**
 * Check if there's already a pending challenge for this alarm
 * Returns the sentOutId if found, null otherwise
 */
export const getExistingPendingChallenge = async (
  userId: string,
  alarmId: string
): Promise<string | null> => {
  try {
    const db = getFirestore();
    const q = query(
      collection(db, ALARMS_SENT_OUT_COLLECTION),
      where("userId", "==", userId),
      where("alarmId", "==", alarmId),
      where("challengeStatus", "==", "pending")
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error("Error checking for existing pending challenge:", error);
    return null;
  }
};

/**
 * Log when an alarm notification is sent out (status: pending)
 * Only creates a new entry if one doesn't already exist for this alarm
 */
export const logAlarmSentOut = async (
  userId: string,
  alarmId: string
): Promise<string> => {
  try {
    // Check if there's already a pending challenge for this alarm
    const existingId = await getExistingPendingChallenge(userId, alarmId);
    if (existingId) {
      console.log(
        `Pending challenge already exists: ${existingId} for alarm ${alarmId}`
      );
      return existingId;
    }

    // Create new pending challenge
    const db = getFirestore();
    const docRef = await addDoc(collection(db, ALARMS_SENT_OUT_COLLECTION), {
      userId,
      alarmId,
      sentAt: serverTimestamp(),
      challengeStatus: "pending",
    });
    console.log(`Logged alarm sent out: ${docRef.id} for alarm ${alarmId}`);
    return docRef.id;
  } catch (error) {
    console.error("Error logging alarm sent out:", error);
    throw error;
  }
};

/**
 * Update alarm sent out status to success
 * Called when user successfully completes the verification challenge
 * Reschedules the next occurrence of the alarm
 */
export const markAlarmChallengeSuccess = async (
  sentOutId: string,
  attemptsMade: number,
  alarmId: string
): Promise<void> => {
  try {
    const db = getFirestore();
    await updateDoc(doc(db, ALARMS_SENT_OUT_COLLECTION, sentOutId), {
      challengeStatus: "success",
      completedAt: serverTimestamp(),
      attemptsMade,
    });
    console.log(`Marked alarm challenge ${sentOutId} as success`);

    // Reschedule next occurrence
    const alarm = await getAlarmById(alarmId);
    if (alarm && alarm.isEnabled) {
      console.log(`Rescheduling next occurrence for alarm ${alarmId}`);
      await scheduleAlarmNotifications(alarm);
    }
  } catch (error) {
    console.error("Error marking alarm challenge as success:", error);
    throw error;
  }
};

/**
 * Update alarm sent out status to failed
 * Called when the 15-minute timer expires without successful completion
 * Reschedules the next occurrence of the alarm
 */
export const markAlarmChallengeFailed = async (
  sentOutId: string,
  attemptsMade: number,
  alarmId: string
): Promise<void> => {
  try {
    const db = getFirestore();
    await updateDoc(doc(db, ALARMS_SENT_OUT_COLLECTION, sentOutId), {
      challengeStatus: "failed",
      completedAt: serverTimestamp(),
      attemptsMade,
    });
    console.log(`Marked alarm challenge ${sentOutId} as failed`);

    // Reschedule next occurrence
    const alarm = await getAlarmById(alarmId);
    if (alarm && alarm.isEnabled) {
      console.log(`Rescheduling next occurrence for alarm ${alarmId}`);
      await scheduleAlarmNotifications(alarm);
    }
  } catch (error) {
    console.error("Error marking alarm challenge as failed:", error);
    throw error;
  }
};

/**
 * Get the most recent pending alarm challenge for a user
 */
export const getPendingAlarmChallenge = async (
  userId: string
): Promise<AlarmSentOut | null> => {
  try {
    const db = getFirestore();
    const q = query(
      collection(db, ALARMS_SENT_OUT_COLLECTION),
      where("userId", "==", userId),
      where("challengeStatus", "==", "pending")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    // Get the most recent pending challenge
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt?.toDate() || new Date(),
    })) as AlarmSentOut[];

    // Sort by sentAt descending and return the most recent
    docs.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    return docs[0];
  } catch (error) {
    console.error("Error getting pending alarm challenge:", error);
    return null;
  }
};
