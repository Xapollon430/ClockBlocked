import { Tabs, useRouter } from "expo-router";

import React from "react";
import {
  Platform,
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,

          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              // position: "absolute",
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Alarms",
            headerShown: true,
            headerTitle: "Alarms",
            headerRight: () => (
              <TouchableOpacity
                style={styles.headerRight}
                onPress={() => router.push("/new-sleep-alarm")}
              >
                <IconSymbol size={28} name="plus" color="white" />
              </TouchableOpacity>
            ),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="alarm.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="gearshape.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 16,
  },
});
