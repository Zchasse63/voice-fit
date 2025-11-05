import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Dumbbell, Play, Calendar } from 'lucide-react-native';
import { useWorkoutStore } from '../store/workout.store';
import VoiceFAB from '../components/voice/VoiceFAB';

type WorkoutType = 'workout' | 'run' | null;

export default function StartScreen() {
  const [selectedType, setSelectedType] = useState<WorkoutType>(null);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);

  const handleQuickStart = (type: 'workout' | 'run') => {
    if (type === 'workout') {
      startWorkout('Quick Workout');
    } else {
      // TODO: Implement run tracking in Phase 3
      console.log('Run tracking coming soon');
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#FBF7F5]">
      <View className="p-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-[#2C5F3D]">START</Text>
        <Text className="text-base text-gray-600 mt-1">
          Begin a new workout or run
        </Text>

        {/* Type Selector */}
        <View className="mt-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Choose Activity Type
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              className={`flex-1 p-6 rounded-2xl ${
                selectedType === 'workout' ? 'bg-[#2C5F3D]' : 'bg-white'
              } active:opacity-80`}
              onPress={() => setSelectedType('workout')}
            >
              <Dumbbell
                color={selectedType === 'workout' ? 'white' : '#2C5F3D'}
                size={32}
              />
              <Text
                className={`text-lg font-bold mt-3 ${
                  selectedType === 'workout' ? 'text-white' : 'text-gray-800'
                }`}
              >
                Workout
              </Text>
              <Text
                className={`text-sm mt-1 ${
                  selectedType === 'workout' ? 'text-white/80' : 'text-gray-600'
                }`}
              >
                Strength training
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 p-6 rounded-2xl ${
                selectedType === 'run' ? 'bg-[#3498DB]' : 'bg-white'
              } active:opacity-80`}
              onPress={() => setSelectedType('run')}
            >
              <Play
                color={selectedType === 'run' ? 'white' : '#3498DB'}
                size={32}
              />
              <Text
                className={`text-lg font-bold mt-3 ${
                  selectedType === 'run' ? 'text-white' : 'text-gray-800'
                }`}
              >
                Run
              </Text>
              <Text
                className={`text-sm mt-1 ${
                  selectedType === 'run' ? 'text-white/80' : 'text-gray-600'
                }`}
              >
                Cardio session
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Start Options */}
        {selectedType && (
          <View className="mt-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Quick Start
            </Text>

            <Pressable
              className="p-4 bg-[#2C5F3D] rounded-2xl mb-3 active:opacity-80"
              onPress={() => handleQuickStart(selectedType)}
            >
              <Text className="text-lg font-bold text-white">
                Start {selectedType === 'workout' ? 'Workout' : 'Run'} Now
              </Text>
              <Text className="text-sm text-white/80 mt-1">
                Begin immediately with voice guidance
              </Text>
            </Pressable>
          </View>
        )}

        {/* Program Selector Placeholder */}
        {selectedType === 'workout' && (
          <View className="mt-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Training Programs
            </Text>

            <View className="p-4 bg-white rounded-2xl">
              <View className="flex-row items-center mb-2">
                <Calendar color="#2C5F3D" size={20} />
                <Text className="text-lg font-bold text-gray-800 ml-2">
                  Today's Program
                </Text>
              </View>
              <Text className="text-sm text-gray-600">
                Program selection coming in Phase 4
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Voice FAB */}
      <VoiceFAB />
    </ScrollView>
  );
}

