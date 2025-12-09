import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <IconSymbol
              name="exclamationmark.triangle.fill"
              size={32}
              color="#FF9500"
            />
            <Text style={styles.modalTitle}>Important</Text>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔊</Text>
              <Text style={styles.infoText}>
                Keep your ringer <Text style={styles.bold}>ON</Text>. Do not
                silence your phone.
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📱</Text>
              <Text style={styles.infoText}>
                Do not force-close the app. Keep it open in the background.
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💸</Text>
              <Text style={styles.infoText}>
                Payment punishment mode will be available soon. For now, no
                charges.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
  },
  modalBody: {
    gap: 16,
    marginBottom: 24,
    width: "100%",
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    width: "100%",
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    fontSize: 16,
    color: "#CCC",
    lineHeight: 22,
    flex: 1,
  },
  bold: {
    fontWeight: "bold",
    color: "#FFF",
  },
  modalButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
