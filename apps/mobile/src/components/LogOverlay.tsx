/**
 * LogOverlay - Modal Workout Log
 * 
 * Notebook-style modal overlay that shows current workout's sets/reps.
 * Accessible from Chat screen header during workout.
 * Can be dismissed to return to chat.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import tokens from '../theme/tokens';
import { database } from '../services/database/watermelon/database';
import WorkoutLog from '../services/database/watermelon/models/WorkoutLog';
import Set from '../services/database/watermelon/models/Set';

interface LogOverlayProps {
  visible: boolean;
  onClose: () => void;
  workoutLogId?: string;
}

interface SetData {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  rpe?: number;
  createdAt: Date;
}

export default function LogOverlay({ visible, onClose, workoutLogId }: LogOverlayProps) {
  const [sets, setSets] = useState<SetData[]>([]);
  const [workoutName, setWorkoutName] = useState<string>('Current Workout');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible && workoutLogId) {
      loadWorkoutData();
    }
  }, [visible, workoutLogId]);

  const loadWorkoutData = async () => {
    setIsLoading(true);
    try {
      // Load workout log
      const workoutLogsCollection = database.get<WorkoutLog>('workout_logs');
      const workoutLog = await workoutLogsCollection.find(workoutLogId!);
      setWorkoutName(workoutLog.workoutName || 'Current Workout');

      // Load sets for this workout
      const setsCollection = database.get<Set>('sets');
      const workoutSets = await setsCollection
        .query()
        .where('workout_log_id', workoutLogId!)
        .fetch();

      const formattedSets: SetData[] = workoutSets.map((set) => ({
        id: set.id,
        exerciseName: set.exerciseName,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        createdAt: new Date(set.createdAt),
      }));

      setSets(formattedSets);
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupSetsByExercise = () => {
    const grouped: { [key: string]: SetData[] } = {};
    sets.forEach((set) => {
      if (!grouped[set.exerciseName]) {
        grouped[set.exerciseName] = [];
      }
      grouped[set.exerciseName].push(set);
    });
    return grouped;
  };

  const renderNotebookLine = (index: number) => {
    return (
      <View
        key={`line-${index}`}
        style={{
          height: 32,
          borderBottomWidth: 1,
          borderBottomColor: tokens.colors.notebook.ruledLine,
        }}
      />
    );
  };

  const renderSet = (set: SetData, setNumber: number) => {
    return (
      <View
        key={set.id}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: tokens.colors.notebook.ruledLine,
        }}
      >
        <Text
          style={{
            fontFamily: tokens.typography.fontFamily.notebook,
            fontSize: tokens.typography.fontSize.base,
            color: tokens.colors.text.primary,
            flex: 1,
          }}
        >
          Set {setNumber}: {set.weight} lbs × {set.reps} reps
          {set.rpe ? ` @ RPE ${set.rpe}` : ''}
        </Text>
      </View>
    );
  };

  const renderExerciseGroup = (exerciseName: string, exerciseSets: SetData[]) => {
    return (
      <View key={exerciseName} style={{ marginBottom: 24 }}>
        {/* Exercise name header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: tokens.colors.accent.primary + '20',
            borderLeftWidth: 4,
            borderLeftColor: tokens.colors.accent.primary,
          }}
        >
          <Text
            style={{
              fontFamily: tokens.typography.fontFamily.notebook,
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.text.primary,
            }}
          >
            {exerciseName}
          </Text>
        </View>

        {/* Sets */}
        {exerciseSets.map((set, index) => renderSet(set, index + 1))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Content */}
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{workoutName}</Text>
              <Text style={styles.headerSubtitle}>
                {sets.length} {sets.length === 1 ? 'set' : 'sets'} logged
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={tokens.colors.text.primary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Red margin line (notebook style) */}
          <View style={styles.redLine} />

          {/* Workout log content */}
          <ScrollView style={styles.scrollView}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading workout...</Text>
              </View>
            ) : sets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No sets logged yet</Text>
                <Text style={styles.emptySubtext}>
                  Start logging sets in the chat!
                </Text>
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                {Object.entries(groupSetsByExercise()).map(([exerciseName, exerciseSets]) =>
                  renderExerciseGroup(exerciseName, exerciseSets)
                )}
              </View>
            )}
          </ScrollView>

          {/* Hole punch decorations (notebook style) */}
          <View style={styles.holePunchContainer}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.holePunch} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: '80%',
    backgroundColor: tokens.colors.notebook.background,
    borderTopLeftRadius: tokens.borderRadius.xl,
    borderTopRightRadius: tokens.borderRadius.xl,
    ...tokens.shadows.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.notebook.redLine,
  },
  headerTitle: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  headerSubtitle: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  redLine: {
    position: 'absolute',
    left: 48,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: tokens.colors.notebook.redLine,
  },
  scrollView: {
    flex: 1,
    paddingLeft: 56, // Space for red line
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  emptyText: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: tokens.typography.fontFamily.notebook,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
  },
  holePunchContainer: {
    position: 'absolute',
    left: 16,
    top: 100,
    bottom: 100,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  holePunch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: tokens.colors.background.primary,
    borderWidth: 1,
    borderColor: tokens.colors.notebook.holePunch,
  },
});

