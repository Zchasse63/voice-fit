/**
 * ClientSelectorScreen
 * 
 * Full-screen modal for selecting a client from assigned clients list.
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, User, CheckCircle } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useCoachStore } from '../../store/coach.store';
import { useNavigation } from '@react-navigation/native';

export default function ClientSelectorScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const {
    selectedClientId,
    assignedClients,
    isLoading,
    error,
    setSelectedClientId,
    fetchAssignedClients,
  } = useCoachStore();

  useEffect(() => {
    fetchAssignedClients();
  }, []);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background.primary,
      }}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          Select Client
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            padding: tokens.spacing.sm,
          }}
        >
          <X size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: tokens.spacing.lg,
        }}
      >
        {isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: tokens.spacing.xl }}>
            <ActivityIndicator size="large" color={colors.accent.green} />
          </View>
        )}

        {error && (
          <View
            style={{
              padding: tokens.spacing.md,
              backgroundColor: `${colors.accent.coral}20`,
              borderRadius: tokens.borderRadius.md,
              marginBottom: tokens.spacing.md,
            }}
          >
            <Text style={{ color: colors.accent.coral, fontSize: tokens.typography.fontSize.sm }}>
              {error}
            </Text>
          </View>
        )}

        {!isLoading && assignedClients.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: tokens.spacing.xl }}>
            <User size={48} color={colors.text.tertiary} />
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginTop: tokens.spacing.md,
              }}
            >
              No Clients Yet
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.tertiary,
                marginTop: tokens.spacing.xs,
                textAlign: 'center',
              }}
            >
              Invite clients to start coaching
            </Text>
          </View>
        )}

        {!isLoading && assignedClients.map((client) => {
          const isSelected = client.id === selectedClientId;
          
          return (
            <Pressable
              key={client.id}
              onPress={() => handleSelectClient(client.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: tokens.spacing.md,
                backgroundColor: isSelected
                  ? `${colors.accent.green}20`
                  : colors.background.secondary,
                borderRadius: tokens.borderRadius.md,
                marginBottom: tokens.spacing.sm,
                borderWidth: isSelected ? 2 : 0,
                borderColor: colors.accent.green,
              }}
            >
              {/* Avatar */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: tokens.borderRadius.full,
                  backgroundColor: colors.accent.green,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: tokens.spacing.md,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: '#FFFFFF',
                  }}
                >
                  {client.full_name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
                </Text>
              </View>

              {/* Client Info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.md,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  {client.full_name || 'No Name'}
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: colors.text.tertiary,
                    marginTop: 2,
                  }}
                >
                  {client.email}
                </Text>
              </View>

              {/* Selected Indicator */}
              {isSelected && (
                <CheckCircle size={24} color={colors.accent.green} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}


