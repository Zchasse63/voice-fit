/**
 * ConflictIndicator
 * 
 * Visual indicator component for scheduling conflicts in the calendar.
 * Shows a badge with conflict severity and count.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';

interface ConflictIndicatorProps {
  conflictCount: number;
  severity?: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium' | 'large';
}

export default function ConflictIndicator({
  conflictCount,
  severity = 'medium',
  size = 'small',
}: ConflictIndicatorProps) {
  const getSeverityColor = () => {
    switch (severity) {
      case 'high':
        return tokens.colors.light.accent.coral;
      case 'medium':
        return tokens.colors.light.accent.orange;
      case 'low':
        return tokens.colors.light.accent.yellow;
      default:
        return tokens.colors.light.accent.orange;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return { container: 12, icon: 8, fontSize: 8 };
      case 'medium':
        return { container: 16, icon: 12, fontSize: 10 };
      case 'large':
        return { container: 20, icon: 16, fontSize: 12 };
      default:
        return { container: 12, icon: 8, fontSize: 8 };
    }
  };

  const severityColor = getSeverityColor();
  const dimensions = getSize();

  return (
    <View
      style={{
        width: dimensions.container,
        height: dimensions.container,
        borderRadius: dimensions.container / 2,
        backgroundColor: severityColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {conflictCount > 1 ? (
        <Text
          style={{
            fontSize: dimensions.fontSize,
            fontWeight: tokens.typography.fontWeight.bold,
            color: '#FFFFFF',
          }}
        >
          {conflictCount}
        </Text>
      ) : (
        <AlertTriangle color="#FFFFFF" size={dimensions.icon} />
      )}
    </View>
  );
}

