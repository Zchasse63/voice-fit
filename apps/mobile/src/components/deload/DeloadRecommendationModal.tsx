/**
 * DeloadRecommendationModal Component
 * 
 * Displays deload week recommendation with explanation and user approval.
 * Shows fatigue indicators and deload prescription details.
 */

import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AlertCircle, TrendingDown, CheckCircle, X, Battery } from 'lucide-react-native';
import { FatigueAssessment, DeloadPrescription } from '../../services/deload/DeloadService';

interface DeloadRecommendationModalProps {
  visible: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  assessment: FatigueAssessment;
  prescription: DeloadPrescription;
}

export default function DeloadRecommendationModal({
  visible,
  onClose,
  onApprove,
  onReject,
  assessment,
  prescription,
}: DeloadRecommendationModalProps) {
  const { isDark } = useTheme();

  const volumeReductionPercent = Math.round((1 - prescription.volumeReduction) * 100);
  const intensityPercent = Math.round(prescription.intensityMaintenance * 100);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <View className={`w-full max-w-md rounded-xl shadow-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Battery color="#F9AC60" size={24} />
                <Text className={`text-xl font-bold ml-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Deload Week Recommended
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

            {/* Alert Badge */}
            <View className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-xl mb-4">
              <View className="flex-row items-center mb-2">
                <AlertCircle color="#F9AC60" size={20} />
                <Text className="text-base font-bold text-orange-600 dark:text-orange-400 ml-2">
                  Recovery Week Needed
                </Text>
              </View>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Your body is showing signs of fatigue. A deload week will help you recover and come back stronger.
              </Text>
            </View>

            {/* Fatigue Indicators */}
            <View className="mb-4">
              <Text className={`text-sm font-body-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Fatigue Indicators:
              </Text>
              {assessment.reasons.map((reason, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <TrendingDown color="#F9AC60" size={16} className="mt-1" />
                  <Text className={`text-sm flex-1 ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {reason}
                  </Text>
                </View>
              ))}
            </View>

            {/* Deload Prescription */}
            <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Text className={`text-sm font-body-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Deload Prescription:
              </Text>

              {/* Volume Reduction */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Volume Reduction
                  </Text>
                  <Text className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {volumeReductionPercent}% fewer sets
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-lg ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                  <Text className="text-sm font-body-semibold text-orange-600 dark:text-orange-400">
                    {Math.round(prescription.volumeReduction * 100)}% volume
                  </Text>
                </View>
              </View>

              {/* Intensity Maintenance */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Intensity Maintenance
                  </Text>
                  <Text className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Keep {intensityPercent}% of weight
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <Text className="text-sm font-body-semibold text-green-600 dark:text-green-400">
                    Maintain strength
                  </Text>
                </View>
              </View>

              {/* Duration */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Duration
                  </Text>
                  <Text className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {prescription.duration} days
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Text className="text-sm font-body-semibold text-blue-600 dark:text-blue-400">
                    1 week
                  </Text>
                </View>
              </View>
            </View>

            {/* Benefits */}
            <View className={`p-3 rounded-xl mb-6 ${isDark ? 'bg-primaryDark/20' : 'bg-primary-500/10'}`}>
              <Text className={`text-sm font-body-semibold mb-2 ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                💡 Benefits of Deloading:
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                • Allows muscles and nervous system to recover{'\n'}
                • Prevents overtraining and injury{'\n'}
                • Prepares you for future progress{'\n'}
                • Maintains strength while reducing fatigue
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <Pressable
                className={`flex-1 p-4 rounded-xl border-2 ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'
                }`}
                onPress={onReject}
                accessibilityLabel="Reject deload"
              >
                <Text className={`text-center font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Skip Deload
                </Text>
              </Pressable>

              <Pressable
                className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-primaryDark' : 'bg-primary-500'}`}
                onPress={onApprove}
                accessibilityLabel="Approve deload"
              >
                <Text className="text-center font-bold text-white">
                  Start Deload Week
                </Text>
              </Pressable>
            </View>

            {/* Premium Badge */}
            <View className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Text className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                ⭐ Premium Auto-Deload Feature
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

