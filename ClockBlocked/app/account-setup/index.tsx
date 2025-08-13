import {
  StyleSheet,
  ImageBackground,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from "react-native";
import React, { useState } from "react";

const texts = [
  "",
  // Step 1: Hugo's Problem
  "In 1830, Victor Hugo was hopelessly behind on his novel. Deadlines loomed, but he kept procrastinating.",
  // Step 2: The Commitment Device
  "Desperate, Hugo instructed his servant to lock him in a freezing cold room with no clothes. No way out—if he didn't write, he stayed trapped in the bitter cold.",
  // Step 3: The Result & Bridge to Product
  "With real consequences, Hugo finished The Hunchback of Notre Dame ahead of schedule. ClockBlocked brings that same power to your life. Ready to commit?",
];

const questions = [
  {
    text: "Are you a dog person?",
    id: "pets",
  },
  {
    text: "Do you prefer summer over winter?",
    id: "seasons",
  },
  {
    text: "Are you a morning person?",
    id: "morning",
  },
  {
    text: "Do you prefer coffee over tea?",
    id: "drinks",
  },
];

export default function AccountSetup() {
  const [storyIndex, setStoryIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [showingQuestions, setShowingQuestions] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [answers, setAnswers] = useState({});

  const handleStoryNext = () => {
    if (storyIndex < texts.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else {
      setShowingQuestions(true);
      setQuestionIndex(0);
    }
  };

  const handleAnswer = (answer: boolean) => {
    setAnswers((prev: Record<string, boolean>) => ({
      ...prev,
      [questions[questionIndex].id]: answer,
    }));

    if (questionIndex === questions.length - 1) {
      setShowLoginModal(true);
    } else {
      setQuestionIndex((prev) => prev + 1);
    }
  };

  const handleLogin = (provider: "google" | "apple") => {
    // Placeholder for login implementation
    console.log(`Login with ${provider}`);
  };

  return (
    <ImageBackground
      source={require("../../assets/images/hugo.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.contentContainer}>
        <Text style={styles.text}>
          {!showingQuestions
            ? "Victor Hugo's Story"
            : `Question ${questionIndex + 1}/4`}
        </Text>
        <View style={styles.storyContainer}>
          <Text style={styles.revealText}>
            {!showingQuestions
              ? texts[storyIndex]
              : questions[questionIndex]?.text}
          </Text>
          {!showingQuestions ? (
            <TouchableOpacity
              style={styles.circleButton}
              onPress={handleStoryNext}
            >
              <Text style={styles.buttonText}>
                {storyIndex === 0 ? "Start" : "Next"}
              </Text>
            </TouchableOpacity>
          ) : questionIndex < questions.length ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.answerButton}
                onPress={() => handleAnswer(true)}
              >
                <Text style={styles.answerButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.answerButton}
                onPress={() => handleAnswer(false)}
              >
                <Text style={styles.answerButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
      <Modal
        visible={showLoginModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Sign In Method</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => handleLogin("google")}
              >
                <Text style={styles.loginButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => handleLogin("apple")}
              >
                <Text style={styles.loginButtonText}>Sign in with Apple</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    margin: 120,
    padding: 30,
    width: "100%",
  },
  storyContainer: {
    alignItems: "center",
    gap: 20,
  },
  text: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
  },
  circleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 20,
    marginTop: 20,
  },
  answerButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  buttonText: {
    color: "#222",
    fontSize: 18,
    fontWeight: "bold",
  },
  answerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  revealText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
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
  },
  modalTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
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
});
