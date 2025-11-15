/**
 * ChatScreen
 *
 * ChatGPT-inspired clean chat interface with interactive exercise swap cards.
 * Single header, iOS Messages-style bubbles, minimal input bar.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChatBubble,
  ChatInput,
  ChatHeader,
  ExerciseSwapCard,
  ExerciseSwapData,
} from "../components/chat";
import tokens from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";
import { apiClient } from "../services/api/client";

interface BaseMessage {
  id: string;
  timestamp: Date;
  isUser: boolean;
}

interface TextMessage extends BaseMessage {
  type: "text";
  text: string;
}

interface ExerciseSwapMessage extends BaseMessage {
  type: "exercise_swap";
  originalExercise: string;
  substitutes: ExerciseSwapData[];
  message: string;
  showMoreAvailable?: boolean;
}

type Message = TextMessage | ExerciseSwapMessage;

export default function ChatScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "text",
      text: "Hey! Ready to crush today's workout?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleExerciseSwap = async (exerciseName: string, reason?: string) => {
    try {
      // Call swap endpoint
      const response = await apiClient.post("/api/chat/swap-exercise", {
        exercise_name: exerciseName,
        reason: reason,
        show_more: false,
      });

      // Add swap message with cards
      const swapMessage: ExerciseSwapMessage = {
        id: Date.now().toString(),
        type: "exercise_swap",
        originalExercise: response.original_exercise,
        substitutes: response.substitutes,
        message: response.message,
        showMoreAvailable: response.show_more_available,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, swapMessage]);
    } catch (error) {
      console.error("Failed to get exercise swaps:", error);

      // Add error message
      const errorMessage: TextMessage = {
        id: Date.now().toString(),
        type: "text",
        text: `Sorry, I couldn't find alternatives for ${exerciseName}. Please try again or ask me for specific suggestions.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleExerciseSelect = async (
    originalExercise: string,
    selectedExercise: ExerciseSwapData,
  ) => {
    // Add confirmation message
    const confirmMessage: TextMessage = {
      id: Date.now().toString(),
      type: "text",
      text: `Perfect! I've swapped ${originalExercise} for ${selectedExercise.substitute_name}. Ready to log your set? 💪`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);

    // TODO: Actually update the workout log in WatermelonDB
    // This would involve finding the current workout and updating the exercise
    // For now, just show confirmation
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: TextMessage = {
      id: Date.now().toString(),
      type: "text",
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputText;
    setInputText("");
    setLoading(true);

    try {
      // First, classify the message
      const classification = await apiClient.post("/api/chat/classify", {
        message: messageText,
        user_id: "user_123", // TODO: Get from auth context
        conversation_history: messages
          .slice(-5)
          .filter((m) => m.type === "text")
          .map((m) => ({
            role: m.isUser ? "user" : "assistant",
            content: (m as TextMessage).text,
          })),
      });

      // Handle based on message type
      if (classification.message_type === "exercise_swap") {
        // Extract exercise name from message or classification
        const exerciseName =
          classification.extracted_data?.exercise_name || messageText;
        const reason = classification.extracted_data?.reason;

        await handleExerciseSwap(exerciseName, reason);
      } else if (classification.message_type === "workout_log") {
        // TODO: Parse and log workout
        const aiMessage: TextMessage = {
          id: (Date.now() + 1).toString(),
          type: "text",
          text: "Got it! Logged your set. 💪",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else if (classification.message_type === "question") {
        // Call AI Coach
        const response = await apiClient.post("/api/coach/question", {
          user_id: "user_123", // TODO: Get from auth context
          question: messageText,
        });

        const aiMessage: TextMessage = {
          id: (Date.now() + 1).toString(),
          type: "text",
          text: response.answer,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // General/onboarding - simple response
        const aiMessage: TextMessage = {
          id: (Date.now() + 1).toString(),
          type: "text",
          text: "I'm here to help! You can log workouts, ask questions, or swap exercises. What would you like to do?",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);

      // Show error to user
      Alert.alert(
        "Connection Error",
        "Failed to reach the AI coach. Please check your connection and try again.",
        [{ text: "OK" }],
      );

      // Add error message as AI response
      const errorMessage: TextMessage = {
        id: (Date.now() + 1).toString(),
        type: "text",
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === "text") {
      return (
        <ChatBubble
          message={item.text}
          isUser={item.isUser}
          timestamp={item.timestamp}
        />
      );
    } else if (item.type === "exercise_swap") {
      return (
        <View style={styles.swapContainer}>
          {/* AI message introducing the swaps */}
          <ChatBubble
            message={item.message}
            isUser={false}
            timestamp={item.timestamp}
          />

          {/* Exercise swap cards */}
          <View style={styles.swapCardsContainer}>
            {item.substitutes.map((exercise) => (
              <ExerciseSwapCard
                key={exercise.id}
                exercise={exercise}
                onSelect={(selected) =>
                  handleExerciseSelect(item.originalExercise, selected)
                }
              />
            ))}
          </View>

          {/* Show more button if available */}
          {item.showMoreAvailable && (
            <View
              style={[styles.showMoreContainer, { borderColor: colors.border }]}
            >
              <Text
                style={[styles.showMoreText, { color: colors.brandPrimary }]}
                onPress={() =>
                  handleExerciseSwap(item.originalExercise, undefined)
                }
              >
                Show More Options
              </Text>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <ChatHeader
          title="VoiceFit Coach"
          onBack={() => navigation.goBack()}
          onAvatarPress={() => navigation.navigate("Profile")}
        />

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input */}
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          loading={loading}
          placeholder="Ask a question, log a set, or swap an exercise..."
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
  },
  swapContainer: {
    marginVertical: tokens.spacing.sm,
  },
  swapCardsContainer: {
    marginTop: tokens.spacing.sm,
  },
  showMoreContainer: {
    marginTop: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
