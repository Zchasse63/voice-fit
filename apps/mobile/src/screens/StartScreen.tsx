import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Dumbbell, Play, Calendar } from 'lucide-react-native';
import { useWorkoutStore } from '../store/workout.store';
import { useNavigation } from '@react-navigation/native';
import VoiceFAB from '../components/voice/VoiceFAB';
import AutoRegulationModal from '../components/autoregulation/AutoRegulationModal';
import { useAutoRegulation } from '../hooks/useAutoRegulation';
import { useTheme } from '../theme/ThemeContext';
import { tokens } from '../theme/tokens';

type WorkoutType = 'workout' | 'run' | null;

type StartScreenNavigationProp = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  goBack: () => void;
};

export default function StartScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const [selectedType, setSelectedType] = useState<WorkoutType>(null);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const navigation = useNavigation<StartScreenNavigationProp>();
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      contentContainerStyle={{ padding: tokens.spacing.lg }}
    >
      <View>
        {/* Header */}
        <Text
          style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          START
        </Text>
        <Text
          style={{
            marginTop: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          Begin a new workout or run
        </Text>

        {/* Type Selector */}
        <View
          style={{
            marginTop: tokens.spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.md,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: tokens.spacing.sm,
            }}
          >
            Choose Activity Type
          </Text>

          <View
            style={{
              flexDirection: 'row',
              columnGap: tokens.spacing.sm,
            }}
          >
            <Pressable
              onPress={() => setSelectedType('workout')}
              style={({ pressed }) => [
                {
                  flex: 1,
                  padding: tokens.spacing.lg,
                  borderRadius: tokens.borderRadius.xl,
                  backgroundColor:
                    selectedType === 'workout'
                      ? colors.accent.blue
                      : colors.background.secondary,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Dumbbell
                color={selectedType === 'workout' ? colors.icon.onAccent : colors.accent.blue}
                size={32}
              />
              <Text
                style={{
                  marginTop: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: selectedType === 'workout' ? colors.text.onAccent : colors.text.primary,
                }}
              >
                Workout
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontSize: tokens.typography.fontSize.xs,
                  color: selectedType === 'workout' ? colors.text.onAccent : colors.text.secondary,
                }}
              >
                Strength training
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedType('run')}
              style={({ pressed }) => [
                {
                  flex: 1,
                  padding: tokens.spacing.lg,
                  borderRadius: tokens.borderRadius.xl,
                  backgroundColor:
                    selectedType === 'run' ? colors.accent.teal : colors.background.secondary,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Play
                color={selectedType === 'run' ? colors.text.onAccent : colors.accent.teal}
                size={32}
              />
              <Text
                style={{
                  marginTop: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: selectedType === 'run' ? colors.text.onAccent : colors.text.primary,
                }}
              >
                Run
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontSize: tokens.typography.fontSize.xs,
                  color: selectedType === 'run' ? colors.text.onAccent : colors.text.secondary,
                }}
              >
                Cardio session
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Start Options */}
        {selectedType && (
          <View
            style={{
              marginTop: tokens.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.md,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.sm,
              }}
            >
              Quick Start
            </Text>

            <Pressable
              onPress={() => handleQuickStart(selectedType)}
              disabled={isChecking}
              style={({ pressed }) => [
                {
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.xl,
                  backgroundColor: colors.accent.blue,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              {isChecking ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ActivityIndicator size="small" color={colors.text.onAccent} />
                  <Text
                    style={{
                      marginLeft: tokens.spacing.xs,
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: tokens.typography.fontWeight.semibold,
                      color: colors.text.onAccent,
                    }}
                  >
                    Checking readiness...
                  </Text>
                </View>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.md,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: colors.text.onAccent,
                    }}
                  >
                    Start {selectedType === 'workout' ? 'Workout' : 'Run'} Now
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.text.onAccent,
                    }}
                  >
                    Begin immediately with voice guidance
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Program Selector Placeholder */}
        {selectedType === 'workout' && (
          <View
            style={{
              marginTop: tokens.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.md,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.sm,
              }}
            >
              Training Programs
            </Text>

            <View
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.background.secondary,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: tokens.spacing.xs,
                }}
              >
                <Calendar color={colors.accent.blue} size={20} />
                <Text
                  style={{
                    marginLeft: tokens.spacing.xs,
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  Today's Program
                </Text>
              </View>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.secondary,
                }}
              >
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

