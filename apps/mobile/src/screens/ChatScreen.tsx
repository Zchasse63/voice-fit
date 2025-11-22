/**
 * ChatScreen
 *
 * ChatGPT-inspired clean chat interface with interactive exercise swap cards.
 * Single header, iOS Messages-style bubbles, minimal input bar.
 *
 * Supports both Premium mode (own data) and Coach mode (client data).
 * When clientId is provided, chat is scoped to that client.
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
import { ScalePressable } from "../components/common/ScalePressable";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChatBubble,
  ChatInput,
  ChatHeader,
  ExerciseSwapCard,
  ExerciseSwapData,
} from "../components/chat";
import QuickLogBar, { QuickLogDraft } from "../components/workout/QuickLogBar";
import tokens from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";
import { apiClient } from "../services/api";
import { useAuthStore } from "../store/auth.store";
import { useCoachStore } from "../store/coach.store";
import ExerciseSubstitutionService, {
  ExerciseSubstitution,
} from "../services/exercise/ExerciseSubstitutionService";
import { classifyChatMessageLocal } from "../services/chat/LocalChatClassifier";
import { AnalyticsService } from "../services/analytics/AnalyticsService";
import { AnalyticsEvents } from "../services/analytics/events";
import { messagePersistenceService } from "../services/chat/MessagePersistenceService";

const mapSubstitutionToSwapData = (
  sub: ExerciseSubstitution,
): ExerciseSwapData => ({
  id: sub.id,
  substitute_name: sub.substitute_name,
  similarity_score: sub.similarity_score,
  why_recommended: sub.notes,
  subtitle: `${sub.movement_pattern} · ${sub.equipment_required}`,
  movement_pattern: sub.movement_pattern,
  primary_muscles: sub.primary_muscles,
  equipment_required: sub.equipment_required,
  difficulty_level: sub.difficulty_level,
  reduced_stress_area: sub.reduced_stress_area === "none" ? undefined : sub.reduced_stress_area,
});

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

interface ChatScreenProps {
  navigation?: any;
  route?: {
    params?: {
      clientId?: string; // For coach mode - view client's chat
      intent?: "check-in" | "weekly-digest";
    };
  };
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const flatListRef = useRef<FlatList>(null);

  const user = useAuthStore((state) => state.user);
  const tier = user?.tier ?? "free";
  const isFreeTier = tier === "free";

  // Coach mode: use clientId from route params or coach store
  const { selectedClientId } = useCoachStore();
  const clientId = route?.params?.clientId || selectedClientId;
  const isCoachMode = !!clientId;

  // Use clientId if in coach mode, otherwise use current user's ID
  const effectiveUserId = isCoachMode ? clientId : user?.id;

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
  const [quickLogDraft, setQuickLogDraft] = useState<QuickLogDraft | null>(null);

  // Handle intents from navigation
  useEffect(() => {
    const intent = route?.params?.intent;
    if (!intent) return;
    const intentMessage: TextMessage = {
      id: Date.now().toString(),
      type: "text",
      text:
        intent === "check-in"
          ? "Opening your daily check-in. How did you sleep and how's your energy?"
          : "Weekly digest ready. Want a quick summary and recommendation?",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, intentMessage]);
  }, [route?.params?.intent]);

  // Load persisted messages on mount
  useEffect(() => {
    const loadPersistedMessages = async () => {
      if (!effectiveUserId) return;

      try {
        const persistedMessages = await messagePersistenceService.loadMessages(effectiveUserId, 50);

        if (persistedMessages.length > 0) {
          // Convert persisted messages to UI message format
          const uiMessages: Message[] = persistedMessages.map((msg) => ({
            id: msg.id,
            type: "text",
            text: msg.text,
            isUser: msg.sender === 'user',
            timestamp: msg.timestamp,
          }));

          setMessages(uiMessages);
          console.log(`✅ Loaded ${uiMessages.length} persisted messages from WatermelonDB`);
        } else {
          // No persisted messages, show welcome message
          setMessages([
            {
              id: "1",
              type: "text",
              text: "Hey! Ready to crush today's workout?",
              isUser: false,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error('❌ Failed to load persisted messages:', error);
        // Fall back to welcome message
        setMessages([
          {
            id: "1",
            type: "text",
            text: "Hey! Ready to crush today's workout?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    };

    loadPersistedMessages();
  }, [effectiveUserId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Helper function to save message to WatermelonDB
  const saveMessageToDB = async (message: TextMessage, messageType: string = 'general') => {
    if (!effectiveUserId) return;

    try {
      await messagePersistenceService.saveMessage({
        id: message.id,
        userId: effectiveUserId,
        text: message.text,
        sender: message.isUser ? 'user' : 'ai',
        messageType: messageType as any,
        timestamp: message.timestamp,
      });
    } catch (error) {
      console.error('❌ Failed to save message to WatermelonDB:', error);
      // Don't throw - message is still in UI state
    }
  };

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

  const handleExerciseSwapLocal = async (exerciseName: string) => {
    try {
      const result = await ExerciseSubstitutionService.getSubstitutions({
        exercise_name: exerciseName,
        min_similarity_score: 0.6,
      });

      if (!result.substitutes.length) {
        const errorMessage: TextMessage = {
          id: Date.now().toString(),
          type: "text",
          text: `I couldn't find safe alternatives for ${exerciseName} yet. Try adjusting weight, reps, or tempo.`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      const swapMessage: ExerciseSwapMessage = {
        id: Date.now().toString(),
        type: "exercise_swap",
        originalExercise: result.original_exercise,
        substitutes: result.substitutes.map(mapSubstitutionToSwapData),
        message:
          "Here are some alternatives that keep the same movement pattern while reducing stress on the injured area:",
        showMoreAvailable: false,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, swapMessage]);
    } catch (error) {
      console.error("Failed to get local exercise swaps:", error);

      const errorMessage: TextMessage = {
        id: Date.now().toString(),
        type: "text",
        text:
          "Sorry, I couldn't load safe alternatives right now. Try again in a moment or choose a different exercise.",
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

    // Save user message to WatermelonDB (will be classified later)
    await saveMessageToDB(userMessage, 'general');

    const messageText = inputText;
    setInputText("");
    setLoading(true);

    try {
      let classification: any;

      if (isFreeTier) {
        // Use lightweight on-device classifier to avoid LLM calls for free tier
        classification = classifyChatMessageLocal(messageText);
      } else {
        // Premium: call backend classifier (which may use LLMs/RAG)
        classification = await apiClient.post("/api/chat/classify", {
          message: messageText,
          user_id: effectiveUserId ?? "user_123",
          conversation_history: messages
            .slice(-5)
            .filter((m) => m.type === "text")
            .map((m) => ({
              role: m.isUser ? "user" : "assistant",
              content: (m as TextMessage).text,
            })),
        });
      }

      if (classification.message_type === "exercise_swap") {
        const exerciseName =
          classification.extracted_data?.exercise_name || messageText;

        if (isFreeTier) {
          await handleExerciseSwapLocal(exerciseName);
        } else {
          const reason = classification.extracted_data?.reason;
          await handleExerciseSwap(exerciseName, reason);
        }
      } else if (classification.message_type === "workout_log") {
        const extracted = classification.extracted_data || {};
        const draftExerciseName =
          typeof extracted.exercise_name === "string" && extracted.exercise_name.length > 0
            ? extracted.exercise_name
            : messageText;

        const draft: QuickLogDraft = {
          exerciseName: draftExerciseName,
          weight:
            typeof extracted.weight === "number" ? extracted.weight : undefined,
          reps:
            typeof extracted.reps === "number" ? extracted.reps : undefined,
          rpe: typeof extracted.rpe === "number" ? extracted.rpe : undefined,
        };

        setQuickLogDraft(draft);

        void AnalyticsService.logEvent(AnalyticsEvents.QUICK_LOG_BAR_OPENED, {
          source: "chat",
          tier,
          classification_confidence: classification.confidence ?? null,
          platform: Platform.OS,
        });

        const parts: string[] = [];
        if (draft.weight != null && draft.reps != null) {
          const rpeSuffix = draft.rpe != null ? ` @ RPE ${draft.rpe}` : "";
          parts.push(`${draft.weight} lbs × ${draft.reps} reps${rpeSuffix}`);
        }

        const summary =
          parts.length > 0
            ? `I think you did: ${parts[0]} for ${draft.exerciseName}.`
            : `Let's log a set for ${draft.exerciseName}.`;

        const aiMessage: TextMessage = {
          id: (Date.now() + 1).toString(),
          type: "text",
          text: `${summary} You can accept or tweak it in the quick log bar below.`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        await saveMessageToDB(aiMessage, 'workout_log');
      } else if (classification.message_type === "question") {
        // For now, all tiers still call the AI coach endpoint for questions
        const response = await apiClient.post("/api/coach/question", {
          user_id: effectiveUserId ?? "user_123",
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
        await saveMessageToDB(aiMessage, 'question');
      } else {
        const aiMessage: TextMessage = {
          id: (Date.now() + 1).toString(),
          type: "text",
          text:
            "I'm here to help! You can log workouts, ask questions, or swap exercises. What would you like to do?",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        await saveMessageToDB(aiMessage, 'general');
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);

      Alert.alert(
        "Connection Error",
        "Failed to reach the AI coach. Please check your connection and try again.",
        [{ text: "OK" }],
      );

      const errorMessage: TextMessage = {
        id: (Date.now() + 1).toString(),
        type: "text",
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      await saveMessageToDB(errorMessage, 'general');
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
              style={[styles.showMoreContainer, { borderColor: colors.border.light }]}
            >
              <Text
                style={[styles.showMoreText, { color: colors.accent.blue }]}
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
          title="Coach"
          onBack={() => navigation.goBack()}
          onAvatarPress={() => navigation.navigate("Profile")}
        />





        {/* Quick actions under header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: tokens.spacing.md,
            paddingVertical: tokens.spacing.sm,
            gap: tokens.spacing.sm,
          }}
        >
          <ScalePressable
            onPress={() => navigation.navigate("ProgramLog")}
            style={{
              flex: 1,
              paddingVertical: tokens.spacing.sm,
              paddingHorizontal: tokens.spacing.md,
              borderRadius: tokens.borderRadius.full,
              backgroundColor: colors.background.secondary,
              borderWidth: 1,
              borderColor: colors.border.light,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                color: colors.text.primary,
                fontWeight: tokens.typography.fontWeight.semibold,
              }}
            >
              Today’s Workout
            </Text>
          </ScalePressable>
          <ScalePressable
            onPress={() => navigation.navigate("TrainingCalendar")}
            style={{
              width: 44,
              height: 44,
              borderRadius: tokens.borderRadius.full,
              backgroundColor: colors.background.secondary,
              borderWidth: 1,
              borderColor: colors.border.light,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.accent.blue, fontSize: 18 }}>📅</Text>
          </ScalePressable>
        </View>

        {/* Session Warning */}
        {/* TODO: Implement session status tracking
        {sessionStatus === 'expiring' && sessionTimeRemaining > 0 && (
          <View style={[styles.sessionWarning, { backgroundColor: colors.backgroundSoft.warning }]}>
            <Text style={[styles.sessionWarningText, { color: colors.text.primary }]}>
              ⏰ Session expiring in {Math.floor(sessionTimeRemaining / 60)} min
            </Text>
          </View>
        )}
        */}

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

        {loading && (
          <View style={{ paddingHorizontal: tokens.spacing.md, paddingBottom: tokens.spacing.sm }}>
            <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.sm }}>
              Coach is thinking...
            </Text>
          </View>
        )}

        {quickLogDraft && (
          <QuickLogBar
            draft={quickLogDraft}
            onLogged={() => {
              setQuickLogDraft(null);
            }}
            onDismiss={() => setQuickLogDraft(null)}
          />
        )}

        {/* Input */}
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onMicPress={() => Alert.alert("Voice", "Voice capture coming soon")}
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
  sessionWarning: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionWarningText: {
    fontSize: 14,
    fontWeight: '600',
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
