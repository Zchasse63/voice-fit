import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { LucideIcon } from 'lucide-react-native';

interface TimelineItemProps {
  title: string;
  subtitle: string;
  time: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBackgroundColor?: string;
  onPress?: () => void;
  isLast?: boolean;
}

export default function TimelineItem({
  title,
  subtitle,
  time,
  icon: Icon,
  iconColor,
  iconBackgroundColor,
  onPress,
  isLast = false,
}: TimelineItemProps) {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  const content = (
    <View style={{ flexDirection: 'row', paddingVertical: tokens.spacing.md }}>
      {/* Timeline Icon */}
      <View style={{ alignItems: 'center', marginRight: tokens.spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: iconBackgroundColor || colors.accent.blue + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {Icon && (
            <Icon
              color={iconColor || colors.accent.blue}
              size={20}
              strokeWidth={2}
            />
          )}
        </View>
        {!isLast && (
          <View
            style={{
              width: 2,
              flex: 1,
              backgroundColor: colors.border.light,
              marginTop: tokens.spacing.xs,
            }}
          />
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: tokens.spacing.xs,
          }}
        >
          {subtitle}
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            color: colors.text.tertiary,
          }}
        >
          {time}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${subtitle}, ${time}`}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
