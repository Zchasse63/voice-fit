/**
 * DeloadRecommendationModal Component
 * 
 * Displays deload week recommendation with explanation and user approval.
 * Shows fatigue indicators and deload prescription details.
 */

import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { AlertCircle, TrendingDown, X, Battery } from 'lucide-react-native';
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
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  const volumeReductionPercent = Math.round((1 - prescription.volumeReduction) * 100);
  const intensityPercent = Math.round(prescription.intensityMaintenance * 100);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay.scrimStrong,
          justifyContent: 'center',
          alignItems: 'center',
          padding: tokens.spacing.lg,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: tokens.borderRadius.xl,
            padding: tokens.spacing.lg,
            backgroundColor: colors.background.secondary,
            ...tokens.shadows.lg,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: tokens.spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Battery color="#F9AC60" size={24} />
                <Text
                  style={{
                    marginLeft: tokens.spacing.xs,
                    fontSize: tokens.typography.fontSize.xl,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                  }}
                >
                  Deload Week Recommended
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Close modal"
                style={{
                  padding: tokens.spacing.xs,
                  minWidth: 44,
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X color={isDark ? '#9CA3AF' : '#6B7280'} size={24} />
              </Pressable>
            </View>

            {/* Alert Badge */}
            <View
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.md,
                backgroundColor: colors.backgroundSoft.warning,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: tokens.spacing.xs,
                }}
              >
                <AlertCircle color="#F9AC60" size={20} />
                <Text
                  style={{
                    marginLeft: tokens.spacing.xs,
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: isDark ? '#FBBF24' : '#92400E',
                  }}
                >
                  Recovery Week Needed
                </Text>
              </View>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                Your body is showing signs of fatigue. A deload week will help you recover and come back stronger.
              </Text>
            </View>

            {/* Fatigue Indicators */}
            <View
              style={{
                marginBottom: tokens.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  marginBottom: tokens.spacing.sm,
                  color: colors.text.secondary,
                }}
              >
                Fatigue Indicators:
              </Text>
              {assessment.reasons.map((reason, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: tokens.spacing.xs,
                  }}
                >
                  <TrendingDown
                    color="#F9AC60"
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
                    {reason}
                  </Text>
                </View>
              ))}
            </View>

            {/* Deload Prescription */}
            <View
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.md,
                backgroundColor: isDark ? colors.background.tertiary : colors.background.tertiary,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  marginBottom: tokens.spacing.sm,
                  color: colors.text.secondary,
                }}
              >
                Deload Prescription:
              </Text>

              {/* Volume Reduction */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: tokens.spacing.sm,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.text.tertiary,
                    }}
                  >
                    Volume Reduction
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.base,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}
                  >
                    {volumeReductionPercent}% fewer sets
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: tokens.spacing.sm,
                    paddingVertical: tokens.spacing.xs,
                    borderRadius: tokens.borderRadius.lg,
                    backgroundColor: colors.backgroundSoft.warningAlt,
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: tokens.typography.fontWeight.semibold,
                      color: isDark ? '#FED7AA' : '#C05621',
                    }}
                  >
                    {Math.round(prescription.volumeReduction * 100)}% volume
                  </Text>
                </View>
              </View>

              {/* Intensity Maintenance */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: tokens.spacing.sm,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.text.tertiary,
                    }}
                  >
                    Intensity Maintenance
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.base,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}
                  >
                    Keep {intensityPercent}% of weight
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: tokens.spacing.sm,
                    paddingVertical: tokens.spacing.xs,
                    borderRadius: tokens.borderRadius.lg,
                    backgroundColor: colors.backgroundSoft.success,
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: tokens.typography.fontWeight.semibold,
                      color: isDark ? '#BBF7D0' : '#166534',
                    }}
                  >
                    Maintain strength
                  </Text>
                </View>
              </View>

              {/* Duration */}
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
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.text.tertiary,
                    }}
                  >
                    Duration
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.base,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}
                  >
                    {prescription.duration} days
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: tokens.spacing.sm,
                    paddingVertical: tokens.spacing.xs,
                    borderRadius: tokens.borderRadius.lg,
                    backgroundColor: colors.backgroundSoft.info,
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: tokens.typography.fontWeight.semibold,
                      color: isDark ? '#BFDBFE' : '#1D4ED8',
                    }}
                  >
                    1 week
                  </Text>
                </View>
              </View>
            </View>

            {/* Benefits */}
            <View
              style={{
                padding: tokens.spacing.sm,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.lg,
                backgroundColor: colors.backgroundSoft.info,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  marginBottom: tokens.spacing.xs,
                  color: colors.accent.blue,
                }}
              >
                💡 Benefits of Deloading:
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                • Allows muscles and nervous system to recover{"\n"}
                • Prevents overtraining and injury{"\n"}
                • Prepares you for future progress{"\n"}
                • Maintains strength while reducing fatigue
              </Text>
            </View>

            {/* Action Buttons */}
            <View
              style={{
                flexDirection: 'row',
                columnGap: tokens.spacing.sm,
              }}
            >
              <Pressable
                onPress={onReject}
                accessibilityLabel="Reject deload"
                style={{
                  flex: 1,
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.lg,
                  borderWidth: 2,
                  borderColor: colors.border.subtle,
                  backgroundColor: colors.background.tertiary,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.secondary,
                  }}
                >
                  Skip Deload
                </Text>
              </Pressable>

              <Pressable
                onPress={onApprove}
                accessibilityLabel="Approve deload"
                style={{
                  flex: 1,
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.lg,
                  backgroundColor: colors.accent.blue,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: '#FFFFFF',
                  }}
                >
                  Start Deload Week
                </Text>
              </Pressable>
            </View>

            {/* Premium Badge */}
            <View
              style={{
                marginTop: tokens.spacing.lg,
                paddingTop: tokens.spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.border.subtle,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  textAlign: 'center',
                  color: colors.text.tertiary,
                }}
              >
                ⭐ Premium Auto-Deload Feature
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

