/**
 * PreferencesScreen
 *
 * User preferences management screen with:
 * - Workout preferences (duration, days, time)
 * - Equipment selection
 * - Exercise preferences (favorites, dislikes, restrictions)
 * - Training style preferences
 * - Recovery preferences
 * - Communication preferences
 *
 * Features:
 * - Real-time save (debounced)
 * - Conversational updates badge
 * - Reset to defaults
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { ChevronLeft, RotateCcw, MessageSquare } from 'lucide-react-native';
import tokens from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/auth.store';
import { supabase } from '../services/supabase';

interface PreferencesScreenProps {
  navigation?: any;
}

interface UserPreferences {
  id?: string;
  user_id: string;
  preferred_workout_duration_min: number;
  preferred_workout_days: number[];
  preferred_workout_time: 'morning' | 'afternoon' | 'evening' | 'flexible';
  max_workouts_per_week: number;
  available_equipment: string[];
  preferred_equipment: string[];
  favorite_exercises: string[];
  disliked_exercises: string[];
  exercise_restrictions: Record<string, string>;
  preferred_rep_ranges: Record<string, number[]>;
  preferred_rest_periods: Record<string, number>;
  prefers_supersets: boolean;
  prefers_dropsets: boolean;
  preferred_deload_frequency: number;
  preferred_rest_days_per_week: number;
  dietary_restrictions: string[];
  calorie_target: number | null;
  protein_target_g: number | null;
  coaching_style: 'motivational' | 'technical' | 'balanced' | 'concise';
  feedback_frequency: 'minimal' | 'moderate' | 'frequent';
  created_at?: string;
  updated_at?: string;
}

const EQUIPMENT_OPTIONS = [
  'barbell',
  'dumbbells',
  'bench',
  'pull_up_bar',
  'squat_rack',
  'cable_machine',
  'leg_press',
  'rowing_machine',
  'treadmill',
  'bike',
  'kettlebells',
  'resistance_bands',
  'medicine_ball',
  'foam_roller',
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PreferencesScreen({ navigation }: PreferencesScreenProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const user = useAuthStore((state) => state.user);

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasConversationalUpdates, setHasConversationalUpdates] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkConversationalUpdates();
  }, []);

  const loadPreferences = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create defaults
          await createDefaultPreferences();
        } else {
          throw error;
        }
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user?.id) return;

    const defaultPrefs: Partial<UserPreferences> = {
      user_id: user.id,
      preferred_workout_duration_min: 60,
      preferred_workout_days: [1, 2, 3, 4, 5],
      preferred_workout_time: 'morning',
      max_workouts_per_week: 4,
      available_equipment: ['barbell', 'dumbbells', 'bench'],
      preferred_equipment: ['barbell'],
      favorite_exercises: [],
      disliked_exercises: [],
      exercise_restrictions: {},
      preferred_rep_ranges: {
        strength: [3, 5],
        hypertrophy: [8, 12],
        endurance: [15, 20],
      },
      preferred_rest_periods: {
        compound: 180,
        isolation: 90,
      },
      prefers_supersets: false,
      prefers_dropsets: false,
      preferred_deload_frequency: 4,
      preferred_rest_days_per_week: 3,
      dietary_restrictions: [],
      calorie_target: null,
      protein_target_g: null,
      coaching_style: 'balanced',
      feedback_frequency: 'moderate',
    };

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Failed to create default preferences:', error);
    }
  };

  const checkConversationalUpdates = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('conversational_preference_updates')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasConversationalUpdates(true);
      }
    } catch (error) {
      console.error('Failed to check conversational updates:', error);
    }
  };

  const savePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user?.id || !preferences) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('user_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, ...updates });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all preferences to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await createDefaultPreferences();
          },
        },
      ]
    );
  };

  const toggleEquipment = (equipment: string) => {
    if (!preferences) return;
    const current = preferences.available_equipment || [];
    const updated = current.includes(equipment)
      ? current.filter((e) => e !== equipment)
      : [...current, equipment];
    savePreferences({ available_equipment: updated });
  };

  const toggleDay = (dayIndex: number) => {
    if (!preferences) return;
    const current = preferences.preferred_workout_days || [];
    const updated = current.includes(dayIndex)
      ? current.filter((d) => d !== dayIndex)
      : [...current, dayIndex];
    savePreferences({ preferred_workout_days: updated });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!preferences) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text.primary, fontSize: 16 }}>
            Failed to load preferences
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        }}
      >
        <Pressable
          onPress={() => navigation?.goBack()}
          style={{ padding: 8 }}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text.primary }}>
            Preferences
          </Text>
          {hasConversationalUpdates && (
            <View
              style={{
                backgroundColor: colors.accent.blue,
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 2,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <MessageSquare size={12} color="#FFFFFF" />
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#FFFFFF' }}>
                Updated from chat
              </Text>
            </View>
          )}
        </View>

        <Pressable onPress={resetToDefaults} style={{ padding: 8 }}>
          <RotateCcw size={20} color={colors.text.tertiary} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Workout Preferences */}
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>
            Workout Preferences
          </Text>

          {/* Duration */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 8 }}>
              Preferred Duration: {preferences.preferred_workout_duration_min} minutes
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.background.secondary,
                borderRadius: 8,
                padding: 12,
                color: colors.text.primary,
                fontSize: 16,
              }}
              value={preferences.preferred_workout_duration_min.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 60;
                savePreferences({ preferred_workout_duration_min: value });
              }}
              keyboardType="number-pad"
              placeholder="60"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          {/* Training Days */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 8 }}>
              Preferred Training Days
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DAY_NAMES.map((day, index) => {
                const isSelected = preferences.preferred_workout_days.includes(index + 1);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleDay(index + 1)}
                    style={{
                      backgroundColor: isSelected ? colors.accent.blue : colors.background.secondary,
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text.primary,
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Max Workouts Per Week */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 8 }}>
              Max Workouts Per Week: {preferences.max_workouts_per_week}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.background.secondary,
                borderRadius: 8,
                padding: 12,
                color: colors.text.primary,
                fontSize: 16,
              }}
              value={preferences.max_workouts_per_week.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 4;
                savePreferences({ max_workouts_per_week: value });
              }}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        </View>

        {/* Equipment */}
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border.light }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>
            Available Equipment
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {EQUIPMENT_OPTIONS.map((equipment) => {
              const isSelected = preferences.available_equipment.includes(equipment);
              return (
                <Pressable
                  key={equipment}
                  onPress={() => toggleEquipment(equipment)}
                  style={{
                    backgroundColor: isSelected ? colors.accent.green : colors.background.secondary,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.text.primary,
                      fontSize: 14,
                      fontWeight: '500',
                    }}
                  >
                    {equipment.replace(/_/g, ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Training Style */}
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border.light }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>
            Training Style
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: colors.text.secondary }}>Supersets</Text>
            <Switch
              value={preferences.prefers_supersets}
              onValueChange={(value) => savePreferences({ prefers_supersets: value })}
              trackColor={{ false: colors.border.light, true: colors.accent.blue }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: colors.text.secondary }}>Dropsets</Text>
            <Switch
              value={preferences.prefers_dropsets}
              onValueChange={(value) => savePreferences({ prefers_dropsets: value })}
              trackColor={{ false: colors.border.light, true: colors.accent.blue }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Coaching Style */}
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border.light }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>
            Coaching Style
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['motivational', 'technical', 'balanced', 'concise'].map((style) => {
              const isSelected = preferences.coaching_style === style;
              return (
                <Pressable
                  key={style}
                  onPress={() => savePreferences({ coaching_style: style as any })}
                  style={{
                    backgroundColor: isSelected ? colors.accent.teal : colors.background.secondary,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.text.primary,
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Saving Indicator */}
        {isSaving && (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.accent.blue} />
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 4 }}>
              Saving...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

