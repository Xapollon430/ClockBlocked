import {
  StyleSheet,
  ImageBackground,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { useTypewriter } from "../../hooks/useTypewriter";
import { STORY_TEXTS, QUESTIONS } from "../../constants";
import { useStore } from "../../store/useStore";
import { signInWithGoogle } from "../../firebase/auth";

const { width: screenWidth } = Dimensions.get("window");

export default function AccountSetup() {
  const [storyIndex, setStoryIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [showingQuestions, setShowingQuestions] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [answers, setAnswers] = useState({});

  const { isLoading, setLoading, setUser } = useStore();

  let textToDisplay = "";
  if (!showingQuestions) {
    textToDisplay = STORY_TEXTS[storyIndex];
  } else if (!showSignIn) {
    textToDisplay = QUESTIONS[questionIndex]?.text;
  }

  const { displayedText, isTyping } = useTypewriter(textToDisplay);

  const handleStoryNext = () => {
    if (storyIndex < STORY_TEXTS.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else {
      setShowingQuestions(true);
      setQuestionIndex(0);
    }
  };

  const handleAnswer = (answer: string) => {
    setAnswers((prev: Record<string, string>) => ({
      ...prev,
      [QUESTIONS[questionIndex].id]: answer,
    }));

    if (questionIndex === QUESTIONS.length - 1) {
      setShowSignIn(true);
    } else {
      setQuestionIndex((prev) => prev + 1);
    }
  };

  const handleLogin = async (provider: "google" | "apple") => {
    if (provider === "google") {
      try {
        setLoading(true);
        const userData = await signInWithGoogle(answers);
        setUser(userData);
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to sign in");
      } finally {
        setLoading(false);
      }
    } else {
      // Apple sign-in placeholder
      Alert.alert("Coming Soon", "Apple sign-in will be available soon.");
    }
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
            : !showSignIn
            ? `Question ${questionIndex + 1}/4`
            : ""}
        </Text>
        <View style={styles.storyContainer}>
          <Text style={styles.revealText}>{displayedText}</Text>
          {!showingQuestions ? (
            <TouchableOpacity
              style={[styles.circleButton, isTyping && styles.disabledButton]}
              onPress={handleStoryNext}
              disabled={isTyping}
            >
              <Text
                style={[
                  styles.buttonText,
                  isTyping && styles.disabledButtonText,
                ]}
              >
                {storyIndex === 0 ? "Start" : "Next"}
              </Text>
            </TouchableOpacity>
          ) : showSignIn ? (
            <View style={styles.signInContainer}>
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  isLoading && styles.disabledSignInButton,
                ]}
                onPress={() => handleLogin("google")}
                disabled={isLoading}
              >
                <Text style={styles.signInButtonText}>
                  {isLoading ? "Signing in..." : "Sign in with Google"}
                </Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={styles.signInButton}
                onPress={() => handleLogin("apple")}
              >
                <Text style={styles.signInButtonText}>Sign in with Apple</Text>
              </TouchableOpacity> */}
            </View>
          ) : questionIndex < QUESTIONS.length ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.answerButton}
                onPress={() =>
                  handleAnswer(QUESTIONS[questionIndex].options[0])
                }
              >
                <Text style={styles.answerButtonText}>
                  {QUESTIONS[questionIndex].options[0]}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.answerButton}
                onPress={() =>
                  handleAnswer(QUESTIONS[questionIndex].options[1])
                }
              >
                <Text style={styles.answerButtonText}>
                  {QUESTIONS[questionIndex].options[1]}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
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
    paddingVertical: 15,
    borderRadius: 30,
    width: 160, // Fixed width for consistent size
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white", // White background to pop out
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: "#222",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  disabledButtonText: {
    color: "#888",
  },
  answerButtonText: {
    color: "black", // Dark text for contrast against white background
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  revealText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "left",
    width: screenWidth * 0.9,
    minHeight: 120,
    marginTop: 8,
  },
  signInContainer: {
    flex: 1,
    alignItems: "center",
    gap: 20,
    marginTop: 100,
    width: "100%",
  },
  signInButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  disabledSignInButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  signInButtonText: {
    color: "#222",
    fontSize: 16,
    fontWeight: "bold",
  },
});
