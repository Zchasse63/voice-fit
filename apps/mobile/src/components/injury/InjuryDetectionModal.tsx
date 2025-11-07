/**
 * InjuryDetectionModal Component
 * 
 * Modal displayed when injury keywords are detected in readiness check-in notes.
 * Shows detected injury information with medical disclaimer and action options.
 * 
 * Phase 3: Injury Detection & Exercise Substitution
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AlertTriangle, X, CheckCircle, ExternalLink, ArrowRight } from 'lucide-react-native';
import WorkoutAdjustmentModal from './WorkoutAdjustmentModal';

interface InjuryDetectionResult {
  injuryDetected: boolean;
  confidence: number;
  bodyPart: string | null;
  severity: 'mild' | 'moderate' | 'severe' | null;
  injuryType: string | null;
  description: string;
  keywords: string[];
}

interface AffectedExercise {
  exerciseName: string;
  sets: number;
  reps: string;
}

interface InjuryDetectionModalProps {
  visible: boolean;
  onClose: () => void;
  injuryResult: InjuryDetectionResult;
  onLogInjury: () => void;
  onDismiss: () => void;
  affectedExercises?: AffectedExercise[]; // Optional: exercises from today's workout
  onSubstitutionsAccepted?: (substitutions: Map<string, string>) => void;
}

export default function InjuryDetectionModal({
  visible,
  onClose,
  injuryResult,
  onLogInjury,
  onDismiss,
  affectedExercises = [],
  onSubstitutionsAccepted,
}: InjuryDetectionModalProps) {
  const { isDark } = useTheme();
  const [showWorkoutAdjustment, setShowWorkoutAdjustment] = useState(false);

  const hasAffectedExercises = affectedExercises.length > 0;

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'severe':
        return isDark ? '#EF4444' : '#DC2626';
      case 'moderate':
        return isDark ? '#F59E0B' : '#D97706';
      case 'mild':
        return isDark ? '#10B981' : '#059669';
      default:
        return isDark ? '#6B7280' : '#9CA3AF';
    }
  };

  const getSeverityLabel = (severity: string | null) => {
    if (!severity) return 'Unknown';
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

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
            <View className="flex-row items-center">
              <AlertTriangle
                color={getSeverityColor(injuryResult.severity)}
                size={24}
              />
              <Text
                className={`text-xl font-bold ml-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                Potential Injury Detected
              </Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Close modal">
              <X color={isDark ? '#9CA3AF' : '#6B7280'} size={24} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Injury Summary */}
            <View
              className={`p-4 rounded-xl mb-4 ${
                isDark ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className={`text-sm font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Body Part
                </Text>
                <Text
                  className={`text-base font-bold ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  {injuryResult.bodyPart || 'Not specified'}
                </Text>
              </View>

              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className={`text-sm font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Severity
                </Text>
                <Text
                  className="text-base font-bold"
                  style={{ color: getSeverityColor(injuryResult.severity) }}
                >
                  {getSeverityLabel(injuryResult.severity)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className={`text-sm font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Type
                </Text>
                <Text
                  className={`text-base font-bold ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  {injuryResult.injuryType || 'Not specified'}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text
                  className={`text-sm font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Confidence
                </Text>
                <Text
                  className={`text-base font-bold ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  {Math.round(injuryResult.confidence * 100)}%
                </Text>
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Assessment
              </Text>
              <Text
                className={`text-base ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {injuryResult.description}
              </Text>
            </View>

            {/* Medical Disclaimer */}
            <View
              className={`p-4 rounded-xl mb-4 border ${
                isDark
                  ? 'bg-yellow-900/20 border-yellow-700'
                  : 'bg-yellow-50 border-yellow-300'
              }`}
            >
              <Text
                className={`text-sm font-bold mb-2 ${
                  isDark ? 'text-yellow-400' : 'text-yellow-800'
                }`}
              >
                ⚠️ Important Medical Disclaimer
              </Text>
              <Text
                className={`text-xs ${
                  isDark ? 'text-yellow-300' : 'text-yellow-900'
                }`}
              >
                This is an automated assessment based on keywords and is NOT a
                medical diagnosis. VoiceFit does not provide medical advice.
                {'\n\n'}
                If you experience severe pain, swelling, inability to bear
                weight, numbness, or symptoms that worsen, seek immediate
                medical attention from a qualified healthcare provider.
              </Text>
            </View>

            {/* Recommendations */}
            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Recommended Actions
              </Text>
              <View className="space-y-2">
                <View className="flex-row items-start mb-2">
                  <CheckCircle
                    color={isDark ? '#4A9B6F' : '#2C5F3D'}
                    size={16}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    className={`text-sm ml-2 flex-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Log this injury to track recovery progress
                  </Text>
                </View>
                <View className="flex-row items-start mb-2">
                  <CheckCircle
                    color={isDark ? '#4A9B6F' : '#2C5F3D'}
                    size={16}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    className={`text-sm ml-2 flex-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    We'll suggest exercise modifications to avoid aggravating
                    the injury
                  </Text>
                </View>
                <View className="flex-row items-start mb-2">
                  <CheckCircle
                    color={isDark ? '#4A9B6F' : '#2C5F3D'}
                    size={16}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    className={`text-sm ml-2 flex-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Weekly check-ins will monitor your recovery
                  </Text>
                </View>
                {injuryResult.severity === 'severe' && (
                  <View className="flex-row items-start">
                    <ExternalLink
                      color={isDark ? '#EF4444' : '#DC2626'}
                      size={16}
                      style={{ marginTop: 2 }}
                    />
                    <Text
                      className={`text-sm ml-2 flex-1 ${
                        isDark ? 'text-red-400' : 'text-red-600'
                      }`}
                    >
                      Consider consulting a healthcare provider for severe
                      injuries
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* View Affected Exercises Button (if available) */}
          {hasAffectedExercises && (
            <Pressable
              className={`p-4 rounded-xl mb-4 border-2 ${
                isDark
                  ? 'bg-blue-900/20 border-blue-700'
                  : 'bg-blue-50 border-blue-300'
              }`}
              onPress={() => setShowWorkoutAdjustment(true)}
              accessibilityLabel="View affected exercises and substitutions"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text
                    className={`text-sm font-bold mb-1 ${
                      isDark ? 'text-blue-400' : 'text-blue-800'
                    }`}
                  >
                    🏋️ View Affected Exercises
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}
                  >
                    {affectedExercises.length} exercise{affectedExercises.length !== 1 ? 's' : ''} may stress your {injuryResult.bodyPart}
                  </Text>
                </View>
                <ArrowRight
                  color={isDark ? '#60A5FA' : '#2563EB'}
                  size={20}
                />
              </View>
            </Pressable>
          )}

          {/* Action Buttons */}
          <View className="flex-row space-x-3 mt-4">
            <Pressable
              className={`flex-1 p-4 rounded-xl ${
                isDark ? 'bg-gray-800' : 'bg-gray-200'
              }`}
              onPress={onDismiss}
              accessibilityLabel="Dismiss injury detection"
            >
              <Text
                className={`text-center font-bold ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Dismiss
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 p-4 rounded-xl ${
                isDark ? 'bg-primaryDark' : 'bg-primary-500'
              }`}
              onPress={onLogInjury}
              accessibilityLabel="Log injury and track recovery"
            >
              <Text className="text-center font-bold text-white">
                Log Injury
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Workout Adjustment Modal */}
      {hasAffectedExercises && onSubstitutionsAccepted && (
        <WorkoutAdjustmentModal
          visible={showWorkoutAdjustment}
          onClose={() => setShowWorkoutAdjustment(false)}
          injuredBodyPart={injuryResult.bodyPart || 'unknown'}
          affectedExercises={affectedExercises}
          onSubstitutionsAccepted={(substitutions) => {
            onSubstitutionsAccepted(substitutions);
            setShowWorkoutAdjustment(false);
          }}
        />
      )}
    </Modal>
  );
}

