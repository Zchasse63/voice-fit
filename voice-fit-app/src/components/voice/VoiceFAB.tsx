/**
 * Voice FAB (Floating Action Button)
 * 
 * Floating action button for voice input with keyboard modal for web testing.
 * Integrates with Voice API Client to parse commands via FastAPI backend.
 */

import React, { useState } from 'react';
import { Pressable, View, Text, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Mic, X } from 'lucide-react-native';
import { voiceAPIClient, VoiceAPIError } from '../../services/api';
import { useWorkoutStore } from '../../store/workout.store';
import { hapticsService } from '../../services/haptics';

export default function VoiceFAB() {
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  
  const addSet = useWorkoutStore((state) => state.addSet);

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) {
      setError('Please enter a command');
      return;
    }

    setIsLoading(true);
    setError(null);
    setParsedData(null);

    try {
      // Call FastAPI backend to parse voice command
      const response = await voiceAPIClient.parseVoiceCommand({
        transcript: transcript.trim(),
      });

      console.log('[VoiceFAB] Parsed response:', response);

      // Store parsed data for confirmation
      setParsedData(response);

      // Auto-accept if high confidence (≥85%)
      if (!response.requires_confirmation) {
        handleAcceptSet(response);
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
    }
  };

  const handleAcceptSet = (data: any) => {
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
      {/* Floating Action Button */}
      <Pressable
        className="absolute bottom-20 right-6 w-16 h-16 bg-[#2C5F3D] rounded-full items-center justify-center shadow-lg active:opacity-80"
        onPress={() => {
          hapticsService.medium();
          setShowInput(true);
        }}
        testID="voice-fab"
      >
        <Mic color="white" size={32} />
      </Pressable>

      {/* Keyboard Input Modal (Web Testing) */}
      <Modal visible={showInput} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white p-6 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Voice Input
              </Text>
              <Pressable onPress={handleClose} testID="close-button">
                <X color="#666" size={24} />
              </Pressable>
            </View>

            {/* Input Field */}
            <TextInput
              className="border border-gray-300 rounded-xl p-4 text-base mb-4"
              placeholder="e.g., bench press 225 for 10"
              value={inputText}
              onChangeText={setInputText}
              autoFocus
              editable={!isLoading && !parsedData}
              testID="voice-input"
            />

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            )}

            {/* Parsed Data Confirmation */}
            {parsedData && (
              <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <Text className="text-sm font-bold text-gray-800 mb-2">
                  Parsed Command:
                </Text>
                <Text className="text-base text-gray-800">
                  {parsedData.exercise_name}
                </Text>
                <Text className="text-sm text-gray-600">
                  {parsedData.weight && `${parsedData.weight} ${parsedData.weight_unit || 'lbs'}`}
                  {parsedData.reps && ` × ${parsedData.reps} reps`}
                  {parsedData.rpe && ` @ RPE ${parsedData.rpe}`}
                </Text>
                <Text className="text-xs text-gray-500 mt-2">
                  Confidence: {(parsedData.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            {!parsedData ? (
              <Pressable
                className={`p-4 rounded-xl items-center ${
                  isLoading ? 'bg-gray-400' : 'bg-[#2C5F3D]'
                }`}
                onPress={() => handleVoiceInput(inputText)}
                disabled={isLoading}
                testID="log-set-button"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-bold text-white">
                    Parse Command
                  </Text>
                )}
              </Pressable>
            ) : (
              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 p-4 bg-gray-200 rounded-xl items-center"
                  onPress={handleReject}
                  testID="reject-button"
                >
                  <Text className="text-base font-bold text-gray-800">
                    Reject
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 p-4 bg-[#2C5F3D] rounded-xl items-center"
                  onPress={() => handleAcceptSet(parsedData)}
                  testID="accept-button"
                >
                  <Text className="text-base font-bold text-white">
                    Accept & Log
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Help Text */}
            <Text className="text-sm text-gray-600 mt-4 text-center">
              Type your command (voice input coming in Phase 4)
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

