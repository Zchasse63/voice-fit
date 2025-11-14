/**
 * ComponentTestScreen
 *
 * Test screen to showcase all new UI components.
 * Used for verifying component functionality and visual appearance.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { Button, Input, Card, PillBadge } from "../components/ui";
import tokens from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";
import { Heart, Search, Check } from "lucide-react-native";

export default function ComponentTestScreen() {
  const { isDark, theme, setTheme } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  // Test states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [textInput, setTextInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTestButton = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const validateEmail = (text: string) => {
    setEmail(text);
    if (text && !text.includes("@")) {
      setEmailError("Please enter a valid email");
    } else {
      setEmailError("");
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                fontSize: tokens.typography.fontSize["3xl"],
                fontWeight: tokens.typography.fontWeight.bold,
                color: colors.text.primary,
              },
            ]}
          >
            Component Test
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                fontSize: tokens.typography.fontSize.base,
                color: colors.text.secondary,
                marginTop: tokens.spacing.xs,
              },
            ]}
          >
            MacroFactor-inspired design system
          </Text>
        </View>

        {/* Theme Toggle */}
        <Card variant="elevated" padding="md" style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.md,
              },
            ]}
          >
            Theme: {theme}
          </Text>
          <View style={styles.buttonRow}>
            <Button
              variant={theme === "light" ? "primary" : "outline"}
              size="sm"
              onPress={() => setTheme("light")}
            >
              Light
            </Button>
            <View style={{ width: tokens.spacing.sm }} />
            <Button
              variant={theme === "dark" ? "primary" : "outline"}
              size="sm"
              onPress={() => setTheme("dark")}
            >
              Dark
            </Button>
            <View style={{ width: tokens.spacing.sm }} />
            <Button
              variant={theme === "auto" ? "primary" : "outline"}
              size="sm"
              onPress={() => setTheme("auto")}
            >
              Auto
            </Button>
          </View>
        </Card>

        {/* Buttons Section */}
        <Card variant="elevated" padding="md" style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.md,
              },
            ]}
          >
            Buttons
          </Text>

          {/* Primary Buttons */}
          <Text
            style={[
              styles.label,
              { color: colors.text.secondary, marginBottom: tokens.spacing.sm },
            ]}
          >
            Primary Variant
          </Text>
          <View style={styles.buttonRow}>
            <Button variant="primary" size="sm" onPress={() => {}}>
              Small
            </Button>
            <View style={{ width: tokens.spacing.sm }} />
            <Button variant="primary" size="md" onPress={() => {}}>
              Medium
            </Button>
            <View style={{ width: tokens.spacing.sm }} />
            <Button variant="primary" size="lg" onPress={() => {}}>
              Large
            </Button>
          </View>

          <View style={{ height: tokens.spacing.md }} />

          {/* Secondary Buttons */}
          <Text
            style={[
              styles.label,
              { color: colors.text.secondary, marginBottom: tokens.spacing.sm },
            ]}
          >
            Secondary Variant
          </Text>
          <View style={styles.buttonRow}>
            <Button variant="secondary" size="md" onPress={() => {}}>
              Secondary
            </Button>
            <View style={{ width: tokens.spacing.sm }} />
            <Button
              variant="secondary"
              size="md"
              onPress={() => {}}
              disabled
            >
              Disabled
            </Button>
          </View>

          <View style={{ height: tokens.spacing.md }} />

          {/* Ghost & Outline */}
          <Text
            style={[
              styles.label,
              { color: colors.text.secondary, marginBottom: tokens.spacing.sm },
            ]}
          >
            Ghost & Outline
          </Text>
          <View style={styles.buttonRow}>
            <Button variant="ghost" size="md" onPress={() => {}}>
              Ghost
            </Button>
            <View style={{ width: tokens.spacing.sm }} />
            <Button variant="outline" size="md" onPress={() => {}}>
              Outline
            </Button>
          </View>

          <View style={{ height: tokens.spacing.md }} />

          {/* With Icons */}
          <Text
            style={[
              styles.label,
              { color: colors.text.secondary, marginBottom: tokens.spacing.sm },
            ]}
          >
            With Icons
          </Text>
          <View style={styles.buttonRow}>
            <Button
              variant="primary"
              size="md"
              onPress={() => {}}
              leftIcon={<Heart size={20} color="#FFFFFF" />}
            >
              Like
            </Button>
            <View style={{ width: tokens.spacing.sm }} />
            <Button
              variant="outline"
              size="md"
              onPress={() => {}}
              rightIcon={<Check size={20} color={colors.accent.blue} />}
            >
              Done
            </Button>
          </View>

          <View style={{ height: tokens.spacing.md }} />

          {/* Loading & Full Width */}
          <Text
            style={[
              styles.label,
              { color: colors.text.secondary, marginBottom: tokens.spacing.sm },
            ]}
          >
            Loading & Full Width
          </Text>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleTestButton}
          >
            Test Loading (2s)
          </Button>
        </Card>

        {/* Inputs Section */}
        <Card variant="elevated" padding="md" style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.md,
              },
            ]}
          >
            Inputs
          </Text>

          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChangeText={validateEmail}
            error={emailError}
            leftIcon={<Search size={20} color={colors.text.tertiary} />}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            helperText="Must be at least 8 characters"
          />

          <Input
            label="Text Input"
            type="text"
            placeholder="Enter some text..."
            value={textInput}
            onChangeText={setTextInput}
          />

          <Input
            label="Disabled Input"
            type="text"
            placeholder="This is disabled"
            value="Cannot edit"
            onChangeText={() => {}}
            disabled
          />
        </Card>

        {/* Cards Section */}
        <Card variant="elevated" padding="md" style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.md,
              },
            ]}
          >
            Cards
          </Text>

          <Card variant="default" padding="md" style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.text.primary }}>Default Card</Text>
          </Card>

          <Card variant="elevated" padding="md" style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.text.primary }}>Elevated Card</Text>
          </Card>

          <Card variant="outlined" padding="md" style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.text.primary }}>Outlined Card</Text>
          </Card>

          <Card
            variant="elevated"
            padding="lg"
            onPress={() => alert("Card pressed!")}
          >
            <Text style={{ color: colors.text.primary }}>
              Pressable Card (tap me!)
            </Text>
          </Card>
        </Card>

        {/* Pill Badges Section */}
        <Card variant="elevated" padding="md" style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.md,
              },
            ]}
          >
            Pill Badges
          </Text>

          <Text
            style={[
              styles.label,
              { color: colors.text.secondary, marginBottom: tokens.spacing.sm },
            ]}
          >
            Variants
          </Text>
          <View style={styles.badgeRow}>
            <PillBadge text="Primary" variant="primary" />
            <PillBadge text="Secondary" variant="secondary" />
            <PillBadge text="Outlined" variant="outlined" />
          </View>

          <View style={{ height: tokens.spacing.md }} />

          <Text
            style={[
              styles.label,
              { color: colors.text.secondary, marginBottom: tokens.spacing.sm },
            ]}
          >
            Sizes
          </Text>
          <View style={styles.badgeRow}>
            <PillBadge text="Small" variant="primary" size="sm" />
            <PillBadge text="Medium" variant="primary" size="md" />
          </View>

          <View style={{ height: tokens.spacing.md }} />

          <Text
            style={[
              styles.label,
              { color: colors.text.secondary, marginBottom: tokens.spacing.sm },
            ]}
          >
            MacroFactor Style (2488 / 2468)
          </Text>
          <PillBadge text="2488 / 2468" variant="outlined" size="md" />
        </Card>

        {/* Color Palette */}
        <Card variant="elevated" padding="md" style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: tokens.spacing.md,
              },
            ]}
          >
            Color Palette
          </Text>

          <View style={styles.colorGrid}>
            <View style={styles.colorItem}>
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: colors.accent.blue },
                ]}
              />
              <Text
                style={[styles.colorLabel, { color: colors.text.secondary }]}
              >
                Blue
              </Text>
            </View>

            <View style={styles.colorItem}>
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: colors.accent.coral },
                ]}
              />
              <Text
                style={[styles.colorLabel, { color: colors.text.secondary }]}
              >
                Coral
              </Text>
            </View>

            <View style={styles.colorItem}>
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: colors.accent.green },
                ]}
              />
              <Text
                style={[styles.colorLabel, { color: colors.text.secondary }]}
              >
                Green
              </Text>
            </View>

            <View style={styles.colorItem}>
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: colors.accent.orange },
                ]}
              />
              <Text
                style={[styles.colorLabel, { color: colors.text.secondary }]}
              >
                Orange
              </Text>
            </View>

            <View style={styles.colorItem}>
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: colors.accent.purple },
                ]}
              />
              <Text
                style={[styles.colorLabel, { color: colors.text.secondary }]}
              >
                Purple
              </Text>
            </View>

            <View style={styles.colorItem}>
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: colors.accent.red },
                ]}
              />
              <Text
                style={[styles.colorLabel, { color: colors.text.secondary }]}
              >
                Red
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
  },
  header: {
    marginBottom: tokens.spacing.xl,
  },
  title: {
    // Dynamic styles applied inline
  },
  subtitle: {
    // Dynamic styles applied inline
  },
  section: {
    marginBottom: tokens.spacing.lg,
  },
  sectionTitle: {
    // Dynamic styles applied inline
  },
  label: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
    flexWrap: "wrap",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.md,
  },
  colorItem: {
    alignItems: "center",
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: tokens.borderRadius.md,
    marginBottom: tokens.spacing.xs,
  },
  colorLabel: {
    fontSize: tokens.typography.fontSize.xs,
  },
});
