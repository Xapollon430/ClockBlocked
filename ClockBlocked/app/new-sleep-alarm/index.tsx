import { StyleSheet } from "react-native";
import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { TimerPicker } from "react-native-timer-picker";
import { LinearGradient } from "expo-linear-gradient";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function NewSleepAlarmScreen() {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [alarm, setAlarm] = useState<{ hours: number; minutes: number }>({
    hours: 7,
    minutes: 0,
  });

  const toggleDay = (idx: number) => {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.alarmStatus}>Time</Text>
      <View style={styles.centeredView}>
        <TimerPicker
          hours={alarm.hours}
          minutes={alarm.minutes}
          onChange={(picked) =>
            setAlarm({ hours: picked.hours, minutes: picked.minutes })
          }
          hideSeconds
          padWithNItems={2}
          use12HourPicker
          minuteLabel=""
          styles={styles.alarm}
          LinearGradient={LinearGradient}
        />
      </View>
      <Text style={styles.repeatLabel}>Repeat On</Text>
      <View style={styles.daysRow}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgb(28,30,33)",
    flex: 1,
    alignItems: "center",
  },
  alarmStatus: {
    marginVertical: 24,
    fontSize: 24,
    color: "#F1F1F1",
  },
  centeredView: {
    alignItems: "center",
  },
  alarm: {
    backgroundColor: "rgb(28,30,33)",
    text: {
      color: "white",
    },
    pickerContainer: {
      width: 150,
    },
  },

  repeatLabel: {
    fontSize: 18,
    marginVertical: 24,
    color: "#F1F1F1",
  },
  daysRow: {
    display: "flex",
    gap: 5,
    width: 200,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  dayButtonSelected: {
    backgroundColor: "#6C63FF",
  },
  dayButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  dayButtonTextSelected: {
    color: "#fff",
  },
  selectedDaysText: {
    fontSize: 16,
    color: "#888",
  },
});
