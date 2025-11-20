import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type SportType = 'strength' | 'running' | 'cycling' | 'swimming' | 'crossfit' | 'hybrid';

interface SportOption {
  value: SportType;
  label: string;
  icon: string;
  description: string;
}

const SPORT_OPTIONS: SportOption[] = [
  {
    value: 'strength',
    label: 'Strength Training',
    icon: '💪',
    description: 'Barbell, dumbbell, powerlifting, bodybuilding',
  },
  {
    value: 'running',
    label: 'Running',
    icon: '🏃',
    description: 'Road running, trail running, marathon training',
  },
  {
    value: 'cycling',
    label: 'Cycling',
    icon: '🚴',
    description: 'Road cycling, mountain biking, indoor cycling',
  },
  {
    value: 'swimming',
    label: 'Swimming',
    icon: '🏊',
    description: 'Pool swimming, open water, triathlon',
  },
  {
    value: 'crossfit',
    label: 'CrossFit',
    icon: '🏋️',
    description: 'Mixed modal training, WODs',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    icon: '🔀',
    description: 'Combination of multiple sports',
  },
];

interface SportSelectorProps {
  selectedSport: SportType;
  onSelectSport: (sport: SportType) => void;
  disabled?: boolean;
}

export const SportSelector: React.FC<SportSelectorProps> = ({
  selectedSport,
  onSelectSport,
  disabled = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Select Sport Type
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Choose the primary focus of your training program
      </Text>

      <View style={styles.optionsContainer}>
        {SPORT_OPTIONS.map((option) => {
          const isSelected = selectedSport === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => !disabled && onSelectSport(option.value)}
              disabled={disabled}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected
                    ? colors.accent.green
                    : colors.background.secondary,
                  borderColor: isSelected ? colors.accent.green : colors.border.default,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.icon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.label,
                    { color: isSelected ? '#FFFFFF' : colors.text.primary },
                  ]}
                >
                  {option.label}
                </Text>
              </View>
              <Text
                style={[
                  styles.description,
                  { color: isSelected ? '#FFFFFF' : colors.text.secondary },
                ]}
              >
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});

