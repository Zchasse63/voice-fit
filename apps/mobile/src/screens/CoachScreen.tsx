import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Send, Bot, User } from 'lucide-react-native';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'coach';
  timestamp: Date;
}

export default function CoachScreen() {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI coach. How can I help you with your training today?",
      sender: 'coach',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCoachData();
  }, []);

  const loadCoachData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Simulate loading coach conversation history
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load coach conversation. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading AI coach..." fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadCoachData} fullScreen />;
  }

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate coach response
    setTimeout(() => {
      const coachResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'AI coach responses will be implemented in Phase 5. For now, this is a placeholder.',
        sender: 'coach',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, coachResponse]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View className={`p-6 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <Text className={`text-3xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
          Coach
        </Text>
        <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Your AI training assistant
        </Text>
      </View>

      {/* Messages */}
      <ScrollView className="flex-1 p-4">
        {messages.map((message) => (
          <View
            key={message.id}
            className={`flex-row mb-4 ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender === 'coach' && (
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
                isDark ? 'bg-primaryDark' : 'bg-primary-500'
              }`}>
                <Bot color="white" size={16} />
              </View>
            )}

            <View
              className={`max-w-[75%] p-4 rounded-xl ${
                message.sender === 'user'
                  ? isDark ? 'bg-primaryDark rounded-tr-sm' : 'bg-primary-500 rounded-tr-sm'
                  : isDark ? 'bg-gray-800 rounded-tl-sm' : 'bg-white rounded-tl-sm'
              }`}
            >
              <Text
                className={`text-base ${
                  message.sender === 'user' ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                {message.text}
              </Text>
              <Text
                className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-white/70' : isDark ? 'text-gray-500' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {message.sender === 'user' && (
              <View className={`w-8 h-8 rounded-full items-center justify-center ml-2 ${isDark ? 'bg-info-dark' : 'bg-info-light'}`}>
                <User color="white" size={16} />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View className={`p-4 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <View className="flex-row items-center">
          <TextInput
            className={`flex-1 p-4 rounded-xl text-base ${
              isDark ? 'bg-gray-700 text-white' : 'bg-background-light text-gray-800'
            }`}
            placeholder="Ask your coach..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            className={`ml-3 w-12 h-12 rounded-full items-center justify-center active:opacity-80 ${
              isDark ? 'bg-primaryDark' : 'bg-primary-500'
            }`}
            onPress={handleSend}
          >
            <Send color="white" size={20} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

