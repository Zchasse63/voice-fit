/**
 * DetailedReadinessForm Component
 * 
 * Detailed readiness assessment with sliders (Premium tier).
 * Provides granular tracking of sleep, soreness, stress, and energy.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/auth.store';
import { readinessService, DetailedReadinessInput } from '../../services/readiness/ReadinessService';
import { InjuryDetectionService, InjuryDetectionResult } from '../../services/injury/InjuryDetectionService';
import { InjuryLoggingService } from '../../services/injury/InjuryLoggingService';
import InjuryDetectionModal from '../injury/InjuryDetectionModal';
import { Moon, Zap, Brain, Battery } from 'lucide-react-native';

interface SliderConfig {
  key: keyof DetailedReadinessInput;
  label: string;
  icon: React.ReactNode;
  lowLabel: string;
  highLabel: string;
}

export default function DetailedReadinessForm({ onComplete }: { onComplete?: () => void }) {
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);

  const [sleepQuality, setSleepQuality] = useState(7);
  const [soreness, setSoreness] = useState(3);
  const [stress, setStress] = useState(3);
  const [energy, setEnergy] = useState(7);
  const [notes, setNotes] = useState<string>(''); // Phase 3: User notes for injury detection
  const [isSaving, setIsSaving] = useState(false);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [detectedInjury, setDetectedInjury] = useState<InjuryDetectionResult | null>(null);

  const sliders: SliderConfig[] = [
    {
      key: 'sleepQuality',
      label: 'Sleep Quality',
      icon: <Moon color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />,
      lowLabel: 'Poor',
      highLabel: 'Excellent',
    },
    {
      key: 'soreness',
      label: 'Muscle Soreness',
      icon: <Zap color={isDark ? '#F9AC60' : '#DD7B57'} size={20} />,
      lowLabel: 'None',
      highLabel: 'Very Sore',
    },
    {
      key: 'stress',
      label: 'Stress Level',
      icon: <Brain color={isDark ? '#86F4EE' : '#36625E'} size={20} />,
      lowLabel: 'Calm',
      highLabel: 'High',
    },
    {
      key: 'energy',
      label: 'Energy Level',
      icon: <Battery color={isDark ? '#4A9B6F' : '#2C5F3D'} size={20} />,
      lowLabel: 'Low',
      highLabel: 'High',
    },
  ];

  const values = {
    sleepQuality,
    soreness,
    stress,
    energy,
  };

  const setters = {
    sleepQuality: setSleepQuality,
    soreness: setSoreness,
    stress: setStress,
    energy: setEnergy,
  };

  const handleSubmit = async () => {
    if (!user || isSaving) return;

    try {
      setIsSaving(true);

      const input: DetailedReadinessInput = {
        sleepQuality,
        soreness,
        stress,
        energy,
      };

      const scoreData = readinessService.calculateDetailedReadiness(input);

      // Phase 3: Add notes to scoreData if provided
      const scoreDataWithNotes = { ...scoreData, notes: notes.trim() || undefined };

      // Phase 3: Check for injury keywords if notes provided (Premium tier)
      if (notes.trim()) {
        const injuryResult = InjuryDetectionService.analyzeNotes(notes);
        if (injuryResult.injuryDetected && injuryResult.confidence >= 0.6) {
          setDetectedInjury(injuryResult);
          setShowInjuryModal(true);
        }
      }

      await readinessService.saveReadinessScore(user.id, scoreDataWithNotes);

      console.log(`✅ Detailed readiness score saved: ${scoreData.score}`);

      if (onComplete) {
        onComplete();
      }

      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save detailed readiness score:', error);
      setIsSaving(false);
    }
  };

  return (
    <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        Detailed Readiness Check
      </Text>
      <Text className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Rate each factor from 1-10 for a personalized readiness score
      </Text>

      {/* Sliders */}
      {sliders.map((slider) => {
        const value = values[slider.key];
        const setValue = setters[slider.key];

        return (
          <View key={slider.key} className="mb-6">
            {/* Label and Icon */}
            <View className="flex-row items-center mb-2">
              {slider.icon}
              <Text className={`text-base font-bold ml-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {slider.label}
              </Text>
              <View className="flex-1" />
              <Text className={`text-lg font-bold ${isDark ? 'text-primaryDark' : 'text-primary-500'}`}>
                {value}
              </Text>
            </View>

            {/* Slider */}
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={value}
              onValueChange={setValue}
              minimumTrackTintColor={isDark ? '#4A9B6F' : '#2C5F3D'}
              maximumTrackTintColor={isDark ? '#374151' : '#D1D5DB'}
              thumbTintColor={isDark ? '#4A9B6F' : '#2C5F3D'}
            />

            {/* Labels */}
            <View className="flex-row justify-between mt-1">
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {slider.lowLabel}
              </Text>
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {slider.highLabel}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Phase 3: Notes Input for Injury Detection */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Any pain, soreness, or concerns? (Optional)
        </Text>
        <TextInput
          className={`p-3 rounded-lg ${
            isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
          }`}
          placeholder="e.g., 'Sharp pain in left shoulder during overhead press'"
          placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!isSaving}
        />
        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Premium: AI-powered injury analysis with personalized recommendations
        </Text>
      </View>

      {/* Submit Button */}
      <Pressable
        className={`flex-row items-center justify-center p-4 rounded-xl mt-2 ${
          isSaving
            ? isDark
              ? 'bg-gray-700'
              : 'bg-gray-300'
            : isDark
            ? 'bg-primaryDark'
            : 'bg-primary-500'
        }`}
        onPress={handleSubmit}
        disabled={isSaving}
        accessibilityLabel="Save Readiness Score"
        accessibilityRole="button"
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className="text-base font-bold text-white">
            Save Readiness Score
          </Text>
        )}
      </Pressable>

      {/* Injury Detection Modal */}
      {showInjuryModal && detectedInjury && (
        <InjuryDetectionModal
          visible={showInjuryModal}
          onClose={() => setShowInjuryModal(false)}
          injuryResult={detectedInjury}
          onLogInjury={async () => {
            if (!user || !detectedInjury) {
              setShowInjuryModal(false);
              return;
            }

            try {
              const severity = detectedInjury.severity || 'mild';

              await InjuryLoggingService.createInjuryLog({
                userId: user.id,
                bodyPart: detectedInjury.bodyPart || 'unspecified',
                severity,
                description: detectedInjury.description,
              });
            } catch (error) {
              console.error('Failed to log injury from detailed readiness:', error);
            } finally {
              setShowInjuryModal(false);
              setDetectedInjury(null);
            }
          }}
          onDismiss={() => {
            setShowInjuryModal(false);
            setDetectedInjury(null);
          }}
          affectedExercises={[]}
          onSubstitutionsAccepted={() => {}}
        />
      )}
    </View>
  );
}

