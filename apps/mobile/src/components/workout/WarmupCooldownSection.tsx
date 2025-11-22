import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';

interface Exercise {
  name: string;
  duration_seconds?: number;
  sets?: number;
  reps?: number | null;
  notes?: string;
}

interface Phase {
  phase_name: string;
  duration_min: number;
  movements: Exercise[];
}

interface WarmupCooldownData {
  template_name: string;
  total_duration_min: number;
  phases: Phase[];
}

interface WarmupCooldownSectionProps {
  type: 'warmup' | 'cooldown';
  data: WarmupCooldownData;
  onStartTimer?: () => void;
}

export const WarmupCooldownSection: React.FC<WarmupCooldownSectionProps> = ({
  type,
  data,
  onStartTimer,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const [isExpanded, setIsExpanded] = useState(false);

  const title = type === 'warmup' ? '🔥 Warmup' : '🧘 Cooldown';
  const bgColor = type === 'warmup' ? colors.accent.orange : colors.accent.blue;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={[styles.header, { borderBottomColor: colors.border.primary }]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
          <Text style={[styles.duration, { color: colors.text.secondary }]}>
            {data.total_duration_min} min
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.text.secondary }]}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Template Name */}
          <Text style={[styles.templateName, { color: colors.text.secondary }]}>
            {data.template_name}
          </Text>

          {/* Phases */}
          {data.phases.map((phase, phaseIndex) => (
            <View key={phaseIndex} style={styles.phase}>
              <View style={styles.phaseHeader}>
                <Text style={[styles.phaseName, { color: colors.text.primary }]}>
                  {phase.phase_name}
                </Text>
                <Text style={[styles.phaseDuration, { color: colors.text.secondary }]}>
                  {phase.duration_min} min
                </Text>
              </View>

              {/* Movements */}
              {phase.movements.map((movement, movementIndex) => (
                <View
                  key={movementIndex}
                  style={[styles.movement, { backgroundColor: colors.background.primary }]}
                >
                  <Text style={[styles.movementName, { color: colors.text.primary }]}>
                    {movement.name}
                  </Text>

                  <View style={styles.movementDetails}>
                    {movement.duration_seconds && (
                      <Text style={[styles.detail, { color: colors.text.secondary }]}>
                        {movement.duration_seconds}s
                      </Text>
                    )}
                    {movement.sets && (
                      <Text style={[styles.detail, { color: colors.text.secondary }]}>
                        {movement.sets} sets
                      </Text>
                    )}
                    {movement.reps && (
                      <Text style={[styles.detail, { color: colors.text.secondary }]}>
                        {movement.reps} reps
                      </Text>
                    )}
                  </View>

                  {movement.notes && (
                    <Text style={[styles.notes, { color: colors.text.tertiary }]}>
                      {movement.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}

          {/* Start Timer Button */}
          {onStartTimer && (
            <Pressable
              onPress={onStartTimer}
              style={[styles.timerButton, { backgroundColor: bgColor }]}
            >
              <Text style={styles.timerButtonText}>
                ▶ Start {type === 'warmup' ? 'Warmup' : 'Cooldown'} Timer
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  duration: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  templateName: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  phase: {
    marginBottom: 16,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  phaseDuration: {
    fontSize: 14,
  },
  movement: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  movementName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  movementDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
  },
  notes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  timerButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  timerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

