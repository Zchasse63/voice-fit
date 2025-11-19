/**
 * ProfileScreenRedesign
 *
 * Premium profile and settings screen with:
 * - Avatar with photo picker
 * - User personal info
 * - Wearables integration status
 * - Dark mode toggle
 * - Settings sections (notifications, privacy, help)
 * - Sign out with confirmation
 *
 * Inspired by MacroFactor and Apple Settings
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
  SectionList,
  SafeAreaView,
} from "react-native";
import {
  X,
  Camera,
  User,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  Watch,
  Moon,
  Sun,
  ChevronRight,
  Shield,
} from "lucide-react-native";
import tokens from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";
import { useAuthStore } from "../store/auth.store";

interface ProfileScreenRedesignProps {
  navigation?: any;
  onNavigateToWearables?: () => void;
}

export default function ProfileScreenRedesign({
  navigation,
  onNavigateToWearables,
}: ProfileScreenRedesignProps = {}) {
  const { isDark, setTheme, theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const [isLoading, setIsLoading] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Get theme colors
  const mode = isDark ? "dark" : "light";
  const colors = tokens.colors[mode];
  const bgPrimary = colors.background.primary;
  const bgSecondary = colors.background.secondary;
  const textPrimary = colors.text.primary;
  const textSecondary = colors.text.tertiary;
  const accentBlue = colors.accent.blue;
  const accentRed = colors.accent.red;
  const borderColor = colors.border.light;

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      // Navigation happens automatically via auth state change
    } catch (error) {
      Alert.alert("Error", "Failed to sign out. Please try again.");
      setIsLoading(false);
    }
  };

  const handleThemeChange = (value: string) => {
    setTheme(value as "light" | "dark" | "auto");
  };

  // Settings sections data
  const sections = [
    {
      title: "ACCOUNT",
      data: [
        {
          id: "personal-info",
          label: "Personal Information",
          description: "Name, email, preferences",
          icon: User,
          action: () => {},
        },
        {
          id: "wearables",
          label: "Wearables",
          description: "Connected devices",
          icon: Watch,
          action: onNavigateToWearables,
          badge: "⊙",
        },
      ],
    },
    {
      title: "PREFERENCES",
      data: [
        {
          id: "appearance",
          label: "Appearance",
          description: "Light, Dark, or Auto",
          icon: isDark ? Moon : Sun,
          hasToggle: true,
        },
        {
          id: "notifications",
          label: "Notifications",
          description: "Manage alerts",
          icon: Bell,
          action: () => {},
        },
      ],
    },
    {
      title: "SUPPORT",
      data: [
        {
          id: "privacy",
          label: "Privacy Policy",
          description: "Our privacy practices",
          icon: Shield,
          action: () => {},
        },
        {
          id: "help",
          label: "Help & Support",
          description: "FAQ and support",
          icon: HelpCircle,
          action: () => {},
        },
      ],
    },
  ];

  const renderSectionHeader = (title: string) => (
    <View
      style={{
        paddingHorizontal: tokens.spacing.lg,
        paddingTop: tokens.spacing.lg,
        paddingBottom: tokens.spacing.sm,
      }}
    >
      <Text
        style={{
          fontSize: tokens.typography.fontSize.xs,
          fontWeight: tokens.typography.fontWeight.semibold,
          color: textSecondary,
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
    </View>
  );

  const renderSettingItem = (item: any, isLast: boolean) => {
    const IconComponent = item.icon;

    return (
      <Pressable
        key={item.id}
        onPress={item.action}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.state.pressed : bgSecondary,
        })}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: tokens.spacing.lg,
            paddingVertical: tokens.spacing.md,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: borderColor,
          }}
        >
          <IconComponent
            color={accentBlue}
            size={24}
            style={{ marginRight: tokens.spacing.md }}
          />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.medium,
                color: textPrimary,
                marginBottom: tokens.spacing.xs,
              }}
            >
              {item.label}
            </Text>
            {item.description && (
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: textSecondary,
                }}
              >
                {item.description}
              </Text>
            )}
          </View>

          {item.hasToggle ? (
            <Switch
              value={isDark}
              onValueChange={(value) => {
                handleThemeChange(value ? "dark" : "light");
              }}
              trackColor={{
                false: colors.state.hover,
                true: accentBlue + "50",
              }}
              thumbColor={isDark ? accentBlue : "#ffffff"}
            />
          ) : (
            <>
              {item.badge && (
                <View
                  style={{
                    fontSize: tokens.typography.fontSize.lg,
                    marginRight: tokens.spacing.sm,
                  }}
                >
                  <Text style={{ color: colors.accent.green }}>
                    {item.badge}
                  </Text>
                </View>
              )}
              <ChevronRight color={textSecondary} size={20} />
            </>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgPrimary }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: textPrimary,
          }}
        >
          Profile
        </Text>
        <Pressable
          onPress={() => navigation?.goBack()}
          style={({ pressed }) => ({
            padding: tokens.spacing.sm,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <X color={textPrimary} size={24} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tokens.spacing.lg }}
      >
        {/* Avatar Section */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: tokens.spacing.xl,
            paddingHorizontal: tokens.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          }}
        >
          <View
            style={{
              position: "relative",
              marginBottom: tokens.spacing.md,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: accentBlue,
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: "#FFFFFF",
                }}
              >
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "?"}
              </Text>
            </View>

            {/* Camera Button */}
            <Pressable
              style={({ pressed }) => ({
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: accentBlue,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: bgPrimary,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Camera color="#FFFFFF" size={16} />
            </Pressable>
          </View>

          {/* User Info */}
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: textPrimary,
              marginBottom: tokens.spacing.xs,
            }}
          >
            {user?.name || "User"}
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: textSecondary,
            }}
          >
            {user?.email}
          </Text>
          {user?.authProvider && (
            <View
              style={{
                marginTop: tokens.spacing.sm,
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: tokens.spacing.xs,
                backgroundColor: colors.state.hover,
                borderRadius: tokens.borderRadius.full,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: textSecondary,
                  textTransform: "capitalize",
                }}
              >
                Signed in with {user.authProvider}
              </Text>
            </View>
          )}
        </View>

        {/* Settings Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={section.title}>
            {renderSectionHeader(section.title)}
            <View
              style={{
                marginHorizontal: tokens.spacing.lg,
                marginBottom: tokens.spacing.md,
                borderRadius: tokens.borderRadius.md,
                backgroundColor: bgSecondary,
                overflow: "hidden",
              }}
            >
              {section.data.map((item, itemIndex) =>
                renderSettingItem(item, itemIndex === section.data.length - 1),
              )}
            </View>
          </View>
        ))}

        {/* Sign Out Section */}
        <View
          style={{
            marginHorizontal: tokens.spacing.lg,
            marginTop: tokens.spacing.xl,
          }}
        >
          <Pressable
            onPress={() => setShowSignOutConfirm(true)}
            disabled={isLoading}
            style={({ pressed }) => ({
              paddingHorizontal: tokens.spacing.lg,
              paddingVertical: tokens.spacing.md,
              backgroundColor: bgSecondary,
              borderRadius: tokens.borderRadius.md,
              flexDirection: "row",
              alignItems: "center",
              opacity: isLoading ? 0.6 : pressed ? 0.8 : 1,
            })}
          >
            {isLoading ? (
              <ActivityIndicator
                color={accentRed}
                size="small"
                style={{ marginRight: tokens.spacing.md }}
              />
            ) : (
              <LogOut
                color={accentRed}
                size={24}
                style={{ marginRight: tokens.spacing.md }}
              />
            )}
            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: accentRed,
              }}
            >
              Sign Out
            </Text>
          </Pressable>
        </View>

        {/* Version */}
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            color: textSecondary,
            textAlign: "center",
            marginTop: tokens.spacing.xl,
          }}
        >
          Coach v1.0.0
        </Text>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal visible={showSignOutConfirm} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay.scrim,
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: bgPrimary,
              paddingHorizontal: tokens.spacing.lg,
              paddingVertical: tokens.spacing.lg,
              borderTopLeftRadius: tokens.borderRadius.lg,
              borderTopRightRadius: tokens.borderRadius.lg,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: textPrimary,
                marginBottom: tokens.spacing.md,
              }}
            >
              Sign Out?
            </Text>

            <Text
              style={{
                fontSize: tokens.typography.fontSize.base,
                color: textSecondary,
                marginBottom: tokens.spacing.lg,
              }}
            >
              Are you sure you want to sign out? You'll need to sign in again to
              access your account.
            </Text>

            {/* Buttons */}
            <View
              style={{
                flexDirection: "row",
                gap: tokens.spacing.md,
              }}
            >
              <Pressable
                onPress={() => setShowSignOutConfirm(false)}
                disabled={isLoading}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: tokens.spacing.md,
                  paddingHorizontal: tokens.spacing.lg,
                  backgroundColor: colors.state.hover,
                  borderRadius: tokens.borderRadius.md,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: textPrimary,
                    textAlign: "center",
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowSignOutConfirm(false);
                  handleSignOut();
                }}
                disabled={isLoading}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: tokens.spacing.md,
                  paddingHorizontal: tokens.spacing.lg,
                  backgroundColor: accentRed,
                  borderRadius: tokens.borderRadius.md,
                  opacity: isLoading ? 0.6 : pressed ? 0.8 : 1,
                })}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.base,
                      fontWeight: tokens.typography.fontWeight.semibold,
                      color: "#FFFFFF",
                      textAlign: "center",
                    }}
                  >
                    Sign Out
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
