import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";
import { useRunStore } from "../store/run.store";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, CheckCircle } from "lucide-react-native";
import { gpsService } from "../services/gps/GPSService";
import { ScalePressable } from "../components/common/ScalePressable";

export default function SplitsScreen() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const navigation = useNavigation();
  const { laps, stats, activeWorkout, isTracking, completeCurrentSegment } = useRunStore();

  // Calculate average pace for comparison
  const avgPace = stats.pace;

  // Calculate delta for each lap
  const lapsWithDelta = laps.map((lap) => {
    const delta = lap.pace - avgPace;
    const deltaFormatted = delta >= 0 ? `+${formatDelta(delta)}` : formatDelta(delta);
    return { ...lap, delta, deltaFormatted };
  });

  // Find best lap
  const bestLapPace = laps.length > 0 ? Math.min(...laps.map(l => l.pace)) : 0;

  const currentSegment = activeWorkout?.segments[activeWorkout.currentSegmentIndex];
  const nextSegment = activeWorkout && activeWorkout.currentSegmentIndex < activeWorkout.segments.length - 1
    ? activeWorkout.segments[activeWorkout.currentSegmentIndex + 1]
    : null;

  const handleCompleteSegment = () => {
    completeCurrentSegment();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.spacing.md,
        }}
      >
        <Pressable onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.text.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            {activeWorkout ? activeWorkout.name : 'Splits'}
          </Text>
          <Text style={{ color: colors.text.secondary, marginTop: 2, fontSize: tokens.typography.fontSize.sm }}>
            {laps.length} {laps.length === 1 ? 'lap' : 'laps'} • Avg pace {gpsService.formatPace(avgPace)}/mi
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Active Workout Info */}
        {activeWorkout && isTracking && currentSegment && (
          <View style={{ padding: tokens.spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border.light }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.xs, marginBottom: 4 }}>
                  Current Segment ({activeWorkout.currentSegmentIndex + 1}/{activeWorkout.segments.length})
                </Text>
                <Text style={{ color: colors.text.primary, fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold }}>
                  {currentSegment.name}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.sm, marginTop: 4 }}>
                  {(() => {
                    if (currentSegment.distance && currentSegment.targetPace) {
                      return `${(currentSegment.distance * 0.000621371).toFixed(2)} mi @ ${Math.floor(currentSegment.targetPace)}:${Math.floor((currentSegment.targetPace % 1) * 60).toString().padStart(2, '0')}/mi`;
                    } else if (currentSegment.distance) {
                      return `${(currentSegment.distance * 0.000621371).toFixed(2)} miles`;
                    } else if (currentSegment.duration) {
                      return `${Math.floor(currentSegment.duration / 60)}:${(currentSegment.duration % 60).toString().padStart(2, '0')}`;
                    }
                    return 'No goal set';
                  })()}
                </Text>
              </View>

              {/* Manual Complete Button */}
              <ScalePressable
                onPress={handleCompleteSegment}
                style={{
                  backgroundColor: colors.accent.green,
                  paddingHorizontal: tokens.spacing.md,
                  paddingVertical: tokens.spacing.sm,
                  borderRadius: tokens.borderRadius.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: tokens.spacing.xs,
                  ...tokens.shadows.md,
                }}
              >
                <CheckCircle size={18} color="white" />
                <Text style={{ color: 'white', fontWeight: tokens.typography.fontWeight.semibold, fontSize: tokens.typography.fontSize.sm }}>
                  Complete
                </Text>
              </ScalePressable>
            </View>

            {/* Next Segment Preview */}
            {nextSegment && (
              <View style={{ backgroundColor: colors.background.secondary, padding: tokens.spacing.sm, borderRadius: tokens.borderRadius.md, marginTop: tokens.spacing.sm }}>
                <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.xs, marginBottom: 4 }}>
                  Next Segment
                </Text>
                <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium }}>
                  {nextSegment.name}
                </Text>
              </View>
            )}

            {/* Workout Progress */}
            <View style={{ marginTop: tokens.spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.xs }}>
                  Workout Progress
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.xs }}>
                  {activeWorkout.currentSegmentIndex + 1} / {activeWorkout.segments.length}
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: colors.border.light, borderRadius: 3, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${((activeWorkout.currentSegmentIndex + 1) / activeWorkout.segments.length) * 100}%`,
                    backgroundColor: colors.accent.blue,
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Laps List */}
        {laps.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: tokens.spacing.xl }}>
            <Text style={{ color: colors.text.secondary, textAlign: "center" }}>
              No laps recorded yet.{activeWorkout ? ' Laps will be created automatically as you complete segments.' : ' Mark laps during your run to see splits here.'}
            </Text>
          </View>
        ) : (
          <View style={{ padding: tokens.spacing.lg, gap: tokens.spacing.sm }}>
            {lapsWithDelta.map((item) => {
              const isBestLap = item.pace === bestLapPace;
              const distanceMiles = (item.distance * 0.000621371).toFixed(2);
              const durationFormatted = formatDuration(item.duration);

              return (
                <View
                  key={item.lapNumber}
                  style={{
                    padding: tokens.spacing.md,
                    backgroundColor: isBestLap ? colors.accent.blue + '10' : colors.background.secondary,
                    borderRadius: tokens.borderRadius.lg,
                    borderWidth: isBestLap ? 2 : 1,
                    borderColor: isBestLap ? colors.accent.blue : colors.border.light,
                  }}
                >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.spacing.xs }}>
                      <Text
                        style={{
                          color: colors.text.primary,
                          fontWeight: tokens.typography.fontWeight.semibold,
                          fontSize: tokens.typography.fontSize.md,
                        }}
                      >
                        Lap {item.lapNumber}
                      </Text>
                      {isBestLap && (
                        <View
                          style={{
                            backgroundColor: colors.accent.blue,
                            paddingHorizontal: tokens.spacing.xs,
                            paddingVertical: 2,
                            borderRadius: tokens.borderRadius.sm,
                          }}
                        >
                          <Text
                            style={{
                              color: 'white',
                              fontSize: tokens.typography.fontSize.xs,
                              fontWeight: tokens.typography.fontWeight.semibold,
                            }}
                          >
                            BEST
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: colors.text.secondary, marginTop: 4, fontSize: tokens.typography.fontSize.sm }}>
                      {distanceMiles} mi • {durationFormatted}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        color: colors.text.primary,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        fontSize: tokens.typography.fontSize.lg,
                      }}
                    >
                      {gpsService.formatPace(item.pace)}
                    </Text>
                    <Text
                      style={{
                        color: item.delta < 0 ? colors.accent.green : item.delta > 0 ? colors.accent.coral : colors.text.secondary,
                        marginTop: 4,
                        fontSize: tokens.typography.fontSize.sm,
                        fontWeight: tokens.typography.fontWeight.semibold,
                      }}
                    >
                      {item.deltaFormatted}
                    </Text>
                  </View>
                </View>

                {/* Pace bar visualization */}
                <View style={{ marginTop: tokens.spacing.sm }}>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.border.light,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (avgPace / item.pace) * 100)}%`,
                        backgroundColor: isBestLap ? colors.accent.blue : item.delta < 0 ? colors.accent.green : colors.accent.coral,
                      }}
                    />
                  </View>
                </View>
              </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDelta(delta: number): string {
  const absDelta = Math.abs(delta);
  const mins = Math.floor(absDelta);
  const secs = Math.round((absDelta - mins) * 60);
  const sign = delta >= 0 ? '+' : '-';
  return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
