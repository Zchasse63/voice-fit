import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { useWorkoutStore } from '../store/workout.store';
import { Dumbbell, TrendingUp, Calendar } from 'lucide-react-native';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const checkSession = useAuthStore((state) => state.checkSession);
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);

  useEffect(() => {
    checkSession();
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView className="flex-1 bg-[#FBF7F5]">
      <View className="p-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-[#2C5F3D]">
          Welcome back, {user?.name || 'Athlete'}!
        </Text>
        <Text className="text-base text-gray-600 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* Active Workout Card */}
        {activeWorkout && (
          <View className="mt-6 p-4 bg-[#E67E22] rounded-2xl">
            <Text className="text-lg font-bold text-white">Active Workout</Text>
            <Text className="text-base text-white mt-1">
              {activeWorkout.name}
            </Text>
            <Text className="text-sm text-white/80 mt-1">
              Started {formatTime(activeWorkout.startTime)}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View className="mt-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Quick Actions
          </Text>

          <Pressable
            className="flex-row items-center p-4 bg-[#2C5F3D] rounded-2xl mb-3 active:opacity-80"
            onPress={() => startWorkout('Quick Workout')}
          >
            <Dumbbell color="white" size={24} />
            <Text className="text-base font-bold text-white ml-3">
              Start Workout
            </Text>
          </Pressable>

          <Pressable className="flex-row items-center p-4 bg-[#3498DB] rounded-2xl mb-3 active:opacity-80">
            <TrendingUp color="white" size={24} />
            <Text className="text-base font-bold text-white ml-3">
              View Progress
            </Text>
          </Pressable>

          <Pressable className="flex-row items-center p-4 bg-[#E67E22] rounded-2xl active:opacity-80">
            <Calendar color="white" size={24} />
            <Text className="text-base font-bold text-white ml-3">
              Today's Program
            </Text>
          </Pressable>
        </View>

        {/* Stats Summary */}
        <View className="mt-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            This Week
          </Text>
          <View className="flex-row justify-between">
            <View className="flex-1 p-4 bg-white rounded-2xl mr-2">
              <Text className="text-3xl font-bold text-[#2C5F3D]">5</Text>
              <Text className="text-sm text-gray-600 mt-1">Workouts</Text>
            </View>
            <View className="flex-1 p-4 bg-white rounded-2xl ml-2">
              <Text className="text-3xl font-bold text-[#2C5F3D]">12.5k</Text>
              <Text className="text-sm text-gray-600 mt-1">lbs Volume</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

