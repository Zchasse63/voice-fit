/**
 * WHOOP Connection Card
 * 
 * Displays WHOOP connection status and allows connect/disconnect
 */

import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { AlertCircle, CheckCircle, Zap } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeContext";
import tokens from "../../theme/tokens";
import { WHOOPOAuthService } from "../../services/wearables/WHOOPOAuthService";

interface WHOOPConnectionCardProps {
  userId: string;
  isConnected: boolean;
  lastSync?: string;
  onConnectionChange: (connected: boolean) => void;
}

export function WHOOPConnectionCard({
  userId,
  isConnected,
  lastSync,
  onConnectionChange,
}: WHOOPConnectionCardProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await WHOOPOAuthService.startOAuthFlow(userId);

      if (success) {
        onConnectionChange(true);
      } else {
        setError("Connection cancelled");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect WHOOP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await WHOOPOAuthService.disconnect(userId);
      onConnectionChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to disconnect WHOOP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.md,
        borderWidth: 1,
        borderColor: isConnected
          ? colors.accent.green
          : colors.border.light,
        marginBottom: tokens.spacing.md,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: tokens.spacing.md }}>
        <Zap
          size={24}
          color={isConnected ? colors.accent.green : colors.text.secondary}
          style={{ marginRight: tokens.spacing.sm }}
        />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
            flex: 1,
          }}
        >
          WHOOP
        </Text>
        {isConnected && (
          <CheckCircle size={20} color={colors.accent.green} />
        )}
      </View>

      {/* Status */}
      <Text
        style={{
          fontSize: tokens.typography.fontSize.sm,
          color: colors.text.secondary,
          marginBottom: tokens.spacing.md,
        }}
      >
        {isConnected
          ? "Connected - Syncing recovery, sleep, and strain data"
          : "Connect to track recovery, sleep, and strain metrics"}
      </Text>

      {/* Last Sync */}
      {isConnected && lastSync && (
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            color: colors.text.tertiary,
            marginBottom: tokens.spacing.md,
          }}
        >
          Last synced: {new Date(lastSync).toLocaleDateString()}
        </Text>
      )}

      {/* Error */}
      {error && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.status.error + "20",
            borderRadius: tokens.borderRadius.md,
            padding: tokens.spacing.sm,
            marginBottom: tokens.spacing.md,
          }}
        >
          <AlertCircle size={16} color={colors.status.error} style={{ marginRight: tokens.spacing.xs }} />
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.status.error,
              flex: 1,
            }}
          >
            {error}
          </Text>
        </View>
      )}

      {/* Action Button */}
      <Pressable
        onPress={isConnected ? handleDisconnect : handleConnect}
        disabled={isLoading}
        style={({ pressed }) => ({
          backgroundColor: isConnected ? colors.status.error : colors.accent.blue,
          borderRadius: tokens.borderRadius.md,
          padding: tokens.spacing.md,
          opacity: pressed || isLoading ? 0.8 : 1,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        })}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.text.inverse} size="small" />
        ) : (
          <Text
            style={{
              color: colors.text.inverse,
              fontWeight: tokens.typography.fontWeight.semibold,
              fontSize: tokens.typography.fontSize.base,
            }}
          >
            {isConnected ? "Disconnect" : "Connect WHOOP"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

