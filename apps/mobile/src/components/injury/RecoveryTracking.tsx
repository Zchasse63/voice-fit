/**
 * RecoveryTracking Component
 *
 * Displays recovery progress for active injuries with weekly check-ins
 * Shows timeline, progress indicators, and recovery recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { InjuryLoggingService } from '../../services/injury/InjuryLoggingService';
import { RecoveryCheckInService, RecoveryProgressResult } from '../../services/injury/RecoveryCheckInService';
import RecoveryCheckInModal, { CheckInData } from './RecoveryCheckInModal';
import InjuryLog from '../../services/database/watermelon/models/InjuryLog';

interface RecoveryCheckIn {
  id: string;
  injury_id: string;
  check_in_date: Date;
  pain_level: number;
  mobility_level: number;
  notes?: string;
}

type ActiveInjury = InjuryLog;

interface RecoveryTrackingProps {
  onClose?: () => void;
}

export default function RecoveryTracking({ onClose }: RecoveryTrackingProps) {
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const mode = isDark ? 'dark' : 'light';
  const colors = tokens.colors[mode];

  const [loading, setLoading] = useState(true);
  const [injuries, setInjuries] = useState<ActiveInjury[]>([]);
  const [selectedInjury, setSelectedInjury] = useState<ActiveInjury | null>(null);
  const [isCheckInModalVisible, setIsCheckInModalVisible] = useState(false);
  const [checkInResult, setCheckInResult] = useState<RecoveryProgressResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadActiveInjuries();
    } else {
      setInjuries([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadActiveInjuries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const activeInjuries = await InjuryLoggingService.getActiveInjuries(user.id);
      setInjuries(activeInjuries);
    } catch (err) {
      console.error('Error loading injuries:', err);
      setError('We had trouble loading your injuries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheckIn = (injury: ActiveInjury) => {
    setSelectedInjury(injury);
    setCheckInResult(null);
    setIsCheckInModalVisible(true);
  };

  const handleMarkResolved = async (injury: ActiveInjury) => {
    try {
      await InjuryLoggingService.resolveInjury(injury.id);
      await loadActiveInjuries();
    } catch (err) {
      console.error('Error resolving injury:', err);
      setError('Unable to mark this injury as resolved.');
    }
  };

  const handleSubmitCheckIn = async (checkInData: CheckInData) => {
    if (!selectedInjury) return;

    try {
      const result = await RecoveryCheckInService.processCheckIn(selectedInjury.id, {
        painLevel: checkInData.painLevel,
        romQuality: checkInData.romQuality,
        activityTolerance: checkInData.activityTolerance,
        newSymptoms: checkInData.newSymptoms,
      });
      setCheckInResult(result);
      await loadActiveInjuries();
    } catch (err) {
      console.error('Error processing recovery check-in:', err);
      setError('We could not save your check-in. Please try again.');
      throw err;
    }
  };

  const formatBodyPart = (bodyPart: string) =>
    bodyPart
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return colors.accent.red;
      case 'moderate':
        return colors.accent.orange;
      default:
        return colors.accent.green;
    }
  };

  const renderContent = () => {
    if (!user) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            Sign in to track injuries
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Create an account or log in to start logging injuries and monitoring recovery progress.
          </Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent.blue} />
        </View>
      );
    }

    if (injuries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No active injuries
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Log an injury from your readiness check-in or workout to see recovery tracking here.
          </Text>
        </View>
      );
    }

    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {injuries.map((injury) => {
          const reportedAt = injury.reportedAt;
          const daysInRecovery = Math.max(
            0,
            Math.floor((now - new Date(reportedAt).getTime()) / msPerDay)
          );
          const lastCheckInBaseline = injury.lastCheckInAt || reportedAt;
          const daysSinceCheckIn = Math.floor(
            (now - new Date(lastCheckInBaseline).getTime()) / msPerDay
          );
          const needsCheckIn =
            injury.status !== 'resolved' && daysSinceCheckIn >= 7;

          return (
            <View
              key={injury.id}
              style={[
                styles.injuryCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                },
              ]}
            >
              <View style={styles.injuryHeaderRow}>
                <View>
                  <Text
                    style={[
                      styles.injuryBodyPart,
                      { color: colors.text.primary },
                    ]}
                  >
                    {formatBodyPart(injury.bodyPart)}
                  </Text>
                  <Text
                    style={[
                      styles.injuryMeta,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Day {daysInRecovery} • Status: {injury.status}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.injurySeverity,
                    { color: getSeverityColor(injury.severity) },
                  ]}
                >
                  {injury.severity.toUpperCase()}
                </Text>
              </View>

              {injury.description ? (
                <Text
                  style={[
                    styles.injuryDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  {injury.description}
                </Text>
              ) : null}

              <Text
                style={[
                  styles.injuryMeta,
                  { color: colors.text.tertiary },
                ]}
              >
                Last check-in:{' '}
                {injury.lastCheckInAt
                  ? `${daysSinceCheckIn} day${daysSinceCheckIn === 1 ? '' : 's'} ago`
                  : 'No check-ins yet'}
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.accent.blue },
                  ]}
                  onPress={() => handleStartCheckIn(injury)}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: colors.chat.userText },
                    ]}
                  >
                    Weekly check-in
                  </Text>
                </TouchableOpacity>

                {injury.status !== 'resolved' && (
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      { borderColor: colors.border.light },
                    ]}
                    onPress={() => handleMarkResolved(injury)}
                  >
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Mark resolved
                    </Text>
                  </TouchableOpacity>
                )}

                {needsCheckIn && (
                  <Text
                    style={[
                      styles.needsCheckInBadge,
                      { color: colors.accent.orange },
                    ]}
                  >
                    Check-in due
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text.primary },
          ]}
        >
          Injury Recovery
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            { color: colors.text.secondary },
          ]}
        >
          Track active injuries and complete weekly check-ins.
        </Text>
      </View>

      {renderContent()}

      {error && (
        <Text
          style={[
            styles.errorText,
            { color: colors.accent.red },
          ]}
        >
          {error}
        </Text>
      )}

      {checkInResult && (
        <View
          style={[
            styles.resultCard,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.light,
            },
          ]}
        >
          <Text
            style={[
              styles.resultTitle,
              { color: colors.text.primary },
            ]}
          >
            Latest recovery update
          </Text>
          <Text
            style={[
              styles.resultText,
              { color: colors.text.secondary },
            ]}
          >
            Status: {checkInResult.status} • Progress:{' '}
            {Math.round(checkInResult.progressScore * 100)}%
          </Text>
          <Text
            style={[
              styles.resultText,
              { color: colors.text.secondary },
            ]}
          >
            {checkInResult.recommendation}
          </Text>
          {checkInResult.requiresMedicalAttention && (
            <Text
              style={[
                styles.resultText,
                { color: colors.accent.red, marginTop: 4 },
              ]}
            >
              Based on your check-in, consider consulting a healthcare provider if symptoms persist or worsen.
            </Text>
          )}
        </View>
      )}

      <RecoveryCheckInModal
        visible={isCheckInModalVisible && !!selectedInjury}
        onClose={() => {
          setIsCheckInModalVisible(false);
          setSelectedInjury(null);
        }}
        injury={selectedInjury}
        onSubmit={handleSubmitCheckIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  injuryCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  injuryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  injuryBodyPart: {
    fontSize: 16,
    fontWeight: '600',
  },
  injurySeverity: {
    fontSize: 12,
    fontWeight: '600',
  },
  injuryMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  injuryDescription: {
    fontSize: 13,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginLeft: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  needsCheckInBadge: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  resultCard: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 13,
    marginTop: 2,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
  },
});