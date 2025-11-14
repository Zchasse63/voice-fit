/**
 * ChatScreen
 *
 * ChatGPT-inspired clean chat interface.
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatBubble, ChatInput, ChatHeader } from "../components/chat";
import tokens from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";
import { apiClient } from "../services/api/client";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
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
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputText;
    setInputText("");
    setLoading(true);

    try {
      // Send message to Railway backend
      const response = await apiClient.sendMessage(messageText);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Failed to send message:", error);

      // Show error to user
      Alert.alert(
        "Connection Error",
        "Failed to reach the AI coach. Please check your connection and try again.",
        [{ text: "OK" }],
      );

      // Add error message as AI response
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
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
          renderItem={({ item }) => (
            <ChatBubble
              message={item.text}
              isUser={item.isUser}
              timestamp={item.timestamp}
            />
          )}
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
});
