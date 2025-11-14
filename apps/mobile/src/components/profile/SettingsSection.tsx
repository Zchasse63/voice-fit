/**
 * SettingsSection Component
 *
 * Reusable settings section component with grouped items.
 * Used in ProfileScreen for organizing settings into categories.
 */

import React from "react";
import { View, Text, Pressable, StyleSheet, Switch } from "react-native";
import { ChevronRight } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

export interface SettingItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action?: () => void;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  badge?: string;
}

interface SettingsSectionProps {
  title: string;
  items: SettingItem[];
}

export default function SettingsSection({
  title,
  items,
}: SettingsSectionProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  const renderSectionHeader = () => (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          styles.sectionTitle,
          {
            fontSize: tokens.typography.fontSize.xs,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: colors.text.tertiary,
            letterSpacing: 0.5,
          },
        ]}
      >
        {title.toUpperCase()}
      </Text>
    </View>
  );

  const renderSettingItem = (item: SettingItem, isLast: boolean) => {
    return (
      <Pressable
        key={item.id}
        onPress={item.action}
        disabled={!item.action && !item.hasToggle}
        style={({ pressed }) => [
          styles.itemContainer,
          {
            backgroundColor: pressed ? colors.state.pressed : "transparent",
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: colors.border.light,
          },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>{item.icon}</View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.label,
              {
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.medium,
                color: colors.text.primary,
              },
            ]}
          >
            {item.label}
          </Text>
          {item.description && (
            <Text
              style={[
                styles.description,
                {
                  fontSize: tokens.typography.fontSize.sm,
                  color: colors.text.tertiary,
                  marginTop: tokens.spacing.xs,
                },
              ]}
            >
              {item.description}
            </Text>
          )}
        </View>

        {/* Right Side (Toggle, Badge, or Chevron) */}
        {item.hasToggle ? (
          <Switch
            value={item.toggleValue}
            onValueChange={item.onToggleChange}
            trackColor={{
              false: colors.state.hover,
              true: colors.accent.blue + "50",
            }}
            thumbColor={item.toggleValue ? colors.accent.blue : "#FFFFFF"}
          />
        ) : (
          <View style={styles.rightContainer}>
            {item.badge && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: colors.accent.green + "20",
                    marginRight: tokens.spacing.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      fontSize: tokens.typography.fontSize.xs,
                      color: colors.accent.green,
                    },
                  ]}
                >
                  {item.badge}
                </Text>
              </View>
            )}
            {item.action && (
              <ChevronRight color={colors.text.tertiary} size={20} />
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {renderSectionHeader()}
      <View
        style={[
          styles.itemsContainer,
          {
            backgroundColor: colors.background.secondary,
            borderRadius: tokens.borderRadius.md,
          },
        ]}
      >
        {items.map((item, index) =>
          renderSettingItem(item, index === items.length - 1)
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.sm,
  },
  sectionTitle: {
    // Dynamic styles applied inline
  },
  itemsContainer: {
    marginHorizontal: tokens.spacing.lg,
    overflow: "hidden",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
  },
  iconContainer: {
    marginRight: tokens.spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  label: {
    // Dynamic styles applied inline
  },
  description: {
    // Dynamic styles applied inline
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.full,
  },
  badgeText: {
    fontWeight: tokens.typography.fontWeight.semibold,
  },
});
