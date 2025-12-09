import { create } from "zustand";
import { signOut, User } from "../firebase/auth";

type AuthState = {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  reset: () => void;
  // Alarm verification modal state
  activeAlarmId: string | null;
  activeAlarmPhrase: string | null;
  alarmStartTime: Date | null;
  sentOutId: string | null; // ID of the alarms_sent_out document
  setActiveAlarm: (
    alarmId: string,
    phrase: string,
    sentOutId: string,
    startTime?: Date
  ) => void;
  clearActiveAlarm: () => void;
};

export const useStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  activeAlarmId: null,
  activeAlarmPhrase: null,
  alarmStartTime: null,
  sentOutId: null,

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setUser: (user: User | null) =>
    set({
      user,
      isLoggedIn: !!user,
    }),

  reset: () =>
    set({
      user: null,
      isLoggedIn: false,
      isLoading: false,
      activeAlarmId: null,
      activeAlarmPhrase: null,
      alarmStartTime: null,
      sentOutId: null,
    }),

  setActiveAlarm: (
    alarmId: string,
    phrase: string,
    sentOutId: string,
    startTime?: Date
  ) =>
    set({
      activeAlarmId: alarmId,
      activeAlarmPhrase: phrase,
      alarmStartTime: startTime || new Date(),
      sentOutId,
    }),

  clearActiveAlarm: () =>
    set({
      activeAlarmId: null,
      activeAlarmPhrase: null,
      alarmStartTime: null,
      sentOutId: null,
    }),
}));
