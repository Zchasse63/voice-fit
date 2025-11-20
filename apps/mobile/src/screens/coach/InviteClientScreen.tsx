/**
 * InviteClientScreen
 * 
 * Form for coaches to invite clients by email.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Send } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/database/supabase.client';

export default function InviteClientScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setIsLoading(true);

      // Get current user token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call backend API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/coach/invite-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          client_email: email,
          message: message || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send invitation');
      }

      Alert.alert(
        'Success',
        'Invitation sent successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setEmail('');
              setMessage('');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background.primary,
      }}
      edges={['top']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: tokens.spacing.lg,
            paddingVertical: tokens.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.light,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Invite Client
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              padding: tokens.spacing.sm,
            }}
          >
            <X size={24} color={colors.text.secondary} />
          </Pressable>
        </View>

        {/* Form */}
        <View
          style={{
            flex: 1,
            padding: tokens.spacing.lg,
          }}
        >
          {/* Email Input */}
          <View style={{ marginBottom: tokens.spacing.lg }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.medium,
                color: colors.text.secondary,
                marginBottom: tokens.spacing.xs,
              }}
            >
              Client Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="client@example.com"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              style={{
                backgroundColor: colors.background.secondary,
                borderRadius: tokens.borderRadius.md,
                padding: tokens.spacing.md,
                fontSize: tokens.typography.fontSize.md,
                color: colors.text.primary,
              }}
            />
          </View>

          {/* Message Input */}
          <View style={{ marginBottom: tokens.spacing.xl }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.medium,
                color: colors.text.secondary,
                marginBottom: tokens.spacing.xs,
              }}
            >
              Message (Optional)
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Add a personal message..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
              style={{
                backgroundColor: colors.background.secondary,
                borderRadius: tokens.borderRadius.md,
                padding: tokens.spacing.md,
                fontSize: tokens.typography.fontSize.md,
                color: colors.text.primary,
                minHeight: 100,
              }}
            />
          </View>

          {/* Send Button */}
          <Pressable
            onPress={handleInvite}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? colors.text.tertiary : colors.accent.green,
              borderRadius: tokens.borderRadius.md,
              padding: tokens.spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: tokens.spacing.sm,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Send size={20} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.md,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: '#FFFFFF',
                  }}
                >
                  Send Invitation
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


