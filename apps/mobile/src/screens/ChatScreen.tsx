/**
 * ChatScreen - Unified Chat Interface
 *
 * Primary interface for all AI interactions in VoiceFit:
 * - Workout logging via voice/text
 * - AI coaching Q&A
 * - Conversational onboarding
 * - Adherence alerts
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { GiftedChat, IMessage, Bubble, InputToolbar, Send } from 'react-native-gifted-chat';
import {
  Mic,
  Send as SendIcon,
  FileText,
  CheckCircle,
  MessageCircle,
  HelpCircle,
  AlertCircle,
} from 'lucide-react-native';
import tokens from '../theme/tokens';
import { database } from '../services/database/watermelon/database';
import Message from '../services/database/watermelon/models/Message';
import { getExerciseIcon } from '../utils/exerciseIcons';
import { SkeletonGroup } from '../components/common/SkeletonLoader';
import { apiClient, APIError } from '../services/api/config';
import { useAuthStore } from '../store/auth.store';
import { supabase } from '../services/database/supabase.client';
import { OnboardingService } from '../services/OnboardingService';
import BadgeUnlock from '../components/BadgeUnlock';
import UserBadge from '../services/database/watermelon/models/UserBadge';

interface WorkoutLogData {
  exercise_id: string;
  exercise_name: string;
  weight?: number;
  reps?: number;
  rpe?: number;
}

interface ChatMessage extends IMessage {
  messageType?: 'workout_log' | 'question' | 'general' | 'onboarding' | 'adherence_alert';
  data?: WorkoutLogData | Record<string, unknown>;
}

interface BadgeData {
  badge_type: string;
  badge_name: string;
  badge_description: string;
  category: string;
}

type ChatScreenNavigationProp = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  goBack: () => void;
};

export default function ChatScreen({ navigation }: { navigation: ChatScreenNavigationProp }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingService, setOnboardingService] = useState<OnboardingService | null>(null);
  const [badgeToShow, setBadgeToShow] = useState<BadgeData | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Load messages from WatermelonDB
    loadMessages();

    // Check onboarding status for authenticated users
    if (user?.id) {
      checkOnboardingStatus();
    }
  }, [user?.id]);

  const checkOnboardingStatus = async () => {
    if (!user?.id) return;

    try {
      // Check if user has completed onboarding
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('is_complete')
        .eq('user_id', user.id)
        .single();

      // If no onboarding record or not complete, start onboarding
      if (error || !data || !data.is_complete) {
        console.log('Starting onboarding for new user:', user.id);
        const service = new OnboardingService(user.id);
        setOnboardingService(service);

        // Get welcome message
        const greeting = await service.startOnboarding();
        await addAIMessage(greeting, 'onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesCollection = database.get<Message>('messages');
      const storedMessages = await messagesCollection.query().fetch();

      const formattedMessages: ChatMessage[] = storedMessages.map((msg) => ({
        _id: msg.id,
        text: msg.text,
        createdAt: new Date(msg.createdAt),
        user: {
          _id: msg.sender === 'user' ? 1 : 2,
          name: msg.sender === 'user' ? 'You' : 'VoiceFit AI',
          avatar: msg.sender === 'ai' ? require('../../assets/icon.png') : undefined,
        },
        messageType: msg.messageType as any,
        data: msg.data ? JSON.parse(msg.data) : undefined,
      }));

      setMessages(formattedMessages.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
      // Don't show welcome message if onboarding will start
      if (!onboardingService) {
        setMessages([
          {
            _id: '1',
            text: "Welcome to VoiceFit! 💪 I'm your AI coach. You can:\n\n• Log workouts by voice or text\n• Ask me training questions\n• Get personalized coaching\n\nTry saying something like '185 for 8' to log a set!",
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'VoiceFit AI',
              avatar: require('../../assets/icon.png'),
            },
            messageType: 'general',
          },
        ]);
      }
    }
  };

  const onSend = useCallback(async (newMessages: ChatMessage[] = []) => {
    const userMessage = newMessages[0];

    // Add user message to chat immediately
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );

    // Save to WatermelonDB
    await saveMessage(userMessage.text, 'user', 'general');

    // Classify message and handle response
    await classifyAndRespond(userMessage.text);
  }, []);

  const saveMessage = async (
    text: string,
    sender: 'user' | 'ai',
    messageType: string,
    data?: any
  ) => {
    try {
      const messagesCollection = database.get<Message>('messages');
      await database.write(async () => {
        await messagesCollection.create((message) => {
          message.userId = user?.id || '';
          message.text = text;
          message.sender = sender;
          message.messageType = messageType;
          message.data = data ? JSON.stringify(data) : undefined;
          message.synced = false;
        });
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const classifyAndRespond = async (text: string) => {
    setIsLoading(true);

    try {
      // Get user ID from auth store
      const userId = useAuthStore.getState().user?.id || 'current_user';

      // Call classification endpoint
      const classification = await apiClient.post('/api/chat/classify', {
        message: text,
        user_id: userId,
      });

      // Handle based on message type
      switch (classification.message_type) {
        case 'workout_log':
          await handleWorkoutLog(text);
          break;
        case 'question':
          await handleQuestion(text);
          break;
        case 'onboarding':
          await handleOnboarding(text);
          break;
        default:
          await handleGeneral(text);
      }
    } catch (error) {
      console.error('Error classifying message:', error);
      // Fallback response
      await addAIMessage("I'm having trouble understanding. Could you try again?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkoutLog = async (text: string) => {
    try {
      // Get user ID from auth store
      const userId = useAuthStore.getState().user?.id || 'current_user';

      // Parse workout with Llama
      const parsed = await apiClient.post('/api/voice/parse', {
        voice_command: text,
        user_id: userId,
      });

      if (parsed.success) {
        // Save set to WatermelonDB
        // TODO: Implement set saving logic

        // Show confirmation
        const confirmationText = `✅ Set logged: ${parsed.exercise_name} - ${parsed.weight} lbs × ${parsed.reps} reps${parsed.rpe ? ` @ RPE ${parsed.rpe}` : ''}`;
        await addAIMessage(confirmationText, 'workout_log', parsed);

        // Check for new badges after workout logging
        await checkForNewBadges(userId);
      } else {
        await addAIMessage("I couldn't parse that workout. Try something like '185 for 8' or 'bench press 225 pounds 5 reps'.");
      }
    } catch (error) {
      console.error('Error parsing workout:', error);
      await addAIMessage("Error logging workout. Please try again.");
    }
  };

  const checkForNewBadges = async (userId: string) => {
    try {
      // Call badge check endpoint
      const badgeResult = await apiClient.post(`/api/badges/${userId}/check-workout`, {});

      if (badgeResult.newly_earned && badgeResult.newly_earned.length > 0) {
        // Get the first new badge
        const newBadge = badgeResult.newly_earned[0];

        // Save badge to WatermelonDB
        await saveBadgeToLocal(userId, newBadge);

        // Show badge unlock animation
        setBadgeToShow({
          badge_type: newBadge.badge_type,
          badge_name: newBadge.badge_name,
          badge_description: newBadge.badge_description,
          category: newBadge.category || 'achievement',
        });
      }
    } catch (error) {
      console.error('Error checking for badges:', error);
      // Don't show error to user - badges are a nice-to-have feature
    }
  };

  const saveBadgeToLocal = async (userId: string, badge: any) => {
    try {
      const badgesCollection = database.get<UserBadge>('user_badges');
      await database.write(async () => {
        await badgesCollection.create((badgeRecord) => {
          badgeRecord.userId = userId;
          badgeRecord.badgeType = badge.badge_type;
          badgeRecord.badgeName = badge.badge_name;
          badgeRecord.badgeDescription = badge.badge_description;
          badgeRecord.earnedAt = new Date();
          badgeRecord.synced = false; // Will be synced by SyncService
        });
      });
    } catch (error) {
      console.error('Error saving badge to local database:', error);
    }
  };

  const handleQuestion = async (text: string) => {
    try {
      // Get user ID from auth store
      const userId = useAuthStore.getState().user?.id || 'current_user';

      // Call AI Coach endpoint
      const aiResponse = await apiClient.post('/api/coach/ask', {
        question: text,
        user_id: userId,
      });

      await addAIMessage(aiResponse.answer, 'question');
    } catch (error) {
      console.error('Error getting AI response:', error);
      if (error instanceof APIError) {
        await addAIMessage(`Error: ${error.message}`);
      } else {
        await addAIMessage("I'm having trouble answering that right now. Please try again.");
      }
    }
  };

  const handleOnboarding = async (text: string) => {
    if (!onboardingService) {
      console.error('Onboarding service not initialized');
      await addAIMessage("Sorry, there was an error with onboarding. Please try again.");
      return;
    }

    try {
      // Process user response through onboarding service
      const response = await onboardingService.processResponse(text);
      await addAIMessage(response, 'onboarding');

      // Check if onboarding is complete
      if (onboardingService.isComplete()) {
        // Clear onboarding service
        setOnboardingService(null);

        // Show success message
        await addAIMessage(
          "🎉 Your program is ready! Head to the Home tab to see your first workout. Let's get started!",
          'general'
        );
      }
    } catch (error) {
      console.error('Error processing onboarding response:', error);
      await addAIMessage("Sorry, there was an error. Please try again.");
    }
  };

  const handleGeneral = async (text: string) => {
    await addAIMessage("I'm here to help! You can log workouts, ask training questions, or chat with me about your fitness goals.");
  };

  const addAIMessage = async (
    text: string,
    messageType: string = 'general',
    data?: any
  ) => {
    const aiMessage: ChatMessage = {
      _id: Math.random().toString(),
      text,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'VoiceFit AI',
        avatar: require('../../assets/icon.png'),
      },
      messageType: messageType as any,
      data,
    };

    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, [aiMessage])
    );

    await saveMessage(text, 'ai', messageType, data);
  };

  const handleVoiceInput = async () => {
    // TODO: Implement voice recording in next subtask
    console.log('Voice input coming soon!');
  };

  // Get icon for message type
  const getMessageIcon = (messageType?: string) => {
    switch (messageType) {
      case 'workout_log':
        return <CheckCircle color={tokens.colors.accent.success} size={16} />;
      case 'question':
        return <HelpCircle color={tokens.colors.accent.info} size={16} />;
      case 'general':
        return <MessageCircle color={tokens.colors.accent.primary} size={16} />;
      case 'adherence_alert':
        return <AlertCircle color={tokens.colors.accent.warning} size={16} />;
      default:
        return null;
    }
  };

  const renderBubble = (props: any) => {
    const currentMessage = props.currentMessage as ChatMessage;
    const isAI = currentMessage.user._id === 2;
    const messageIcon = isAI ? getMessageIcon(currentMessage.messageType) : null;

    return (
      <View>
        {messageIcon && (
          <View style={styles.messageIconContainer}>
            {messageIcon}
          </View>
        )}
        <Bubble
          {...props}
          wrapperStyle={{
            left: {
              backgroundColor: tokens.colors.chat.aiBubble,
            },
            right: {
              backgroundColor: tokens.colors.chat.userBubble,
            },
          }}
          textStyle={{
            left: {
              color: tokens.colors.chat.aiText,
              fontFamily: tokens.typography.fontFamily.system,
            },
            right: {
              color: tokens.colors.chat.userText,
              fontFamily: tokens.typography.fontFamily.system,
            },
          }}
        />
      </View>
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: tokens.colors.background.secondary,
          borderTopColor: tokens.colors.border.light,
          borderTopWidth: 1,
          paddingVertical: 8,
        }}
        primaryStyle={{
          alignItems: 'center',
        }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send {...props}>
        <View style={{ marginRight: 12, marginBottom: 8 }}>
          <SendIcon color={tokens.colors.accent.primary} size={28} />
        </View>
      </Send>
    );
  };

  const renderActions = () => {
    return (
      <TouchableOpacity
        onPress={handleVoiceInput}
        style={{
          marginLeft: 12,
          marginBottom: 8,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isRecording ? tokens.colors.accent.error : tokens.colors.accent.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Mic color={tokens.colors.text.inverse} size={20} />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.loadingFooter}>
        <SkeletonGroup variant="chatMessage" count={1} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.background.primary }}>
      {/* Header with Show Log button */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: tokens.spacing.md,
          backgroundColor: tokens.colors.background.secondary,
          borderBottomWidth: 1,
          borderBottomColor: tokens.colors.border.light,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: tokens.typography.fontSize['2xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.text.primary,
            }}
          >
            Chat
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            // TODO: Open LogOverlay modal in Week 3
            console.log('Show Log modal coming in Week 3!');
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: tokens.colors.accent.primary,
            borderRadius: tokens.borderRadius.md,
          }}
        >
          <FileText color={tokens.colors.text.inverse} size={18} />
          <Text
            style={{
              marginLeft: 6,
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.text.inverse,
            }}
          >
            Show Log
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat Interface */}
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages as ChatMessage[])}
        user={{
          _id: 1,
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        renderActions={renderActions}
        renderFooter={renderFooter}
        alwaysShowSend
        scrollToBottom
        placeholder="Type a message or tap mic to speak..."
        textInputStyle={{
          fontFamily: tokens.typography.fontFamily.system,
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.text.primary,
        }}
      />

      {/* Badge Unlock Modal */}
      {badgeToShow && (
        <BadgeUnlock
          visible={!!badgeToShow}
          badgeType={badgeToShow.badge_type}
          badgeName={badgeToShow.badge_name}
          badgeDescription={badgeToShow.badge_description}
          onClose={() => setBadgeToShow(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  messageIconContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.full,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingFooter: {
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
});
