import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type {
  EnhancedSwapResponse,
  ExerciseSubstitute,
  ContextBadge,
} from '../../services/exercise/EnhancedExerciseSwapService';

interface EnhancedExerciseSwapCardProps {
  response: EnhancedSwapResponse;
  onSubstituteSelect: (substitute: ExerciseSubstitute) => void;
  contextBadges: ContextBadge[];
  showDebugInfo?: boolean;
}



export const EnhancedExerciseSwapCard: React.FC<EnhancedExerciseSwapCardProps> = ({
  response,
  onSubstituteSelect,
  contextBadges,
  showDebugInfo = false,
}) => {
  const [showAIReasoning, setShowAIReasoning] = useState(false);
  const [expandedSubstitute, setExpandedSubstitute] = useState<string | null>(null);

  const getBadgeColor = (type: ContextBadge['type']): string => {
    switch (type) {
      case 'injury':
        return '#FF6B6B';
      case 'equipment':
        return '#4ECDC4';
      case 'program':
        return '#95E1D3';
      case 'preference':
        return '#FFD93D';
      case 'ai_ranked':
        return '#A78BFA';
      default:
        return '#6B7280';
    }
  };

  const getBadgeIcon = (type: ContextBadge['type']): string => {
    switch (type) {
      case 'injury':
        return '🩹';
      case 'equipment':
        return '🏋️';
      case 'program':
        return '📋';
      case 'preference':
        return '⭐';
      case 'ai_ranked':
        return '🤖';
      default:
        return '•';
    }
  };

  const getDifficultyColor = (difficulty?: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return '#10B981';
      case 'intermediate':
        return '#F59E0B';
      case 'advanced':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Substitutes for <Text style={styles.exerciseName}>{response.original_exercise}</Text>
        </Text>
      </View>

      {/* Context Badges */}
      {contextBadges.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.badgesContainer}
          contentContainerStyle={styles.badgesContent}
        >
          {contextBadges.map((badge, index) => (
            <View
              key={`${badge.type}-${index}`}
              style={[styles.badge, { backgroundColor: getBadgeColor(badge.type) }]}
            >
              <Text style={styles.badgeIcon}>{getBadgeIcon(badge.type)}</Text>
              <Text style={styles.badgeText}>{badge.label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* AI Reasoning (if available) */}
      {response.reasoning && response.metadata.ai_reranked && (
        <View style={styles.reasoningContainer}>
          <TouchableOpacity
            style={styles.reasoningHeader}
            onPress={() => setShowAIReasoning(!showAIReasoning)}
            activeOpacity={0.7}
          >
            <Text style={styles.reasoningTitle}>
              🤖 AI Reasoning {showAIReasoning ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          {showAIReasoning && (
            <View style={styles.reasoningContent}>
              <Text style={styles.reasoningText}>{response.reasoning}</Text>
            </View>
          )}
        </View>
      )}

      {/* Substitutes List */}
      <View style={styles.substitutesContainer}>
        <Text style={styles.sectionTitle}>
          {response.substitutes.length} Substitute{response.substitutes.length !== 1 ? 's' : ''}
        </Text>

        {response.substitutes.map((substitute, index) => (
          <TouchableOpacity
            key={`${substitute.exercise}-${index}`}
            style={styles.substituteCard}
            onPress={() => onSubstituteSelect(substitute)}
            activeOpacity={0.8}
          >
            <View style={styles.substituteHeader}>
              <View style={styles.substituteInfo}>
                <Text style={styles.substituteName}>{substitute.exercise}</Text>
                <View style={styles.substituteMetaRow}>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Match:</Text>
                    <Text style={styles.scoreValue}>
                      {Math.round(substitute.similarity_score * 100)}%
                    </Text>
                  </View>
                  {substitute.difficulty && (
                    <View
                      style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(substitute.difficulty) },
                      ]}
                    >
                      <Text style={styles.difficultyText}>{substitute.difficulty}</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setExpandedSubstitute(
                    expandedSubstitute === substitute.exercise ? null : substitute.exercise
                  )
                }
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.expandIcon}>
                  {expandedSubstitute === substitute.exercise ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Expanded Details */}
            {expandedSubstitute === substitute.exercise && (
              <View style={styles.expandedContent}>
                <Text style={styles.reasoning}>{substitute.reasoning}</Text>

                {substitute.muscle_groups.length > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>💪 Muscles:</Text>
                    <Text style={styles.detailValue}>
                      {substitute.muscle_groups.join(', ')}
                    </Text>
                  </View>
                )}

                {substitute.equipment.length > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🏋️ Equipment:</Text>
                    <Text style={styles.detailValue}>{substitute.equipment.join(', ')}</Text>
                  </View>
                )}

                {substitute.movement_pattern && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🔄 Pattern:</Text>
                    <Text style={styles.detailValue}>{substitute.movement_pattern}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Debug Info */}
      {showDebugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            DB Results: {response.metadata.db_results} | RAG Results:{' '}
            {response.metadata.rag_results}
          </Text>
          <Text style={styles.debugText}>
            Processing Time: {response.metadata.processing_time_ms.toFixed(2)}ms
          </Text>
          <Text style={styles.debugText}>
            AI Reranked: {response.metadata.ai_reranked ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.debugText}>
            Enhanced Swap: {response.metadata.feature_flags.enhanced_swap_enabled ? 'On' : 'Off'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  exerciseName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  badgesContainer: {
    marginBottom: 12,
    maxHeight: 40,
  },
  badgesContent: {
    paddingRight: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  badgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reasoningContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  reasoningHeader: {
    padding: 12,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  reasoningContent: {
    padding: 12,
    paddingTop: 0,
  },
  reasoningText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  substitutesContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  substituteCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  substituteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  substituteInfo: {
    flex: 1,
  },
  substituteName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  substituteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  expandIcon: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reasoning: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 6,
    minWidth: 90,
  },
  detailValue: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  debugContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  debugText: {
    fontSize: 11,
    color: '#78350F',
    marginBottom: 2,
  },
});

export default EnhancedExerciseSwapCard;
