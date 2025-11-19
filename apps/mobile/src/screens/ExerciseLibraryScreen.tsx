import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { tokens } from '../theme/tokens';
import { Search, Dumbbell, Target, TrendingUp } from 'lucide-react-native';

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  description: string;
}

const EXERCISES: Exercise[] = [
  // Chest
  { id: '1', name: 'Bench Press', category: 'Strength', muscleGroup: 'Chest', equipment: 'Barbell', description: 'Compound chest exercise' },
  { id: '2', name: 'Incline Bench Press', category: 'Strength', muscleGroup: 'Chest', equipment: 'Barbell', description: 'Upper chest focus' },
  { id: '3', name: 'Dumbbell Flyes', category: 'Strength', muscleGroup: 'Chest', equipment: 'Dumbbells', description: 'Chest isolation' },
  { id: '4', name: 'Push-ups', category: 'Bodyweight', muscleGroup: 'Chest', equipment: 'Bodyweight', description: 'Classic chest exercise' },
  
  // Back
  { id: '5', name: 'Deadlift', category: 'Strength', muscleGroup: 'Back', equipment: 'Barbell', description: 'Full body compound' },
  { id: '6', name: 'Pull-ups', category: 'Bodyweight', muscleGroup: 'Back', equipment: 'Bodyweight', description: 'Lat development' },
  { id: '7', name: 'Barbell Row', category: 'Strength', muscleGroup: 'Back', equipment: 'Barbell', description: 'Back thickness' },
  { id: '8', name: 'Lat Pulldown', category: 'Strength', muscleGroup: 'Back', equipment: 'Cable', description: 'Lat width' },
  
  // Legs
  { id: '9', name: 'Squat', category: 'Strength', muscleGroup: 'Legs', equipment: 'Barbell', description: 'King of exercises' },
  { id: '10', name: 'Leg Press', category: 'Strength', muscleGroup: 'Legs', equipment: 'Machine', description: 'Quad focus' },
  { id: '11', name: 'Romanian Deadlift', category: 'Strength', muscleGroup: 'Legs', equipment: 'Barbell', description: 'Hamstring focus' },
  { id: '12', name: 'Lunges', category: 'Strength', muscleGroup: 'Legs', equipment: 'Dumbbells', description: 'Unilateral leg work' },
  
  // Shoulders
  { id: '13', name: 'Overhead Press', category: 'Strength', muscleGroup: 'Shoulders', equipment: 'Barbell', description: 'Shoulder compound' },
  { id: '14', name: 'Lateral Raises', category: 'Strength', muscleGroup: 'Shoulders', equipment: 'Dumbbells', description: 'Side delt focus' },
  { id: '15', name: 'Face Pulls', category: 'Strength', muscleGroup: 'Shoulders', equipment: 'Cable', description: 'Rear delt health' },
  
  // Arms
  { id: '16', name: 'Barbell Curl', category: 'Strength', muscleGroup: 'Arms', equipment: 'Barbell', description: 'Bicep mass' },
  { id: '17', name: 'Tricep Dips', category: 'Bodyweight', muscleGroup: 'Arms', equipment: 'Bodyweight', description: 'Tricep compound' },
  { id: '18', name: 'Hammer Curls', category: 'Strength', muscleGroup: 'Arms', equipment: 'Dumbbells', description: 'Bicep and forearm' },
  { id: '19', name: 'Skull Crushers', category: 'Strength', muscleGroup: 'Arms', equipment: 'Barbell', description: 'Tricep isolation' },
];

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

