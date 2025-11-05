import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Trophy, TrendingUp, Award } from 'lucide-react-native';

const mockPRs = [
  {
    id: '1',
    exercise: 'Squat',
    weight: 315,
    reps: 5,
    date: '2025-10-28',
    improvement: '+10 lbs',
  },
  {
    id: '2',
    exercise: 'Bench Press',
    weight: 225,
    reps: 5,
    date: '2025-10-25',
    improvement: '+5 lbs',
  },
  {
    id: '3',
    exercise: 'Deadlift',
    weight: 405,
    reps: 3,
    date: '2025-10-20',
    improvement: '+15 lbs',
  },
  {
    id: '4',
    exercise: 'Overhead Press',
    weight: 135,
    reps: 8,
    date: '2025-10-15',
    improvement: '+5 lbs',
  },
];

const fitnessMetrics = [
  { label: 'Total PRs', value: '12', icon: Trophy },
  { label: 'This Month', value: '4', icon: TrendingUp },
  { label: 'Streak', value: '3 weeks', icon: Award },
];

export default function PRsScreen() {
  return (
    <ScrollView className="flex-1 bg-[#FBF7F5]">
      <View className="p-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-[#2C5F3D]">
          Personal Records
        </Text>
        <Text className="text-base text-gray-600 mt-1">
          Your best lifts and progression
        </Text>

        {/* Fitness Metrics */}
        <View className="mt-6 flex-row justify-between">
          {fitnessMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <View
                key={index}
                className="flex-1 p-4 bg-white rounded-2xl mx-1"
              >
                <Icon color="#2C5F3D" size={20} />
                <Text className="text-2xl font-bold text-[#2C5F3D] mt-2">
                  {metric.value}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">
                  {metric.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* PR List */}
        <View className="mt-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Recent PRs
          </Text>

          {mockPRs.map((pr) => (
            <View key={pr.id} className="p-4 bg-white rounded-2xl mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">
                    {pr.exercise}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {new Date(pr.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-[#2C5F3D]">
                    {pr.weight}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {pr.reps} reps
                  </Text>
                  <Text className="text-xs text-green-600 mt-1">
                    {pr.improvement}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Progress Chart Placeholder */}
        <View className="mt-6 p-4 bg-white rounded-2xl">
          <View className="flex-row items-center mb-2">
            <TrendingUp color="#2C5F3D" size={20} />
            <Text className="text-lg font-bold text-gray-800 ml-2">
              Progress Charts
            </Text>
          </View>
          <Text className="text-sm text-gray-600">
            Detailed analytics coming in Phase 6
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

