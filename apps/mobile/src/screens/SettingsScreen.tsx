import React from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/auth.store';
import {
  User,
  Moon,
  Sun,
  Bell,
  Database,
  LogOut,
  Info,
  Shield,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { isDark, theme, setTheme } = useTheme();
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Your workouts will remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}>
      <View className="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className={`text-3xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
            Settings
          </Text>
          <Text className={`text-base mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your account and preferences
          </Text>
        </View>

        {/* Account Section */}
        <View className="mb-6">
          <Text className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            ACCOUNT
          </Text>

          <View className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <View className="flex-row items-center">
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                    isDark ? 'bg-primaryDark/20' : 'bg-primary-500/20'
                  }`}
                >
                  <User color={isDark ? '#4A9B6F' : '#2C5F3D'} size={24} />
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {user?.email || 'Not signed in'}
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Account Settings
                  </Text>
                </View>
                <ChevronRight color={isDark ? '#6B7280' : '#9CA3AF'} size={20} />
              </View>
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View className="mb-6">
          <Text className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            APPEARANCE
          </Text>

          <View className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <Pressable
              className="p-4 border-b border-gray-200 dark:border-gray-700 active:opacity-80"
              onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              accessibilityLabel="Toggle dark mode"
              accessibilityRole="button"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  {isDark ? (
                    <Moon color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                  ) : (
                    <Sun color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                  )}
                  <View className="ml-4 flex-1">
                    <Text className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      Dark Mode
                    </Text>
                    <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {theme === 'dark' ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={theme === 'dark'}
                  onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
                  trackColor={{ false: '#D1D5DB', true: '#4A9B6F' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            NOTIFICATIONS
          </Text>

          <View className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="p-4 border-b border-gray-200 dark:border-gray-700">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Bell color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                  <View className="ml-4 flex-1">
                    <Text className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      Workout Reminders
                    </Text>
                    <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Get notified about your workouts
                    </Text>
                  </View>
                </View>
                <Switch
                  value={false}
                  onValueChange={() => {}}
                  trackColor={{ false: '#D1D5DB', true: '#4A9B6F' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Data Section */}
        <View className="mb-6">
          <Text className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            DATA
          </Text>

          <View className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <Pressable
              className="p-4 border-b border-gray-200 dark:border-gray-700 active:opacity-80"
              onPress={handleClearCache}
              accessibilityLabel="Clear cache"
              accessibilityRole="button"
            >
              <View className="flex-row items-center">
                <Database color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                <View className="ml-4 flex-1">
                  <Text className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Clear Cache
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Free up storage space
                  </Text>
                </View>
                <ChevronRight color={isDark ? '#6B7280' : '#9CA3AF'} size={20} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* About Section */}
        <View className="mb-6">
          <Text className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            ABOUT
          </Text>

          <View className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <Pressable
              className="p-4 border-b border-gray-200 dark:border-gray-700 active:opacity-80"
              accessibilityLabel="Help & Support"
              accessibilityRole="button"
            >
              <View className="flex-row items-center">
                <HelpCircle color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                <View className="ml-4 flex-1">
                  <Text className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Help & Support
                  </Text>
                </View>
                <ChevronRight color={isDark ? '#6B7280' : '#9CA3AF'} size={20} />
              </View>
            </Pressable>

            <Pressable
              className="p-4 border-b border-gray-200 dark:border-gray-700 active:opacity-80"
              accessibilityLabel="Privacy Policy"
              accessibilityRole="button"
            >
              <View className="flex-row items-center">
                <Shield color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                <View className="ml-4 flex-1">
                  <Text className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Privacy Policy
                  </Text>
                </View>
                <ChevronRight color={isDark ? '#6B7280' : '#9CA3AF'} size={20} />
              </View>
            </Pressable>

            <Pressable
              className="p-4 active:opacity-80"
              accessibilityLabel="About VoiceFit"
              accessibilityRole="button"
            >
              <View className="flex-row items-center">
                <Info color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                <View className="ml-4 flex-1">
                  <Text className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    About VoiceFit
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Version 1.0.0
                  </Text>
                </View>
                <ChevronRight color={isDark ? '#6B7280' : '#9CA3AF'} size={20} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Sign Out Button */}
        <Pressable
          className={`p-4 rounded-xl items-center active:opacity-80 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}
          onPress={handleSignOut}
          accessibilityLabel="Sign Out"
          accessibilityRole="button"
        >
          <View className="flex-row items-center">
            <LogOut color="#EF4444" size={20} />
            <Text className="text-base font-bold text-red-500 ml-3">
              Sign Out
            </Text>
          </View>
        </Pressable>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Made with ❤️ for fitness enthusiasts
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

