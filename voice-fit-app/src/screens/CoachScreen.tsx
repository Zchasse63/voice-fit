import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send, Bot, User } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'coach';
  timestamp: Date;
}

const mockMessages: Message[] = [
  {
    id: '1',
    text: "Hi! I'm your AI coach. How can I help you today?",
    sender: 'coach',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    text: 'What should I focus on for my next workout?',
    sender: 'user',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: '3',
    text: "Based on your recent training, I'd recommend focusing on upper body strength. Your squat PRs are progressing well, but we could work on your bench press and overhead press.",
    sender: 'coach',
    timestamp: new Date(Date.now() - 3400000),
  },
];

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState('');

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
      className="flex-1 bg-[#FBF7F5]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View className="p-6 bg-white border-b border-gray-200">
        <Text className="text-3xl font-bold text-[#2C5F3D]">Coach</Text>
        <Text className="text-base text-gray-600 mt-1">
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
              <View className="w-8 h-8 rounded-full bg-[#2C5F3D] items-center justify-center mr-2">
                <Bot color="white" size={16} />
              </View>
            )}

            <View
              className={`max-w-[75%] p-4 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-[#2C5F3D] rounded-tr-sm'
                  : 'bg-white rounded-tl-sm'
              }`}
            >
              <Text
                className={`text-base ${
                  message.sender === 'user' ? 'text-white' : 'text-gray-800'
                }`}
              >
                {message.text}
              </Text>
              <Text
                className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {message.sender === 'user' && (
              <View className="w-8 h-8 rounded-full bg-[#3498DB] items-center justify-center ml-2">
                <User color="white" size={16} />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View className="p-4 bg-white border-t border-gray-200">
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 p-4 bg-[#FBF7F5] rounded-2xl text-base"
            placeholder="Ask your coach..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            className="ml-3 w-12 h-12 bg-[#2C5F3D] rounded-full items-center justify-center active:opacity-80"
            onPress={handleSend}
          >
            <Send color="white" size={20} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

