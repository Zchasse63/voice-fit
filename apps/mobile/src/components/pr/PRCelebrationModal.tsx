/**
 * PRCelebrationModal Component
 * 
 * Celebrates new personal records with confetti animation and PR details.
 * Displays improvement over previous PR and share options.
 */

import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Trophy, TrendingUp, X, Share2 } from 'lucide-react-native';
import { PRData } from '../../services/pr/PRService';

interface PRCelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  prData: PRData;
  previousPR?: number;
}

export default function PRCelebrationModal({
  visible,
  onClose,
  prData,
  previousPR,
}: PRCelebrationModalProps) {
  const { isDark } = useTheme();

  const improvement = previousPR ? prData.oneRM - previousPR : 0;
  const improvementPercent = previousPR ? ((improvement / previousPR) * 100).toFixed(1) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <View className={`w-full max-w-md rounded-xl shadow-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Close Button */}
          <Pressable
            onPress={onClose}
            className="absolute top-4 right-4 z-10"
            accessibilityLabel="Close modal"
          >
            <X color={isDark ? '#9CA3AF' : '#6B7280'} size={24} />
          </Pressable>

          {/* Confetti Effect (Visual) */}
          <View className="items-center mb-4">
            <View className="w-20 h-20 rounded-full bg-yellow-500/20 items-center justify-center">
              <Trophy color="#F59E0B" size={48} />
            </View>
          </View>

          {/* Celebration Header */}
          <Text className={`text-3xl font-bold text-center mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            🎉 New PR! 🎉
          </Text>
          <Text className={`text-lg text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            You just crushed a personal record!
          </Text>

          {/* Exercise Name */}
          <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Exercise
            </Text>
            <Text className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {prData.exerciseName}
            </Text>
          </View>

          {/* PR Details */}
          <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-primaryDark/20' : 'bg-primary-500/10'}`}>
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Weight × Reps
                </Text>
                <Text className={`text-xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                  {prData.weight} lbs × {prData.reps}
                </Text>
              </View>
              <View className="items-end">
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Estimated 1RM
                </Text>
                <Text className={`text-xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                  {prData.oneRM} lbs
                </Text>
              </View>
            </View>

            {/* Improvement */}
            {previousPR && improvement > 0 && (
              <View className="flex-row items-center justify-center pt-3 border-t border-gray-300 dark:border-gray-600">
                <TrendingUp color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                <Text className={`text-base font-bold ml-2 ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                  +{improvement.toFixed(1)} lbs ({improvementPercent}% improvement)
                </Text>
              </View>
            )}
          </View>

          {/* Previous PR */}
          {previousPR && (
            <View className="mb-6">
              <Text className={`text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Previous best: {previousPR} lbs
              </Text>
            </View>
          )}

          {/* Motivational Message */}
          <View className={`p-3 rounded-xl mb-6 ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
            <Text className={`text-sm text-center font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
              💪 Keep pushing! You're getting stronger every day!
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            {/* Share Button */}
            <Pressable
              className={`flex-row items-center justify-center p-4 rounded-xl border-2 ${
                isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'
              }`}
              onPress={() => {
                // TODO: Implement share functionality
                console.log('Share PR:', prData);
              }}
              accessibilityLabel="Share PR"
            >
              <Share2 color={isDark ? '#9CA3AF' : '#6B7280'} size={20} />
              <Text className={`font-bold ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Share Achievement
              </Text>
            </Pressable>

            {/* Continue Button */}
            <Pressable
              className={`p-4 rounded-xl ${isDark ? 'bg-primaryDark' : 'bg-primary-500'}`}
              onPress={onClose}
              accessibilityLabel="Continue"
            >
              <Text className="text-center font-bold text-white text-lg">
                Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

