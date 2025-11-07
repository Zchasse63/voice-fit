/**
 * WorkoutAdjustmentModal
 * 
 * Displays affected exercises from the user's workout with substitution options.
 * Allows users to accept/reject each substitution based on similarity scores.
 * 
 * Features:
 * - Shows original exercise from workout plan
 * - Displays suggested substitutes sorted by similarity score
 * - Color-coded similarity indicators (green: 0.90+, blue: 0.75-0.89, yellow: 0.60-0.74)
 * - Accept/reject functionality for each substitution
 * - Updates workout plan in WatermelonDB when user accepts substitution
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import ExerciseSubstitutionService, {
  ExerciseSubstitution,
  SubstitutionResult,
} from '../../services/exercise/ExerciseSubstitutionService';
import ExplanationFormatterService, {
  FormattedExplanation,
} from '../../services/exercise/ExplanationFormatterService';

interface AffectedExercise {
  exerciseName: string;
  sets: number;
  reps: string;
}

interface WorkoutAdjustmentModalProps {
  visible: boolean;
  onClose: () => void;
  injuredBodyPart: string;
  affectedExercises: AffectedExercise[];
  onSubstitutionsAccepted: (substitutions: Map<string, string>) => void;
}

export default function WorkoutAdjustmentModal({
  visible,
  onClose,
  injuredBodyPart,
  affectedExercises,
  onSubstitutionsAccepted,
}: WorkoutAdjustmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [substitutionResults, setSubstitutionResults] = useState<Map<string, SubstitutionResult>>(new Map());
  const [selectedSubstitutions, setSelectedSubstitutions] = useState<Map<string, string>>(new Map());
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [explanations, setExplanations] = useState<Map<string, FormattedExplanation>>(new Map());

  // Fetch substitutions when modal opens
  useEffect(() => {
    if (visible && affectedExercises.length > 0) {
      fetchSubstitutions();
    }
  }, [visible, affectedExercises]);

  const fetchSubstitutions = async () => {
    setLoading(true);
    try {
      const exerciseNames = affectedExercises.map(ex => ex.exerciseName);
      const results = await ExerciseSubstitutionService.getWorkoutSubstitutions(
        exerciseNames,
        injuredBodyPart,
        0.60 // Moderately similar threshold
      );
      setSubstitutionResults(results);
    } catch (error) {
      console.error('[WorkoutAdjustmentModal] Error fetching substitutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubstitution = (originalExercise: string, substituteName: string) => {
    const newSelections = new Map(selectedSubstitutions);
    
    // Toggle selection
    if (newSelections.get(originalExercise) === substituteName) {
      newSelections.delete(originalExercise);
    } else {
      newSelections.set(originalExercise, substituteName);
    }
    
    setSelectedSubstitutions(newSelections);
  };

  const handleAcceptSubstitutions = () => {
    onSubstitutionsAccepted(selectedSubstitutions);
    onClose();
  };

  const toggleExplanation = (originalExercise: string, substitute: ExerciseSubstitution) => {
    const key = `${originalExercise}-${substitute.substitute_name}`;
    const newExpanded = new Set(expandedExplanations);

    if (newExpanded.has(key)) {
      // Collapse
      newExpanded.delete(key);
    } else {
      // Expand and generate explanation if not already cached
      newExpanded.add(key);

      if (!explanations.has(key)) {
        const explanation = ExplanationFormatterService.formatExplanation(substitute, {
          injured_body_part: injuredBodyPart,
        });
        const newExplanations = new Map(explanations);
        newExplanations.set(key, explanation);
        setExplanations(newExplanations);
      }
    }

    setExpandedExplanations(newExpanded);
  };

  const getSimilarityColor = (score: number): string => {
    if (score >= 0.90) return '#10b981'; // Green - Nearly Identical
    if (score >= 0.75) return '#3b82f6'; // Blue - Highly Similar
    if (score >= 0.60) return '#f59e0b'; // Yellow - Moderately Similar
    return '#6b7280'; // Gray - Lower Similarity
  };

  const getSimilarityLabel = (score: number): string => {
    if (score >= 0.90) return 'Nearly Identical';
    if (score >= 0.75) return 'Highly Similar';
    if (score >= 0.60) return 'Moderately Similar';
    return 'Lower Similarity';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[85%]">
          {/* Header */}
          <View className="p-6 border-b border-gray-200">
            <Text className="text-2xl font-bold text-gray-900">
              Workout Adjustments
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Protecting your {injuredBodyPart.replace('_', ' ')}
            </Text>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 px-6">
            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-gray-600 mt-4">Finding safe alternatives...</Text>
              </View>
            ) : (
              <View className="py-4">
                {affectedExercises.map((exercise, index) => {
                  const result = substitutionResults.get(exercise.exerciseName);
                  const hasSubstitutes = result && result.substitutes.length > 0;

                  return (
                    <View key={index} className="mb-6">
                      {/* Original Exercise */}
                      <View className="bg-red-50 p-4 rounded-lg mb-3">
                        <View className="flex-row items-center mb-1">
                          <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                          <Text className="text-sm font-semibold text-red-700">
                            AFFECTED EXERCISE
                          </Text>
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                          {exercise.exerciseName}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {exercise.sets} sets × {exercise.reps} reps
                        </Text>
                      </View>

                      {/* Substitution Options */}
                      {hasSubstitutes ? (
                        <View>
                          <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Safe Alternatives:
                          </Text>
                          {result.substitutes.map((substitute, subIndex) => {
                            const isSelected = selectedSubstitutions.get(exercise.exerciseName) === substitute.substitute_name;
                            const similarityColor = getSimilarityColor(substitute.similarity_score);

                            return (
                              <Pressable
                                key={subIndex}
                                onPress={() => handleSelectSubstitution(exercise.exerciseName, substitute.substitute_name)}
                                className={`mb-3 p-4 rounded-lg border-2 ${
                                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                                }`}
                              >
                                {/* Substitute Header */}
                                <View className="flex-row items-center justify-between mb-2">
                                  <Text className="text-base font-bold text-gray-900 flex-1">
                                    {substitute.substitute_name}
                                  </Text>
                                  <View
                                    className="px-3 py-1 rounded-full"
                                    style={{ backgroundColor: `${similarityColor}20` }}
                                  >
                                    <Text
                                      className="text-xs font-semibold"
                                      style={{ color: similarityColor }}
                                    >
                                      {Math.round(substitute.similarity_score * 100)}%
                                    </Text>
                                  </View>
                                </View>

                                {/* Similarity Label */}
                                <Text className="text-xs text-gray-600 mb-2">
                                  {getSimilarityLabel(substitute.similarity_score)}
                                </Text>

                                {/* Exercise Details */}
                                <View className="flex-row flex-wrap gap-2 mb-2">
                                  <View className="bg-gray-100 px-2 py-1 rounded">
                                    <Text className="text-xs text-gray-700">
                                      {substitute.equipment_required}
                                    </Text>
                                  </View>
                                  <View className="bg-gray-100 px-2 py-1 rounded">
                                    <Text className="text-xs text-gray-700">
                                      {substitute.difficulty_level}
                                    </Text>
                                  </View>
                                  <View className="bg-gray-100 px-2 py-1 rounded">
                                    <Text className="text-xs text-gray-700">
                                      {substitute.movement_pattern.replace('_', ' ')}
                                    </Text>
                                  </View>
                                </View>

                                {/* Scientific Notes (Short Preview) */}
                                <Text className="text-xs text-gray-600 leading-4">
                                  {substitute.notes.length > 120
                                    ? `${substitute.notes.substring(0, 120)}...`
                                    : substitute.notes}
                                </Text>

                                {/* Why? Button */}
                                <Pressable
                                  onPress={() => toggleExplanation(exercise.exerciseName, substitute)}
                                  className="mt-3 self-start"
                                >
                                  <Text className="text-sm font-semibold text-blue-600">
                                    {expandedExplanations.has(`${exercise.exerciseName}-${substitute.substitute_name}`)
                                      ? '▼ Hide Explanation'
                                      : '▶ Why is this recommended?'}
                                  </Text>
                                </Pressable>

                                {/* Expanded Explanation */}
                                {expandedExplanations.has(`${exercise.exerciseName}-${substitute.substitute_name}`) && (
                                  <View className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 p-3 rounded-lg">
                                    <Text className="text-xs text-gray-700 leading-5">
                                      {explanations.get(`${exercise.exerciseName}-${substitute.substitute_name}`)?.explanation || 'Loading explanation...'}
                                    </Text>
                                  </View>
                                )}

                                {/* Selection Indicator */}
                                {isSelected && (
                                  <View className="mt-3 pt-3 border-t border-blue-200">
                                    <Text className="text-sm font-semibold text-blue-600">
                                      ✓ Selected as replacement
                                    </Text>
                                  </View>
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : (
                        <View className="bg-gray-50 p-4 rounded-lg">
                          <Text className="text-sm text-gray-600">
                            No substitutions available for this exercise.
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-6 border-t border-gray-200 bg-white">
            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
              >
                <Text className="text-base font-semibold text-gray-700">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAcceptSubstitutions}
                disabled={selectedSubstitutions.size === 0}
                className={`flex-1 py-4 rounded-xl items-center ${
                  selectedSubstitutions.size > 0 ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <Text className="text-base font-semibold text-white">
                  Accept {selectedSubstitutions.size > 0 ? `(${selectedSubstitutions.size})` : ''}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