export default function ExerciseLibraryScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');

  const filteredExercises = EXERCISES.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  const cardBackground = colors.background.secondary;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      contentContainerStyle={{ padding: tokens.spacing.lg }}
    >
      <View>
        {/* Header */}
        <View style={{ marginBottom: tokens.spacing.lg }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize["2xl"],
              fontWeight: tokens.typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Exercise Library
          </Text>
          <Text
            style={{
              marginTop: tokens.spacing.xs,
              fontSize: tokens.typography.fontSize.base,
              color: colors.text.secondary,
            }}
          >
            Browse {EXERCISES.length} exercises
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: tokens.spacing.md,
            borderRadius: tokens.borderRadius.xl,
            marginBottom: tokens.spacing.md,
            backgroundColor: cardBackground,
          }}
        >
          <Search
            color={colors.text.tertiary}
            size={20}
          />
          <TextInput
            style={{
              flex: 1,
              marginLeft: tokens.spacing.sm,
              fontSize: tokens.typography.fontSize.base,
              color: colors.text.primary,
            }}
            placeholder="Search exercises..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search exercises"
          />
        </View>

        {/* Muscle Group Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: tokens.spacing.lg }}
        >
          {MUSCLE_GROUPS.map((group) => {
            const isSelected = selectedMuscleGroup === group;
            return (
              <Pressable
                key={group}
                onPress={() => setSelectedMuscleGroup(group)}
                style={{
                  paddingHorizontal: tokens.spacing.md,
                  paddingVertical: tokens.spacing.xs,
                  borderRadius: 999,
                  marginRight: tokens.spacing.xs,
                  backgroundColor: isSelected
                    ? colors.accent.blue
                    : cardBackground,
                }}
                accessibilityLabel={`Filter by ${group}`}
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: isSelected
                      ? colors.text.onAccent
                      : colors.text.secondary,
                  }}
                >
                  {group}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Exercise List */}
        <View>
          <Text
            style={{
              marginBottom: tokens.spacing.sm,
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            {filteredExercises.length}{" "}
            {filteredExercises.length === 1 ? "Exercise" : "Exercises"}
          </Text>

          {filteredExercises.length === 0 ? (
            <View
              style={{
                padding: tokens.spacing.xl,
                borderRadius: tokens.borderRadius.xl,
                alignItems: "center",
                backgroundColor: cardBackground,
              }}
            >
              <Dumbbell
                color={colors.text.tertiary}
                size={48}
              />
              <Text
                style={{
                  marginTop: tokens.spacing.md,
                  fontSize: tokens.typography.fontSize.base,
                  textAlign: "center",
                  color: colors.text.secondary,
                }}
              >
                No exercises found
              </Text>
              <Text
                style={{
                  marginTop: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.sm,
                  textAlign: "center",
                  color: colors.text.tertiary,
                }}
              >
                Try adjusting your search or filters
              </Text>
            </View>
          ) : (
            filteredExercises.map((exercise) => (
              <Pressable
                key={exercise.id}
                style={{
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.xl,
                  marginBottom: tokens.spacing.sm,
                  backgroundColor: cardBackground,
                }}
                accessibilityLabel={`${exercise.name}, ${exercise.muscleGroup}`}
                accessibilityRole="button"
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 999,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: tokens.spacing.md,
                      backgroundColor: isDark
                        ? colors.backgroundSoft.accent
                        : colors.backgroundSoft.accentSubtle,
                    }}
                  >
                    <Dumbbell
                      color={colors.accent.blue}
                      size={24}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: colors.text.primary,
                      }}
                    >
                      {exercise.name}
                    </Text>
                    <Text
                      style={{
                        marginTop: tokens.spacing.xs,
                        fontSize: tokens.typography.fontSize.sm,
                        color: colors.text.secondary,
                      }}
                    >
                      {exercise.description}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        marginTop: tokens.spacing.sm,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginRight: tokens.spacing.md,
                        }}
                      >
                        <Target
                          color={colors.accent.blue}
                          size={14}
                        />
                        <Text
                          style={{
                            marginLeft: tokens.spacing.xs,
                            fontSize: tokens.typography.fontSize.xs,
                            color: colors.text.secondary,
                          }}
                        >
                          {exercise.muscleGroup}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginRight: tokens.spacing.md,
                        }}
                      >
                        <TrendingUp
                          color={colors.accent.blue}
                          size={14}
                        />
                        <Text
                          style={{
                            marginLeft: tokens.spacing.xs,
                            fontSize: tokens.typography.fontSize.xs,
                            color: colors.text.secondary,
                          }}
                        >
                          {exercise.category}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Dumbbell
                          color={colors.accent.blue}
                          size={14}
                        />
                        <Text
                          style={{
                            marginLeft: tokens.spacing.xs,
                            fontSize: tokens.typography.fontSize.xs,
                            color: colors.text.secondary,
                          }}
                        >
                          {exercise.equipment}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

