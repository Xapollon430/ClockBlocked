import React, { useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { TimerPicker } from "react-native-timer-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "@/components/Button";
import { DAYS } from "@/constants";
import { useStore } from "@/store/useStore";
import { createAlarm } from "@/services/alarmService";

export default function NewSleepAlarmScreen() {
  const router = useRouter();
  const { user } = useStore();

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [alarm, setAlarm] = useState({
    hours: 8,
    minutes: 22,
  });
  const [isSaving, setIsSaving] = useState(false);

  const toggleDay = (idx: number) => {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
    );
  };

  const handleSaveAlarm = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day for the alarm");
      return;
    }

    setIsSaving(true);
    try {
      await createAlarm(user.uid, alarm.hours, alarm.minutes, selectedDays);
      Alert.alert("Success", "Alarm created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error saving alarm:", error);
      Alert.alert("Error", "Failed to create alarm. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.timeSection}>
          <Text style={styles.sectionTitle}>Set Time</Text>
          <View style={styles.pickerWrapper}>
            <TimerPicker
              initialValue={{
                hours: alarm.hours,
                minutes: alarm.minutes,
              }}
              onDurationChange={(picked) => {
                setAlarm({ hours: picked.hours, minutes: picked.minutes });
              }}
              hideSeconds
              padWithNItems={2}
              use12HourPicker
              minuteLabel=""
              styles={styles.alarm}
              LinearGradient={LinearGradient}
            />
          </View>
        </View>

        <View style={styles.daysSection}>
          <Text style={styles.sectionTitle}>Repeat</Text>
          <View style={styles.daysGrid}>
            {DAYS.map((day, idx) => (
              <TouchableOpacity
                key={day}
                onPress={() => toggleDay(idx)}
                style={[
                  styles.dayButton,
                  selectedDays.includes(idx) && styles.dayButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    selectedDays.includes(idx) && styles.dayButtonTextSelected,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Save Alarm"
          onPress={handleSaveAlarm}
          disabled={isSaving}
          loading={isSaving}
          loadingText="Saving..."
          style={styles.saveButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  timeSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 20,
  },
  pickerWrapper: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
  },
  alarm: {
    backgroundColor: "#1C1C1E",
    text: {
      color: "white",
    },
  },
  daysSection: {
    marginBottom: 40,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    justifyContent: "center",
  },
  dayButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1C1C1E",
  },
  dayButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  dayButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },
  dayButtonTextSelected: {
    color: "#FFF",
  },
  saveButton: {
    marginTop: "auto",
  },
});
