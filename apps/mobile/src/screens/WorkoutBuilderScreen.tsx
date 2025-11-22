import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { tokens } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Plus, Trash2, X, GripVertical } from 'lucide-react-native';
import { SelectionModal } from '../components/settings/SelectionModal';
import { useRunStore } from '../store/run.store';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

export interface WorkoutSegment {
  id: string;
  type: 'warmup' | 'interval' | 'recovery' | 'cooldown' | 'steady';
  duration?: number; // seconds
  distance?: number; // meters
  targetPace?: number; // min/mile
  name: string;
}

export interface CustomWorkout {
  id: string;
  name: string;
  description: string;
  segments: WorkoutSegment[];
  totalDistance: number;
  estimatedDuration: number;
}

export default function WorkoutBuilderScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const navigation = useNavigation();

  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [segments, setSegments] = useState<WorkoutSegment[]>([]);
  const [segmentTypeModalVisible, setSegmentTypeModalVisible] = useState(false);
  const [editingSegment, setEditingSegment] = useState<WorkoutSegment | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const addSegment = (type: WorkoutSegment['type']) => {
    const newSegment: WorkoutSegment = {
      id: Date.now().toString(),
      type,
      name: getSegmentTypeName(type),
      duration: type === 'warmup' || type === 'cooldown' ? 300 : 60, // 5 min or 1 min
    };
    setSegments([...segments, newSegment]);
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const duplicateSegment = (segment: WorkoutSegment) => {
    const newSegment: WorkoutSegment = {
      ...segment,
      id: Date.now().toString(),
    };
    // Insert the duplicate right after the original
    const index = segments.findIndex(s => s.id === segment.id);
    const newSegments = [...segments];
    newSegments.splice(index + 1, 0, newSegment);
    setSegments(newSegments);
  };

  const openEditSegment = (segment: WorkoutSegment) => {
    setEditingSegment({ ...segment });
    setEditModalVisible(true);
  };

  const saveEditedSegment = () => {
    if (!editingSegment) return;
    setSegments(segments.map(s => s.id === editingSegment.id ? editingSegment : s));
    setEditModalVisible(false);
    setEditingSegment(null);
  };

  const updateEditingSegment = (updates: Partial<WorkoutSegment>) => {
    if (!editingSegment) return;
    setEditingSegment({ ...editingSegment, ...updates });
  };

  const getSegmentTypeName = (type: WorkoutSegment['type']): string => {
    const names = {
      warmup: 'Warm Up',
      interval: 'Interval',
      recovery: 'Recovery',
      cooldown: 'Cool Down',
      steady: 'Steady Run',
    };
    return names[type];
  };

  const getSegmentColor = (type: WorkoutSegment['type']): string => {
    const colorMap = {
      warmup: colors.accent.blue,
      interval: colors.accent.coral,
      recovery: colors.accent.green,
      cooldown: colors.accent.blue,
      steady: colors.accent.purple,
    };
    return colorMap[type];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // Calculate workout summary stats
  const calculateSummaryStats = () => {
    let totalDuration = 0;
    let totalDistance = 0;
    let recoveryTime = 0;

    segments.forEach(segment => {
      // Calculate segment duration based on distance + pace if both are provided
      let segmentDuration = 0;

      if (segment.distance && segment.targetPace) {
        // Duration = distance (miles) * pace (min/mile) * 60 (to convert to seconds)
        const distanceInMiles = segment.distance * 0.000621371;
        segmentDuration = distanceInMiles * segment.targetPace * 60;
      } else if (segment.duration) {
        // Use manual duration if no distance/pace calculation
        segmentDuration = segment.duration;
      }

      totalDuration += segmentDuration;

      if (segment.type === 'recovery') {
        recoveryTime += segmentDuration;
      }

      if (segment.distance) {
        totalDistance += segment.distance;
      }
    });

    return {
      totalDuration,
      totalDistance: totalDistance / 1609.34, // Convert meters to miles
      recoveryTime,
    };
  };

  const stats = calculateSummaryStats();

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }
    if (segments.length === 0) {
      Alert.alert('Error', 'Please add at least one segment');
      return;
    }

    // Save the workout to storage
    await useRunStore.getState().saveWorkout({
      name: workoutName,
      description: workoutDescription,
      segments,
    });

    // Set it as the active workout (but don't start the run yet)
    const savedWorkouts = useRunStore.getState().savedWorkouts;
    const justSaved = savedWorkouts[savedWorkouts.length - 1];
    if (justSaved) {
      useRunStore.getState().setActiveWorkoutFromSaved(justSaved.id);
    }

    // Navigate back to Run screen
    navigation.goBack();
  };

  const renderRightActions = () => (
    <View
      style={{
        backgroundColor: colors.accent.coral,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: tokens.spacing.lg,
        borderRadius: tokens.borderRadius.lg,
      }}
    >
      <Trash2 size={24} color="white" />
    </View>
  );

  const renderSegmentItem = ({ item: segment, drag, isActive, getIndex }: RenderItemParams<WorkoutSegment>) => {
    const index = getIndex() ?? 0;
    return (
    <ScaleDecorator>
      <Swipeable
        renderRightActions={renderRightActions}
        onSwipeableOpen={() => removeSegment(segment.id)}
      >
        <Pressable
          onPress={() => openEditSegment(segment)}
          onLongPress={drag}
          disabled={isActive}
          style={{
            backgroundColor: isActive ? colors.background.tertiary : colors.background.secondary,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.md,
            borderLeftWidth: 4,
            borderLeftColor: getSegmentColor(segment.type),
            marginBottom: tokens.spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, flex: 1 }}>
              <GripVertical size={20} color={colors.text.tertiary} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }}>
                  <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.sm }}>
                    {index + 1}.
                  </Text>
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontWeight: tokens.typography.fontWeight.semibold,
                      fontSize: tokens.typography.fontSize.md,
                    }}
                  >
                    {segment.name}
                  </Text>
                </View>
                {segment.duration && (
                  <Text style={{ color: colors.text.secondary, marginTop: tokens.spacing.xs }}>
                    Duration: {formatDuration(segment.duration)}
                  </Text>
                )}
                {segment.distance && (
                  <Text style={{ color: colors.text.secondary, marginTop: tokens.spacing.xs }}>
                    Distance: {(segment.distance * 0.000621371).toFixed(2)} mi
                  </Text>
                )}
                {segment.targetPace && (
                  <Text style={{ color: colors.text.secondary, marginTop: tokens.spacing.xs }}>
                    Target Pace: {Math.floor(segment.targetPace)}:{Math.floor((segment.targetPace % 1) * 60).toString().padStart(2, '0')}/mi
                  </Text>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  duplicateSegment(segment);
                }}
                style={{
                  backgroundColor: colors.accent.blue + '20',
                  borderRadius: tokens.borderRadius.full,
                  padding: tokens.spacing.xs,
                }}
              >
                <Plus size={18} color={colors.accent.blue} />
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  removeSegment(segment.id);
                }}
                style={{
                  backgroundColor: colors.accent.coral + '20',
                  borderRadius: tokens.borderRadius.full,
                  padding: tokens.spacing.xs,
                }}
              >
                <Trash2 size={18} color={colors.accent.coral} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Swipeable>
    </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md }}>
          <Pressable onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={colors.text.primary} />
          </Pressable>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Create Workout
          </Text>
        </View>
        <Pressable onPress={saveWorkout}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.md,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.accent.blue,
            }}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <DraggableFlatList
        data={segments}
        onDragEnd={({ data }) => setSegments(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderSegmentItem}
        contentContainerStyle={{ padding: tokens.spacing.lg }}
        ListHeaderComponent={
          <View style={{ gap: tokens.spacing.lg, marginBottom: tokens.spacing.lg }}>
            {/* Workout Name */}
            <View>
              <Text style={{ color: colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                Workout Name
              </Text>
              <TextInput
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholder="e.g., Speed Intervals"
                placeholderTextColor={colors.text.tertiary}
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                  paddingHorizontal: tokens.spacing.md,
                  paddingVertical: tokens.spacing.sm,
                  color: colors.text.primary,
                  fontSize: tokens.typography.fontSize.md,
                }}
              />
            </View>

            {/* Workout Description */}
            <View>
              <Text style={{ color: colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                Description (Optional)
              </Text>
              <TextInput
                value={workoutDescription}
                onChangeText={setWorkoutDescription}
                placeholder="e.g., 8x400m intervals with 200m recovery"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                  paddingHorizontal: tokens.spacing.md,
                  paddingVertical: tokens.spacing.sm,
                  color: colors.text.primary,
                  fontSize: tokens.typography.fontSize.md,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            {/* Workout Summary Stats */}
            {segments.length > 0 && (
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
                    color: colors.text.secondary,
                    marginBottom: tokens.spacing.xs,
                  }}
                >
                  Workout Summary
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.xl,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: colors.text.primary,
                      }}
                    >
                      {stats.totalDistance.toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                      Total Miles
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.xl,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: colors.text.primary,
                      }}
                    >
                      {formatDuration(stats.totalDuration)}
                    </Text>
                    <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                      Total Duration
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.xl,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: colors.accent.green,
                      }}
                    >
                      {formatDuration(stats.recoveryTime)}
                    </Text>
                    <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                      Recovery Time
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Segments Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.text.secondary }}>
                Segments ({segments.length})
              </Text>
              <Pressable
                onPress={() => setSegmentTypeModalVisible(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: tokens.spacing.xs,
                  backgroundColor: colors.accent.blue,
                  paddingHorizontal: tokens.spacing.md,
                  paddingVertical: tokens.spacing.xs,
                  borderRadius: tokens.borderRadius.full,
                }}
              >
                <Plus size={16} color="white" />
                <Text style={{ color: 'white', fontWeight: tokens.typography.fontWeight.semibold }}>
                  Add Segment
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            style={{
              padding: tokens.spacing.xl,
              backgroundColor: colors.background.secondary,
              borderRadius: tokens.borderRadius.lg,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
              No segments yet. Add segments to build your workout.
            </Text>
          </View>
        }
      />

      {/* Segment Type Selection Modal */}
      <SelectionModal
        visible={segmentTypeModalVisible}
        title="Select Segment Type"
        options={[
          { label: 'Warm Up', value: 'warmup' },
          { label: 'Interval', value: 'interval' },
          { label: 'Recovery', value: 'recovery' },
          { label: 'Steady Run', value: 'steady' },
          { label: 'Cool Down', value: 'cooldown' },
        ]}
        selectedValue=""
        onSelect={(val) => {
          addSegment(val as WorkoutSegment['type']);
        }}
        onClose={() => setSegmentTypeModalVisible(false)}
      />

      {/* Edit Segment Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.background.primary,
              borderTopLeftRadius: tokens.borderRadius.xl,
              borderTopRightRadius: tokens.borderRadius.xl,
              padding: tokens.spacing.lg,
              maxHeight: '80%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: tokens.spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                Edit Segment
              </Text>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <X size={24} color={colors.text.secondary} />
              </Pressable>
            </View>

            {editingSegment && (
              <ScrollView style={{ gap: tokens.spacing.md }}>
                {/* Segment Type */}
                <View style={{ marginBottom: tokens.spacing.md }}>
                  <Text style={{ color: colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                    Segment Type
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs }}>
                    {(['warmup', 'interval', 'recovery', 'steady', 'cooldown'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => updateEditingSegment({ type, name: getSegmentTypeName(type) })}
                        style={{
                          paddingHorizontal: tokens.spacing.md,
                          paddingVertical: tokens.spacing.sm,
                          borderRadius: tokens.borderRadius.full,
                          backgroundColor:
                            editingSegment.type === type
                              ? getSegmentColor(type)
                              : colors.background.secondary,
                        }}
                      >
                        <Text
                          style={{
                            color: editingSegment.type === type ? 'white' : colors.text.primary,
                            fontWeight: tokens.typography.fontWeight.medium,
                          }}
                        >
                          {getSegmentTypeName(type)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Duration Picker */}
                <View style={{ marginBottom: tokens.spacing.md }}>
                  <Text style={{ color: colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                    Duration (optional)
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderRadius: tokens.borderRadius.md,
                      padding: tokens.spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: tokens.spacing.xs,
                    }}
                  >
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.xs }}>
                        Minutes
                      </Text>
                      <TextInput
                        value={editingSegment.duration ? Math.floor(editingSegment.duration / 60).toString() : '0'}
                        onChangeText={(text) => {
                          const mins = parseInt(text) || 0;
                          const secs = editingSegment.duration ? editingSegment.duration % 60 : 0;
                          updateEditingSegment({ duration: mins * 60 + secs });
                        }}
                        keyboardType="number-pad"
                        style={{
                          color: colors.text.primary,
                          fontSize: tokens.typography.fontSize.xl,
                          fontWeight: tokens.typography.fontWeight.bold,
                          textAlign: 'center',
                          minWidth: 60,
                        }}
                      />
                    </View>
                    <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.xl }}>:</Text>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.xs }}>
                        Seconds
                      </Text>
                      <TextInput
                        value={editingSegment.duration ? (editingSegment.duration % 60).toString().padStart(2, '0') : '00'}
                        onChangeText={(text) => {
                          const secs = Math.min(59, parseInt(text) || 0);
                          const mins = editingSegment.duration ? Math.floor(editingSegment.duration / 60) : 0;
                          updateEditingSegment({ duration: mins * 60 + secs });
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={{
                          color: colors.text.primary,
                          fontSize: tokens.typography.fontSize.xl,
                          fontWeight: tokens.typography.fontWeight.bold,
                          textAlign: 'center',
                          minWidth: 60,
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Distance Picker */}
                <View style={{ marginBottom: tokens.spacing.md }}>
                  <Text style={{ color: colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                    Distance (optional)
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderRadius: tokens.borderRadius.md,
                      padding: tokens.spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: tokens.spacing.xs,
                    }}
                  >
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.xs }}>
                        Miles
                      </Text>
                      <TextInput
                        value={
                          editingSegment.distance
                            ? Math.floor(editingSegment.distance * 0.000621371).toString()
                            : '0'
                        }
                        onChangeText={(text) => {
                          const wholeMiles = parseInt(text) || 0;
                          const decimal = editingSegment.distance
                            ? ((editingSegment.distance * 0.000621371) % 1) * 100
                            : 0;
                          updateEditingSegment({ distance: (wholeMiles + decimal / 100) * 1609.34 });
                        }}
                        keyboardType="number-pad"
                        style={{
                          color: colors.text.primary,
                          fontSize: tokens.typography.fontSize.xl,
                          fontWeight: tokens.typography.fontWeight.bold,
                          textAlign: 'center',
                          minWidth: 60,
                        }}
                      />
                    </View>
                    <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.xl }}>.</Text>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.xs }}>
                        Decimal
                      </Text>
                      <TextInput
                        value={
                          editingSegment.distance
                            ? Math.floor(((editingSegment.distance * 0.000621371) % 1) * 100)
                                .toString()
                                .padStart(2, '0')
                            : '00'
                        }
                        onChangeText={(text) => {
                          const decimal = Math.min(99, parseInt(text) || 0);
                          const wholeMiles = editingSegment.distance
                            ? Math.floor(editingSegment.distance * 0.000621371)
                            : 0;
                          updateEditingSegment({ distance: (wholeMiles + decimal / 100) * 1609.34 });
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={{
                          color: colors.text.primary,
                          fontSize: tokens.typography.fontSize.xl,
                          fontWeight: tokens.typography.fontWeight.bold,
                          textAlign: 'center',
                          minWidth: 60,
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Target Pace Picker */}
                <View style={{ marginBottom: tokens.spacing.md }}>
                  <Text style={{ color: colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                    Target Pace (min/mile, optional)
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderRadius: tokens.borderRadius.md,
                      padding: tokens.spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: tokens.spacing.xs,
                    }}
                  >
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.xs }}>
                        Minutes
                      </Text>
                      <TextInput
                        value={editingSegment.targetPace ? Math.floor(editingSegment.targetPace).toString() : '0'}
                        onChangeText={(text) => {
                          const mins = parseInt(text) || 0;
                          const secs = editingSegment.targetPace ? (editingSegment.targetPace % 1) * 60 : 0;
                          updateEditingSegment({ targetPace: mins + secs / 60 });
                        }}
                        keyboardType="number-pad"
                        style={{
                          color: colors.text.primary,
                          fontSize: tokens.typography.fontSize.xl,
                          fontWeight: tokens.typography.fontWeight.bold,
                          textAlign: 'center',
                          minWidth: 60,
                        }}
                      />
                    </View>
                    <Text style={{ color: colors.text.secondary, fontSize: tokens.typography.fontSize.xl }}>:</Text>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: colors.text.tertiary, fontSize: tokens.typography.fontSize.xs }}>
                        Seconds
                      </Text>
                      <TextInput
                        value={
                          editingSegment.targetPace
                            ? Math.floor((editingSegment.targetPace % 1) * 60)
                                .toString()
                                .padStart(2, '0')
                            : '00'
                        }
                        onChangeText={(text) => {
                          const secs = Math.min(59, parseInt(text) || 0);
                          const mins = editingSegment.targetPace ? Math.floor(editingSegment.targetPace) : 0;
                          updateEditingSegment({ targetPace: mins + secs / 60 });
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={{
                          color: colors.text.primary,
                          fontSize: tokens.typography.fontSize.xl,
                          fontWeight: tokens.typography.fontWeight.bold,
                          textAlign: 'center',
                          minWidth: 60,
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Save Button */}
                <Pressable
                  onPress={saveEditedSegment}
                  style={{
                    backgroundColor: colors.accent.blue,
                    borderRadius: tokens.borderRadius.md,
                    paddingVertical: tokens.spacing.md,
                    alignItems: 'center',
                    marginTop: tokens.spacing.md,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: tokens.typography.fontWeight.semibold,
                      fontSize: tokens.typography.fontSize.md,
                    }}
                  >
                    Save Changes
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

