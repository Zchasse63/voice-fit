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
import { tokens } from '../../theme/tokens';
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
          justifyContent: 'flex-end',
          backgroundColor: colors.overlay.scrim,
        }}
      >
        <View
          style={{
            borderTopLeftRadius: tokens.borderRadius.xl,
            borderTopRightRadius: tokens.borderRadius.xl,
            padding: tokens.spacing.lg,
            backgroundColor: colors.background.secondary,
            maxHeight: '90%',
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
            <View>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                Recovery Check-In
              </Text>
              <Text
                style={{
                  marginTop: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                {injury.bodyPart} • Day {daysInRecovery}
              </Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Close modal">
              <X
                color={isDark ? tokens.colors.dark.text.tertiary : tokens.colors.light.text.tertiary}
                size={24}
              />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Pain Level Slider */}
            <View style={{ marginBottom: tokens.spacing.lg }}>
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
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                  }}
                >
                  Current Pain Level
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize['2xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color:
                      painLevel >= 7
                        ? tokens.colors.light.accent.red
                        : painLevel >= 4
                          ? tokens.colors.light.accent.orange
                          : tokens.colors.light.accent.green,
                  }}
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
                    ? tokens.colors.light.accent.red
                    : painLevel >= 4
                      ? tokens.colors.light.accent.orange
                      : tokens.colors.light.accent.green
                }
                maximumTrackTintColor={
                  isDark ? tokens.colors.dark.border.subtle : tokens.colors.light.border.subtle
                }
                thumbTintColor={
                  painLevel >= 7
                    ? tokens.colors.light.accent.red
                    : painLevel >= 4
                      ? tokens.colors.light.accent.orange
                      : tokens.colors.light.accent.green
                }
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: tokens.spacing.xs,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  No pain
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  Worst pain
                </Text>
              </View>
            </View>

            {/* Range of Motion Quality */}
            <View style={{ marginBottom: tokens.spacing.lg }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.base,
                  fontWeight: tokens.typography.fontWeight.bold,
                  marginBottom: tokens.spacing.sm,
                  color: colors.text.primary,
                }}
              >
                Range of Motion
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  columnGap: tokens.spacing.xs,
                }}
              >
                <Pressable
                  onPress={() => setRomQuality('better')}
                  style={{
                    flex: 1,
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.xl,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      romQuality === 'better'
                        ? isDark
                          ? `${tokens.colors.dark.accent.green}20`
                          : `${tokens.colors.light.accent.green}20`
                        : colors.background.tertiary,
                    borderWidth: romQuality === 'better' ? 2 : 0,
                    borderColor:
                      romQuality === 'better'
                        ? isDark
                          ? tokens.colors.dark.accent.green
                          : tokens.colors.light.accent.green
                        : 'transparent',
                  }}
                >
                  <TrendingUp
                    color={
                      romQuality === 'better'
                        ? tokens.colors.light.accent.green
                        : colors.text.tertiary
                    }
                    size={20}
                  />
                  <Text
                    style={{
                      marginLeft: tokens.spacing.xs,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color:
                        romQuality === 'better'
                          ? tokens.colors.light.accent.green
                          : colors.text.secondary,
                    }}
                  >
                    Better
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setRomQuality('same')}
                  style={{
                    flex: 1,
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.xl,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      romQuality === 'same'
                        ? isDark
                          ? `${tokens.colors.dark.accent.orange}20`
                          : `${tokens.colors.light.accent.orange}20`
                        : colors.background.tertiary,
                    borderWidth: romQuality === 'same' ? 2 : 0,
                    borderColor:
                      romQuality === 'same'
                        ? isDark
                          ? tokens.colors.dark.accent.orange
                          : tokens.colors.light.accent.orange
                        : 'transparent',
                  }}
                >
                  <Minus
                    color={
                      romQuality === 'same'
                        ? tokens.colors.light.accent.orange
                        : colors.text.tertiary
                    }
                    size={20}
                  />
                  <Text
                    style={{
                      marginLeft: tokens.spacing.xs,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color:
                        romQuality === 'same'
                          ? tokens.colors.light.accent.orange
                          : colors.text.secondary,
                    }}
                  >
                    Same
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setRomQuality('worse')}
                  style={{
                    flex: 1,
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.xl,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      romQuality === 'worse'
                        ? isDark
                          ? `${tokens.colors.dark.accent.red}20`
                          : `${tokens.colors.light.accent.red}20`
                        : colors.background.tertiary,
                    borderWidth: romQuality === 'worse' ? 2 : 0,
                    borderColor:
                      romQuality === 'worse'
                        ? isDark
                          ? tokens.colors.dark.accent.red
                          : tokens.colors.light.accent.red
                        : 'transparent',
                  }}
                >
                  <TrendingDown
                    color={
                      romQuality === 'worse'
                        ? tokens.colors.light.accent.red
                        : colors.text.tertiary
                    }
                    size={20}
                  />
                  <Text
                    style={{
                      marginLeft: tokens.spacing.xs,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color:
                        romQuality === 'worse'
                          ? tokens.colors.light.accent.red
                          : colors.text.secondary,
                    }}
                  >
                    Worse
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Activity Tolerance */}
            <View style={{ marginBottom: tokens.spacing.lg }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.base,
                  fontWeight: tokens.typography.fontWeight.bold,
                  marginBottom: tokens.spacing.sm,
                  color: colors.text.primary,
                }}
              >
                Activity Tolerance
              </Text>
              <View style={{ rowGap: tokens.spacing.xs }}>
                <Pressable
                  onPress={() => setActivityTolerance('improving')}
                  style={{
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.xl,
                    backgroundColor:
                      activityTolerance === 'improving'
                        ? isDark
                          ? `${tokens.colors.dark.accent.green}20`
                          : `${tokens.colors.light.accent.green}20`
                        : colors.background.tertiary,
                    borderWidth: activityTolerance === 'improving' ? 2 : 0,
                    borderColor:
                      activityTolerance === 'improving'
                        ? isDark
                          ? tokens.colors.dark.accent.green
                          : tokens.colors.light.accent.green
                        : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: tokens.typography.fontWeight.bold,
                      color:
                        activityTolerance === 'improving'
                          ? tokens.colors.light.accent.green
                          : colors.text.primary,
                    }}
                  >
                    Improving
                  </Text>
                  <Text
                    style={{
                      marginTop: tokens.spacing.xs,
                      fontSize: tokens.typography.fontSize.xs,
                      color:
                        activityTolerance === 'improving'
                          ? tokens.colors.light.accent.green
                          : colors.text.secondary,
                    }}
                  >
                    Can do more activities with less discomfort
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActivityTolerance('plateau')}
                  style={{
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.xl,
                    backgroundColor:
                      activityTolerance === 'plateau'
                        ? isDark
                          ? `${tokens.colors.dark.accent.orange}20`
                          : `${tokens.colors.light.accent.orange}20`
                        : colors.background.tertiary,
                    borderWidth: activityTolerance === 'plateau' ? 2 : 0,
                    borderColor:
                      activityTolerance === 'plateau'
                        ? isDark
                          ? tokens.colors.dark.accent.orange
                          : tokens.colors.light.accent.orange
                        : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: tokens.typography.fontWeight.bold,
                      color:
                        activityTolerance === 'plateau'
                          ? tokens.colors.light.accent.orange
                          : colors.text.primary,
                    }}
                  >
                    Plateau
                  </Text>
                  <Text
                    style={{
                      marginTop: tokens.spacing.xs,
                      fontSize: tokens.typography.fontSize.xs,
                      color:
                        activityTolerance === 'plateau'
                          ? tokens.colors.light.accent.orange
                          : colors.text.secondary,
                    }}
                  >
                    No significant change in activity level
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActivityTolerance('declining')}
                  style={{
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.xl,
                    backgroundColor:
                      activityTolerance === 'declining'
                        ? isDark
                          ? `${tokens.colors.dark.accent.red}20`
                          : `${tokens.colors.light.accent.red}20`
                        : colors.background.tertiary,
                    borderWidth: activityTolerance === 'declining' ? 2 : 0,
                    borderColor:
                      activityTolerance === 'declining'
                        ? isDark
                          ? tokens.colors.dark.accent.red
                          : tokens.colors.light.accent.red
                        : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: tokens.typography.fontWeight.bold,
                      color:
                        activityTolerance === 'declining'
                          ? tokens.colors.light.accent.red
                          : colors.text.primary,
                    }}
                  >
                    Declining
                  </Text>
                  <Text
                    style={{
                      marginTop: tokens.spacing.xs,
                      fontSize: tokens.typography.fontSize.xs,
                      color:
                        activityTolerance === 'declining'
                          ? tokens.colors.light.accent.red
                          : colors.text.secondary,
                    }}
                  >
                    More difficulty with activities than before
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityLabel="Submit recovery check-in"
            style={{
              marginTop: tokens.spacing.md,
              padding: tokens.spacing.md,
              borderRadius: tokens.borderRadius.xl,
              alignItems: 'center',
              backgroundColor: isSubmitting
                ? colors.background.tertiary
                : isDark
                  ? tokens.colors.dark.accent.green
                  : tokens.colors.light.accent.green,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={tokens.colors.shared.static.white} />
            ) : (
              <Text
                style={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.colors.shared.static.white,
                }}
              >
                Submit Check-In
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

