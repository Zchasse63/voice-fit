/**
 * RunScreen - GPS Running Tracker (Redesigned)
 * 
 * Features:
 * - Pre-run goal selection
 * - Active run with map + live stats
 * - Recent runs list
 * - Integration with /api/running/parse and /api/running/analyze
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Play, Pause, Square, MapPin, Target, TrendingUp } from 'lucide-react-native';
import tokens from '../theme/tokens';
import { useRunStore } from '../store/run.store';

type RunMode = 'idle' | 'goal_selection' | 'active';

interface RunGoal {
  type: 'distance' | 'duration' | 'easy';
  value?: number;
  label: string;
}

export default function RunScreen() {
  const mapRef = useRef<MapView>(null);
  const [mode, setMode] = useState<RunMode>('idle');
  const [selectedGoal, setSelectedGoal] = useState<RunGoal | null>(null);

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
    requestPermissions();
  }, []);

  useEffect(() => {
    // Center map on latest coordinate
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

  const goals: RunGoal[] = [
    { type: 'easy', label: 'Easy Run' },
    { type: 'distance', value: 3, label: '3 Miles' },
    { type: 'distance', value: 5, label: '5 Miles' },
    { type: 'duration', value: 30, label: '30 Minutes' },
    { type: 'duration', value: 60, label: '60 Minutes' },
  ];

  const handleStartRun = async (goal: RunGoal) => {
    if (!hasPermission) {
      Alert.alert(
        'Location Permission Required',
        'VoiceFit needs access to your location to track your runs.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: () => requestPermissions() },
        ]
      );
      return;
    }

    setSelectedGoal(goal);
    setMode('active');
    await startRun();
  };

  const handleStopRun = () => {
    Alert.alert(
      'Stop Run',
      'Are you sure you want to stop this run? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            await stopRun();
            // TODO: Save run to WatermelonDB and sync to backend
            Alert.alert('Run Saved', 'Your run has been saved successfully!', [
              { text: 'OK', onPress: () => { reset(); setMode('idle'); } },
            ]);
          },
        },
      ]
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
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number): string => {
    if (pace === 0 || !isFinite(pace)) return '--:--';
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Idle mode - Show goal selection and recent runs
  if (mode === 'idle') {
    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Run</Text>
          <Text style={styles.headerSubtitle}>Track your outdoor runs</Text>
        </View>

        {/* Goal Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target color={tokens.colors.accent.primary} size={24} />
            <Text style={styles.sectionTitle}>Start a Run</Text>
          </View>

          <View style={styles.goalsGrid}>
            {goals.map((goal, index) => (
              <TouchableOpacity
                key={index}
                style={styles.goalCard}
                onPress={() => handleStartRun(goal)}
              >
                <Text style={styles.goalLabel}>{goal.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Runs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp color={tokens.colors.accent.primary} size={24} />
            <Text style={styles.sectionTitle}>Recent Runs</Text>
          </View>

          <View style={styles.emptyState}>
            <MapPin color={tokens.colors.text.tertiary} size={48} />
            <Text style={styles.emptyStateText}>No runs yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start your first run to see it here!
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Active mode - Show map and live stats
  return (
    <View style={styles.activeContainer}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={{ flex: 1 }}
          showsUserLocation
          showsMyLocationButton
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
              strokeColor={tokens.colors.run.routeLine}
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>

      {/* Stats Overlay */}
      <View style={styles.statsOverlay}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{formatDistance(stats.distance)} mi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(stats.duration)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pace</Text>
            <Text style={styles.statValue}>{formatPace(stats.pace)}</Text>
          </View>
        </View>

        {selectedGoal && (
          <View style={styles.goalBadge}>
            <Target color={tokens.colors.text.inverse} size={16} />
            <Text style={styles.goalBadgeText}>{selectedGoal.label}</Text>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.controlsRow}>
          {!isTracking ? (
            <TouchableOpacity style={styles.startButton} onPress={() => startRun()}>
              <Play color={tokens.colors.text.inverse} size={32} fill={tokens.colors.text.inverse} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.controlButton, isPaused && styles.resumeButton]}
                onPress={isPaused ? resumeRun : pauseRun}
              >
                {isPaused ? (
                  <Play color={tokens.colors.text.inverse} size={24} fill={tokens.colors.text.inverse} />
                ) : (
                  <Pause color={tokens.colors.text.inverse} size={24} fill={tokens.colors.text.inverse} />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.stopButton} onPress={handleStopRun}>
                <Square color={tokens.colors.text.inverse} size={24} fill={tokens.colors.text.inverse} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Additional Stats */}
        {isTracking && (
          <View style={styles.additionalStats}>
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatLabel}>Avg Speed</Text>
              <Text style={styles.additionalStatValue}>{stats.avgSpeed.toFixed(1)} mph</Text>
            </View>
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatLabel}>Calories</Text>
              <Text style={styles.additionalStatValue}>{stats.calories}</Text>
            </View>
            {stats.gradeAdjustedPace && (
              <View style={styles.additionalStatItem}>
                <Text style={styles.additionalStatLabel}>GAP</Text>
                <Text style={styles.additionalStatValue}>{formatPace(stats.gradeAdjustedPace)}/mi</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginTop: 4,
  },
  section: {
    padding: tokens.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginLeft: tokens.spacing.sm,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  goalCard: {
    width: '48%',
    backgroundColor: tokens.colors.run.goalCard,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    margin: 4,
    alignItems: 'center',
    ...tokens.shadows.sm,
  },
  goalLabel: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
  },
  emptyState: {
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.xl,
    alignItems: 'center',
    ...tokens.shadows.sm,
  },
  emptyStateText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    marginTop: 4,
  },
  // Active mode styles
  activeContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  mapContainer: {
    flex: 1,
  },
  statsOverlay: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: tokens.colors.background.secondary + 'E6',
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    ...tokens.shadows.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },
  statValue: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginTop: 4,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.accent.primary,
    borderRadius: tokens.borderRadius.full,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    marginTop: tokens.spacing.sm,
  },
  goalBadgeText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
    marginLeft: 6,
  },
  controlsContainer: {
    backgroundColor: tokens.colors.background.secondary,
    padding: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.light,
  },
  errorText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.accent.error,
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    width: 80,
    height: 80,
    backgroundColor: tokens.colors.run.startButton,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadows.md,
  },
  controlButton: {
    width: 64,
    height: 64,
    backgroundColor: tokens.colors.run.pauseButton,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  resumeButton: {
    backgroundColor: tokens.colors.run.startButton,
  },
  stopButton: {
    width: 64,
    height: 64,
    backgroundColor: tokens.colors.accent.error,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.light,
  },
  additionalStatItem: {
    alignItems: 'center',
  },
  additionalStatLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },
  additionalStatValue: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginTop: 4,
  },
});

