/**
 * ClientSelectorHeader Component
 * 
 * Shows current selected client in navigation header with dropdown.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown, User } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useCoachStore } from '../../store/coach.store';

interface ClientSelectorHeaderProps {
  onPress: () => void;
}

export function ClientSelectorHeader({ onPress }: ClientSelectorHeaderProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const { selectedClientId, assignedClients } = useCoachStore();

  const selectedClient = assignedClients.find(c => c.id === selectedClientId);

  if (!selectedClient) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: tokens.spacing.xs,
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.md,
        }}
      >
        <User size={16} color={colors.text.tertiary} />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            color: colors.text.tertiary,
          }}
        >
          Select Client
        </Text>
        <ChevronDown size={16} color={colors.text.tertiary} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacing.xs,
        paddingHorizontal: tokens.spacing.md,
        paddingVertical: tokens.spacing.sm,
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.md,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: tokens.borderRadius.full,
          backgroundColor: colors.accent.green,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            fontWeight: tokens.typography.fontWeight.bold,
            color: '#FFFFFF',
          }}
        >
          {selectedClient.full_name?.[0]?.toUpperCase() || selectedClient.email[0].toUpperCase()}
        </Text>
      </View>

      {/* Name */}
      <Text
        style={{
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium,
          color: colors.text.primary,
        }}
        numberOfLines={1}
      >
        {selectedClient.full_name || selectedClient.email}
      </Text>

      {/* Dropdown Icon */}
      <ChevronDown size={16} color={colors.text.secondary} />
    </Pressable>
  );
}

