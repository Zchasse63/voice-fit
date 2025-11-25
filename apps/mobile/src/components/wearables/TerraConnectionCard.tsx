/**
 * Terra Connection Card
 * 
 * Displays Terra connection status and connected wearable providers
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { AlertCircle, CheckCircle, Zap } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeContext";
import tokens from "../../theme/tokens";
import { TerraOAuthService } from "../../services/wearables/TerraOAuthService";

interface TerraConnectionCardProps {
  userId: string;
  isConnected: boolean;
  lastSync?: string;
  onConnectionChange: (connected: boolean) => void;
}

const PROVIDER_LOGOS: Record<string, string> = {
  garmin: "🏃",
  fitbit: "⌚",
  oura: "💍",
  apple_health: "🍎",
  google_fit: "🔵",
  withings: "⚖️",
  polar: "❤️",
  suunto: "🧭",
};

export function TerraConnectionCard({
  userId,
  isConnected,
  lastSync,
  onConnectionChange,
}: TerraConnectionCardProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);

  useEffect(() => {
    if (isConnected) {
      loadConnectedProviders();
    }
  }, [isConnected]);

  const loadConnectedProviders = async () => {
    try {
      const providers = await TerraOAuthService.getConnectedProviders(userId);
      setConnectedProviders(providers);
    } catch (err) {
      console.error("Error loading providers:", err);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await TerraOAuthService.startOAuthFlow(userId);

      if (success) {
        await loadConnectedProviders();
        onConnectionChange(true);
      } else {
        setError("Connection cancelled");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect Terra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await TerraOAuthService.disconnect(userId);
      setConnectedProviders([]);
      onConnectionChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to disconnect Terra");
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
        borderColor: isConnected ? colors.accent.green : colors.border.light,
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
          Terra (Multi-Wearable)
        </Text>
        {isConnected && <CheckCircle size={20} color={colors.accent.green} />}
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
          ? "Connected - Syncing data from all connected wearables"
          : "Connect to sync data from Garmin, Fitbit, Oura, Apple Health, and more"}
      </Text>

      {/* Connected Providers */}
      {isConnected && connectedProviders.length > 0 && (
        <View style={{ marginBottom: tokens.spacing.md }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.tertiary,
              marginBottom: tokens.spacing.sm,
            }}
          >
            Connected Providers:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
              {connectedProviders.map((provider) => (
                <View
                  key={provider}
                  style={{
                    backgroundColor: colors.background.primary,
                    borderRadius: tokens.borderRadius.md,
                    paddingHorizontal: tokens.spacing.sm,
                    paddingVertical: tokens.spacing.xs,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ marginRight: tokens.spacing.xs }}>
                    {PROVIDER_LOGOS[provider.toLowerCase()] || "📱"}
                  </Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.text.secondary,
                      textTransform: "capitalize",
                    }}
                  >
                    {provider.replace("_", " ")}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

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
            {isConnected ? "Disconnect" : "Connect Terra"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

