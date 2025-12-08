import {
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
  Text,
} from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useState, useCallback } from "react";
import { View } from "react-native";
import { useStore } from "@/store/useStore";
import { useFocusEffect } from "expo-router";
import {
  getUserAlarms,
  toggleAlarmEnabled,
  Alarm,
} from "@/services/alarmService";
import { AlarmCard } from "@/components/AlarmCard";
import { useAlarmNotifications } from "@/hooks/useAlarmNotifications";
import {
  scheduleAlarmNotifications,
  cancelAlarmNotifications,
} from "@/services/notificationService";

export default function AlarmsScreen() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useStore();

  // Initialize notification listeners
  useAlarmNotifications();

  const fetchAlarms = useCallback(async () => {
    try {
      const userAlarms = await getUserAlarms(user?.uid);
      setAlarms(userAlarms);
    } catch (error) {
      console.error("Error fetching alarms:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      fetchAlarms();
    }, [fetchAlarms])
  );

  const handleToggleAlarm = async (alarmId: string, currentState: boolean) => {
    try {
      // Update UI immediately
      const updatedAlarms = alarms.map((alarm) =>
        alarm.id === alarmId ? { ...alarm, isEnabled: !currentState } : alarm
      );
      setAlarms(updatedAlarms);

      // Update in Firestore
      await toggleAlarmEnabled(alarmId, !currentState);

      // Update notifications
      const toggledAlarm = updatedAlarms.find((a) => a.id === alarmId);
      if (toggledAlarm) {
        if (toggledAlarm.isEnabled) {
          // Schedule notifications for this alarm
          await scheduleAlarmNotifications(toggledAlarm);
        } else {
          // Cancel notifications for this alarm
          await cancelAlarmNotifications(alarmId);
        }
      }
    } catch (error) {
      // If toggle fails, refresh alarms from server
      const userAlarms = await getUserAlarms(user!.uid);
      setAlarms(userAlarms);
      Alert.alert("Error", "Failed to toggle alarm");
    }
  };

  const renderAlarmItem = ({ item }: { item: Alarm }) => (
    <AlarmCard alarm={item} onToggle={handleToggleAlarm} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (alarms.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <IconSymbol name="alarm" size={64} color="#666" />
          <Text style={styles.emptyText}>No alarms yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to create your first alarm
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={alarms}
        renderItem={renderAlarmItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
