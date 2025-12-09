import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { configureGoogleSignIn } from "@/firebase/auth";
import { useStore } from "@/store/useStore";
import { AlarmVerificationModal } from "@/components/AlarmVerificationModal";
import { getPendingAlarmChallenge } from "@/services/alarmService";
import { getRandomMotivationalPhrase } from "@/constants";

export default function RootLayout() {
  const router = useRouter();
  const [authInitialized, setAuthInitialized] = useState(false);
  const { isLoggedIn, setUser, setActiveAlarm, user } = useStore();

  // Initialize Firebase and configure Google Sign-In
  useEffect(() => {
    configureGoogleSignIn();

    // Set up auth state listener for persistence
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, update store
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
      } else {
        // User is signed out, reset store
        setUser(null);
      }
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Check for pending alarm challenges on app startup
  useEffect(() => {
    const checkPendingChallenge = async () => {
      if (user?.uid) {
        const pendingChallenge = await getPendingAlarmChallenge(user.uid);
        if (pendingChallenge && pendingChallenge.id) {
          // Restore the modal with a new random phrase (phrase not stored in DB)
          const phrase = getRandomMotivationalPhrase();
          setActiveAlarm(
            pendingChallenge.alarmId,
            phrase,
            pendingChallenge.id,
            pendingChallenge.sentAt
          );
        }
      }
    };

    if (authInitialized && isLoggedIn) {
      checkPendingChallenge();
    }
  }, [authInitialized, isLoggedIn, user?.uid]);

  useEffect(() => {
    if (authInitialized) {
      if (isLoggedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/account-setup");
      }
    }
  }, [authInitialized, isLoggedIn]);

  if (!authInitialized) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="account-setup" options={{ headerShown: false }} />
        <Stack.Screen name="new-sleep-alarm" options={{ headerShown: false }} />
        <Stack.Screen
          name="edit-sleep-alarm"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
      <AlarmVerificationModal />
    </ThemeProvider>
  );
}
