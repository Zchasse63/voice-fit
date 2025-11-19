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
import { tokens } from '../../theme/tokens';
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
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
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
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: colors.overlay.scrim,
        }}
      >
        <View
          style={{
            borderTopLeftRadius: tokens.borderRadius['3xl'],
            borderTopRightRadius: tokens.borderRadius['3xl'],
            padding: tokens.spacing.lg,
            maxHeight: '90%',
            backgroundColor: colors.background.secondary,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: tokens.spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <AlertTriangle
                color={getSeverityColor(injuryResult.severity)}
                size={24}
              />
              <Text
                style={{
                  marginLeft: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
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
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.md,
                backgroundColor: colors.background.tertiary,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: tokens.spacing.xs,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    color: colors.text.tertiary,
                  }}
                >
                  Body Part
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                  }}
                >
                  {injuryResult.bodyPart || 'Not specified'}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: tokens.spacing.xs,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    color: colors.text.tertiary,
                  }}
                >
                  Severity
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: getSeverityColor(injuryResult.severity),
                  }}
                >
                  {getSeverityLabel(injuryResult.severity)}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: tokens.spacing.xs,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    color: colors.text.tertiary,
                  }}
                >
                  Type
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                  }}
                >
                  {injuryResult.injuryType || 'Not specified'}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    color: colors.text.tertiary,
                  }}
                >
                  Confidence
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                  }}
                >
                  {Math.round(injuryResult.confidence * 100)}%
                </Text>
              </View>
            </View>

            {/* Description */}
            <View
              style={{
                marginBottom: tokens.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                  marginBottom: tokens.spacing.xs,
                  color: colors.text.tertiary,
                }}
              >
                Assessment
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.base,
                  color: colors.text.secondary,
                }}
              >
                {injuryResult.description}
              </Text>
            </View>

            {/* Medical Disclaimer */}
            <View
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.md,
                borderWidth: 1,
                backgroundColor: colors.backgroundSoft.warning,
                borderColor: isDark ? '#FACC15' : '#EAB308',
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.bold,
                  marginBottom: tokens.spacing.xs,
                  color: isDark ? '#FEF9C3' : '#854D0E',
                }}
              >
                ⚠️ Important Medical Disclaimer
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: isDark ? '#FEF9C3' : '#713F12',
                }}
              >
                This is an automated assessment based on keywords and is NOT a
                medical diagnosis. Coach does not provide medical advice.
                {'\n\n'}
                If you experience severe pain, swelling, inability to bear
                weight, numbness, or symptoms that worsen, seek immediate
                medical attention from a qualified healthcare provider.
              </Text>
            </View>

            {/* Recommendations */}
            <View
              style={{
                marginBottom: tokens.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                  marginBottom: tokens.spacing.xs,
                  color: colors.text.tertiary,
                }}
              >
                Recommended Actions
              </Text>
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: tokens.spacing.xs,
                  }}
                >
                  <CheckCircle
                    color={isDark ? '#4A9B6F' : '#2C5F3D'}
                    size={16}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    style={{
                      marginLeft: tokens.spacing.xs,
                      flex: 1,
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.secondary,
                    }}
                  >
                    Log this injury to track recovery progress
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: tokens.spacing.xs,
                  }}
                >
                  <CheckCircle
                    color={isDark ? '#4A9B6F' : '#2C5F3D'}
                    size={16}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    style={{
                      marginLeft: tokens.spacing.xs,
                      flex: 1,
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.secondary,
                    }}
                  >
                    We'll suggest exercise modifications to avoid aggravating
                    the injury
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: tokens.spacing.xs,
                  }}
                >
                  <CheckCircle
                    color={isDark ? '#4A9B6F' : '#2C5F3D'}
                    size={16}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    style={{
                      marginLeft: tokens.spacing.xs,
                      flex: 1,
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.secondary,
                    }}
                  >
                    Weekly check-ins will monitor your recovery
                  </Text>
                </View>
                {injuryResult.severity === 'severe' && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                    }}
                  >
                    <ExternalLink
                      color={isDark ? '#EF4444' : '#DC2626'}
                      size={16}
                      style={{ marginTop: 2 }}
                    />
                    <Text
                      style={{
                        marginLeft: tokens.spacing.xs,
                        flex: 1,
                        fontSize: tokens.typography.fontSize.sm,
                        color: isDark ? '#FCA5A5' : '#B91C1C',
                      }}
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
              onPress={() => setShowWorkoutAdjustment(true)}
              accessibilityLabel="View affected exercises and substitutions"
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.md,
                borderWidth: 2,
                backgroundColor: colors.backgroundSoft.info,
                borderColor: isDark ? '#1D4ED8' : '#3B82F6',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: tokens.typography.fontWeight.bold,
                      marginBottom: tokens.spacing.xs,
                      color: isDark ? '#60A5FA' : '#1D4ED8',
                    }}
                  >
                    🏋️ View Affected Exercises
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: isDark ? '#BFDBFE' : '#1D4ED8',
                    }}
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
          <View
            style={{
              flexDirection: 'row',
              gap: tokens.spacing.sm,
              marginTop: tokens.spacing.lg,
            }}
          >
            <Pressable
              onPress={onDismiss}
              accessibilityLabel="Dismiss injury detection"
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.background.tertiary,
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.secondary,
                }}
              >
                Dismiss
              </Text>
            </Pressable>

            <Pressable
              onPress={onLogInjury}
              accessibilityLabel="Log injury and track recovery"
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: getSeverityColor(injuryResult.severity),
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: '#FFFFFF',
                }}
              >
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

