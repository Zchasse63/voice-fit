import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/auth.store';
import { UserPlus } from 'lucide-react-native';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

interface SignUpScreenProps {
  onNavigateToLogin: () => void;
}

export default function SignUpScreen({ onNavigateToLogin }: SignUpScreenProps) {
  const { isDark } = useTheme();
  const signUp = useAuthStore((state) => state.signUp);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): string | null => {
    if (!name || !email || !password || !confirmPassword) {
      return 'Please fill in all fields';
    }

    if (name.length < 2) {
      return 'Name must be at least 2 characters';
    }

    if (!email.includes('@')) {
      return 'Please enter a valid email address';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  };

  const handleSignUp = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signUp(email, password, name);
      // Navigation will happen automatically via App.tsx auth state
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Creating your account..." fullScreen />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center p-6">
          {/* Logo/Header */}
          <View className="items-center mb-8">
            <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
              isDark ? 'bg-primaryDark' : 'bg-primary-500'
            }`}>
              <UserPlus color="white" size={40} />
            </View>
            <Text className={`text-4xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
              VoiceFit
            </Text>
            <Text className={`text-base mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Create your account to get started
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4">
              <ErrorMessage message={error} onRetry={() => setError(null)} />
            </View>
          )}

          {/* Name Input */}
          <View className="mb-4">
            <Text className={`text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Name
            </Text>
            <TextInput
              className={`p-4 rounded-xl text-base ${
                isDark 
                  ? 'bg-gray-800 text-gray-200 border border-gray-700' 
                  : 'bg-white text-gray-800 border border-gray-300'
              }`}
              placeholder="Your name"
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className={`text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Email
            </Text>
            <TextInput
              className={`p-4 rounded-xl text-base ${
                isDark 
                  ? 'bg-gray-800 text-gray-200 border border-gray-700' 
                  : 'bg-white text-gray-800 border border-gray-300'
              }`}
              placeholder="your@email.com"
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className={`text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Password
            </Text>
            <TextInput
              className={`p-4 rounded-xl text-base ${
                isDark 
                  ? 'bg-gray-800 text-gray-200 border border-gray-700' 
                  : 'bg-white text-gray-800 border border-gray-300'
              }`}
              placeholder="At least 6 characters"
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
            />
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text className={`text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Confirm Password
            </Text>
            <TextInput
              className={`p-4 rounded-xl text-base ${
                isDark 
                  ? 'bg-gray-800 text-gray-200 border border-gray-700' 
                  : 'bg-white text-gray-800 border border-gray-300'
              }`}
              placeholder="Re-enter your password"
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
            />
          </View>

          {/* Sign Up Button */}
          <Pressable
            className={`p-4 rounded-xl items-center mb-4 active:opacity-80 min-h-[60px] justify-center ${
              isDark ? 'bg-primaryDark' : 'bg-primary-500'
            }`}
            onPress={handleSignUp}
            accessibilityLabel="Create Account"
            accessibilityHint="Create your VoiceFit account"
            accessibilityRole="button"
          >
            <Text className="text-base font-bold text-white">
              Create Account
            </Text>
          </Pressable>

          {/* Login Link */}
          <View className="flex-row justify-center items-center">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
            </Text>
            <Pressable
              onPress={onNavigateToLogin}
              accessibilityLabel="Sign In"
              accessibilityHint="Navigate to sign in screen"
              accessibilityRole="button"
            >
              <Text className={`text-sm font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

