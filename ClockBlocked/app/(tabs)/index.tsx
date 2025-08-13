import { StyleSheet } from "react-native";
import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";

export default function AlarmsScreen() {
  return <View style={styles.container}></View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgb(28,30,33)",
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  alarmStatus: {
    fontSize: 24,
    color: "#F1F1F1",
  },
  centeredView: {
    alignItems: "center",
  },
  alarm: {
    backgroundColor: "rgb(15,17,25)",
    text: {
      color: "white",
    },
  },
  setAlarmButtonText: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    overflow: "hidden",
    borderColor: "#C2C2C2",
    color: "#C2C2C2",
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
