/**
 * ConflictWarningModal
 * 
 * Displays scheduling conflict warnings when rescheduling workouts.
 * Shows conflict details and allows user to proceed or cancel.
 */

import React from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { AlertTriangle, X, CheckCircle } from 'lucide-react-native';
import type { ConflictInfo } from '../../services/calendar/CalendarService';

interface ConflictWarningModalProps {
  visible: boolean;
  onClose: () => void;
  onProceed: () => void;
  conflicts: ConflictInfo;
  targetDate: string;
}

export default function ConflictWarningModal({
  visible,
  onClose,
  onProceed,
  conflicts,
  targetDate,
}: ConflictWarningModalProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  const getConflictSeverity = () => {
    if (conflicts.conflict_type === 'excessive_duration') return 'high';
    if (conflicts.conflict_type === 'too_many_workouts') return 'high';
    if (conflicts.conflict_type === 'duration_warning') return 'medium';
    return 'low';
  };

  const severity = getConflictSeverity();
  const severityColor =
    severity === 'high'
      ? tokens.colors.light.accent.coral
      : severity === 'medium'
      ? tokens.colors.light.accent.orange
      : tokens.colors.light.accent.yellow;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: tokens.spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.xl,
            width: '100%',
            maxWidth: 400,
            maxHeight: '80%',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: tokens.spacing.lg,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${severityColor}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: tokens.spacing.md,
              }}
            >
              <AlertTriangle color={severityColor} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                Scheduling Conflict
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginTop: 2,
                }}
              >
                {new Date(targetDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X color={colors.text.secondary} size={24} />
            </Pressable>
          </View>

          {/* Conflict Details */}
          <ScrollView style={{ maxHeight: 300 }}>
            {/* Warnings */}
            {conflicts.warnings.map((warning, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: `${severityColor}10`,
                  borderLeftWidth: 3,
                  borderLeftColor: severityColor,
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.md,
                  marginBottom: tokens.spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: colors.text.primary,
                  }}
                >
                  {warning}
                </Text>
              </View>
            ))}

            {/* Existing Workouts */}
            {conflicts.workouts.length > 0 && (
              <View style={{ marginTop: tokens.spacing.md }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.secondary,
                    marginBottom: tokens.spacing.sm,
                  }}
                >
                  Existing workouts on this day:
                </Text>
                {conflicts.workouts.map((workout, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: tokens.spacing.sm,
                      borderBottomWidth: index < conflicts.workouts.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border.primary,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: tokens.typography.fontSize.sm,
                          color: colors.text.primary,
                        }}
                      >
                        {workout.workout_name}
                      </Text>
                      <Text
                        style={{
                          fontSize: tokens.typography.fontSize.xs,
                          color: colors.text.tertiary,
                          marginTop: 2,
                        }}
                      >
                        {workout.estimated_duration} min
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View
            style={{
              flexDirection: 'row',
              gap: tokens.spacing.md,
              marginTop: tokens.spacing.lg,
            }}
          >
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: tokens.spacing.md,
                borderRadius: tokens.borderRadius.md,
                backgroundColor: colors.background.secondary,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.md,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onProceed}
              style={{
                flex: 1,
                paddingVertical: tokens.spacing.md,
                borderRadius: tokens.borderRadius.md,
                backgroundColor: colors.accent.green,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: tokens.spacing.sm,
              }}
            >
              <CheckCircle color="#FFFFFF" size={20} />
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.md,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: '#FFFFFF',
                }}
              >
                Proceed Anyway
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

