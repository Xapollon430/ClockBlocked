import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useStore } from "@/store/useStore";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const { logout, user } = useStore();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/account-setup");
          } catch (error) {
            Alert.alert("Error", "Failed to log out. Please try again.");
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert(
              "Coming Soon",
              "Account deletion will be available soon."
            );
          },
        },
      ]
    );
  };

  const handleAppInfo = () => {
    Alert.alert(
      "ClockBlocked",
      "Version 1.0.0\n\nA smart alarm app that helps you wake up on time.",
      [{ text: "OK" }]
    );
  };

  const handlePaymentMethods = () => {
    Alert.alert("Coming Soon", "Payment methods will be available soon.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* User Info Section */}
          {user && (
            <View style={styles.userSection}>
              <View style={styles.avatarContainer}>
                <IconSymbol
                  name="person.circle.fill"
                  size={60}
                  color="#007AFF"
                />
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          )}

          {/* Settings Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GENERAL</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleAppInfo}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="info.circle" size={24} color="#007AFF" />
                <Text style={styles.settingText}>App Info</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handlePaymentMethods}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="creditcard" size={24} color="#007AFF" />
                <Text style={styles.settingText}>Payment Methods</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>

            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <View style={styles.settingLeft}>
                <IconSymbol
                  name="arrow.right.square"
                  size={24}
                  color="#FF9500"
                />
                <Text style={styles.settingText}>Log Out</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.dangerItem]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="trash" size={24} color="#FF3B30" />
                <Text style={[styles.settingText, styles.dangerText]}>
                  Delete Account
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  },
  userSection: {
    alignItems: "center",

    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userEmail: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1C1C1E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
  dangerItem: {
    backgroundColor: "#1C1C1E",
  },
  dangerText: {
    color: "#FF3B30",
  },
});
