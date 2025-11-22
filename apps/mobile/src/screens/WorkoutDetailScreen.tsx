import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { tokens } from '../theme/tokens';
import { ArrowLeft, Clock, Dumbbell } from 'lucide-react-native';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { database } from '../services/database/watermelon/database';
import WorkoutLog from '../services/database/watermelon/models/WorkoutLog';
import Set from '../services/database/watermelon/models/Set';
import { Q } from '@nozbe/watermelondb';
import { WarmupCooldownSection } from '../components/workout/WarmupCooldownSection';

interface WorkoutDetailScreenProps {
  workoutId: string;
  onBack: () => void;
}

interface SetWithExercise {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  rpe: number;
}

interface ExerciseGroup {
  exerciseName: string;
  sets: SetWithExercise[];
  totalVolume: number;
}

export default function WorkoutDetailScreen({ workoutId, onBack }: WorkoutDetailScreenProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const [workout, setWorkout] = useState<WorkoutLog | null>(null);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkoutDetails();
  }, [workoutId]);

  const loadWorkoutDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const workoutLog = await database
        .get<WorkoutLog>('workout_logs')
        .find(workoutId);

      const sets = await database
        .get<Set>('sets')
        .query(Q.where('workout_log_id', workoutId))
        .fetch();

      // Group sets by exercise
      const groupMap = new Map<string, SetWithExercise[]>();
      sets.forEach((set) => {
        const exerciseName = set.exerciseName;
        if (!groupMap.has(exerciseName)) {
          groupMap.set(exerciseName, []);
        }
        groupMap.get(exerciseName)!.push({
          id: set.id,
          exerciseName: set.exerciseName,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe ?? 0,
        });
      });

      // Calculate total volume for each exercise
      const groups: ExerciseGroup[] = Array.from(groupMap.entries()).map(([exerciseName, sets]) => {
        const totalVolume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
        return {
          exerciseName,
          sets,
          totalVolume,
        };
      });

      setWorkout(workoutLog);
      setExerciseGroups(groups);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load workout details:', err);
      setError('Failed to load workout details. Please try again.');
      setIsLoading(false);
    }
  };

  const formatDuration = (startTime: Date, endTime: Date): string => {
    const durationMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading workout..." fullScreen />;
  }

  if (error || !workout) {
    return (
      <ErrorMessage
        message={error || 'Workout not found'}
        onRetry={loadWorkoutDetails}
        fullScreen
      />
    );
  }

  const totalSets = exerciseGroups.reduce((sum, group) => sum + group.sets.length, 0);
  const totalVolume = exerciseGroups.reduce((sum, group) => sum + group.totalVolume, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      contentContainerStyle={{
        paddingHorizontal: tokens.spacing.lg,
        paddingVertical: tokens.spacing.lg,
      }}
    >
      <View>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: tokens.spacing.lg,
          }}
        >
          <Pressable
            onPress={onBack}
            accessibilityLabel="Go Back"
            accessibilityRole="button"
            style={({ pressed }) => [
              {
                padding: tokens.spacing.sm,
                marginRight: tokens.spacing.sm,
                borderRadius: tokens.borderRadius.full,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <ArrowLeft color={colors.accent.blue} size={24} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize['2xl'],
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {workout.workoutName}
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              {workout.startTime?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }) || 'Unknown date'}
            </Text>
          </View>
        </View>

        {/* Summary Stats */}
        <View
          style={{
            flexDirection: 'row',
            marginBottom: tokens.spacing.lg,
          }}
        >
          <View
            style={{
              flex: 1,
              padding: tokens.spacing.md,
              borderRadius: tokens.borderRadius.lg,
              marginRight: tokens.spacing.sm,
              backgroundColor: colors.background.secondary,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: tokens.spacing.xs,
              }}
            >
              <Clock color={colors.accent.blue} size={20} />
              <Text
                style={{
                  marginLeft: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                }}
              >
                Duration
              </Text>
            </View>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {workout.startTime && workout.endTime ? formatDuration(workout.startTime, workout.endTime) : 'Unknown duration'}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              padding: tokens.spacing.md,
              borderRadius: tokens.borderRadius.lg,
              marginLeft: tokens.spacing.sm,
              backgroundColor: colors.background.secondary,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: tokens.spacing.xs,
              }}
            >
              <Dumbbell color={colors.accent.blue} size={20} />
              <Text
                style={{
                  marginLeft: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                }}
              >
                Total Volume
              </Text>
            </View>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {totalVolume >= 1000
                ? `${(totalVolume / 1000).toFixed(1)}k`
                : totalVolume}{' '}
              lbs
            </Text>
          </View>
        </View>

        {/* Warmup Section */}
        {workout.warmupRoutine && (
          <WarmupCooldownSection
            type="warmup"
            data={JSON.parse(workout.warmupRoutine)}
            onStartTimer={() => {
              // TODO: Implement timer functionality
              console.log('Start warmup timer');
            }}
          />
        )}

        {/* Exercise Groups */}
        <View style={{ marginTop: tokens.spacing.md }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: tokens.spacing.sm,
            }}
          >
            Exercises ({exerciseGroups.length})
          </Text>

          {exerciseGroups.map((group, groupIndex) => (
            <View
              key={groupIndex}
              style={{
                marginBottom: tokens.spacing.md,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.background.secondary,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.md,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: colors.text.primary,
                  marginBottom: tokens.spacing.sm,
                }}
              >
                {group.exerciseName}
              </Text>

              {/* Sets Table Header */}
              <View
                style={{
                  flexDirection: 'row',
                  paddingBottom: 8,
                  marginBottom: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.light,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: tokens.typography.fontSize.xs,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.tertiary,
                  }}
                >
                  Set
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: tokens.typography.fontSize.xs,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.tertiary,
                    textAlign: 'center',
                  }}
                >
                  Weight
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: tokens.typography.fontSize.xs,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.tertiary,
                    textAlign: 'center',
                  }}
                >
                  Reps
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: tokens.typography.fontSize.xs,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.tertiary,
                    textAlign: 'center',
                  }}
                >
                  RPE
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: tokens.typography.fontSize.xs,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.tertiary,
                    textAlign: 'right',
                  }}
                >
                  Volume
                </Text>
              </View>

              {/* Sets Rows */}
              {group.sets.map((set, setIndex) => (
                <View
                  key={set.id}
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.secondary,
                    }}
                  >
                    {setIndex + 1}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.primary,
                      textAlign: 'center',
                    }}
                  >
                    {set.weight} lbs
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.primary,
                      textAlign: 'center',
                    }}
                  >
                    {set.reps}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.primary,
                      textAlign: 'center',
                    }}
                  >
                    {set.rpe || '-'}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: tokens.typography.fontSize.sm,
                      color: colors.text.primary,
                      textAlign: 'right',
                    }}
                  >
                    {set.weight * set.reps}
                  </Text>
                </View>
              ))}

              {/* Exercise Summary */}
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: tokens.spacing.sm,
                  paddingTop: tokens.spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: colors.border.light,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.text.primary,
                  }}
                >
                  Total
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: colors.accent.blue,
                    textAlign: 'right',
                  }}
                >
                  {group.sets.length} sets • {group.totalVolume} lbs
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Workout Summary */}
        <View
          style={{
            marginTop: tokens.spacing.lg,
            padding: tokens.spacing.md,
            borderRadius: tokens.borderRadius.lg,
            backgroundColor: colors.background.secondary,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.md,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: tokens.spacing.sm,
            }}
          >
            Workout Summary
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: tokens.spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              Total Exercises
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {exerciseGroups.length}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: tokens.spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              Total Sets
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {totalSets}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              Total Volume
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.accent.blue,
              }}
            >
              {totalVolume.toLocaleString()} lbs
            </Text>
          </View>
        </View>

        {/* Cooldown Section */}
        {workout.cooldownRoutine && (
          <WarmupCooldownSection
            type="cooldown"
            data={JSON.parse(workout.cooldownRoutine)}
            onStartTimer={() => {
              // TODO: Implement timer functionality
              console.log('Start cooldown timer');
            }}
          />
        )}
      </View>
    </ScrollView>
  );
}

