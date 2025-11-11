/**
 * LogScreen - Full Workout History (Redesigned)
 * 
 * Full-page workout log with:
 * - Day-by-day navigation
 * - Filter/search
 * - Stats footer
 * - Notebook-style design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Calendar,
} from 'lucide-react-native';
import tokens from '../theme/tokens';
import { database } from '../services/database/watermelon/database';
import WorkoutLog from '../services/database/watermelon/models/WorkoutLog';
import Set from '../services/database/watermelon/models/Set';
import { Q } from '@nozbe/watermelondb';
import { SkeletonGroup } from '../components/common/SkeletonLoader';
import AnimatedListItem from '../components/common/AnimatedListItem';
import WorkoutTypeBadge from '../components/common/WorkoutTypeBadge';

interface WorkoutDay {
  date: Date;
  workouts: {
    id: string;
    name: string;
    startTime: Date;
    endTime?: Date;
    sets: {
      exerciseName: string;
      weight: number;
      reps: number;
      rpe?: number;
    }[];
  }[];
}

const ITEMS_PER_PAGE = 20;

export default function LogScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadWorkoutHistory();
  }, [selectedDate]);

  const loadWorkoutHistory = async (loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setPage(0);
      setWorkoutDays([]);
      setHasMore(true);
    }

    try {
      // Load workouts for selected month with pagination
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const currentPage = loadMore ? page + 1 : 0;

      const workouts = await database
        .get<WorkoutLog>('workout_logs')
        .query(
          Q.where('start_time', Q.gte(startOfMonth.getTime())),
          Q.where('start_time', Q.lte(endOfMonth.getTime())),
          Q.sortBy('start_time', Q.desc),
          Q.skip(currentPage * ITEMS_PER_PAGE),
          Q.take(ITEMS_PER_PAGE)
        )
        .fetch();

      // Check if we have more data
      if (workouts.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      // Group workouts by day
      const grouped: { [key: string]: WorkoutDay } = {};

      for (const workout of workouts) {
        const dateKey = new Date(workout.startTime).toDateString();

        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: new Date(workout.startTime),
            workouts: [],
          };
        }

        // Load sets for this workout
        const sets = await database
          .get<Set>('sets')
          .query(Q.where('workout_log_id', workout.id))
          .fetch();

        grouped[dateKey].workouts.push({
          id: workout.id,
          name: workout.workoutName || 'Workout',
          startTime: new Date(workout.startTime),
          endTime: workout.endTime ? new Date(workout.endTime) : undefined,
          sets: sets.map((set) => ({
            exerciseName: set.exerciseName,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
          })),
        });
      }

      const newDays = Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());

      // Append to existing days if loading more, otherwise replace
      if (loadMore) {
        setWorkoutDays([...workoutDays, ...newDays]);
        setPage(currentPage);
      } else {
        setWorkoutDays(newDays);
      }
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadWorkoutHistory(true);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const renderMonthNavigation = () => {
    return (
      <View style={styles.monthNavigation}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <ChevronLeft color={tokens.colors.text.primary} size={24} />
        </TouchableOpacity>
        
        <View style={styles.monthDisplay}>
          <Calendar color={tokens.colors.accent.primary} size={20} />
          <Text style={styles.monthText}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <ChevronRight color={tokens.colors.text.primary} size={24} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSearchBar = () => {
    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={tokens.colors.text.tertiary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={tokens.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color={tokens.colors.accent.primary} size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderWorkoutDay = (day: WorkoutDay) => {
    return (
      <View key={day.date.toISOString()} style={styles.dayContainer}>
        {/* Date header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>
            {day.date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Workouts for this day */}
        {day.workouts.map((workout) => (
          <View key={workout.id} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View style={styles.workoutTitleRow}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <WorkoutTypeBadge workoutName={workout.name} size="small" />
              </View>
              <Text style={styles.workoutTime}>
                {workout.startTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {/* Sets grouped by exercise */}
            {Object.entries(
              workout.sets.reduce((acc, set) => {
                if (!acc[set.exerciseName]) {
                  acc[set.exerciseName] = [];
                }
                acc[set.exerciseName].push(set);
                return acc;
              }, {} as { [key: string]: typeof workout.sets })
            ).map(([exerciseName, sets]) => (
              <View key={exerciseName} style={styles.exerciseGroup}>
                <Text style={styles.exerciseName}>{exerciseName}</Text>
                {sets.map((set, index) => (
                  <Text key={index} style={styles.setDetails}>
                    Set {index + 1}: {set.weight} lbs × {set.reps} reps
                    {set.rpe ? ` @ RPE ${set.rpe}` : ''}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <Calendar color={tokens.colors.text.tertiary} size={48} />
        <Text style={styles.emptyStateText}>No workouts this month</Text>
        <Text style={styles.emptyStateSubtext}>
          Start logging workouts in the Chat tab!
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={tokens.colors.text.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Log</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Red margin line (notebook style) */}
      <View style={styles.redLine} />

      {/* Content */}
      <View style={styles.content}>
        {renderMonthNavigation()}
        {renderSearchBar()}

        <ScrollView style={styles.scrollView}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <SkeletonGroup variant="listItem" count={5} />
            </View>
          ) : workoutDays.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {workoutDays.map((day, index) => (
                <AnimatedListItem key={day.date.toISOString()} index={index} animationType="slide">
                  {renderWorkoutDay(day)}
                </AnimatedListItem>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <Pressable
                  onPress={handleLoadMore}
                  disabled={isLoadingMore}
                  style={styles.loadMoreButton}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color={tokens.colors.accent.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load More Workouts</Text>
                  )}
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workoutDays.length}</Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {workoutDays.reduce((sum, day) => sum + day.workouts.length, 0)}
          </Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {workoutDays.reduce(
              (sum, day) =>
                sum +
                day.workouts.reduce((wSum, w) => wSum + w.sets.length, 0),
              0
            )}
          </Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.notebook.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.notebook.background,
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.notebook.redLine,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  redLine: {
    position: 'absolute',
    left: 48,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: tokens.colors.notebook.redLine,
  },
  content: {
    flex: 1,
    paddingLeft: 56, // Space for red line
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing.md,
  },
  navButton: {
    padding: 8,
  },
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.md,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    marginRight: tokens.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.primary,
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  dayContainer: {
    marginBottom: tokens.spacing.lg,
  },
  dateHeader: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.accent.primary + '20',
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.accent.primary,
  },
  dateText: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  workoutCard: {
    padding: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.notebook.ruledLine,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  workoutName: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  workoutTime: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  exerciseGroup: {
    marginTop: tokens.spacing.sm,
  },
  exerciseName: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: 4,
  },
  setDetails: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginLeft: tokens.spacing.md,
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  loadingText: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  emptyStateText: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.md,
  },
  emptyStateSubtext: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    marginTop: 4,
  },
  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.light,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  statLabel: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: tokens.colors.border.light,
  },
  loadMoreButton: {
    padding: tokens.spacing.md,
    marginVertical: tokens.spacing.md,
    marginHorizontal: tokens.spacing.md,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
  },
  loadMoreText: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.accent.primary,
  },
});

