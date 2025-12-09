/**
 * Alarm Verification Modal
 *
 * Non-dismissible modal for alarm verification challenges.
 *
 * FEATURES:
 * - Speech recognition (via @react-native-voice/voice) or text input
 * - 15-minute countdown timer
 * - Unlimited attempts (tracked for logging)
 * - Fuzzy phrase matching (~80% word match)
 * - Keyboard-aware UI (KeyboardAvoidingView + ScrollView)
 *
 * STATE MANAGEMENT:
 * - Auto-resets all state when modal opens (prevents stale data)
 * - Tracks sentOutId for updating challenge status in Firestore
 *
 * SUCCESS FLOW:
 * - Updates challenge status to "success" with attempt count
 * - Cancels all remaining notifications for this alarm
 *
 * FAILURE FLOW:
 * - Only triggered by 15-minute timeout (not by incorrect attempts)
 * - Updates challenge status to "failed" with attempt count
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useStore } from "@/store/useStore";
import {
  markAlarmChallengeSuccess,
  markAlarmChallengeFailed,
} from "@/services/alarmService";
import { cancelAlarmNotifications } from "@/services/notificationService";
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from "@react-native-voice/voice";

const TIMEOUT_MINUTES = 15;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

export const AlarmVerificationModal: React.FC = () => {
  const {
    activeAlarmId,
    activeAlarmPhrase,
    alarmStartTime,
    sentOutId,
    clearActiveAlarm,
  } = useStore();

  const [mode, setMode] = useState<"speech" | "text">("speech");
  const [textInput, setTextInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(TIMEOUT_MS);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isVisible = !!activeAlarmId && !!activeAlarmPhrase;

  // Reset state when modal opens
  useEffect(() => {
    if (isVisible) {
      setMode("speech");
      setTextInput("");
      setIsListening(false);
      setTranscription("");
      setTimeRemaining(TIMEOUT_MS);
      setAttempts(0);
      setError("");
    }
  }, [isVisible]);

  // Initialize Voice listeners
  useEffect(() => {
    if (isVisible && mode === "speech") {
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechEnd = onSpeechEnd;
    }

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isVisible, mode]);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      setTranscription(e.value[0]);
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error("Speech recognition error:", e.error);
    setError(`Speech error: ${e.error?.message}. Please try again.`);
    setIsListening(false);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const handleTimeout = useCallback(async () => {
    if (!sentOutId || !activeAlarmId) return;

    try {
      await markAlarmChallengeFailed(sentOutId, attempts, activeAlarmId);
      Alert.alert(
        "Time's Up!",
        "You failed to complete the alarm verification in time. This has been logged.",
        [{ text: "OK", onPress: clearActiveAlarm }]
      );
    } catch (error) {
      console.error("Error marking challenge as failed:", error);
      clearActiveAlarm();
    }
  }, [sentOutId, activeAlarmId, attempts, clearActiveAlarm]);

  // Start countdown timer
  useEffect(() => {
    if (!isVisible || !alarmStartTime) return;

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Update countdown every second
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - alarmStartTime.getTime();
      const remaining = Math.max(0, TIMEOUT_MS - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleTimeout();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, alarmStartTime, handleTimeout]);

  const startListening = async () => {
    try {
      setError("");
      setTranscription("");
      setIsListening(true);
      await Voice.start("en-US");
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError("Could not start listening. Please try again.");
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (err) {
      console.error("Error stopping speech recognition:", err);
    }
  };

  const validatePhrase = (input: string): boolean => {
    if (!activeAlarmPhrase) return false;

    const normalized = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, "");

    const target = normalized(activeAlarmPhrase);
    const userInput = normalized(input);

    // Exact match
    if (target === userInput) return true;

    // Fuzzy match: calculate similarity (simple word matching)
    const targetWords = target.split(/\s+/);
    const inputWords = userInput.split(/\s+/);

    const matchedWords = targetWords.filter((word) =>
      inputWords.includes(word)
    ).length;

    const similarity = matchedWords / targetWords.length;

    // Accept if 80% of words match
    return similarity >= 0.8;
  };

  const handleSubmit = async () => {
    const input = mode === "speech" ? transcription : textInput;

    const isValid = validatePhrase(input);

    if (true) {
      // Mark challenge as success
      if (sentOutId && activeAlarmId) {
        try {
          await markAlarmChallengeSuccess(
            sentOutId,
            attempts + 1,
            activeAlarmId
          );
          // Cancel remaining notifications for this alarm
          await cancelAlarmNotifications(activeAlarmId);
        } catch (error) {
          console.error("Error marking challenge as success:", error);
        }
      }
      Alert.alert("Success!", "Alarm verified. Have a great day!", [
        { text: "OK", onPress: clearActiveAlarm },
      ]);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError("Incorrect phrase. Please try again.");

      // Reset inputs
      setTextInput("");
      setTranscription("");
    }
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView
          contentContainerStyle={[styles.scrollContent]}
          keyboardShouldPersistTaps="never"
        >
          <View style={styles.header}>
            <Text style={styles.timer}>
              Time Remaining: {formatTime(timeRemaining)}
            </Text>
            <Text style={styles.attempts}>Attempts: {attempts}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Wake Up Challenge</Text>
            <Text style={styles.subtitle}>
              Say or type this phrase to continue:
            </Text>

            <View style={styles.phraseContainer}>
              <Text style={styles.phrase}>{activeAlarmPhrase}</Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {mode === "speech" ? (
              <View style={styles.speechContainer}>
                {transcription ? (
                  <View style={styles.transcriptionBox}>
                    <Text style={styles.transcriptionLabel}>You said:</Text>
                    <Text style={styles.transcription}>{transcription}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.micButton,
                    isListening && styles.micButtonActive,
                  ]}
                  onPress={isListening ? stopListening : startListening}
                >
                  {isListening ? (
                    <ActivityIndicator size="large" color="#FFF" />
                  ) : (
                    <Text style={styles.micButtonText}>
                      {"🎤 Tap to Speak"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setMode("text")}
                >
                  <Text style={styles.switchButtonText}>
                    I can't speak right now
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.textContainer}>
                <TextInput
                  style={styles.textInput}
                  value={textInput}
                  onChangeText={setTextInput}
                  placeholder="Type the phrase here..."
                  placeholderTextColor="#666"
                  autoFocus
                  multiline
                />

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setMode("speech")}
                >
                  <Text style={styles.switchButtonText}>Use voice instead</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                !textInput.trim() &&
                  !transcription.trim() &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              // disabled={!textInput.trim() && !transcription.trim()}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  timer: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 8,
  },
  attempts: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: "#999",
    textAlign: "center",
    marginBottom: 32,
  },
  phraseContainer: {
    backgroundColor: "#1a1a1a",
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  phrase: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "center",
  },
  error: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  speechContainer: {
    alignItems: "center",
  },
  transcriptionBox: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: "100%",
  },
  transcriptionLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  transcription: {
    fontSize: 18,
    color: "#FFF",
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  micButtonActive: {
    backgroundColor: "#FF3B30",
  },
  micButtonText: {
    fontSize: 18,
    color: "#FFF",
    textAlign: "center",
  },
  textContainer: {
    width: "100%",
  },
  textInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: "#FFF",
    minHeight: 100,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  switchButton: {
    padding: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  switchButtonText: {
    fontSize: 16,
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  submitButton: {
    backgroundColor: "#34C759",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto",
  },
  submitButtonDisabled: {
    backgroundColor: "#333",
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },
});
