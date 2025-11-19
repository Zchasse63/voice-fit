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
import { tokens } from '../../theme/tokens';
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
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;
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
      icon: <Moon color={accentColors.green} size={20} />,
      lowLabel: 'Poor',
      highLabel: 'Excellent',
    },
    {
      key: 'soreness',
      label: 'Muscle Soreness',
      icon: <Zap color={accentColors.orange} size={20} />,
      lowLabel: 'None',
      highLabel: 'Very Sore',
    },
    {
      key: 'stress',
      label: 'Stress Level',
      icon: <Brain color={accentColors.teal} size={20} />,
      lowLabel: 'Calm',
      highLabel: 'High',
    },
    {
      key: 'energy',
      label: 'Energy Level',
      icon: <Battery color={accentColors.green} size={20} />,
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
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.borderRadius.lg,
        backgroundColor: colors.background.secondary,
      }}
    >
      {/* Header */}
      <Text
        style={{
          fontSize: tokens.typography.fontSize.xl,
          fontWeight: tokens.typography.fontWeight.bold,
          marginBottom: tokens.spacing.sm,
          color: colors.text.primary,
        }}
      >
        Detailed Readiness Check
      </Text>
      <Text
        style={{
          fontSize: tokens.typography.fontSize.sm,
          marginBottom: tokens.spacing.lg,
          color: colors.text.secondary,
        }}
      >
        Rate each factor from 1-10 for a personalized readiness score
      </Text>

      {/* Sliders */}
      {sliders.map((slider) => {
        const value = values[slider.key];
        const setValue = setters[slider.key];

        return (
          <View
            key={slider.key}
            style={{ marginBottom: tokens.spacing.lg }}
          >
            {/* Label and Icon */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: tokens.spacing.xs,
              }}
            >
              {slider.icon}
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.md,
                  fontWeight: tokens.typography.fontWeight.bold,
                  marginLeft: tokens.spacing.sm,
                  color: colors.text.primary,
                }}
              >
                {slider.label}
              </Text>
              <View style={{ flex: 1 }} />
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: accentColors.blue,
                }}
              >
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
              minimumTrackTintColor={accentColors.green}
              maximumTrackTintColor={colors.border.light}
              thumbTintColor={accentColors.green}
            />

            {/* Labels */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: tokens.spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                }}
              >
                {slider.lowLabel}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.tertiary,
                }}
              >
                {slider.highLabel}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Phase 3: Notes Input for Injury Detection */}
      <View style={{ marginBottom: tokens.spacing.md }}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            marginBottom: tokens.spacing.xs,
            color: colors.text.secondary,
          }}
        >
          Any pain, soreness, or concerns? (Optional)
        </Text>
        <TextInput
          style={{
            padding: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.md,
            backgroundColor: colors.background.tertiary,
            color: colors.text.primary,
          }}
          placeholder="e.g., 'Sharp pain in left shoulder during overhead press'"
          placeholderTextColor={colors.text.tertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!isSaving}
        />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            marginTop: tokens.spacing.xs,
            color: colors.text.tertiary,
          }}
        >
          Premium: AI-powered injury analysis with personalized recommendations
        </Text>
      </View>

      {/* Submit Button */}
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: tokens.spacing.md,
          borderRadius: tokens.borderRadius.lg,
          marginTop: tokens.spacing.sm,
          backgroundColor: isSaving
            ? colors.background.tertiary
            : accentColors.green,
          opacity: isSaving ? 0.7 : 1,
        }}
        onPress={handleSubmit}
        disabled={isSaving}
        accessibilityLabel="Save Readiness Score"
        accessibilityRole="button"
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.text.primary} />
        ) : (
          <Text
            style={{
              fontSize: tokens.typography.fontSize.md,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.light.text.primary,
            }}
          >
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

