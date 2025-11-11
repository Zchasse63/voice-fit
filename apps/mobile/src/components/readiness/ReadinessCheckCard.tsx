/**
 * ReadinessCheckCard Component
 * 
 * Daily readiness check with emoji selection (Free tier).
 * Displays on Home screen for quick daily assessment.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/auth.store';
import { readinessService, SimpleReadinessInput } from '../../services/readiness/ReadinessService';
import { InjuryDetectionService, InjuryDetectionResult } from '../../services/injury/InjuryDetectionService';
import InjuryDetectionModal from '../injury/InjuryDetectionModal';
import { CheckCircle } from 'lucide-react-native';

type EmojiOption = '😊' | '😐' | '😓';

interface EmojiChoice {
  emoji: EmojiOption;
  label: string;
  description: string;
}

const emojiChoices: EmojiChoice[] = [
  { emoji: '😊', label: 'Great', description: 'Feeling strong and ready' },
  { emoji: '😐', label: 'OK', description: 'Decent energy' },
  { emoji: '😓', label: 'Tired', description: 'Low energy or sore' },
];

export default function ReadinessCheckCard() {
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [todayScore, setTodayScore] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>(''); // Phase 3: User notes for injury detection
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [detectedInjury, setDetectedInjury] = useState<InjuryDetectionResult | null>(null);

  useEffect(() => {
    loadTodayScore();
  }, [user]);

  const loadTodayScore = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const score = await readinessService.getTodayReadinessScore(user.id);
      if (score) {
        setTodayScore(score.score);
        if (score.emoji) {
          setSelectedEmoji(score.emoji as EmojiOption);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load today\'s readiness score:', error);
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = async (emoji: EmojiOption) => {
    if (!user || isSaving) return;

    try {
      setIsSaving(true);
      setSelectedEmoji(emoji);

      const input: SimpleReadinessInput = { emoji };
      const scoreData = readinessService.calculateSimpleReadiness(input);

      // Phase 3: Add notes to scoreData if provided
      const scoreDataWithNotes = { ...scoreData, notes: notes.trim() || undefined };

      // Phase 3: Check for injury keywords if notes provided
      if (notes.trim()) {
        const injuryResult = InjuryDetectionService.analyzeNotes(notes);
        if (injuryResult.injuryDetected && injuryResult.confidence >= 0.6) {
          setDetectedInjury(injuryResult);
          setShowInjuryModal(true);
        }
      }

      await readinessService.saveReadinessScore(user.id, scoreDataWithNotes);
      setTodayScore(scoreData.score);

      console.log(`✅ Readiness score saved: ${scoreData.score}`);
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save readiness score:', error);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <ActivityIndicator size="small" color={isDark ? '#4A9B6F' : '#2C5F3D'} />
      </View>
    );
  }

  return (
    <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          How are you feeling today?
        </Text>
        {todayScore !== null && (
          <View className="flex-row items-center">
            <CheckCircle color={isDark ? '#4A9B6F' : '#2C5F3D'} size={16} />
            <Text className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {todayScore}%
            </Text>
          </View>
        )}
      </View>

      {/* Emoji Selection */}
      <View className="flex-row justify-between">
        {emojiChoices.map((choice) => {
          const isSelected = selectedEmoji === choice.emoji;

          return (
            <Pressable
              key={choice.emoji}
              className={`flex-1 items-center p-3 rounded-xl mx-1 ${
                isSelected
                  ? isDark
                    ? 'bg-primaryDark'
                    : 'bg-primary-500'
                  : isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-100'
              }`}
              onPress={() => handleEmojiSelect(choice.emoji)}
              disabled={isSaving}
              accessibilityLabel={`${choice.label} - ${choice.description}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text className="text-3xl mb-1">{choice.emoji}</Text>
              <Text
                className={`text-xs font-bold ${
                  isSelected ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {choice.label}
              </Text>
              <Text
                className={`text-xs text-center mt-1 ${
                  isSelected ? 'text-white opacity-90' : isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {choice.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Phase 3: Notes Input for Injury Detection */}
      <View className="mt-4">
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
          We'll check for potential injuries and suggest modifications if needed
        </Text>
      </View>

      {/* Upgrade hint for Premium features */}
      {todayScore !== null && (
        <Text className={`text-xs text-center mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Upgrade to Premium for AI-powered injury analysis
        </Text>
      )}

      {/* Injury Detection Modal */}
      {showInjuryModal && detectedInjury && (
        <InjuryDetectionModal
          visible={showInjuryModal}
          onClose={() => setShowInjuryModal(false)}
          injuryResult={detectedInjury}
          onLogInjury={async () => {
            // TODO: Implement injury logging
            console.log('Log injury:', detectedInjury);
            setShowInjuryModal(false);
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

