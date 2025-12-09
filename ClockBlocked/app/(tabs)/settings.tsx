import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { getAuth, deleteUser } from "@react-native-firebase/auth";
import { getFirestore, doc, deleteDoc } from "@react-native-firebase/firestore";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useStore } from "@/store/useStore";
import { useRouter } from "expo-router";
import { deleteUserAlarms } from "@/services/alarmService";

export default function SettingsScreen() {
  const { user, reset } = useStore();
  const router = useRouter();

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const auth = getAuth();
              const currentUser = auth.currentUser;

              if (!currentUser) {
                Alert.alert("Error", "User not found");
                return;
              }

              // 1. Delete all user alarms and cancel notifications
              await deleteUserAlarms(currentUser.uid);

              // 2. Delete user document from Firestore users collection
              const db = getFirestore();
              await deleteDoc(doc(db, "users", currentUser.uid));

              // 3. Delete user account from Firebase Auth
              await deleteUser(currentUser);

              // 4. Reset local store (don't call logout() as user is already gone)
              reset();
              router.replace("/account-setup");
            } catch (error: any) {
              console.error("Error deleting account:", error);
              if (error.code === "auth/requires-recent-login") {
                Alert.alert(
                  "Security Check",
                  "Please log out and log in again to delete your account."
                );
              } else {
                Alert.alert(
                  "Error",
                  "Failed to delete account. Please try again."
                );
              }
            }
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
