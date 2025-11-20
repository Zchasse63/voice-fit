import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";
import { useRunStore } from "../store/run.store";
import { Play, Pause, Square, MapPin, Mic } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

export default function RunScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<any>();

  const {
    isTracking,
    isPaused,
    coordinates,
    stats,
    error,
    hasPermission,
    requestPermissions,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
    reset,
  } = useRunStore();

  useEffect(() => {
    initializePermissions();
  }, []);

  useEffect(() => {
    if (coordinates.length > 0 && mapRef.current) {
      const latestCoord = coordinates[coordinates.length - 1];
      mapRef.current.animateToRegion({
        latitude: latestCoord.latitude,
        longitude: latestCoord.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [coordinates]);

  const initializePermissions = async () => {
    try {
      await requestPermissions();
    } catch (err) {
      console.error("Failed to initialize permissions:", err);
    }
  };

  const handleStart = async () => {
    if (!hasPermission) {
      Alert.alert(
        "Location Permission Required",
        "This app needs access to your location to track your runs.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Grant Permission", onPress: () => requestPermissions() },
        ],
      );
      return;
    }
    await startRun();
  };

  const handlePause = async () => {
    await pauseRun();
  };

  const handleResume = async () => {
    await resumeRun();
  };

  const handleStop = () => {
    Alert.alert(
      "Stop Run",
      "Are you sure you want to stop this run? Your progress will be saved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Stop",
          style: "destructive",
          onPress: async () => {
            await stopRun();
            Alert.alert("Run Saved", "Your run has been saved successfully!", [
              { text: "OK", onPress: () => reset() },
            ]);
          },
        },
      ],
    );
  };

  const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371;
    return miles.toFixed(2);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPace = (pace: number): string => {
    if (pace === 0 || !isFinite(pace)) return "--:--";
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!hasPermission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background.primary,
          alignItems: "center",
          justifyContent: "center",
          padding: tokens.spacing.xl,
        }}
      >
        <MapPin color={colors.accent.blue} size={64} strokeWidth={2} />
        <Text
          style={{
            fontSize: tokens.typography.fontSize["2xl"],
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
            marginTop: tokens.spacing.lg,
            textAlign: "center",
          }}
        >
          Location Permission Required
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.base,
            color: colors.text.secondary,
            marginTop: tokens.spacing.md,
            textAlign: "center",
          }}
        >
          This app needs access to your location to track your runs and outdoor
          workouts.
        </Text>
        <Pressable
          style={{
            backgroundColor: colors.accent.blue,
            borderRadius: tokens.borderRadius.lg,
            paddingVertical: tokens.spacing.md,
            paddingHorizontal: tokens.spacing.xl,
            marginTop: tokens.spacing.xl,
          }}
          onPress={requestPermissions}
          accessibilityLabel="Grant Location Permission"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.bold,
              color: "white",
            }}
          >
            Grant Permission
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Full-Screen Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={isTracking}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {coordinates.length > 1 && (
          <Polyline
            coordinates={coordinates.map((coord) => ({
              latitude: coord.latitude,
              longitude: coord.longitude,
            }))}
            strokeColor={colors.accent.blue}
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* Goal Row */}
      <View
        style={{
          position: "absolute",
          top: 20,
          left: 0,
          right: 0,
          paddingHorizontal: tokens.spacing.lg,
          flexDirection: "row",
          justifyContent: "space-between",
          gap: tokens.spacing.sm,
        }}
      >
        {["Easy", "Distance", "Time"].map((label) => (
          <Pressable
            key={label}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.background.secondary,
              borderRadius: tokens.borderRadius.full,
              paddingVertical: tokens.spacing.sm,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border.light,
              opacity: pressed ? 0.85 : 1,
            })}
            onPress={() => Alert.alert("Goal", `${label} goal coming soon`)}
          >
            <Text
              style={{
                color: colors.text.primary,
                fontWeight: tokens.typography.fontWeight.semibold,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Stats Overlay - Runna Style */}
      {isTracking && (
        <View
          style={{
            position: "absolute",
            top: 80,
            left: tokens.spacing.lg,
            right: tokens.spacing.lg,
            backgroundColor: isDark
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            borderRadius: tokens.borderRadius.xl,
            padding: tokens.spacing.lg,
            ...tokens.shadows.lg,
          }}
        >
          {/* Primary Stats - Large Display */}
          <View style={{ marginBottom: tokens.spacing.md }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize["3xl"],
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
                textAlign: "center",
              }}
            >
              {formatDistance(stats.distance)}
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: "center",
                marginTop: 4,
              }}
            >
              MILES
            </Text>
          </View>

          {/* Secondary Stats - Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              paddingTop: tokens.spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border.light,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {formatDuration(stats.duration)}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.secondary,
                  marginTop: 4,
                }}
              >
                TIME
              </Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {formatPace(stats.pace)}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.secondary,
                  marginTop: 4,
                }}
              >
                PACE /MI
              </Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {stats.calories}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.secondary,
                  marginTop: 4,
                }}
              >
                CALORIES
              </Text>
            </View>
          </View>

          {/* Elevation Stats (if available) */}
          {(stats.elevationGain > 0 || stats.elevationLoss > 0) && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                paddingTop: tokens.spacing.md,
                marginTop: tokens.spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border.light,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.accent.green,
                  }}
                >
                  +{Math.round(stats.elevationGain)}m
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                    marginTop: 4,
                  }}
                >
                  ELEVATION ↑
                </Text>
              </View>

              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.accent.coral,
                  }}
                >
                  -{Math.round(stats.elevationLoss)}m
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                    marginTop: 4,
                  }}
                >
                  ELEVATION ↓
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Control Buttons - Bottom Fixed */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark
            ? "rgba(30, 30, 30, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
          paddingTop: tokens.spacing.lg,
          paddingBottom: tokens.spacing.xl + 20,
          paddingHorizontal: tokens.spacing.xl,
          borderTopLeftRadius: tokens.borderRadius.xl,
          borderTopRightRadius: tokens.borderRadius.xl,
          ...tokens.shadows.xl,
        }}
      >
        {/* Voice shortcut hint */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: tokens.spacing.sm,
            marginBottom: tokens.spacing.sm,
          }}
        >
          <Mic size={16} color={colors.text.secondary} />
          <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.sm }}>
            Try: “Mark lap” or “Pause run”
          </Text>
        </View>

        {error && (
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.accent.coral,
              textAlign: "center",
              marginBottom: tokens.spacing.md,
            }}
          >
            {error}
          </Text>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: tokens.spacing.lg,
          }}
        >
          {!isTracking ? (
            // Start Button - Large and centered
            <Pressable
              style={({ pressed }) => ({
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.accent.green,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
                ...tokens.shadows.lg,
              })}
              onPress={handleStart}
              accessibilityLabel="Start Run"
              accessibilityRole="button"
            >
              <Play color="white" size={36} fill="white" strokeWidth={2} />
            </Pressable>
          ) : (
            <>
              {/* Pause/Resume Button */}
              <Pressable
                style={({ pressed }) => ({
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: isPaused
                    ? colors.accent.green
                    : colors.accent.orange,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                  ...tokens.shadows.md,
                })}
                onPress={isPaused ? handleResume : handlePause}
                accessibilityLabel={isPaused ? "Resume Run" : "Pause Run"}
                accessibilityRole="button"
              >
                {isPaused ? (
                  <Play color="white" size={30} fill="white" strokeWidth={2} />
                ) : (
                  <Pause color="white" size={30} fill="white" strokeWidth={2} />
                )}
              </Pressable>

              {/* Stop Button */}
              <Pressable
                style={({ pressed }) => ({
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: colors.accent.coral,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                  ...tokens.shadows.md,
                })}
                onPress={handleStop}
                accessibilityLabel="Stop Run"
                accessibilityRole="button"
              >
                <Square color="white" size={28} fill="white" strokeWidth={2} />
              </Pressable>
            </>
        )}
      </View>

      <Pressable
        onPress={() => navigation.navigate("Splits")}
        style={({ pressed }) => ({
          marginTop: tokens.spacing.md,
          alignItems: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          style={{
            color: colors.accent.blue,
            fontWeight: tokens.typography.fontWeight.semibold,
          }}
        >
          View splits
        </Text>
      </Pressable>

      {/* Instructions */}
      {!isTracking && (
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              textAlign: "center",
              marginTop: tokens.spacing.md,
            }}
          >
            Tap to start tracking your run
          </Text>
        )}
      </View>
    </View>
  );
}
