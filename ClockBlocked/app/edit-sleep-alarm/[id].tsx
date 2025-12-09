import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { TimerPicker } from "react-native-timer-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/Button";
import { DAYS } from "@/constants";
import {
  getAlarmById,
  updateAlarm,
  deleteAlarm,
} from "@/services/alarmService";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function EditSleepAlarmScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [alarm, setAlarm] = useState({
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    loadAlarm();
  }, [id]);

  const loadAlarm = async () => {
    try {
      if (!id) return;
      const alarmData = await getAlarmById(id);
      if (alarmData) {
        setAlarm({
          hours: alarmData.hours,
          minutes: alarmData.minutes,
        });
        setSelectedDays(alarmData.selectedDays);
      }
    } catch (error) {
      console.error("Error loading alarm:", error);
      Alert.alert("Error", "Failed to load alarm");
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleUpdateAlarm = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day for the alarm");
      return;
    }

    if (!user || !id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setSaving(true);
    try {
      await updateAlarm(id, {
        hours: alarm.hours,
        minutes: alarm.minutes,
        selectedDays,
      });

      Alert.alert("Success", "Alarm updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error updating alarm:", error);
      Alert.alert("Error", "Failed to update alarm. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlarm = () => {
    Alert.alert("Delete Alarm", "Are you sure you want to delete this alarm?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (!id) return;
            await deleteAlarm(id);
            router.back();
          } catch (error) {
            console.error("Error deleting alarm:", error);
            Alert.alert("Error", "Failed to delete alarm");
          }
        },
      },
    ]);
  };

  // We need to use useLayoutEffect to set header options dynamically because
  // Layout files don't have access to route params (id)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleDeleteAlarm}
          style={styles.deleteButton}
        >
          <IconSymbol
            name="trash"
            size={24}
            color="#FF3B30"
            style={{ left: 6 }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Time</Text>
          <View style={styles.pickerWrapper}>
            {/* Selection Highlight Bar */}
            <View style={styles.highlightBar} />
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repeat</Text>
          <View style={styles.daysContainer}>
            {DAYS.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  selectedDays.includes(index) && styles.dayButtonActive,
                ]}
                onPress={() => handleDayToggle(index)}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDays.includes(index) && styles.dayTextActive,
                  ]}
                >
                  {day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Update Alarm"
          onPress={handleUpdateAlarm}
          disabled={saving}
          loading={saving}
          loadingText="Updating..."
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 16,
  },
  pickerWrapper: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  highlightBar: {
    position: "absolute",
    top: "50%",
    height: 50,
    width: "100%",
    backgroundColor: "#3A3A3C",
    borderRadius: 10,
    marginTop: -15, // Half of height to center
  },
  alarm: {
    backgroundColor: "transparent", // Transparent so highlight bar shows through
    text: {
      color: "white",
    },
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 50,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3A3A3C",
  },
  dayButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  dayTextActive: {
    color: "#FFF",
  },
  saveButton: {
    marginTop: "auto",
  },
  deleteButton: {
    paddingRight: 8,
  },
});
