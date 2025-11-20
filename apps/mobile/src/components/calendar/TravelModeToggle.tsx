/**
 * TravelModeToggle
 * 
 * Toggle component for enabling/disabling travel mode in the calendar.
 * When enabled, allows users to mark periods as unavailable for training.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Plane, X, Calendar as CalendarIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CalendarService from '../../services/calendar/CalendarService';
import { useAuthStore } from '../../store/auth.store';

interface TravelModeToggleProps {
  onAvailabilityCreated?: () => void;
}

export default function TravelModeToggle({ onAvailabilityCreated }: TravelModeToggleProps) {
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [availabilityType, setAvailabilityType] = useState<'travel' | 'vacation' | 'injury' | 'other'>('travel');
  const [notes, setNotes] = useState('');

  const calendarService = new CalendarService();

  const handleCreateAvailability = async () => {
    if (!user?.id) return;

    if (endDate < startDate) {
      Alert.alert('Invalid Dates', 'End date must be after start date');
      return;
    }

    try {
      await calendarService.createAvailabilityWindow(
        user.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        availabilityType,
        notes || undefined
      );

      Alert.alert('Success', 'Availability window created successfully');
      setShowModal(false);
      setNotes('');
      onAvailabilityCreated?.();
    } catch (error) {
      console.error('Failed to create availability window:', error);
      Alert.alert('Error', 'Failed to create availability window');
    }
  };

  const availabilityTypes = [
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'vacation', label: 'Vacation', icon: '🏖️' },
    { value: 'injury', label: 'Injury', icon: '🤕' },
    { value: 'other', label: 'Other', icon: '📅' },
  ] as const;

  return (
    <>
      <Pressable
        onPress={() => setShowModal(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: tokens.spacing.md,
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.md,
          gap: tokens.spacing.sm,
        }}
      >
        <Plane color={colors.accent.blue} size={20} />
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Mark Unavailable
        </Text>
      </Pressable>

      <Modal visible={showModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.background.primary,
              borderTopLeftRadius: tokens.borderRadius.xl,
              borderTopRightRadius: tokens.borderRadius.xl,
              padding: tokens.spacing.xl,
              maxHeight: '80%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: tokens.spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                Mark Unavailable
              </Text>
              <Pressable onPress={() => setShowModal(false)} hitSlop={8}>
                <X color={colors.text.secondary} size={24} />
              </Pressable>
            </View>

            {/* Type Selection */}
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.secondary,
                marginBottom: tokens.spacing.sm,
              }}
            >
              Reason
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: tokens.spacing.sm,
                marginBottom: tokens.spacing.lg,
              }}
            >
              {availabilityTypes.map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => setAvailabilityType(type.value)}
                  style={{
                    flex: 1,
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.md,
                    backgroundColor:
                      availabilityType === type.value
                        ? colors.accent.blue
                        : colors.background.secondary,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{type.icon}</Text>
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color:
                        availabilityType === type.value
                          ? '#FFFFFF'
                          : colors.text.primary,
                    }}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Date Range */}
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.secondary,
                marginBottom: tokens.spacing.sm,
              }}
            >
              Date Range
            </Text>
            <View style={{ flexDirection: 'row', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
              <Pressable
                onPress={() => setShowStartPicker(true)}
                style={{
                  flex: 1,
                  padding: tokens.spacing.md,
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                }}
              >
                <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                  Start Date
                </Text>
                <Text style={{ fontSize: tokens.typography.fontSize.md, color: colors.text.primary, marginTop: 4 }}>
                  {startDate.toLocaleDateString()}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowEndPicker(true)}
                style={{
                  flex: 1,
                  padding: tokens.spacing.md,
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                }}
              >
                <Text style={{ fontSize: tokens.typography.fontSize.xs, color: colors.text.tertiary }}>
                  End Date
                </Text>
                <Text style={{ fontSize: tokens.typography.fontSize.md, color: colors.text.primary, marginTop: 4 }}>
                  {endDate.toLocaleDateString()}
                </Text>
              </Pressable>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: tokens.spacing.md }}>
              <Pressable
                onPress={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: tokens.spacing.md,
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.md,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCreateAvailability}
                style={{
                  flex: 1,
                  padding: tokens.spacing.md,
                  backgroundColor: colors.accent.blue,
                  borderRadius: tokens.borderRadius.md,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.md,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: '#FFFFFF',
                  }}
                >
                  Save
                </Text>
              </Pressable>
            </View>

            {/* Date Pickers */}
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

