import React from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { formatTime } from "@/utils";
import { DAY_ABBREVIATIONS } from "@/constants";
import { Alarm } from "@/services/alarmService";

type AlarmCardProps = {
  alarm: Alarm;
  onToggle: (alarmId: string, currentState: boolean) => void;
};

export const AlarmCard = ({ alarm, onToggle }: AlarmCardProps) => {
  const router = useRouter();

  const handleCardPress = () => {
    router.push(`/edit-sleep-alarm/${alarm.id}`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainContent}
        onPress={handleCardPress}
        activeOpacity={0.8}
      >
        <View style={styles.timeSection}>
          <Text style={styles.alarmTime}>
            {formatTime(alarm.hours, alarm.minutes)}
          </Text>
          <View style={styles.daysContainer}>
            {DAY_ABBREVIATIONS.map((day, index) => (
              <View
                key={index}
                style={[
                  styles.dayCircle,
                  alarm.selectedDays.includes(index) && styles.dayCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.dayCircleText,
                    alarm.selectedDays.includes(index) &&
                      styles.dayCircleTextActive,
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.switchContainer}>
          <Switch
            value={alarm.isEnabled}
            onValueChange={() => onToggle(alarm.id, alarm.isEnabled)}
            trackColor={{ false: "#2A2A2A", true: "#007AFF" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 20,
  },
  mainContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeSection: {
    flex: 1,
    marginRight: 20,
  },
  alarmTime: {
    fontSize: 40,
    fontWeight: "300",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  daysContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircleActive: {
    backgroundColor: "#007AFF",
  },
  dayCircleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888888",
  },
  dayCircleTextActive: {
    color: "#FFFFFF",
  },
  switchContainer: {
    transform: [{ scale: 0.9 }],
  },
});
