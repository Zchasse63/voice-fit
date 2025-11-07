/**
 * RecoveryCheckInModal Component
 * 
 * Weekly recovery check-in modal for active injuries.
 * Collects pain level, ROM quality, and activity tolerance to track recovery progress.
 * 
 * Phase 3: Injury Detection & Exercise Substitution
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../theme/ThemeContext';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface InjuryLog {
  id: string;
  bodyPart: string;
  severity: string;
  description?: string;
  reportedAt: Date;
}

interface RecoveryCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  injury: InjuryLog | null;
  onSubmit: (checkInData: CheckInData) => Promise<void>;
}

export interface CheckInData {
  painLevel: number;
  romQuality: 'better' | 'same' | 'worse';
  activityTolerance: 'improving' | 'plateau' | 'declining';
  newSymptoms?: string;
}

export default function RecoveryCheckInModal({
  visible,
  onClose,
  injury,
  onSubmit,
}: RecoveryCheckInModalProps) {
  const { isDark } = useTheme();
  const [painLevel, setPainLevel] = useState(5);
  const [romQuality, setRomQuality] = useState<'better' | 'same' | 'worse'>('same');
  const [activityTolerance, setActivityTolerance] = useState<'improving' | 'plateau' | 'declining'>('plateau');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!injury || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      const checkInData: CheckInData = {
        painLevel,
        romQuality,
        activityTolerance,
      };

      await onSubmit(checkInData);
      
      // Reset form
      setPainLevel(5);
      setRomQuality('same');
      setActivityTolerance('plateau');
      
      onClose();
    } catch (error) {
      console.error('Failed to submit check-in:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!injury) return null;

  const daysInRecovery = Math.floor(
    (new Date().getTime() - new Date(injury.reportedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View
          className={`rounded-t-3xl p-6 ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
          style={{ maxHeight: '90%' }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text
                className={`text-xl font-bold ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                Recovery Check-In
              </Text>
              <Text
                className={`text-sm mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {injury.bodyPart} • Day {daysInRecovery}
              </Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Close modal">
              <X color={isDark ? '#9CA3AF' : '#6B7280'} size={24} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Pain Level Slider */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className={`text-base font-bold ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  Current Pain Level
                </Text>
                <Text
                  className={`text-2xl font-bold ${
                    painLevel >= 7
                      ? 'text-red-500'
                      : painLevel >= 4
                      ? 'text-yellow-500'
                      : 'text-green-500'
                  }`}
                >
                  {painLevel}
                </Text>
              </View>

              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={painLevel}
                onValueChange={setPainLevel}
                minimumTrackTintColor={
                  painLevel >= 7
                    ? '#EF4444'
                    : painLevel >= 4
                    ? '#F59E0B'
                    : '#10B981'
                }
                maximumTrackTintColor={isDark ? '#374151' : '#D1D5DB'}
                thumbTintColor={
                  painLevel >= 7
                    ? '#EF4444'
                    : painLevel >= 4
                    ? '#F59E0B'
                    : '#10B981'
                }
              />

              <View className="flex-row justify-between mt-1">
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No pain
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Worst pain
                </Text>
              </View>
            </View>

            {/* Range of Motion Quality */}
            <View className="mb-6">
              <Text
                className={`text-base font-bold mb-3 ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                Range of Motion
              </Text>
              <View className="flex-row space-x-2">
                <Pressable
                  className={`flex-1 p-4 rounded-xl flex-row items-center justify-center ${
                    romQuality === 'better'
                      ? isDark
                        ? 'bg-green-900/40 border-2 border-green-500'
                        : 'bg-green-100 border-2 border-green-500'
                      : isDark
                      ? 'bg-gray-800'
                      : 'bg-gray-100'
                  }`}
                  onPress={() => setRomQuality('better')}
                >
                  <TrendingUp
                    color={romQuality === 'better' ? '#10B981' : isDark ? '#6B7280' : '#9CA3AF'}
                    size={20}
                  />
                  <Text
                    className={`ml-2 font-bold ${
                      romQuality === 'better'
                        ? 'text-green-500'
                        : isDark
                        ? 'text-gray-400'
                        : 'text-gray-600'
                    }`}
                  >
                    Better
                  </Text>
                </Pressable>

                <Pressable
                  className={`flex-1 p-4 rounded-xl flex-row items-center justify-center ${
                    romQuality === 'same'
                      ? isDark
                        ? 'bg-yellow-900/40 border-2 border-yellow-500'
                        : 'bg-yellow-100 border-2 border-yellow-500'
                      : isDark
                      ? 'bg-gray-800'
                      : 'bg-gray-100'
                  }`}
                  onPress={() => setRomQuality('same')}
                >
                  <Minus
                    color={romQuality === 'same' ? '#F59E0B' : isDark ? '#6B7280' : '#9CA3AF'}
                    size={20}
                  />
                  <Text
                    className={`ml-2 font-bold ${
                      romQuality === 'same'
                        ? 'text-yellow-500'
                        : isDark
                        ? 'text-gray-400'
                        : 'text-gray-600'
                    }`}
                  >
                    Same
                  </Text>
                </Pressable>

                <Pressable
                  className={`flex-1 p-4 rounded-xl flex-row items-center justify-center ${
                    romQuality === 'worse'
                      ? isDark
                        ? 'bg-red-900/40 border-2 border-red-500'
                        : 'bg-red-100 border-2 border-red-500'
                      : isDark
                      ? 'bg-gray-800'
                      : 'bg-gray-100'
                  }`}
                  onPress={() => setRomQuality('worse')}
                >
                  <TrendingDown
                    color={romQuality === 'worse' ? '#EF4444' : isDark ? '#6B7280' : '#9CA3AF'}
                    size={20}
                  />
                  <Text
                    className={`ml-2 font-bold ${
                      romQuality === 'worse'
                        ? 'text-red-500'
                        : isDark
                        ? 'text-gray-400'
                        : 'text-gray-600'
                    }`}
                  >
                    Worse
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Activity Tolerance */}
            <View className="mb-6">
              <Text
                className={`text-base font-bold mb-3 ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                Activity Tolerance
              </Text>
              <View className="space-y-2">
                <Pressable
                  className={`p-4 rounded-xl ${
                    activityTolerance === 'improving'
                      ? isDark
                        ? 'bg-green-900/40 border-2 border-green-500'
                        : 'bg-green-100 border-2 border-green-500'
                      : isDark
                      ? 'bg-gray-800'
                      : 'bg-gray-100'
                  }`}
                  onPress={() => setActivityTolerance('improving')}
                >
                  <Text
                    className={`font-bold ${
                      activityTolerance === 'improving'
                        ? 'text-green-500'
                        : isDark
                        ? 'text-gray-300'
                        : 'text-gray-700'
                    }`}
                  >
                    Improving
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      activityTolerance === 'improving'
                        ? 'text-green-400'
                        : isDark
                        ? 'text-gray-500'
                        : 'text-gray-600'
                    }`}
                  >
                    Can do more activities with less discomfort
                  </Text>
                </Pressable>

                <Pressable
                  className={`p-4 rounded-xl ${
                    activityTolerance === 'plateau'
                      ? isDark
                        ? 'bg-yellow-900/40 border-2 border-yellow-500'
                        : 'bg-yellow-100 border-2 border-yellow-500'
                      : isDark
                      ? 'bg-gray-800'
                      : 'bg-gray-100'
                  }`}
                  onPress={() => setActivityTolerance('plateau')}
                >
                  <Text
                    className={`font-bold ${
                      activityTolerance === 'plateau'
                        ? 'text-yellow-500'
                        : isDark
                        ? 'text-gray-300'
                        : 'text-gray-700'
                    }`}
                  >
                    Plateau
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      activityTolerance === 'plateau'
                        ? 'text-yellow-400'
                        : isDark
                        ? 'text-gray-500'
                        : 'text-gray-600'
                    }`}
                  >
                    No significant change in activity level
                  </Text>
                </Pressable>

                <Pressable
                  className={`p-4 rounded-xl ${
                    activityTolerance === 'declining'
                      ? isDark
                        ? 'bg-red-900/40 border-2 border-red-500'
                        : 'bg-red-100 border-2 border-red-500'
                      : isDark
                      ? 'bg-gray-800'
                      : 'bg-gray-100'
                  }`}
                  onPress={() => setActivityTolerance('declining')}
                >
                  <Text
                    className={`font-bold ${
                      activityTolerance === 'declining'
                        ? 'text-red-500'
                        : isDark
                        ? 'text-gray-300'
                        : 'text-gray-700'
                    }`}
                  >
                    Declining
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      activityTolerance === 'declining'
                        ? 'text-red-400'
                        : isDark
                        ? 'text-gray-500'
                        : 'text-gray-600'
                    }`}
                  >
                    More difficulty with activities than before
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <Pressable
            className={`p-4 rounded-xl mt-4 ${
              isSubmitting
                ? isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-300'
                : isDark
                ? 'bg-primaryDark'
                : 'bg-primary-500'
            }`}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityLabel="Submit recovery check-in"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-center font-bold text-white">
                Submit Check-In
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

