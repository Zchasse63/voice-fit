import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');

  const filteredExercises = EXERCISES.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}>
      <View className="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className={`text-3xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
            Exercise Library
          </Text>
          <Text className={`text-base mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Browse {EXERCISES.length} exercises
          </Text>
        </View>

        {/* Search Bar */}
        <View className={`flex-row items-center p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <Search color={isDark ? '#9CA3AF' : '#6B7280'} size={20} />
          <TextInput
            className={`flex-1 ml-3 text-base ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
            placeholder="Search exercises..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search exercises"
          />
        </View>

        {/* Muscle Group Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {MUSCLE_GROUPS.map((group) => (
            <Pressable
              key={group}
              onPress={() => setSelectedMuscleGroup(group)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedMuscleGroup === group
                  ? isDark
                    ? 'bg-primaryDark'
                    : 'bg-primary-500'
                  : isDark
                  ? 'bg-gray-800'
                  : 'bg-white'
              }`}
              accessibilityLabel={`Filter by ${group}`}
              accessibilityRole="button"
            >
              <Text
                className={`text-sm font-bold ${
                  selectedMuscleGroup === group
                    ? 'text-white'
                    : isDark
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}
              >
                {group}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Exercise List */}
        <View>
          <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {filteredExercises.length} {filteredExercises.length === 1 ? 'Exercise' : 'Exercises'}
          </Text>

          {filteredExercises.length === 0 ? (
            <View className={`p-8 rounded-xl items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Dumbbell color={isDark ? '#4B5563' : '#D1D5DB'} size={48} />
              <Text className={`text-base mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No exercises found
              </Text>
              <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Try adjusting your search or filters
              </Text>
            </View>
          ) : (
            filteredExercises.map((exercise) => (
              <Pressable
                key={exercise.id}
                className={`p-4 rounded-xl mb-3 active:opacity-80 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                accessibilityLabel={`${exercise.name}, ${exercise.muscleGroup}`}
                accessibilityRole="button"
              >
                <View className="flex-row items-start">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                      isDark ? 'bg-primaryDark/20' : 'bg-primary-500/20'
                    }`}
                  >
                    <Dumbbell color={isDark ? '#4A9B6F' : '#2C5F3D'} size={24} />
                  </View>

                  <View className="flex-1">
                    <Text className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {exercise.name}
                    </Text>
                    <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {exercise.description}
                    </Text>

                    <View className="flex-row mt-3">
                      <View className="flex-row items-center mr-4">
                        <Target color={isDark ? '#4A9B6F' : '#2C5F3D'} size={14} />
                        <Text className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {exercise.muscleGroup}
                        </Text>
                      </View>
                      <View className="flex-row items-center mr-4">
                        <TrendingUp color={isDark ? '#4A9B6F' : '#2C5F3D'} size={14} />
                        <Text className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {exercise.category}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Dumbbell color={isDark ? '#4A9B6F' : '#2C5F3D'} size={14} />
                        <Text className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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

