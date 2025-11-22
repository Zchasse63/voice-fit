import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { ScalePressable } from "../components/common/ScalePressable";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";
import { useRunStore } from "../store/run.store";
import { Play, Pause, Square, MapPin, Settings, ChevronDown, ChevronUp } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CountdownOverlay } from "../components/run/CountdownOverlay";

export default function RunScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [isIntervalExpanded, setIsIntervalExpanded] = React.useState(false);

  const {
    isTracking,
    isPaused,
    isWaitingForMotion,
    isCountingDown,
    countdownValue,
    coordinates,
    stats,
    activeWorkout,
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
    // Pass activeWorkout to startRun if it exists
    console.log('🏃 Starting run with activeWorkout:', activeWorkout ? activeWorkout.name : 'None (Free Run)');
    await startRun(activeWorkout || undefined);
  };

  const handlePause = async () => {
    await pauseRun();
  };

  const handleResume = async () => {
    await resumeRun();
  };

  const handleStop = () => {
    Alert.alert(
      "Complete Run",
      "Are you sure you want to complete this run?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          style: "default",
          onPress: async () => {
            await stopRun();
            reset();
            // Stay on Run screen - user can view splits or start a new run
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
    <View style={{ flex: 1, justifyContent: "flex-end" }}>
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

      {/* UNIFIED FLOATING OVERLAY - Expands based on state */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: tokens.spacing.md,
          right: tokens.spacing.md,
          zIndex: 20,
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: tokens.borderRadius.xl,
          padding: tokens.spacing.md,
          ...tokens.shadows.lg,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Top Row: Back + Content + Settings */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {/* Back Button */}
          <ScalePressable
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16, color: colors.text.primary }}>←</Text>
          </ScalePressable>

          {/* Center Content - Changes based on state */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.sm }}>
            {!isTracking && activeWorkout && (
              // Pre-run with workout: Show "CUSTOM WORKOUT" label centered
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                  fontWeight: tokens.typography.fontWeight.medium,
                  textAlign: 'center',
                }}
              >
                CUSTOM WORKOUT
              </Text>
            )}
            {!isTracking && !activeWorkout && (
              // Pre-run without workout: Show "NO SCHEDULED RUN" centered
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                  fontWeight: tokens.typography.fontWeight.medium,
                  textAlign: 'center',
                }}
              >
                NO SCHEDULED RUN
              </Text>
            )}
            {isTracking && (
              // Active run: Show distance centered
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize["2xl"],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatDistance(stats.distance)}
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                    fontWeight: tokens.typography.fontWeight.medium,
                  }}
                >
                  MI
                </Text>
              </View>
            )}
          </View>

          {/* Settings Button */}
          <ScalePressable
            onPress={() => navigation.navigate("RunSettings")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={16} color={colors.text.primary} />
          </ScalePressable>
        </View>

        {/* PRE-RUN CONTENT - Below top row */}
        {!isTracking && activeWorkout && (
          <View style={{ marginTop: 4, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: 2,
                textAlign: 'center',
              }}
            >
              {activeWorkout.name}
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: 'center',
              }}
            >
              {activeWorkout.segments.length} segments • {activeWorkout.segments[0]?.name || 'N/A'}
            </Text>
          </View>
        )}

        {!isTracking && !activeWorkout && (
          <View style={{ marginTop: tokens.spacing.sm, alignItems: 'center' }}>
            {/* Two Buttons Side by Side */}
            <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, width: '100%' }}>
              <ScalePressable
                onPress={handleStart}
                style={{
                  flex: 1,
                  paddingVertical: tokens.spacing.sm,
                  paddingHorizontal: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.lg,
                  backgroundColor: colors.accent.green,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: tokens.typography.fontWeight.semibold,
                    fontSize: tokens.typography.fontSize.sm,
                  }}
                >
                  Free Run
                </Text>
              </ScalePressable>

              <ScalePressable
                onPress={() => navigation.navigate("WorkoutBuilder")}
                style={{
                  flex: 1,
                  paddingVertical: tokens.spacing.sm,
                  paddingHorizontal: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.lg,
                  backgroundColor: colors.accent.blue,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: tokens.typography.fontWeight.semibold,
                    fontSize: tokens.typography.fontSize.sm,
                  }}
                >
                  Create Workout
                </Text>
              </ScalePressable>
            </View>
          </View>
        )}

        {/* ACTIVE RUN CONTENT - Stats */}
        {isTracking && (
          <View style={{ marginTop: 4 }}>
            {/* Stats Row: Time | Pace | Heart Rate - Pulled closer to distance */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: tokens.spacing.xs,
              }}
            >
              {/* Time */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatDuration(stats.duration)}
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginTop: 2,
                    fontWeight: tokens.typography.fontWeight.medium,
                  }}
                >
                  TIME
                </Text>
              </View>

              <View style={{ width: 1, height: 32, backgroundColor: colors.border.light }} />

              {/* Pace */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatPace(stats.pace)}
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginTop: 2,
                    fontWeight: tokens.typography.fontWeight.medium,
                  }}
                >
                  PACE
                </Text>
              </View>

              <View style={{ width: 1, height: 32, backgroundColor: colors.border.light }} />

              {/* Heart Rate - Placeholder */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  --
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginTop: 2,
                    fontWeight: tokens.typography.fontWeight.medium,
                  }}
                >
                  HR
                </Text>
              </View>
            </View>

            {/* Current Interval - Only if structured workout - Pulled closer to stats */}
            {activeWorkout && (
              <Pressable
                onPress={() => setIsIntervalExpanded(!isIntervalExpanded)}
                style={{
                  marginTop: tokens.spacing.xs,
                  paddingTop: tokens.spacing.xs,
                  borderTopWidth: 1,
                  borderTopColor: colors.border.light,
                }}
              >
                {/* Collapsed View - Current Interval */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.xs,
                        color: colors.text.tertiary,
                        marginBottom: 2,
                      }}
                    >
                      CURRENT INTERVAL
                    </Text>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.md,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: colors.accent.blue,
                      }}
                    >
                      {activeWorkout.segments[activeWorkout.currentSegmentIndex]?.name || 'Complete'}
                    </Text>
                    {activeWorkout.segments[activeWorkout.currentSegmentIndex] && (
                      <Text
                        style={{
                          fontSize: tokens.typography.fontSize.xs,
                          color: colors.text.secondary,
                          marginTop: 2,
                        }}
                      >
                        {(() => {
                          const seg = activeWorkout.segments[activeWorkout.currentSegmentIndex];
                          if (seg.distance && seg.targetPace) {
                            return `${(seg.distance * 0.000621371).toFixed(2)} mi @ ${Math.floor(seg.targetPace)}:${Math.floor((seg.targetPace % 1) * 60).toString().padStart(2, '0')}/mi`;
                          } else if (seg.distance) {
                            return `${(seg.distance * 0.000621371).toFixed(2)} miles`;
                          } else if (seg.duration) {
                            return `${Math.floor(seg.duration / 60)}:${(seg.duration % 60).toString().padStart(2, '0')}`;
                          }
                          return '';
                        })()}
                      </Text>
                    )}
                  </View>

                  {/* Segment Progress Badge + Chevron */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }}>
                    <View
                      style={{
                        backgroundColor: colors.accent.blue + '20',
                        paddingHorizontal: tokens.spacing.sm,
                        paddingVertical: 4,
                        borderRadius: tokens.borderRadius.md,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: tokens.typography.fontSize.xs,
                          fontWeight: tokens.typography.fontWeight.semibold,
                          color: colors.accent.blue,
                        }}
                      >
                        {activeWorkout.currentSegmentIndex + 1}/{activeWorkout.segments.length}
                      </Text>
                    </View>
                    {isIntervalExpanded ? (
                      <ChevronUp size={20} color={colors.text.tertiary} />
                    ) : (
                      <ChevronDown size={20} color={colors.text.tertiary} />
                    )}
                  </View>
                </View>

                {/* Expanded View - All Segments */}
                {isIntervalExpanded && (
                  <ScrollView
                    style={{
                      marginTop: tokens.spacing.sm,
                      maxHeight: 200,
                    }}
                    showsVerticalScrollIndicator={true}
                  >
                    {activeWorkout.segments.map((segment, index) => {
                      const isCurrent = index === activeWorkout.currentSegmentIndex;
                      const isPast = index < activeWorkout.currentSegmentIndex;

                      return (
                        <View
                          key={segment.id}
                          style={{
                            paddingVertical: tokens.spacing.sm,
                            paddingHorizontal: tokens.spacing.sm,
                            marginBottom: tokens.spacing.xs,
                            borderRadius: tokens.borderRadius.md,
                            backgroundColor: isCurrent
                              ? colors.accent.blue + '15'
                              : isPast
                              ? colors.background.secondary
                              : 'transparent',
                            borderLeftWidth: isCurrent ? 3 : 0,
                            borderLeftColor: isCurrent ? colors.accent.blue : 'transparent',
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }}>
                                <Text
                                  style={{
                                    fontSize: tokens.typography.fontSize.xs,
                                    color: colors.text.tertiary,
                                    fontWeight: tokens.typography.fontWeight.medium,
                                  }}
                                >
                                  {index + 1}.
                                </Text>
                                <Text
                                  style={{
                                    fontSize: tokens.typography.fontSize.sm,
                                    fontWeight: isCurrent ? tokens.typography.fontWeight.bold : tokens.typography.fontWeight.semibold,
                                    color: isCurrent ? colors.accent.blue : colors.text.primary,
                                  }}
                                >
                                  {segment.name}
                                </Text>
                                <View
                                  style={{
                                    paddingHorizontal: tokens.spacing.xs,
                                    paddingVertical: 2,
                                    borderRadius: tokens.borderRadius.sm,
                                    backgroundColor: (() => {
                                      switch (segment.type) {
                                        case 'warmup': return colors.accent.orange + '20';
                                        case 'interval': return colors.accent.red + '20';
                                        case 'recovery': return colors.accent.green + '20';
                                        case 'cooldown': return colors.accent.blue + '20';
                                        default: return colors.background.secondary;
                                      }
                                    })(),
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: tokens.typography.fontSize.xs,
                                      color: (() => {
                                        switch (segment.type) {
                                          case 'warmup': return colors.accent.orange;
                                          case 'interval': return colors.accent.red;
                                          case 'recovery': return colors.accent.green;
                                          case 'cooldown': return colors.accent.blue;
                                          default: return colors.text.secondary;
                                        }
                                      })(),
                                      fontWeight: tokens.typography.fontWeight.medium,
                                    }}
                                  >
                                    {segment.type.toUpperCase()}
                                  </Text>
                                </View>
                              </View>
                              <Text
                                style={{
                                  fontSize: tokens.typography.fontSize.xs,
                                  color: colors.text.secondary,
                                  marginTop: 4,
                                }}
                              >
                                {(() => {
                                  if (segment.distance && segment.targetPace) {
                                    return `${(segment.distance * 0.000621371).toFixed(2)} mi @ ${Math.floor(segment.targetPace)}:${Math.floor((segment.targetPace % 1) * 60).toString().padStart(2, '0')}/mi`;
                                  } else if (segment.distance) {
                                    return `${(segment.distance * 0.000621371).toFixed(2)} miles`;
                                  } else if (segment.duration) {
                                    return `${Math.floor(segment.duration / 60)}:${(segment.duration % 60).toString().padStart(2, '0')}`;
                                  }
                                  return '';
                                })()}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Bottom Controls Container */}
      <View
        style={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: tokens.spacing.lg,
          backgroundColor: 'transparent',
        }}
      >
        {/* Background container for buttons */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(28, 28, 30, 0.92)' : 'rgba(255, 255, 255, 0.92)',
            borderRadius: tokens.borderRadius.xl,
            padding: tokens.spacing.lg,
            ...tokens.shadows.lg,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          }}
        >
          {!isTracking && activeWorkout ? (
            // Start Screen Layout - Only show start button if activeWorkout exists
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ScalePressable
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: colors.accent.green,
                  alignItems: "center",
                  justifyContent: "center",
                  ...tokens.shadows.lg,
                }}
                onPress={handleStart}
                accessibilityLabel="Start Run"
                accessibilityRole="button"
              >
                <Play color="white" size={32} fill="white" strokeWidth={2} />
              </ScalePressable>
            </View>
          ) : (
            // Active Run Controls - Smaller, more compact
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: tokens.spacing.md,
              }}
            >
              {/* Pause/Resume Button - Smaller */}
              <ScalePressable
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: isPaused
                    ? colors.accent.green
                    : colors.accent.orange,
                  alignItems: "center",
                  justifyContent: "center",
                  ...tokens.shadows.md,
                }}
                onPress={isPaused ? handleResume : handlePause}
                accessibilityLabel={isPaused ? "Resume Run" : "Pause Run"}
                accessibilityRole="button"
              >
                {isPaused ? (
                  <Play color="white" size={24} fill="white" strokeWidth={2} />
                ) : (
                  <Pause color="white" size={24} fill="white" strokeWidth={2} />
                )}
              </ScalePressable>

              {/* Stop Button - Smaller */}
              <ScalePressable
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.accent.coral,
                  alignItems: "center",
                  justifyContent: "center",
                  ...tokens.shadows.md,
                }}
                onPress={handleStop}
                accessibilityLabel="Stop Run"
                accessibilityRole="button"
              >
                <Square color="white" size={22} fill="white" strokeWidth={2} />
              </ScalePressable>
            </View>
          )}
        </View>
      </View>

      {/* Countdown Overlay */}
      <CountdownOverlay value={countdownValue} isVisible={isCountingDown} />

      {/* Waiting for Motion Indicator */}
      {isWaitingForMotion && (
        <View
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              paddingHorizontal: tokens.spacing.xl,
              paddingVertical: tokens.spacing.lg,
              borderRadius: tokens.borderRadius.lg,
              ...tokens.shadows.lg,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.accent.blue,
                textAlign: "center",
              }}
            >
              Waiting for motion...
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: "center",
                marginTop: tokens.spacing.xs,
              }}
            >
              Start moving to begin tracking
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
