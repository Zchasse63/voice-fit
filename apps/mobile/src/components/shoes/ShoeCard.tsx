import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Trash2, ChevronRight } from 'lucide-react-native';
import { useColors } from '../../hooks/useColors';
import { useTokens } from '../../hooks/useTokens';
import { supabase } from '../../services/database/supabase';

interface ShoeCardProps {
  shoe: {
    id: string;
    brand: string;
    model: string;
    purchase_date: string;
    total_mileage: number;
    replacement_threshold: number;
    is_active: boolean;
  };
  onDelete: () => void;
  onRefresh: () => void;
}

export default function ShoeCard({ shoe, onDelete, onRefresh }: ShoeCardProps) {
  const colors = useColors();
  const tokens = useTokens();
  const [mileageData, setMileageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMileageData();
  }, [shoe.id]);

  const loadMileageData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('runs')
        .select('distance')
        .eq('shoe_id', shoe.id);

      if (error) throw error;

      const totalMiles = (data || []).reduce((sum, run) => sum + (run.distance / 1609.34), 0);
      const remaining = shoe.replacement_threshold - totalMiles;
      const percentage = (totalMiles / shoe.replacement_threshold) * 100;

      setMileageData({
        totalMiles: Math.round(totalMiles * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentage: Math.round(percentage),
      });
    } catch (error) {
      console.error('Error loading mileage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!mileageData) return colors.accent.blue;
    if (mileageData.percentage >= 90) return colors.accent.red;
    if (mileageData.percentage >= 70) return colors.accent.orange;
    return colors.accent.green;
  };

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.md,
        borderWidth: 1,
        borderColor: colors.border.subtle,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: tokens.spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text.primary,
            }}
          >
            {shoe.brand} {shoe.model}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.text.secondary,
              marginTop: 4,
            }}
          >
            Purchased: {new Date(shoe.purchase_date).toLocaleDateString()}
          </Text>
        </View>
        <Pressable onPress={onDelete}>
          <Trash2 color={colors.accent.red} size={20} />
        </Pressable>
      </View>

      {/* Mileage Progress */}
      {loading ? (
        <ActivityIndicator color={colors.accent.blue} size="small" />
      ) : mileageData ? (
        <View style={{ gap: tokens.spacing.sm }}>
          {/* Progress Bar */}
          <View
            style={{
              height: 8,
              backgroundColor: colors.background.primary,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${Math.min(mileageData.percentage, 100)}%`,
                backgroundColor: getStatusColor(),
              }}
            />
          </View>

          {/* Stats */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.text.secondary,
              }}
            >
              {mileageData.totalMiles} / {shoe.replacement_threshold} mi
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: getStatusColor(),
              }}
            >
              {mileageData.percentage}%
            </Text>
          </View>

          {/* Remaining */}
          <Text
            style={{
              fontSize: 12,
              color: colors.text.secondary,
            }}
          >
            {mileageData.remaining} mi remaining
          </Text>
        </View>
      ) : null}
    </View>
  );
}

