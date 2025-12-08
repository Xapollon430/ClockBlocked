# ClockBlocked System Architecture & User Flow

This document outlines the technical architecture, user flows, and design decisions for the ClockBlocked alarm application.

## 1. System Overview

ClockBlocked is an alarm application that requires users to perform a "verification challenge" (speaking or typing a motivational phrase) to dismiss the alarm. The system leverages **Firebase Firestore** for state tracking, **Expo Notifications** for scheduling, and **React Native Voice** for speech recognition.

---

## 2. Core Components

### A. Alarm Service (`services/alarmService.ts`)

- **Role:** Manages Alarm CRUD operations and challenge status updates.
- **Database:** Uses Firestore collection `alarms`.
- **Key Responsibility:** When an alarm is created or updated, it immediately calculates the _next_ occurrence and calls the Notification Service to schedule it.

### B. Notification Service (`services/notificationService.ts`)

- **Role:** Handles low-level scheduling with Expo Notifications.
- **Logic:**
  - Calculates the next valid date based on `selectedDays`.
  - **Burst Scheduling:** Schedules **5 notifications** spaced **18 seconds apart** for a single alarm event. This ensures that if the user misses the first brief notification, subsequent ones will ring.
  - **Buffer:** The 18s interval is designed to overlap slightly with the 17s custom alarm sound to create a continuous looping effect.

### C. Notification Hook (`hooks/useAlarmNotifications.ts`)

- **Role:** The "Brain" of the alarm trigger system running in the app.
- **Listeners:**
  1. **Foreground (`notificationListener`):** Detects alarm while app is open. Plays custom looping sound via `expo-av`.
  2. **Background/Lock (`responseListener`):** Detects when user taps a notification. Stops any pre-playing sound to allow the user to focus on the modal.
  3. **App Launch:** Checks `getLastNotificationResponseAsync` to handle cold starts from a notification tap.
- **State Management:** Logs the alarm as "pending" in Firestore immediately upon trigger.

### D. Verification Modal (`components/AlarmVerificationModal.tsx`)

- **Role:** The UI for the challenge. Non-dismissible (blocks back button/gestures).
- **Features:**
  - **Speech Recognition:** Uses `@react-native-voice/voice`.
  - **Unlimited Attempts:** User can try as many times as needed.
  - **Timeout:** 15-minute hard limit.
  - **Phrase Matching:** Fuzzy matching (~80% similarity) to account for speech-to-text imperfections.

---

## 3. User Flow & Data Lifecycle

### Phase 1: Alarm Creation

1. **User** creates alarm (e.g., 8:00 AM Mon-Fri).
2. **App** saves to Firestore `alarms`.
3. **App** calculates the _next_ single occurrence (e.g., next Monday at 8:00 AM).
4. **App** schedules 5 local notifications for that specific timestamp.

### Phase 2: Alarm Trigger (The Wake Up)

**Scenario A: Phone Locked**

1. System notification fires (Sound plays for 30s max iOS limit).
2. **User** taps notification.
3. App opens. `useAlarmNotifications` detects the tap.
4. **Logic:**
   - Logs entry to Firestore `alarms_sent_out` (Status: "pending").
   - Opens Verification Modal with a locally generated phrase.
   - **Audio:** Does _not_ play the app's internal loop (user is already interacting).

**Scenario B: App in Foreground**

1. `notificationListener` fires.
2. **Logic:**
   - Logs entry to Firestore `alarms_sent_out` (Status: "pending").
   - Opens Verification Modal.
   - **Audio:** Starts playing looping sound via `expo-av` immediately.

### Phase 3: The Challenge

1. **Modal** displays a random motivational phrase.
2. **User** attempts to speak the phrase.
3. **Validation:**
   - **Incorrect:** Shows error, increments attempt counter, allows retry.
   - **Correct:**
     1. Updates `alarms_sent_out` status to "success".
     2. Cancels the remaining 4 burst notifications (so they don't ring while you're awake).
     3. **Critical:** Calls `scheduleAlarmNotifications` to schedule the _next_ occurrence (e.g., Tuesday 8:00 AM).
     4. Closes modal.

### Phase 4: Failure (Timeout)

1. User ignores alarm or fails to verify for 15 minutes.
2. Timer expires.
3. **App** updates `alarms_sent_out` status to "failed".
4. **App** reschedules the next occurrence (so the user doesn't miss tomorrow's alarm too).
5. Modal closes.

---

## 4. Edge Cases & Handling

### 1. App Killed / Crash During Alarm

- **Problem:** User force-quits app while modal is open.
- **Solution:**
  - The "pending" status remains in Firestore `alarms_sent_out`.
  - On App Launch (`_layout.tsx`), the app checks for any "pending" challenges for the user.
  - If found, it **restores the modal**.
  - _Note:_ A new phrase is generated (phrases are not stored in DB for simplicity/privacy).

### 2. Multiple Notifications for Same Alarm

- **Problem:** The 5 burst notifications fire sequentially.
- **Solution:**
  - The system checks if a "pending" challenge already exists for this `alarmId` and `userId`.
  - If yes, it reuses the existing challenge ID.
  - It checks `!activeAlarmId` before opening the modal to ensure we don't reset the user's progress or change the phrase mid-attempt.

### 3. Recurring Alarms

- **Design Decision:** We do not use the OS's native "repeat" interval (which is limited).
- **Implementation:** "One-Shot with Reschedule".
  - We schedule _only_ the immediate next instance.
  - We rely on the **Success** or **Failure** callback to schedule the _subsequent_ instance.
  - _Risk:_ If the user's phone is off for a week, the chain breaks. (Acceptable trade-off for complex scheduling logic control).

### 4. Audio Persistence

- **Problem:** iOS kills background audio after 30s.
- **Solution:**
  - We use the **Notification Sound** (system) as the initial "wake up".
  - We use **In-App Audio** (`expo-av`) as the "sustained" alarm once the app is open.
  - We actively manage the Audio Session (play in silent mode, background active) in the hook.

---

## 5. Database Schema

### Collection: `alarms`

```typescript
{
  id: string;
  userId: string;
  hours: number;
  minutes: number;
  selectedDays: number[]; // 0=Sun, 1=Mon...
  isEnabled: boolean;
  createdAt: Timestamp;
}
```

### Collection: `alarms_sent_out`

```typescript
{
  id: string;
  userId: string;
  alarmId: string;
  sentAt: Timestamp;
  challengeStatus: "pending" | "success" | "failed";
  completedAt?: Timestamp;
  attemptsMade?: number;
}
```

## 6. Future Considerations

- **Offline Mode:** Currently relies on Firestore. If offline, logging might queue, but app logic should fail gracefully or store locally.
- **Hardened Rescheduling:** Consider a background fetch task to "heal" broken schedule chains if an alarm is missed completely.
