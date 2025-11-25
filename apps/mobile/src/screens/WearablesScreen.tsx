import React, { useState, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Watch } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import tokens from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { WHOOPConnectionCard } from "../components/wearables/WHOOPConnectionCard";
import { TerraConnectionCard } from "../components/wearables/TerraConnectionCard";
import { supabase } from "../services/supabase";

export default function WearablesScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const [whoopConnected, setWhoopConnected] = useState(false);
  const [whoopLastSync, setWhoopLastSync] = useState<string | undefined>();
  const [terraConnected, setTerraConnected] = useState(false);
  const [terraLastSync, setTerraLastSync] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadWearableConnections();
    }
  }, [user?.id]);

  const loadWearableConnections = async () => {
    try {
      // Load WHOOP connection
      const { data: whoopData } = await supabase
        .from("wearable_provider_connections")
        .select("*")
        .eq("user_id", user?.id)
        .eq("provider", "whoop")
        .single();

      if (whoopData) {
        setWhoopConnected(whoopData.is_active);
        setWhoopLastSync(whoopData.last_sync);
      }

      // Load Terra connection
      const { data: terraData } = await supabase
        .from("wearable_provider_connections")
        .select("*")
        .eq("user_id", user?.id)
        .eq("provider", "terra")
        .single();

      if (terraData) {
        setTerraConnected(terraData.is_active);
        setTerraLastSync(terraData.last_sync);
      }
    } catch (err) {
      console.error("Error loading wearable connections:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhoopConnectionChange = (connected: boolean) => {
    setWhoopConnected(connected);
    loadWearableConnections();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: tokens.spacing.lg, flexDirection: "row", alignItems: "center" }}>
          <Watch color={colors.accent.blue} size={22} style={{ marginRight: tokens.spacing.sm }} />
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Wearables
          </Text>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: tokens.spacing.lg, gap: tokens.spacing.md }}>
          <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.sm }}>
            Connect wearable devices to track recovery, sleep, and performance metrics.
          </Text>

          {/* WHOOP Connection */}
          {user?.id && (
            <WHOOPConnectionCard
              userId={user.id}
              isConnected={whoopConnected}
              lastSync={whoopLastSync}
              onConnectionChange={handleWhoopConnectionChange}
            />
          )}

          {/* Terra Connection */}
          {user?.id && (
            <TerraConnectionCard
              userId={user.id}
              isConnected={terraConnected}
              lastSync={terraLastSync}
              onConnectionChange={(connected) => {
                setTerraConnected(connected);
                loadWearableConnections();
              }}
            />
          )}

          {/* Coming Soon */}
          <Text
            style={{
              color: colors.text.tertiary,
              fontSize: tokens.typography.fontSize.xs,
              marginTop: tokens.spacing.md,
            }}
          >
            More wearable integrations coming soon: Apple Health (direct), Polar, Suunto
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
