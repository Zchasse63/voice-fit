/**
 * ReadinessCheckCard Component
 * 
 * Daily readiness check with emoji selection (Free tier).
 * Displays on Home screen for quick daily assessment.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth.store';
import { readinessService, SimpleReadinessInput, calculateReadinessTrend } from '../../services/readiness/ReadinessService';
import { InjuryDetectionService, InjuryDetectionResult } from '../../services/injury/InjuryDetectionService';
import { InjuryLoggingService } from '../../services/injury/InjuryLoggingService';
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
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const accentColors = colors.accent;
  const user = useAuthStore((state) => state.user);
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [todayScore, setTodayScore] = useState<number | null>(null);
  const [trendAverage, setTrendAverage] = useState<number | null>(null);
  const [trendDirection, setTrendDirection] = useState<'improving' | 'declining' | 'stable' | null>(null);
  const [trendChange, setTrendChange] = useState<number | null>(null);
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

      const [today, recentScores] = await Promise.all([
        readinessService.getTodayReadinessScore(user.id),
        readinessService.getRecentReadinessScores(user.id, 7),
      ]);

      if (today) {
        setTodayScore(today.score);
        if (today.emoji) {
          setSelectedEmoji(today.emoji as EmojiOption);
        }
      }

      if (recentScores && recentScores.length > 0) {
        const trend = calculateReadinessTrend(
          recentScores.map((score) => ({ date: score.date, score: score.score })),
        );

        if (trend) {
          setTrendAverage(trend.averageScore);
          setTrendDirection(trend.direction);
          setTrendChange(trend.change);
        } else {
          setTrendAverage(null);
          setTrendDirection(null);
          setTrendChange(null);
        }
      } else {
        setTrendAverage(null);
        setTrendDirection(null);
        setTrendChange(null);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load today's readiness score:", error);
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
      <View
        style={{
          padding: tokens.spacing.md,
          borderRadius: tokens.borderRadius.lg,
          marginBottom: tokens.spacing.md,
          backgroundColor: colors.background.secondary,
        }}
      >
        <ActivityIndicator size="small" color={accentColors.green} />
      </View>
    );
  }

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.borderRadius.lg,
        marginBottom: tokens.spacing.md,
        backgroundColor: colors.background.secondary,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: tokens.spacing.sm,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          How are you feeling today?
        </Text>
        {todayScore !== null && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CheckCircle color={accentColors.green} size={16} />
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                marginLeft: tokens.spacing.xs,
                color: colors.text.secondary,
              }}
            >
              {todayScore}%
            </Text>
          </View>
        )}
      </View>

      {/* Free-tier on-device readiness trend summary */}
      {trendAverage !== null && trendDirection && (
        <View style={{ marginBottom: tokens.spacing.sm }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Last 7 days: {trendAverage}% ·
            {trendDirection === 'improving' && ' Trending up'}
            {trendDirection === 'declining' && ' Trending down'}
            {trendDirection === 'stable' && ' Stable'}
            {trendChange !== null && Math.abs(trendChange) >= 1 && ` (${trendChange > 0 ? '+' : ''}${trendChange} pts)`}
          </Text>
        </View>
      )}

      {/* Emoji Selection */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {emojiChoices.map((choice) => {
          const isSelected = selectedEmoji === choice.emoji;

          return (
            <Pressable
              key={choice.emoji}
              style={{
                flex: 1,
                alignItems: 'center',
                padding: tokens.spacing.sm,
                borderRadius: tokens.borderRadius.lg,
                marginHorizontal: tokens.spacing.xs,
                backgroundColor: isSelected
                  ? accentColors.green
                  : colors.background.tertiary,
                opacity: isSaving ? 0.7 : 1,
              }}
              onPress={() => handleEmojiSelect(choice.emoji)}
              disabled={isSaving}
              accessibilityLabel={`${choice.label} - ${choice.description}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize['3xl'],
                  marginBottom: tokens.spacing.xs,
                  color: isSelected ? tokens.colors.light.text.primary : colors.text.primary,
                }}
              >
                {choice.emoji}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: isSelected ? tokens.colors.light.text.primary : colors.text.primary,
                }}
              >
                {choice.label}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  textAlign: 'center',
                  marginTop: tokens.spacing.xs,
                  color: isSelected ? tokens.colors.light.text.primary : colors.text.secondary,
                  opacity: isSelected ? 0.9 : 1,
                }}
              >
                {choice.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Phase 3: Notes Input for Injury Detection */}
      <View style={{ marginTop: tokens.spacing.md }}>
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
          We'll check for potential injuries and suggest modifications if needed
        </Text>
      </View>

      {/* Upgrade hint for Premium features */}
      {todayScore !== null && (
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            textAlign: 'center',
            marginTop: tokens.spacing.sm,
            color: colors.text.tertiary,
          }}
        >
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
              console.error('Failed to log injury from readiness card:', error);
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

