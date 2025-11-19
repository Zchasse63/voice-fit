/**
 * PRCelebrationModal Component
 * 
 * Celebrates new personal records with confetti animation and PR details.
 * Displays improvement over previous PR and share options.
 */

import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Trophy, TrendingUp, X, Share2 } from 'lucide-react-native';
import { PRData } from '../../services/pr/PRService';

interface PRCelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  prData: PRData;
  previousPR?: number;
}

export default function PRCelebrationModal({
  visible,
  onClose,
  prData,
  previousPR,
}: PRCelebrationModalProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  const improvement = previousPR ? prData.oneRM - previousPR : 0;
  const improvementPercent = previousPR ? ((improvement / previousPR) * 100).toFixed(1) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay.scrim,
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
          {/* Close Button */}
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close modal"
            style={{
              position: 'absolute',
              top: tokens.spacing.md,
              right: tokens.spacing.md,
              zIndex: 10,
            }}
          >
            <X color={isDark ? '#9CA3AF' : '#6B7280'} size={24} />
          </Pressable>

          {/* Confetti Effect (Visual) */}
          <View
            style={{
              alignItems: 'center',
              marginBottom: tokens.spacing.md,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.backgroundSoft.warning,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy color="#F59E0B" size={48} />
            </View>
          </View>

          {/* Celebration Header */}
          <Text
            style={{
              fontSize: tokens.typography.fontSize['3xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              textAlign: 'center',
              marginBottom: tokens.spacing.xs,
              color: colors.text.primary,
            }}
          >
            🎉 New PR! 🎉
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              textAlign: 'center',
              marginBottom: tokens.spacing.lg,
              color: colors.text.secondary,
            }}
          >
            You just crushed a personal record!
          </Text>

          {/* Exercise Name */}
          <View
            style={{
              padding: tokens.spacing.md,
              borderRadius: tokens.borderRadius.lg,
              marginBottom: tokens.spacing.md,
              backgroundColor: colors.background.tertiary,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: colors.text.tertiary,
              }}
            >
              Exercise
            </Text>
            <Text
              style={{
                marginTop: tokens.spacing.xs,
                fontSize: tokens.typography.fontSize['2xl'],
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {prData.exerciseName}
            </Text>
          </View>

          {/* PR Details */}
          <View
            style={{
              padding: tokens.spacing.md,
              borderRadius: tokens.borderRadius.lg,
              marginBottom: tokens.spacing.md,
              backgroundColor: colors.backgroundSoft.success,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: tokens.spacing.sm,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  Weight × Reps
                </Text>
                <Text
                  style={{
                    marginTop: tokens.spacing.xs,
                    fontSize: tokens.typography.fontSize.xl,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.accent.blue,
                  }}
                >
                  {prData.weight} lbs × {prData.reps}
                </Text>
              </View>
              <View
                style={{
                  alignItems: 'flex-end',
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  Estimated 1RM
                </Text>
                <Text
                  style={{
                    marginTop: tokens.spacing.xs,
                    fontSize: tokens.typography.fontSize.xl,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.accent.blue,
                  }}
                >
                  {prData.oneRM} lbs
                </Text>
              </View>
            </View>

            {/* Improvement */}
            {previousPR && improvement > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: tokens.spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: colors.border.subtle,
                }}
              >
                <TrendingUp color={colors.accent.green} size={20} />
                <Text
                  style={{
                    marginLeft: tokens.spacing.xs,
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.accent.green,
                  }}
                >
                  +{improvement.toFixed(1)} lbs ({improvementPercent}% improvement)
                </Text>
              </View>
            )}
          </View>

          {/* Previous PR */}
          {previousPR && (
            <View
              style={{
                marginBottom: tokens.spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  textAlign: 'center',
                  color: colors.text.tertiary,
                }}
              >
                Previous best: {previousPR} lbs
              </Text>
            </View>
          )}

          {/* Motivational Message */}
          <View
            style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.borderRadius.lg,
              marginBottom: tokens.spacing.lg,
              backgroundColor: colors.backgroundSoft.warning,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                textAlign: 'center',
                fontWeight: tokens.typography.fontWeight.bold,
                color: isDark ? '#FACC15' : '#92400E',
              }}
            >
              💪 Keep pushing! You're getting stronger every day!
            </Text>
          </View>

          {/* Action Buttons */}
          <View
            style={{
              rowGap: tokens.spacing.sm,
            }}
          >
            {/* Share Button */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                borderWidth: 2,
                borderColor: colors.border.subtle,
                backgroundColor: colors.background.tertiary,
              }}
              onPress={() => {
                // TODO: Implement share functionality
                console.log('Share PR:', prData);
              }}
              accessibilityLabel="Share PR"
            >
              <Share2 color={colors.text.tertiary} size={20} />
              <Text
                style={{
                  marginLeft: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.base,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                Share Achievement
              </Text>
            </Pressable>

            {/* Continue Button */}
            <Pressable
              onPress={onClose}
              accessibilityLabel="Continue"
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.accent.blue,
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: '#FFFFFF',
                }}
              >
                Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

