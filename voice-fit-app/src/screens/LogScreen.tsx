import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Calendar, TrendingUp } from 'lucide-react-native';

const mockWorkouts = [
  {
    id: '1',
    name: 'Upper Body',
    date: '2025-11-03',
    sets: 12,
    volume: 3200,
  },
  {
    id: '2',
    name: 'Lower Body',
    date: '2025-11-01',
    sets: 10,
    volume: 4500,
  },
  {
    id: '3',
    name: 'Full Body',
    date: '2025-10-30',
    sets: 15,
    volume: 5100,
  },
  {
    id: '4',
    name: 'Upper Body',
    date: '2025-10-28',
    sets: 11,
    volume: 3100,
  },
];

export default function LogScreen() {
  return (
    <ScrollView className="flex-1 bg-[#FBF7F5]">
      <View className="p-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-[#2C5F3D]">Workout Log</Text>
        <Text className="text-base text-gray-600 mt-1">
          Your training history
        </Text>

        {/* Calendar View Placeholder */}
        <View className="mt-6 p-4 bg-white rounded-2xl">
          <View className="flex-row items-center mb-3">
            <Calendar color="#2C5F3D" size={20} />
            <Text className="text-lg font-bold text-gray-800 ml-2">
              November 2025
            </Text>
          </View>
          <Text className="text-sm text-gray-600">
            Calendar view coming in Phase 6
          </Text>
        </View>

        {/* Workout List */}
        <View className="mt-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Recent Workouts
          </Text>

          {mockWorkouts.map((workout) => (
            <View
              key={workout.id}
              className="p-4 bg-white rounded-2xl mb-3"
            >
              <Text className="text-lg font-bold text-gray-800">
                {workout.name}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {new Date(workout.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <View className="flex-row mt-2">
                <Text className="text-sm text-gray-600 mr-4">
                  {workout.sets} sets
                </Text>
                <Text className="text-sm text-gray-600">
                  {workout.volume.toLocaleString()} lbs
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

