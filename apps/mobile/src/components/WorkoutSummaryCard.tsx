/**
 * WorkoutSummaryCard
 * 
 * Custom message component for displaying workout logs in chat.
 * Shows exercise, weight, reps, RPE, and PR detection.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Trophy, TrendingUp } from 'lucide-react-native';
import tokens from '../theme/tokens';

interface WorkoutSummaryCardProps {
  exerciseName: string;
  weight: number;
  reps: number;
  rpe?: number;
  isPR?: boolean;
  prType?: 'weight' | 'reps' | 'volume';
  previousBest?: {
    weight: number;
    reps: number;
  };
}

export default function WorkoutSummaryCard({
  exerciseName,
  weight,
  reps,
  rpe,
  isPR = false,
  prType,
  previousBest,
}: WorkoutSummaryCardProps) {
  const renderPRBadge = () => {
    if (!isPR) return null;

    let prLabel = 'PR!';
    if (prType === 'weight') prLabel = 'Weight PR!';
    else if (prType === 'reps') prLabel = 'Rep PR!';
    else if (prType === 'volume') prLabel = 'Volume PR!';

    return (
      <View style={styles.prBadge}>
        <Trophy color={tokens.colors.badge.gold} size={16} />
        <Text style={styles.prBadgeText}>{prLabel}</Text>
      </View>
    );
  };

  const renderPreviousBest = () => {
    if (!isPR || !previousBest) return null;

    return (
      <View style={styles.previousBestContainer}>
        <TrendingUp color={tokens.colors.accent.success} size={14} />
        <Text style={styles.previousBestText}>
          Previous: {previousBest.weight} lbs × {previousBest.reps} reps
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, isPR && styles.containerPR]}>
      {/* Exercise name */}
      <Text style={styles.exerciseName}>{exerciseName}</Text>

      {/* Weight and reps */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Weight</Text>
          <Text style={styles.statValue}>{weight} lbs</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Reps</Text>
          <Text style={styles.statValue}>{reps}</Text>
        </View>

        {rpe && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>RPE</Text>
              <Text style={styles.statValue}>{rpe}</Text>
            </View>
          </>
        )}
      </View>

      {/* PR badge */}
      {renderPRBadge()}

      {/* Previous best */}
      {renderPreviousBest()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    marginVertical: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    ...tokens.shadows.sm,
  },
  containerPR: {
    borderColor: tokens.colors.badge.gold,
    borderWidth: 2,
    backgroundColor: tokens.colors.badge.gold + '10',
  },
  exerciseName: {
    fontFamily: tokens.typography.fontFamily.system,
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: tokens.typography.fontFamily.system,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: tokens.typography.fontFamily.system,
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: tokens.colors.border.light,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.badge.gold,
    borderRadius: tokens.borderRadius.full,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    marginTop: tokens.spacing.sm,
  },
  prBadgeText: {
    fontFamily: tokens.typography.fontFamily.system,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
    marginLeft: 6,
  },
  previousBestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.xs,
  },
  previousBestText: {
    fontFamily: tokens.typography.fontFamily.system,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
    marginLeft: 4,
  },
});

