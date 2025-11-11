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
      className="p-4 rounded-2xl mb-6"
      style={{ backgroundColor: getCardColor() }}
    >
      {/* Header */}
      <View className="flex-row items-center mb-3">
        {deloadRecommendation.deload_needed ? (
          <AlertCircle size={24} color={getIconColor()} />
        ) : (
          <CheckCircle size={24} color={getIconColor()} />
        )}
        <Text className={`ml-2 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {deloadRecommendation.deload_needed ? 'Deload Recommended' : 'No Deload Needed'}
        </Text>
      </View>

      {/* Deload Type Badge */}
      {deloadRecommendation.deload_type && (
        <View className="flex-row items-center mb-3">
          <View
            className="px-3 py-1 rounded-full mr-2"
            style={{ backgroundColor: getIconColor() + '30' }}
          >
            <Text
              className="text-xs font-semibold capitalize"
              style={{ color: getIconColor() }}
            >
              {deloadRecommendation.deload_type.replace('_', ' ')}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: getConfidenceBadgeColor() + '30' }}
          >
            <Text
              className="text-xs font-semibold capitalize"
              style={{ color: getConfidenceBadgeColor() }}
            >
              {deloadRecommendation.confidence} confidence
            </Text>
          </View>
        </View>
      )}

      {/* Reason */}
      <Text className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {deloadRecommendation.reason}
      </Text>

      {/* Recommendation */}
      {deloadRecommendation.recommendation && (
        <View className={`p-3 rounded-xl mb-3 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
          <View className="flex-row items-start">
            <Info size={16} color={getIconColor()} className="mt-0.5 mr-2" />
            <Text className={`flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {deloadRecommendation.recommendation}
            </Text>
          </View>
        </View>
      )}

      {/* Indicators */}
      {Object.keys(deloadRecommendation.indicators).length > 0 && (
        <View className="mb-3">
          <Text className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Indicators
          </Text>
          {Object.entries(deloadRecommendation.indicators).map(([key, value]) => (
            <View key={key} className="flex-row justify-between mb-1">
              <Text className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {key.replace(/_/g, ' ')}:
              </Text>
              <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {typeof value === 'number' ? value.toFixed(1) : value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      {deloadRecommendation.deload_needed && deloadRecommendation.requires_approval && (
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={handleApprove}
            disabled={isApproving}
            className="flex-1 py-3 rounded-xl mr-2"
            style={{ backgroundColor: getIconColor() }}
          >
            <Text className="text-white text-center font-semibold">
              {isApproving ? 'Approving...' : 'Approve Deload'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDismiss}
            disabled={isApproving}
            className={`flex-1 py-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
          >
            <Text className={`text-center font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Programmed Deload Info */}
      {deloadRecommendation.deload_needed && deloadRecommendation.deload_type === 'programmed' && (
        <View className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            This is a programmed deload week built into your training plan. Follow the reduced volume
            prescribed in your program.
          </Text>
        </View>
      )}
    </View>
  );
};

