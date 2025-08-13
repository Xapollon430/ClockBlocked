import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function TabLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "New Sleep Alarm",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <IconSymbol name="chevron.left" size={28} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({});
