import React from "react";
import { Modal, View, StyleSheet } from "react-native";

type GenericModalProps = {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
};

export const GenericModal = ({
  visible,
  onClose,
  children,
}: GenericModalProps) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose || (() => {})}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
    width: "80%",
    minHeight: 150,
  },
  modalButtons: {
    width: "100%",
    gap: 20,
  },
  loginButton: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#333",
    opacity: 0.6,
  },
});
