/**
 * AutoRegulationModal Component
 * 
 * Displays recommended load adjustments based on RPE and readiness data.
 * Requires user approval before applying changes (Premium feature).
 */

import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AlertTriangle, TrendingDown, TrendingUp, CheckCircle, X } from 'lucide-react-native';
import { LoadAdjustment } from '../../services/autoregulation/AutoRegulationService';

interface AutoRegulationModalProps {
  visible: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  adjustment: LoadAdjustment;
  currentWeight?: number;
  newWeight?: number;
  exerciseName?: string;
  reasons?: string[];
}

export default function AutoRegulationModal({
  visible,
  onClose,
  onApprove,
  onReject,
  adjustment,
  currentWeight,
  newWeight,
  exerciseName,
  reasons = [],
}: AutoRegulationModalProps) {
  const { isDark } = useTheme();

  const isReduction = adjustment.adjustmentPercentage < 0;
  const isIncrease = adjustment.adjustmentPercentage > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <View className={`w-full max-w-md rounded-xl shadow-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <AlertTriangle
                color={isReduction ? '#F9AC60' : '#4A9B6F'}
                size={24}
              />
              <Text className={`text-xl font-bold ml-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Auto-Regulation Suggestion
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
              accessibilityLabel="Close modal"
            >
              <X color={isDark ? '#9CA3AF' : '#6B7280'} size={24} />
            </Pressable>
          </View>

          {/* Adjustment Badge */}
          <View
            className={`flex-row items-center justify-center p-3 rounded-xl mb-4 ${
              isReduction
                ? 'bg-orange-100 dark:bg-orange-900/30'
                : isIncrease
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            {isReduction ? (
              <TrendingDown color="#F9AC60" size={20} />
            ) : isIncrease ? (
              <TrendingUp color="#4A9B6F" size={20} />
            ) : (
              <CheckCircle color="#4A9B6F" size={20} />
            )}
            <Text
              className={`text-lg font-bold ml-2 ${
                isReduction
                  ? 'text-orange-600 dark:text-orange-400'
                  : isIncrease
                  ? 'text-green-600 dark:text-green-400'
                  : isDark
                  ? 'text-gray-300'
                  : 'text-gray-700'
              }`}
            >
              {adjustment.adjustmentPercentage > 0 ? '+' : ''}
              {adjustment.adjustmentPercentage}% Load Adjustment
            </Text>
          </View>

          {/* Exercise Info */}
          {exerciseName && currentWeight && newWeight && (
            <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Text className={`text-sm font-body-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {exerciseName}
              </Text>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Current Weight
                  </Text>
                  <Text className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {currentWeight} lbs
                  </Text>
                </View>
                <Text className={`text-2xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>→</Text>
                <View>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Recommended Weight
                  </Text>
                  <Text
                    className={`text-lg font-bold ${
                      isReduction
                        ? 'text-orange-500'
                        : isIncrease
                        ? 'text-green-500'
                        : isDark
                        ? 'text-gray-200'
                        : 'text-gray-800'
                    }`}
                  >
                    {newWeight} lbs
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Reason */}
          <View className="mb-4">
            <Text className={`text-sm font-body-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Why this adjustment?
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {adjustment.reason}
            </Text>
          </View>

          {/* Additional Reasons */}
          {reasons.length > 0 && (
            <View className="mb-4">
              <Text className={`text-sm font-body-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Additional Factors:
              </Text>
              {reasons.map((reason, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text className={`text-sm mr-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    •
                  </Text>
                  <Text className={`text-sm flex-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {reason}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommended Action */}
          <View className={`p-3 rounded-xl mb-6 ${isDark ? 'bg-primaryDark/20' : 'bg-primary-500/10'}`}>
            <Text className={`text-sm font-body-semibold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
              💡 {adjustment.recommendedAction}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3">
            <Pressable
              className={`flex-1 p-4 rounded-xl border-2 ${
                isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'
              }`}
              onPress={onReject}
              accessibilityLabel="Reject adjustment"
            >
              <Text className={`text-center font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Keep Current
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-primaryDark' : 'bg-primary-500'}`}
              onPress={onApprove}
              accessibilityLabel="Approve adjustment"
            >
              <Text className="text-center font-bold text-white">
                Apply Adjustment
              </Text>
            </Pressable>
          </View>

          {/* Premium Badge */}
          <View className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Text className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              ⭐ Premium Auto-Regulation Feature
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

