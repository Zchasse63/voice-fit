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

  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay.scrim,
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.background.secondary,
            borderTopLeftRadius: tokens.borderRadius['3xl'],
            borderTopRightRadius: tokens.borderRadius['3xl'],
            maxHeight: '85%',
          }}
        >
          {/* Header */}
          <View
            style={{
              padding: tokens.spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.subtle,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize['2xl'],
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              Workout Adjustments
            </Text>
            <Text
              style={{
                marginTop: tokens.spacing.xs,
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              Protecting your {injuredBodyPart.replace('_', ' ')}
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1, paddingHorizontal: tokens.spacing.lg }}
            contentContainerStyle={{ paddingVertical: tokens.spacing.md }}
          >
            {loading ? (
              <View
                style={{
                  paddingVertical: tokens.spacing.xl,
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator
                  size="large"
                  color={isDark ? tokens.colors.dark.accent.blue : tokens.colors.light.accent.blue}
                />
                <Text
                  style={{
                    marginTop: tokens.spacing.sm,
                    fontSize: tokens.typography.fontSize.sm,
                    color: colors.text.secondary,
                  }}
                >
                  Finding safe alternatives...
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: tokens.spacing.sm }}>
                {affectedExercises.map((exercise, index) => {
                  const result = substitutionResults.get(exercise.exerciseName);
                  const hasSubstitutes = result && result.substitutes.length > 0;

                  return (
                    <View
                      key={index}
                      style={{ marginBottom: tokens.spacing.lg }}
                    >
                      {/* Original Exercise */}
                      <View
                        style={{
                          backgroundColor: isDark
                            ? `${tokens.colors.dark.state.danger}10`
                            : `${tokens.colors.light.state.danger}10`,
                          padding: tokens.spacing.md,
                          borderRadius: tokens.borderRadius.xl,
                          marginBottom: tokens.spacing.sm,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: tokens.spacing.xs,
                          }}
                        >
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              marginRight: tokens.spacing.xs,
                              backgroundColor: isDark
                                ? tokens.colors.dark.state.danger
                                : tokens.colors.light.state.danger,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: tokens.typography.fontSize.xs,
                              fontWeight: tokens.typography.fontWeight.semibold,
                              color: isDark
                                ? tokens.colors.dark.state.danger
                                : tokens.colors.light.state.danger,
                            }}
                          >
                            AFFECTED EXERCISE
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: tokens.typography.fontSize.lg,
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: colors.text.primary,
                          }}
                        >
                          {exercise.exerciseName}
                        </Text>
                        <Text
                          style={{
                            marginTop: 2,
                            fontSize: tokens.typography.fontSize.sm,
                            color: colors.text.secondary,
                          }}
                        >
                          {exercise.sets} sets × {exercise.reps} reps
                        </Text>
                      </View>

                      {/* Substitution Options */}
                      {hasSubstitutes ? (
                        <View>
                          <Text
                            style={{
                              marginBottom: tokens.spacing.xs,
                              fontSize: tokens.typography.fontSize.sm,
                              fontWeight: tokens.typography.fontWeight.semibold,
                              color: colors.text.primary,
                            }}
                          >
                            Safe Alternatives:
                          </Text>
                          {result.substitutes.map((substitute, subIndex) => {
                            const isSelected =
                              selectedSubstitutions.get(exercise.exerciseName) ===
                              substitute.substitute_name;
                            const similarityColor = getSimilarityColor(
                              substitute.similarity_score,
                            );

                            return (
                              <Pressable
                                key={subIndex}
                                onPress={() =>
                                  handleSelectSubstitution(
                                    exercise.exerciseName,
                                    substitute.substitute_name,
                                  )
                                }
                                style={{
                                  marginBottom: tokens.spacing.sm,
                                  padding: tokens.spacing.md,
                                  borderRadius: tokens.borderRadius.xl,
                                  borderWidth: 2,
                                  borderColor: isSelected
                                    ? isDark
                                      ? tokens.colors.dark.accent.blue
                                      : tokens.colors.light.accent.blue
                                    : colors.border.subtle,
                                  backgroundColor: isSelected
                                    ? isDark
                                      ? `${tokens.colors.dark.accent.blue}10`
                                      : `${tokens.colors.light.accent.blue}10`
                                    : colors.background.primary,
                                }}
                              >
                                {/* Substitute Header */}
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: tokens.spacing.xs,
                                  }}
                                >
                                  <Text
                                    style={{
                                      flex: 1,
                                      fontSize: tokens.typography.fontSize.base,
                                      fontWeight: tokens.typography.fontWeight.bold,
                                      color: colors.text.primary,
                                    }}
                                  >
                                    {substitute.substitute_name}
                                  </Text>
                                  <View
                                    style={{
                                      paddingHorizontal: tokens.spacing.sm,
                                      paddingVertical: tokens.spacing.xs,
                                      borderRadius: 999,
                                      backgroundColor: `${similarityColor}20`,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: tokens.typography.fontSize.xs,
                                        fontWeight: tokens.typography.fontWeight.semibold,
                                        color: similarityColor,
                                      }}
                                    >
                                      {Math.round(substitute.similarity_score * 100)}%
                                    </Text>
                                  </View>
                                </View>

                                {/* Similarity Label */}
                                <Text
                                  style={{
                                    marginBottom: tokens.spacing.xs,
                                    fontSize: tokens.typography.fontSize.xs,
                                    color: colors.text.secondary,
                                  }}
                                >
                                  {getSimilarityLabel(substitute.similarity_score)}
                                </Text>

                                {/* Exercise Details */}
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                    marginBottom: tokens.spacing.xs,
                                  }}
                                >
                                  <View
                                    style={{
                                      backgroundColor: colors.background.tertiary,
                                      paddingHorizontal: tokens.spacing.xs,
                                      paddingVertical: 2,
                                      borderRadius: tokens.borderRadius.lg,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: colors.text.secondary,
                                      }}
                                    >
                                      {substitute.equipment_required}
                                    </Text>
                                  </View>
                                  <View
                                    style={{
                                      backgroundColor: colors.background.tertiary,
                                      paddingHorizontal: tokens.spacing.xs,
                                      paddingVertical: 2,
                                      borderRadius: tokens.borderRadius.lg,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: colors.text.secondary,
                                      }}
                                    >
                                      {substitute.difficulty_level}
                                    </Text>
                                  </View>
                                  <View
                                    style={{
                                      backgroundColor: colors.background.tertiary,
                                      paddingHorizontal: tokens.spacing.xs,
                                      paddingVertical: 2,
                                      borderRadius: tokens.borderRadius.lg,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: colors.text.secondary,
                                      }}
                                    >
                                      {substitute.movement_pattern.replace('_', ' ')}
                                    </Text>
                                  </View>
                                </View>

                                {/* Scientific Notes (Short Preview) */}
                                <Text
                                  style={{
                                    fontSize: tokens.typography.fontSize.xs,
                                    color: colors.text.secondary,
                                    lineHeight: 16,
                                  }}
                                >
                                  {substitute.notes.length > 120
                                    ? `${substitute.notes.substring(0, 120)}...`
                                    : substitute.notes}
                                </Text>

                                {/* Why? Button */}
                                <Pressable
                                  onPress={() =>
                                    toggleExplanation(exercise.exerciseName, substitute)
                                  }
                                  style={{
                                    marginTop: tokens.spacing.sm,
                                    alignSelf: 'flex-start',
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: tokens.typography.fontSize.sm,
                                      fontWeight: tokens.typography.fontWeight.semibold,
                                      color: isDark
                                        ? tokens.colors.dark.accent.blue
                                        : tokens.colors.light.accent.blue,
                                    }}
                                  >
                                    {expandedExplanations.has(
                                      `${exercise.exerciseName}-${substitute.substitute_name}`,
                                    )
                                      ? '▼ Hide Explanation'
                                      : '▶ Why is this recommended?'}
                                  </Text>
                                </Pressable>

                                {/* Expanded Explanation */}
                                {expandedExplanations.has(
                                  `${exercise.exerciseName}-${substitute.substitute_name}`,
                                ) && (
                                  <View
                                    style={{
                                      marginTop: tokens.spacing.sm,
                                      paddingTop: tokens.spacing.sm,
                                      borderTopWidth: 1,
                                      borderTopColor: colors.border.subtle,
                                      backgroundColor: colors.background.tertiary,
                                      padding: tokens.spacing.sm,
                                      borderRadius: tokens.borderRadius.lg,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: colors.text.primary,
                                        lineHeight: 18,
                                      }}
                                    >
                                      {explanations.get(
                                        `${exercise.exerciseName}-${substitute.substitute_name}`,
                                      )?.explanation || 'Loading explanation...'}
                                    </Text>
                                  </View>
                                )}

                                {/* Selection Indicator */}
                                {isSelected && (
                                  <View
                                    style={{
                                      marginTop: tokens.spacing.sm,
                                      paddingTop: tokens.spacing.sm,
                                      borderTopWidth: 1,
                                      borderTopColor: isDark
                                        ? `${tokens.colors.dark.accent.blue}40`
                                        : `${tokens.colors.light.accent.blue}40`,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: tokens.typography.fontSize.sm,
                                        fontWeight: tokens.typography.fontWeight.semibold,
                                        color: isDark
                                          ? tokens.colors.dark.accent.blue
                                          : tokens.colors.light.accent.blue,
                                      }}
                                    >
                                      ✓ Selected as replacement
                                    </Text>
                                  </View>
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : (
                        <View
                          style={{
                            backgroundColor: colors.background.tertiary,
                            padding: tokens.spacing.md,
                            borderRadius: tokens.borderRadius.xl,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: tokens.typography.fontSize.sm,
                              color: colors.text.secondary,
                            }}
                          >
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
          <View
            style={{
              padding: tokens.spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.border.subtle,
              backgroundColor: colors.background.secondary,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                columnGap: tokens.spacing.sm,
              }}
            >
              <Pressable
                onPress={onClose}
                style={{
                  flex: 1,
                  paddingVertical: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.xl,
                  alignItems: 'center',
                  backgroundColor: colors.background.tertiary,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAcceptSubstitutions}
                disabled={selectedSubstitutions.size === 0}
                style={{
                  flex: 1,
                  paddingVertical: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.xl,
                  alignItems: 'center',
                  backgroundColor:
                    selectedSubstitutions.size > 0
                      ? isDark
                        ? tokens.colors.dark.accent.blue
                        : tokens.colors.light.accent.blue
                      : colors.background.tertiary,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color:
                      selectedSubstitutions.size > 0
                        ? tokens.colors.shared.static.white
                        : colors.text.secondary,
                  }}
                >
                  Accept
                  {selectedSubstitutions.size > 0
                    ? ` (${selectedSubstitutions.size})`
                    : ''}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

