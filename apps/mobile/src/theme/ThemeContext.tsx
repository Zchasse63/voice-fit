/**
 * ThemeContext
 *
 * Provides theme management for the app with support for light, dark, and auto modes.
 * Auto mode follows the system color scheme.
 * Theme preference is persisted to AsyncStorage.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tokens } from "./tokens";

const THEME_STORAGE_KEY = "@voicefit_theme";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  colors: typeof tokens.colors.light;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("auto");
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Calculate isDark based on theme and system preference
  useEffect(() => {
    if (theme === "auto") {
      setIsDark(systemColorScheme === "dark");
    } else {
      setIsDark(theme === "dark");
    }
  }, [theme, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedTheme &&
        (savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "auto")
      ) {
        setThemeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error("Failed to load theme preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  const value = {
    theme,
    isDark,
    colors,
    setTheme,
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;
