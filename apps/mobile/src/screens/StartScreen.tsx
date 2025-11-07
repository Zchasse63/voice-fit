import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Dumbbell, Play, Calendar } from 'lucide-react-native';
import { useWorkoutStore } from '../store/workout.store';
import { useNavigation } from '@react-navigation/native';
import VoiceFAB from '../components/voice/VoiceFAB';
import AutoRegulationModal from '../components/autoregulation/AutoRegulationModal';
import { useAutoRegulation } from '../hooks/useAutoRegulation';
import { useTheme } from '../theme/ThemeContext';

type WorkoutType = 'workout' | 'run' | null;

export default function StartScreen() {
  const { isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<WorkoutType>(null);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const navigation = useNavigation<any>();
  const {
    isChecking,
    trigger,
    showModal,
    checkAutoRegulation,
    handleApprove,
    handleReject,
    closeModal,
  } = useAutoRegulation();

  const handleQuickStart = async (type: 'workout' | 'run') => {
    if (type === 'workout') {
      // Check for auto-regulation before starting workout
      const shouldShowModal = await checkAutoRegulation();

      if (!shouldShowModal) {
        // No auto-regulation needed, start workout immediately
        startWorkout('Quick Workout');
      }
      // If modal is shown, user will approve/reject and then workout starts
    } else {
      navigation.navigate('RunScreen');
    }
  };

  const handleAutoRegulationApprove = () => {
    handleApprove();
    // Start workout after approval
    startWorkout('Quick Workout');
  };

  const handleAutoRegulationReject = () => {
    handleReject();
    // Start workout anyway after rejection
    startWorkout('Quick Workout');
  };

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <View className="p-6">
        {/* Header */}
        <Text className={`text-3xl font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>START</Text>
        <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Begin a new workout or run
        </Text>

        {/* Type Selector */}
        <View className="mt-6">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Choose Activity Type
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              className={`flex-1 p-6 rounded-xl active:opacity-80 ${
                selectedType === 'workout'
                  ? isDark ? 'bg-primaryDark' : 'bg-primary-500'
                  : isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              onPress={() => setSelectedType('workout')}
            >
              <Dumbbell
                color={selectedType === 'workout' ? 'white' : isDark ? '#4A9B6F' : '#2C5F3D'}
                size={32}
              />
              <Text
                className={`text-lg font-bold mt-3 ${
                  selectedType === 'workout' ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                Workout
              </Text>
              <Text
                className={`text-sm mt-1 ${
                  selectedType === 'workout' ? 'text-white/80' : isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Strength training
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 p-6 rounded-xl active:opacity-80 ${
                selectedType === 'run'
                  ? isDark ? 'bg-info-dark' : 'bg-info-light'
                  : isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              onPress={() => setSelectedType('run')}
            >
              <Play
                color={selectedType === 'run' ? 'white' : isDark ? '#5DADE2' : '#3498DB'}
                size={32}
              />
              <Text
                className={`text-lg font-bold mt-3 ${
                  selectedType === 'run' ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                Run
              </Text>
              <Text
                className={`text-sm mt-1 ${
                  selectedType === 'run' ? 'text-white/80' : isDark ? 'text-gray-400' : 'text-gray-600'
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
            <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Quick Start
            </Text>

            <Pressable
              className={`p-4 rounded-xl mb-3 active:opacity-80 ${isDark ? 'bg-primaryDark' : 'bg-primary-500'}`}
              onPress={() => handleQuickStart(selectedType)}
              disabled={isChecking}
            >
              {isChecking ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-lg font-bold text-white ml-2">
                    Checking readiness...
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="text-lg font-bold text-white">
                    Start {selectedType === 'workout' ? 'Workout' : 'Run'} Now
                  </Text>
                  <Text className="text-sm text-white/80 mt-1">
                    Begin immediately with voice guidance
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Program Selector Placeholder */}
        {selectedType === 'workout' && (
          <View className="mt-6">
            <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Training Programs
            </Text>

            <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <View className="flex-row items-center mb-2">
                <Calendar color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />
                <Text className={`text-lg font-bold ml-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Today's Program
                </Text>
              </View>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Program selection coming in Phase 4
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Voice FAB */}
      <VoiceFAB />

      {/* Auto-Regulation Modal */}
      {trigger && (
        <AutoRegulationModal
          visible={showModal}
          onClose={closeModal}
          onApprove={handleAutoRegulationApprove}
          onReject={handleAutoRegulationReject}
          adjustment={{
            shouldAdjust: true,
            adjustmentPercentage: -10,
            reason: trigger.reasons[0] || 'Auto-regulation recommended',
            recommendedAction: 'Reduce training load to prevent overtraining',
          }}
          reasons={trigger.reasons}
        />
      )}
    </ScrollView>
  );
}

