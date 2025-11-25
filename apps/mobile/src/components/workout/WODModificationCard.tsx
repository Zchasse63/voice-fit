/**
 * WOD Modification Card Component
 * 
 * Displays CrossFit WOD modifications and scaling options
 */

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { ChevronDown, ChevronUp, AlertCircle, Zap } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

interface WODModification {
  level: "beginner" | "intermediate" | "advanced";
  movements: Array<{
    name: string;
    reps: string;
    weight?: string;
    notes?: string;
  }>;
  time_estimate: string;
  modifications: string[];
}

interface WODModificationData {
  original_wod: string;
  modifications: WODModification[];
  user_injuries: string[];
}

export function WODModificationCard() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const { user } = useAuth();
  const [wodText, setWodText] = useState("");
  const [data, setData] = useState<WODModificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);

  const handleModifyWOD = async () => {
    if (!wodText.trim() || !user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/crossfit/modify-wod", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          wod_text: wodText,
          user_id: user.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to modify WOD");
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Error modifying WOD:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ gap: tokens.spacing.md }}>
      {/* Input Section */}
      <View
        style={{
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.md,
          gap: tokens.spacing.sm,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Paste WOD
        </Text>
        <View
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: tokens.borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border.primary,
            padding: tokens.spacing.sm,
            minHeight: 80,
          }}
        >
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 12,
              fontStyle: "italic",
            }}
          >
            Paste your WOD here to get personalized modifications...
          </Text>
        </View>
        <Pressable
          onPress={handleModifyWOD}
          disabled={isLoading || !wodText.trim()}
          style={({ pressed }) => ({
            backgroundColor: colors.accent.blue,
            borderRadius: tokens.borderRadius.md,
            paddingVertical: tokens.spacing.sm,
            opacity: pressed ? 0.8 : isLoading || !wodText.trim() ? 0.5 : 1,
          })}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text
              style={{
                color: "white",
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              Get Modifications
            </Text>
          )}
        </Pressable>
      </View>

      {/* Modifications Display */}
      {data && (
        <View style={{ gap: tokens.spacing.md }}>
          {/* Injury Warning */}
          {data.user_injuries.length > 0 && (
            <View
              style={{
                backgroundColor: colors.accent.orange + "20",
                borderLeftWidth: 4,
                borderLeftColor: colors.accent.orange,
                borderRadius: tokens.borderRadius.md,
                padding: tokens.spacing.sm,
                flexDirection: "row",
                gap: tokens.spacing.sm,
              }}
            >
              <AlertCircle color={colors.accent.orange} size={20} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.accent.orange,
                    marginBottom: 2,
                  }}
                >
                  Modifications for Injuries
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.text.secondary,
                  }}
                >
                  {data.user_injuries.join(", ")}
                </Text>
              </View>
            </View>
          )}

          {/* Modification Levels */}
          {data.modifications.map((mod, index) => (
            <ModificationLevel
              key={index}
              level={mod.level}
              movements={mod.movements}
              timeEstimate={mod.time_estimate}
              modifications={mod.modifications}
              isExpanded={expandedLevel === mod.level}
              onPress={() =>
                setExpandedLevel(expandedLevel === mod.level ? null : mod.level)
              }
              colors={colors}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ModificationLevel({
  level,
  movements,
  timeEstimate,
  modifications,
  isExpanded,
  onPress,
  colors,
}: {
  level: string;
  movements: any[];
  timeEstimate: string;
  modifications: string[];
  isExpanded: boolean;
  onPress: () => void;
  colors: any;
}) {
  const levelColors: any = {
    beginner: colors.accent.green,
    intermediate: colors.accent.yellow,
    advanced: colors.accent.red,
  };

  const levelColor = levelColors[level] || colors.accent.blue;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        borderWidth: 1,
        borderColor: levelColor,
        overflow: "hidden",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: tokens.spacing.md,
          backgroundColor: `${levelColor}10`,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.md,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: levelColor,
              textTransform: "capitalize",
            }}
          >
            {level}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.text.secondary,
              marginTop: 2,
            }}
          >
            ⏱️ {timeEstimate}
          </Text>
        </View>
        {isExpanded ? (
          <ChevronUp color={levelColor} size={24} />
        ) : (
          <ChevronDown color={levelColor} size={24} />
        )}
      </View>

      {isExpanded && (
        <View style={{ padding: tokens.spacing.md, gap: tokens.spacing.md }}>
          {/* Movements */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.text.primary,
                marginBottom: tokens.spacing.sm,
              }}
            >
              Movements
            </Text>
            {movements.map((mov, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.background.primary,
                  borderRadius: tokens.borderRadius.md,
                  padding: tokens.spacing.sm,
                  marginBottom: tokens.spacing.xs,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: colors.text.primary,
                  }}
                >
                  {mov.name} - {mov.reps}
                </Text>
                {mov.weight && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.text.secondary,
                      marginTop: 2,
                    }}
                  >
                    Weight: {mov.weight}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Modifications */}
          {modifications.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.text.primary,
                  marginBottom: tokens.spacing.sm,
                }}
              >
                💡 Modifications
              </Text>
              {modifications.map((mod, idx) => (
                <Text
                  key={idx}
                  style={{
                    fontSize: 11,
                    color: colors.text.secondary,
                    marginBottom: tokens.spacing.xs,
                    lineHeight: 16,
                  }}
                >
                  • {mod}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

