/**
 * RunStatsCard Component
 * 
 * Displays weekly running statistics on the HomeScreen.
 * Shows total distance, run count, average pace, and calories.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import tokens from '../../theme/tokens';

interface RunStatsCardProps {
  totalDistance: number; // meters
  runCount: number;
  avgPace: number; // min/mile
  totalCalories: number;
  loading?: boolean;
}

export default function RunStatsCard({
  totalDistance,
  runCount,
  avgPace,
  totalCalories,
  loading = false,
}: RunStatsCardProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? 'dark' : 'light'];

  // Convert meters to miles
  const distanceMiles = (totalDistance / 1609.34).toFixed(1);

  // Format pace as MM:SS
  const formatPace = (pace: number) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.title, { color: colors.text.secondary }]}>
          Loading run stats...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View style={styles.header}>
        <Activity size={20} color={colors.accent.blue} />
        <Text style={[styles.title, { color: colors.text.primary }]}>
          This Week's Runs
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {distanceMiles}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Miles
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {runCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Runs
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {avgPace > 0 ? formatPace(avgPace) : '--'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Avg Pace
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {totalCalories}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Calories
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    marginBottom: tokens.spacing.xs,
  },
  statLabel: {
    fontSize: tokens.typography.fontSize.xs,
    textTransform: 'uppercase',
  },
});

