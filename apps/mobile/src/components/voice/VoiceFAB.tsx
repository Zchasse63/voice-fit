/**
 * Voice FAB (Floating Action Button)
 *
 * Floating action button for voice input with keyboard modal for web testing.
 * Integrates with Voice API Client to parse commands via FastAPI backend.
 * Features pulse animation while listening using Reanimated 3.x
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Modal, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Mic, X } from 'lucide-react-native';
import { voiceAPIClient, VoiceAPIError } from '../../services/api';
import { useWorkoutStore } from '../../store/workout.store';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { hapticsService } from '../../services/haptics';
import { ScalePressable } from '../common/ScalePressable';

interface VoiceCommandParsedData {
  exercise_name: string;
  weight?: number;
  weight_unit?: string;
  reps?: number;
  rpe?: number;
  confidence: number;
  requires_confirmation: boolean;
}

export default function VoiceFAB() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<VoiceCommandParsedData | null>(null);

  const addSet = useWorkoutStore((state) => state.addSet);

  // Animation values for pulse effect
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Start pulse animation when loading
  const startPulseAnimation = () => {
    scale.value = withRepeat(
      withSequence(
        withSpring(1.2, { damping: 2 }),
        withSpring(1, { damping: 2 })
      ),
      -1, // Infinite
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withSpring(0.6),
        withSpring(1)
      ),
      -1,
      true
    );
  };

  // Stop pulse animation
  const stopPulseAnimation = () => {
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
  };

  // Animated style for FAB
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) {
      setError('Please enter a command');
      return;
    }

    setIsLoading(true);
    setError(null);
    setParsedData(null);

    // Start pulse animation while processing
    startPulseAnimation();

    try {
      // Call FastAPI backend to parse voice command
      const response = await (voiceAPIClient as any).parseVoiceCommand({
        transcript: transcript.trim(),
      });

      console.log('[VoiceFAB] Parsed response:', response);

      // Store parsed data for confirmation
      // Cast response to our local interface as we can't access the shared type definition
      const data = response as unknown as VoiceCommandParsedData;
      setParsedData(data);

      // Auto-accept if high confidence (≥85%)
      if (!data.requires_confirmation) {
        handleAcceptSet(data);
      }
    } catch (err) {
      console.error('[VoiceFAB] Error parsing voice command:', err);

      // Haptic feedback for error
      hapticsService.error();

      if (err instanceof VoiceAPIError) {
        if (err.statusCode === 0) {
          setError('Cannot connect to voice API. Make sure the backend is running on localhost:8000');
        } else if (err.statusCode === 408) {
          setError('Request timeout. Please try again.');
        } else {
          setError(err.message || 'Failed to parse voice command');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
      // Stop pulse animation when done
      stopPulseAnimation();
    }
  };

  const handleAcceptSet = (data: VoiceCommandParsedData) => {
    // Haptic feedback for success
    hapticsService.success();

    // Add to workout store
    addSet({
      exerciseName: data.exercise_name,
      weight: data.weight || 0,
      reps: data.reps || 0,
      rpe: data.rpe,
    });

    // Show success message
    console.log(`[VoiceFAB] Set logged: ${data.exercise_name} ${data.weight}lbs x ${data.reps}`);

    // Reset state
    setShowInput(false);
    setInputText('');
    setParsedData(null);
    setError(null);
  };

  const handleReject = () => {
    // Haptic feedback for rejection
    hapticsService.light();

    setParsedData(null);
    setError(null);
  };

  const handleClose = () => {
    setShowInput(false);
    setInputText('');
    setParsedData(null);
    setError(null);
  };

  return (
    <>
      {/* Floating Action Button with Pulse Animation */}
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            bottom: tokens.spacing['2xl'],
            right: tokens.spacing.lg,
          },
        ]}
      >
        <ScalePressable
          style={({ pressed }) => ({
            width: 64,
            height: 64,
            borderRadius: tokens.borderRadius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accent.blue,
            opacity: pressed ? 0.9 : 1,
            ...tokens.shadows.lg,
          })}
          onPress={() => {
            setShowInput(true);
          }}
          haptic="medium"
          accessibilityLabel="Voice Input"
          accessibilityHint="Opens voice input to log workout sets"
          accessibilityRole="button"
          testID="voice-fab"
        >
          <Mic color="#FFFFFF" size={32} />
        </ScalePressable>
      </Animated.View>

      {/* Keyboard Input Modal (Web Testing) */}
      <Modal visible={showInput} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: colors.overlay.scrim,
          }}
        >
          <View
            style={{
              padding: tokens.spacing.lg,
              borderTopLeftRadius: tokens.borderRadius.xl,
              borderTopRightRadius: tokens.borderRadius.xl,
              backgroundColor: colors.background.secondary,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: tokens.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                Voice Input
              </Text>
              <ScalePressable
                onPress={handleClose}
                haptic="light"
                accessibilityLabel="Close"
                accessibilityHint="Closes voice input modal"
                accessibilityRole="button"
                testID="close-button"
              >
                <X color={colors.text.tertiary} size={24} />
              </ScalePressable>
            </View>

            {/* Input Field */}
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border.light,
                borderRadius: tokens.components.input.borderRadius,
                padding: tokens.spacing.md,
                fontSize: tokens.typography.fontSize.base,
                marginBottom: tokens.spacing.md,
                color: colors.text.primary,
                backgroundColor: colors.background.primary,
              }}
              placeholder="e.g., bench press 225 for 10"
              placeholderTextColor={colors.text.tertiary}
              value={inputText}
              onChangeText={setInputText}
              autoFocus
              editable={!isLoading && !parsedData}
              testID="voice-input"
            />

            {/* Error Message */}
            {error && (
              <View
                style={{
                  padding: tokens.spacing.sm,
                  borderRadius: tokens.borderRadius.md,
                  marginBottom: tokens.spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.accent.red,
                  backgroundColor: colors.backgroundSoft.danger,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: colors.accent.red,
                  }}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Parsed Data Confirmation */}
            {parsedData && (
              <View
                style={{
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.md,
                  marginBottom: tokens.spacing.md,
                  borderWidth: 1,
                  borderColor: colors.accent.green,
                  backgroundColor: colors.backgroundSoft.success,
                }}
              >
                <Text
                  style={{
                    marginBottom: tokens.spacing.xs,
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  Parsed Command:
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    color: colors.text.primary,
                  }}
                >
                  {parsedData.exercise_name}
                </Text>
                <Text
                  style={{
                    marginTop: tokens.spacing.xs,
                    fontSize: tokens.typography.fontSize.sm,
                    color: colors.text.secondary,
                  }}
                >
                  {parsedData.weight && `${parsedData.weight} ${parsedData.weight_unit || 'lbs'}`}
                  {parsedData.reps && ` × ${parsedData.reps} reps`}
                  {parsedData.rpe && ` @ RPE ${parsedData.rpe}`}
                </Text>
                <Text
                  style={{
                    marginTop: tokens.spacing.xs,
                    fontSize: tokens.typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  Confidence: {(parsedData.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            {!parsedData ? (
              <ScalePressable
                style={({ pressed }) => ({
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.xl,
                  alignItems: 'center',
                  minHeight: 60,
                  backgroundColor: isLoading
                    ? colors.text.disabled
                    : colors.accent.blue,
                  opacity: pressed ? 0.9 : 1,
                })}
                onPress={() => handleVoiceInput(inputText)}
                disabled={isLoading}
                haptic="selection"
                accessibilityLabel="Parse Command"
                accessibilityHint="Processes the voice input to log a workout set"
                accessibilityRole="button"
                testID="log-set-button"
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.base,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: '#FFFFFF',
                    }}
                  >
                    Parse Command
                  </Text>
                )}
              </ScalePressable>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  columnGap: tokens.spacing.sm,
                }}
              >
                <ScalePressable
                  style={({ pressed }) => ({
                    flex: 1,
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.xl,
                    alignItems: 'center',
                    minHeight: 60,
                    backgroundColor: colors.background.tertiary,
                    opacity: pressed ? 0.9 : 1,
                  })}
                  onPress={handleReject}
                  haptic="medium"
                  accessibilityLabel="Reject"
                  accessibilityHint="Rejects the parsed command and allows re-entry"
                  accessibilityRole="button"
                  testID="reject-button"
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.base,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}
                  >
                    Reject
                  </Text>
                </ScalePressable>
                <ScalePressable
                  style={({ pressed }) => ({
                    flex: 1,
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.xl,
                    alignItems: 'center',
                    minHeight: 60,
                    backgroundColor: colors.accent.green,
                    opacity: pressed ? 0.9 : 1,
                  })}
                  onPress={() => handleAcceptSet(parsedData)}
                  haptic="success"
                  accessibilityLabel="Accept and Log"
                  accessibilityHint="Accepts the parsed command and logs the workout set"
                  accessibilityRole="button"
                  testID="accept-button"
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.base,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: '#FFFFFF',
                    }}
                  >
                    Accept & Log
                  </Text>
                </ScalePressable>
              </View>
            )}

            {/* Help Text */}
            <Text
              style={{
                marginTop: tokens.spacing.md,
                fontSize: tokens.typography.fontSize.sm,
                textAlign: 'center',
                color: colors.text.secondary,
              }}
            >
              Type your command (voice input coming in Phase 4)
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

