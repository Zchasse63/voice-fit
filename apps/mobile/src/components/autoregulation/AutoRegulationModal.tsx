/**
 * AutoRegulationModal Component
 * 
 * Displays recommended load adjustments based on RPE and readiness data.
 * Requires user approval before applying changes (Premium feature).
 */

import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
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
  const themeColors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = themeColors.accent;

  const isReduction = adjustment.adjustmentPercentage < 0;
  const isIncrease = adjustment.adjustmentPercentage > 0;

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
          backgroundColor: themeColors.overlay.scrim,
          justifyContent: 'center',
          alignItems: 'center',
          padding: tokens.spacing.lg,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 480,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.lg,
            backgroundColor: themeColors.background.secondary,
            ...tokens.shadows.lg,
          }}
        >
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
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <AlertTriangle
                color={isReduction ? accentColors.orange : accentColors.green}
                size={24}
              />
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: tokens.typography.fontWeight.bold,
                  marginLeft: tokens.spacing.sm,
                  color: themeColors.text.primary,
                }}
              >
                Auto-Regulation Suggestion
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close modal"
              style={{
                padding: tokens.spacing.sm,
                minWidth: 44,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X color={themeColors.text.tertiary} size={24} />
            </Pressable>
          </View>

          {/* Adjustment Badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: tokens.spacing.sm,
              borderRadius: tokens.borderRadius.md,
              marginBottom: tokens.spacing.md,
              backgroundColor: themeColors.background.tertiary,
              borderWidth: 1,
              borderColor: isReduction
                ? accentColors.orange
                : isIncrease
                ? accentColors.green
                : themeColors.border.light,
            }}
          >
            {isReduction ? (
              <TrendingDown color={accentColors.orange} size={20} />
            ) : isIncrease ? (
              <TrendingUp color={accentColors.green} size={20} />
            ) : (
              <CheckCircle color={accentColors.green} size={20} />
            )}
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.bold,
                marginLeft: tokens.spacing.sm,
                color: isReduction
                  ? accentColors.orange
                  : isIncrease
                  ? accentColors.green
                  : themeColors.text.secondary,
              }}
            >
              {adjustment.adjustmentPercentage > 0 ? '+' : ''}
              {adjustment.adjustmentPercentage}% Load Adjustment
            </Text>
          </View>

          {/* Exercise Info */}
          {exerciseName && currentWeight && newWeight && (
            <View
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.md,
                marginBottom: tokens.spacing.md,
                backgroundColor: isDark
                  ? themeColors.background.tertiary
                  : themeColors.background.secondary,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  marginBottom: tokens.spacing.sm,
                  color: themeColors.text.secondary,
                }}
              >
                {exerciseName}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: themeColors.text.tertiary,
                    }}
                  >
                    Current Weight
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.lg,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: themeColors.text.primary,
                    }}
                  >
                    {currentWeight} lbs
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize['2xl'],
                    color: themeColors.text.tertiary,
                  }}
                >
                  →
                </Text>
                <View>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: themeColors.text.tertiary,
                    }}
                  >
                    Recommended Weight
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.lg,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: isReduction
                        ? accentColors.orange
                        : isIncrease
                        ? accentColors.green
                        : themeColors.text.primary,
                    }}
                  >
                    {newWeight} lbs
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Reason */}
          <View
            style={{ marginBottom: tokens.spacing.md }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
                marginBottom: tokens.spacing.xs,
                color: themeColors.text.secondary,
              }}
            >
              Why this adjustment?
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: themeColors.text.tertiary,
              }}
            >
              {adjustment.reason}
            </Text>
          </View>

          {/* Additional Reasons */}
          {reasons.length > 0 && (
            <View
              style={{ marginBottom: tokens.spacing.md }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  marginBottom: tokens.spacing.xs,
                  color: themeColors.text.secondary,
                }}
              >
                Additional Factors:
              </Text>
              {reasons.map((reason, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: tokens.spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      marginRight: tokens.spacing.xs,
                      color: themeColors.text.tertiary,
                    }}
                  >
                    •
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      flex: 1,
                      color: themeColors.text.tertiary,
                    }}
                  >
                    {reason}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommended Action */}
          <View
            style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.borderRadius.md,
              marginBottom: tokens.spacing.lg,
              backgroundColor: themeColors.background.tertiary,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: accentColors.blue,
              }}
            >
              💡 {adjustment.recommendedAction}
            </Text>
          </View>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: 'row',
            }}
          >
            <Pressable
              onPress={onReject}
              accessibilityLabel="Reject adjustment"
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.md,
                borderWidth: 2,
                borderColor: themeColors.border.light,
                backgroundColor: themeColors.background.tertiary,
                marginRight: tokens.spacing.sm,
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: themeColors.text.primary,
                }}
              >
                Keep Current
              </Text>
            </Pressable>

            <Pressable
              onPress={onApprove}
              accessibilityLabel="Approve adjustment"
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.md,
                backgroundColor: accentColors.green,
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.colors.light.text.primary,
                }}
              >
                Apply Adjustment
              </Text>
            </Pressable>
          </View>

          {/* Premium Badge */}
          <View
            style={{
              marginTop: tokens.spacing.md,
              paddingTop: tokens.spacing.sm,
              borderTopWidth: 1,
              borderTopColor: themeColors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                textAlign: 'center',
                color: themeColors.text.tertiary,
              }}
            >
              ⭐ Premium Auto-Regulation Feature
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

