/**
 * Design Tokens
 *
 * MacroFactor-inspired design system for VoiceFit UI redesign.
 * Clean, data-driven aesthetic with selective color pops.
 */

export const tokens = {
  // ============================================================================
  // COLORS
  // ============================================================================
  colors: {
    light: {
      // Background colors (MacroFactor white/gray)
      background: {
        primary: "#FFFFFF", // Main background
        secondary: "#F8F9FA", // Cards, sections
        tertiary: "#E9ECEF", // Subtle dividers
      },

      // Text colors
      text: {
        primary: "#000000", // Headlines
        secondary: "#495057", // Body text
        tertiary: "#6C757D", // Labels, captions
        disabled: "#ADB5BD", // Disabled states
      },

      // Accent colors (selective pops of color)
      accent: {
        blue: "#007AFF", // Primary actions (iOS blue)
        coral: "#FF6B6B", // Data emphasis (MacroFactor style)
        orange: "#FF9500", // Warnings, streaks
        green: "#34C759", // Success, PRs, run start
        purple: "#AF52DE", // Data viz alternate
        teal: "#5AC8FA", // Data viz
        yellow: "#FFCC00", // Data viz
        red: "#FF3B30", // Errors, destructive actions
      },

      // Chat bubble colors (iOS Messages style)
      chat: {
        userBubble: "#007AFF", // Blue (user messages)
        aiBubble: "#F8F9FA", // Light gray (AI messages)
        userText: "#FFFFFF", // White text on blue
        aiText: "#000000", // Black text on gray
      },

      // Border colors
      border: {
        subtle: "#E9ECEF", // Extra-subtle borders
        light: "#E9ECEF", // Subtle borders
        medium: "#6C757D", // Medium borders
      },

      // Overlay colors (modals, scrims, shimmer)
      overlay: {
        scrim: "rgba(0, 0, 0, 0.5)", // Standard modal/alert backdrop
        scrimStrong: "rgba(0, 0, 0, 0.8)", // Stronger/full-screen overlays
        shimmer: "rgba(255, 255, 255, 0.3)", // Skeleton shimmer overlay
      },

      // Soft background tints for callouts, chips, and badges
      backgroundSoft: {
        info: "#DBEAFE", // Soft blue info tint
        success: "#DCFCE7", // Soft green success tint
        warning: "#FEF3C7", // Soft yellow/orange warning tint
        warningAlt: "#FFEFD5", // Alternate warm warning tint
        danger: "#FEE2E2", // Soft red danger tint
        accent: "rgba(96, 165, 250, 0.15)", // Accent blue selection tint
        accentSubtle: "rgba(37, 99, 235, 0.08)", // Subtle accent blue tint
      },

      // State colors
      state: {
        hover: "#F8F9FA", // Hover state
        pressed: "#E9ECEF", // Pressed state
      },
    },

    dark: {
      // Background colors (true black)
      background: {
        primary: "#000000", // True black background
        secondary: "#1C1C1E", // Dark gray cards
        tertiary: "#2C2C2E", // Medium gray dividers
      },

      // Text colors
      text: {
        primary: "#FFFFFF", // White headlines
        secondary: "#E5E5E7", // Light gray body
        tertiary: "#98989D", // Medium gray labels
        disabled: "#48484A", // Dark gray disabled
      },

      // Accent colors (brighter for dark mode)
      accent: {
        blue: "#0A84FF", // Brighter blue
        coral: "#FF6B6B", // Same coral
        orange: "#FF9F0A", // Brighter orange
        green: "#30D158", // Brighter green
        purple: "#BF5AF2", // Brighter purple
        teal: "#64D2FF", // Brighter teal
        yellow: "#FFD60A", // Brighter yellow
        red: "#FF453A", // Brighter red
      },

      // Chat bubble colors
      chat: {
        userBubble: "#0A84FF", // Brighter blue
        aiBubble: "#2C2C2E", // Dark gray
        userText: "#FFFFFF", // White text
        aiText: "#FFFFFF", // White text
      },

      // Border colors
      border: {
        subtle: "#2C2C2E", // Extra-subtle borders
        light: "#2C2C2E", // Dark gray borders
        medium: "#48484A", // Medium gray borders
      },

      // Overlay colors (modals, scrims, shimmer)
      overlay: {
        scrim: "rgba(0, 0, 0, 0.5)", // Standard modal/alert backdrop
        scrimStrong: "rgba(0, 0, 0, 0.8)", // Stronger/full-screen overlays
        shimmer: "rgba(255, 255, 255, 0.15)", // Subtle shimmer overlay on dark
      },

      // Soft background tints for callouts, chips, and badges
      backgroundSoft: {
        info: "rgba(59, 130, 246, 0.18)", // Soft blue info tint
        success: "rgba(34, 197, 94, 0.18)", // Soft green success tint
        warning: "rgba(250, 204, 21, 0.18)", // Soft yellow/orange warning tint
        warningAlt: "rgba(249, 172, 96, 0.18)", // Alternate warm warning tint
        danger: "rgba(248, 113, 113, 0.18)", // Soft red danger tint
        accent: "rgba(96, 165, 250, 0.15)", // Accent blue selection tint
        accentSubtle: "rgba(37, 99, 235, 0.08)", // Subtle accent blue tint
      },

      // State colors
      state: {
        hover: "#2C2C2E", // Dark gray hover
        pressed: "#3C3C3E", // Slightly lighter pressed
      },
    },
  },

  // ============================================================================
  // TYPOGRAPHY (SF Pro - iOS System Font)
  // ============================================================================
  typography: {
    fontFamily: {
      system: "System", // SF Pro on iOS, Roboto on Android
    },

    fontSize: {
      xs: 11, // Timestamps, captions
      sm: 13, // Labels, secondary text
      base: 15, // Body text (iOS standard)
      md: 17, // Emphasized body
      lg: 20, // Subheadings
      xl: 24, // Section headers
      "2xl": 28, // Screen titles
      "3xl": 34, // Large titles (MacroFactor "DASHBOARD")
    },

    fontWeight: {
      regular: "400" as const, // Body text
      medium: "500" as const, // Emphasized text
      semibold: "600" as const, // Subheadings
      bold: "700" as const, // Headlines
    },

    lineHeight: {
      tight: 1.2, // Headlines
      normal: 1.4, // Body text
      relaxed: 1.6, // Long-form content
    },
  },

  // ============================================================================
  // SPACING (8pt Grid System)
  // ============================================================================
  spacing: {
    xs: 4, // Tight spacing
    sm: 8, // Small gaps
    md: 16, // Standard padding
    lg: 24, // Section spacing
    xl: 32, // Screen padding
    "2xl": 48, // Large spacing
  },

  // ============================================================================
  // BORDER RADIUS
  // ============================================================================
  borderRadius: {
    sm: 8, // Buttons, inputs
    md: 12, // Cards
    lg: 16, // Large cards
    xl: 20, // Hero elements
    full: 9999, // Circular (avatars, pills)
  },

  // ============================================================================
  // SHADOWS (iOS-style)
  // ============================================================================
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // ============================================================================
  components: {
    // Button
    button: {
      height: {
        sm: 36,
        md: 44,
        lg: 52,
      },
      borderRadius: 12,
    },

    // Input
    input: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
    },

    // Card
    card: {
      padding: 16,
      borderRadius: 12,
    },

    // Pill Badge (MacroFactor "2488 / 2468" style)
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },

    // Chat
    chat: {
      bubbleMaxWidth: "75%",
      bubbleBorderRadius: 18, // iOS Messages style
      bubblePadding: {
        horizontal: 16,
        vertical: 12,
      },
      inputHeight: 52,
    },

    // Avatar
    avatar: {
      sizes: {
        sm: 32,
        md: 48,
        lg: 80,
      },
    },
  },
};

export default tokens;
