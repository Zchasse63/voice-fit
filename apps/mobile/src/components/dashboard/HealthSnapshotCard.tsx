import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Heart, AlertTriangle, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '../../store/auth.store';
import { supabase } from '../../services/database/supabase.client';

interface HealthSnapshot {
  id: string;
  date: string;
  recovery_score: number | null;
  ai_summary: string | null;
  ai_recommendations: string[];
  risk_flags: string[];
  data_completeness_score: number;
}

interface HealthSnapshotCardProps {
  onPress?: () => void;
}

export default function HealthSnapshotCard({ onPress }: HealthSnapshotCardProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const borderColor = isDark ? tokens.borders.primary.colorDark : tokens.borders.primary.colorLight;
  const user = useAuthStore((state) => state.user);
  
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLatestSnapshot();
  }, []);

  const loadLatestSnapshot = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('health_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setSnapshot(data);
    } catch (error) {
      console.error('Failed to load health snapshot:', error);
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecoveryColor = (score: number | null) => {
    if (!score) return colors.text.tertiary;
    if (score >= 80) return colors.accent.green;
    if (score >= 60) return colors.accent.orange;
    return colors.accent.coral;
  };

  const getRecoveryLabel = (score: number | null) => {
    if (!score) return 'No Data';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Moderate';
    return 'Low';
  };

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.lg,
          minHeight: 180,
          justifyContent: 'center',
          alignItems: 'center',
          ...tokens.shadows.sm,
          borderWidth: tokens.borders.primary.width,
          borderColor,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent.blue} />
      </View>
    );
  }

  if (!snapshot) {
    return (
      <View
        style={{
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.lg,
          minHeight: 180,
          ...tokens.shadows.sm,
          borderWidth: tokens.borders.primary.width,
          borderColor,
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
          Health Snapshot
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            lineHeight: 20,
          }}
        >
          Connect your wearable or log your first workout to see your daily health insights.
        </Text>
      </View>
    );
  }

  const recoveryScore = snapshot.recovery_score || 0;
  const recoveryColor = getRecoveryColor(recoveryScore);
  const recoveryLabel = getRecoveryLabel(recoveryScore);

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.lg,
        minHeight: 180,
        ...tokens.shadows.sm,
        borderWidth: tokens.borders.primary.width,
        borderColor,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }}>
          <Heart color={colors.accent.coral} size={20} strokeWidth={2} />
          <Text
            style={{
              fontSize: tokens.typography.fontSize.md,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Health Snapshot
          </Text>
        </View>
        <ChevronRight color={colors.text.tertiary} size={20} />
      </View>

      {/* Recovery Score */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.md }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            borderWidth: 4,
            borderColor: recoveryColor,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: tokens.spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.bold,
              color: recoveryColor,
              fontVariant: ['tabular-nums'],
            }}
          >
            {recoveryScore}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
              marginBottom: 2,
            }}
          >
            Recovery Score
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.md,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: recoveryColor,
            }}
          >
            {recoveryLabel}
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.text.tertiary,
              marginTop: 2,
            }}
          >
            {snapshot.date} • {snapshot.data_completeness_score}% complete
          </Text>
        </View>
      </View>

      {/* AI Summary */}
      {snapshot.ai_summary && (
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            lineHeight: 20,
            marginBottom: tokens.spacing.md,
          }}
          numberOfLines={2}
        >
          {snapshot.ai_summary}
        </Text>
      )}

      {/* Recommendations */}
      {snapshot.ai_recommendations && snapshot.ai_recommendations.length > 0 && (
        <View style={{ marginBottom: tokens.spacing.sm }}>
          {snapshot.ai_recommendations.slice(0, 2).map((rec, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: tokens.spacing.xs }}>
              <Text style={{ color: colors.accent.blue, marginRight: tokens.spacing.xs }}>•</Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: tokens.typography.fontSize.xs,
                  color: colors.text.secondary,
                  lineHeight: 16,
                }}
                numberOfLines={1}
              >
                {rec}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Risk Flags */}
      {snapshot.risk_flags && snapshot.risk_flags.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }}>
          <AlertTriangle color={colors.accent.orange} size={14} />
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: colors.accent.orange,
              fontWeight: tokens.typography.fontWeight.medium,
            }}
          >
            {snapshot.risk_flags.length} risk flag{snapshot.risk_flags.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
