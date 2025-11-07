import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/auth.store';
import { LogIn } from 'lucide-react-native';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

interface LoginScreenProps {
  onNavigateToSignUp: () => void;
}

export default function LoginScreen({ onNavigateToSignUp }: LoginScreenProps) {
  const { isDark } = useTheme();
  const signIn = useAuthStore((state) => state.signIn);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signIn(email, password);
      // Navigation will happen automatically via App.tsx auth state
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Signing in..." fullScreen />;
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
              <LogIn color="white" size={40} />
            </View>
            <Text className={`text-4xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
              VoiceFit
            </Text>
            <Text className={`text-base mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome back! Sign in to continue
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4">
              <ErrorMessage message={error} onRetry={() => setError(null)} />
            </View>
          )}

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
          <View className="mb-6">
            <Text className={`text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Password
            </Text>
            <TextInput
              className={`p-4 rounded-xl text-base ${
                isDark 
                  ? 'bg-gray-800 text-gray-200 border border-gray-700' 
                  : 'bg-white text-gray-800 border border-gray-300'
              }`}
              placeholder="Enter your password"
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
            />
          </View>

          {/* Login Button */}
          <Pressable
            className={`p-4 rounded-xl items-center mb-4 active:opacity-80 min-h-[60px] justify-center ${
              isDark ? 'bg-primaryDark' : 'bg-primary-500'
            }`}
            onPress={handleLogin}
            accessibilityLabel="Sign In"
            accessibilityHint="Sign in to your account"
            accessibilityRole="button"
          >
            <Text className="text-base font-bold text-white">
              Sign In
            </Text>
          </Pressable>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account?{' '}
            </Text>
            <Pressable
              onPress={onNavigateToSignUp}
              accessibilityLabel="Sign Up"
              accessibilityHint="Navigate to sign up screen"
              accessibilityRole="button"
            >
              <Text className={`text-sm font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

