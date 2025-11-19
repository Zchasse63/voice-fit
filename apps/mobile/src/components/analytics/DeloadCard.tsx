/**
 * Deload Recommendation Card Component
 * 
 * Displays deload recommendation with approval button for auto-regulation deloads.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import { DeloadRecommendation } from '../../services/api/AnalyticsAPIClient';
import { useTheme } from '../../hooks/useTheme';
import { tokens } from '../../theme/tokens';

interface DeloadCardProps {
  deloadRecommendation: DeloadRecommendation;
  onApprove?: () => void;
  onDismiss?: () => void;
}

export const DeloadCard: React.FC<DeloadCardProps> = ({
  deloadRecommendation,
  onApprove,
  onDismiss,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const [isApproving, setIsApproving] = useState(false);

  // Get card background color based on deload type
  const getCardColor = () => {
    if (!deloadRecommendation.deload_needed) {
      return isDark ? '#1f2937' : '#f3f4f6'; // gray
    }
    if (deloadRecommendation.deload_type === 'programmed') {
      return isDark ? '#1e3a8a' : '#dbeafe'; // blue
    }
    if (deloadRecommendation.deload_type === 'auto_regulation') {
      return isDark ? '#7c2d12' : '#fed7aa'; // orange
    }
    return isDark ? '#1f2937' : '#f3f4f6'; // gray
  };

  // Get icon color
  const getIconColor = () => {
    if (!deloadRecommendation.deload_needed) {
      return '#10b981'; // green
    }
    if (deloadRecommendation.deload_type === 'programmed') {
      return '#3b82f6'; // blue
    }
    if (deloadRecommendation.deload_type === 'auto_regulation') {
      return '#f97316'; // orange
    }
    return '#6b7280'; // gray
  };

  // Get confidence badge color
  const getConfidenceBadgeColor = () => {
    switch (deloadRecommendation.confidence) {
      case 'high':
        return '#10b981'; // green
      case 'medium':
        return '#f59e0b'; // yellow
      case 'low':
        return '#6b7280'; // gray
      default:
        return '#6b7280'; // gray
    }
  };

  // Handle approve button
  const handleApprove = () => {
    Alert.alert(
      'Approve Deload Week',
      'This will modify your program to include a deload week with reduced volume. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: async () => {
            setIsApproving(true);
            try {
              if (onApprove) {
                await onApprove();
              }
              Alert.alert('Success', 'Deload week approved and added to your program!');
            } catch (error) {
              Alert.alert('Error', 'Failed to approve deload week. Please try again.');
            } finally {
              setIsApproving(false);
            }
          },
        },
      ]
    );
  };

  // Handle dismiss button
  const handleDismiss = () => {
    Alert.alert(
      'Dismiss Recommendation',
      'Are you sure you want to dismiss this deload recommendation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: () => {
            if (onDismiss) {
              onDismiss();
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.borderRadius['2xl'],
        marginBottom: tokens.spacing.lg,
        backgroundColor: getCardColor(),
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: tokens.spacing.sm,
        }}
      >
        {deloadRecommendation.deload_needed ? (
          <AlertCircle size={24} color={getIconColor()} />
        ) : (
          <CheckCircle size={24} color={getIconColor()} />
        )}
        <Text
          style={{
            marginLeft: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          {deloadRecommendation.deload_needed ? 'Deload Recommended' : 'No Deload Needed'}
        </Text>
      </View>

      {/* Deload Type Badge */}
      {deloadRecommendation.deload_type && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: tokens.spacing.sm,
          }}
        >
          <View
            style={{
              paddingHorizontal: tokens.spacing.sm,
              paddingVertical: tokens.spacing.xs,
              borderRadius: tokens.borderRadius.full,
              marginRight: tokens.spacing.xs,
              backgroundColor: getIconColor() + '30',
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.semibold,
                textTransform: 'capitalize',
                color: getIconColor(),
              }}
            >
              {deloadRecommendation.deload_type.replace('_', ' ')}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: tokens.spacing.sm,
              paddingVertical: tokens.spacing.xs,
              borderRadius: tokens.borderRadius.full,
              backgroundColor: getConfidenceBadgeColor() + '30',
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.semibold,
                textTransform: 'capitalize',
                color: getConfidenceBadgeColor(),
              }}
            >
              {deloadRecommendation.confidence} confidence
            </Text>
          </View>
        </View>
      )}

      {/* Reason */}
      <Text
        style={{
          fontSize: tokens.typography.fontSize.sm,
          marginBottom: tokens.spacing.sm,
          color: colors.text.secondary,
        }}
      >
        {deloadRecommendation.reason}
      </Text>

      {/* Recommendation */}
      {deloadRecommendation.recommendation && (
        <View
          style={{
            padding: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.lg,
            marginBottom: tokens.spacing.sm,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <Info
              size={16}
              color={getIconColor()}
              style={{ marginTop: 2, marginRight: tokens.spacing.xs }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              {deloadRecommendation.recommendation}
            </Text>
          </View>
        </View>
      )}

      {/* Indicators */}
      {Object.keys(deloadRecommendation.indicators).length > 0 && (
        <View
          style={{
            marginBottom: tokens.spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.semibold,
              marginBottom: tokens.spacing.xs,
              color: colors.text.tertiary,
            }}
          >
            Indicators
          </Text>
          {Object.entries(deloadRecommendation.indicators).map(([key, value]) => (
            <View
              key={key}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 2,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  textTransform: 'capitalize',
                  color: colors.text.tertiary,
                }}
              >
                {key.replace(/_/g, ' ')}:
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                {typeof value === 'number' ? value.toFixed(1) : value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      {deloadRecommendation.deload_needed && deloadRecommendation.requires_approval && (
        <View
          style={{
            flexDirection: 'row',
            columnGap: tokens.spacing.xs,
          }}
        >
          <TouchableOpacity
            onPress={handleApprove}
            disabled={isApproving}
            style={{
              flex: 1,
              paddingVertical: tokens.spacing.sm,
              borderRadius: tokens.borderRadius.lg,
              marginRight: tokens.spacing.xs,
              backgroundColor: getIconColor(),
              opacity: isApproving ? 0.7 : 1,
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
              {isApproving ? 'Approving...' : 'Approve Deload'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDismiss}
            disabled={isApproving}
            style={{
              flex: 1,
              paddingVertical: tokens.spacing.sm,
              borderRadius: tokens.borderRadius.lg,
              backgroundColor: colors.background.tertiary,
              opacity: isApproving ? 0.7 : 1,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Programmed Deload Info */}
      {deloadRecommendation.deload_needed && deloadRecommendation.deload_type === 'programmed' && (
        <View
          style={{
            marginTop: tokens.spacing.sm,
            padding: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.lg,
            backgroundColor: colors.background.tertiary,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.tertiary,
            }}
          >
            This is a programmed deload week built into your training plan. Follow the reduced volume
            prescribed in your program.
          </Text>
        </View>
      )}
    </View>
  );
};

