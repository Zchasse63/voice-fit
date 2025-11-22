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
    // Compatibility layer - default to light theme for direct access
    // Components should use theme-aware colors via useTheme() hook
    get background() { return this.light.background; },
    get text() { return this.light.text; },
    get icon() { return this.light.icon; },
    get accent() { return this.light.accent; },
    get backgroundSoft() { return this.light.backgroundSoft; },
    get state() { return this.light.state; },
    get overlay() { return this.light.overlay; },
    get badge() { return this.light.badge; },
    get notebook() { return this.light.notebook; },
    get border() { return this.light.border; },
    get chat() { return this.light.chat; },
    shared: {
      static: {
        white: "#FFFFFF",
        black: "#000000",
      },
    },

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
        inverse: "#FFFFFF", // White text on dark backgrounds
        onAccent: "#FFFFFF", // Text on accent backgrounds
      },

      // Icon colors
      icon: {
        primary: "#000000", // Primary icons
        secondary: "#495057", // Secondary icons
        disabled: "#ADB5BD", // Disabled icons
        onAccent: "#FFFFFF", // Icons on accent backgrounds
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

        // Semantic color aliases for common use cases
        primary: "#007AFF", // Alias for blue
        success: "#34C759", // Alias for green
        warning: "#FF9500", // Alias for orange
        error: "#FF3B30", // Alias for red
        info: "#5AC8FA", // Alias for teal
      },

      // Badge colors
      badge: {
        background: "#E9ECEF", // Light gray background
        text: "#495057", // Dark gray text
        border: "#DEE2E6", // Subtle border
        gold: "#FFD700", // Gold badge
        silver: "#C0C0C0", // Silver badge
        bronze: "#CD7F32", // Bronze badge
        platinum: "#E5E4E2", // Platinum badge
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
        primary: "#DEE2E6", // Primary borders
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
        danger: "#FF3B30", // Danger/destructive state
      },

      // Notebook-style colors (for LogOverlay)
      notebook: {
        background: "#FFFEF5", // Cream notebook paper
        ruledLine: "#E0E0E0", // Light gray ruled lines
        redLine: "#FF6B6B", // Red margin line
        holePunch: "#D1D5DB", // Hole punch gray
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
        inverse: "#000000", // Black text on light backgrounds
        onAccent: "#000000", // Text on accent backgrounds (dark mode)
      },

      // Icon colors
      icon: {
        primary: "#FFFFFF", // Primary icons
        secondary: "#E5E5E7", // Secondary icons
        disabled: "#48484A", // Disabled icons
        onAccent: "#000000", // Icons on accent backgrounds (dark mode)
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

        // Semantic color aliases for common use cases
        primary: "#0A84FF", // Alias for blue
        success: "#30D158", // Alias for green
        warning: "#FF9F0A", // Alias for orange
        error: "#FF453A", // Alias for red
        info: "#64D2FF", // Alias for teal
      },

      // Badge colors
      badge: {
        background: "#2C2C2E", // Dark gray background
        text: "#E5E5E7", // Light gray text
        border: "#48484A", // Subtle border
        gold: "#FFD700", // Gold badge
        silver: "#C0C0C0", // Silver badge
        bronze: "#CD7F32", // Bronze badge
        platinum: "#E5E4E2", // Platinum badge
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
        primary: "#3A3A3C", // Primary borders
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
        danger: "#FF453A", // Danger/destructive state (bright red for dark mode)
      },

      // Notebook-style colors (for LogOverlay)
      notebook: {
        background: "#1C1C1E", // Dark notebook background
        ruledLine: "#2C2C2E", // Dark ruled lines
        redLine: "#FF453A", // Bright red margin line
        holePunch: "#48484A", // Hole punch dark gray
      },
    },
  },

  // ============================================================================
  // TYPOGRAPHY (SF Pro - iOS System Font)
  // ============================================================================
  typography: {
    fontFamily: {
      system: "System", // SF Pro on iOS, Roboto on Android
      notebook: "Courier New", // Monospace for notebook-style text
    },

    fontSize: {
      xs: 11, // Timestamps, captions
      sm: 13, // Labels, secondary text
      base: 15, // Body text (iOS standard)
      md: 17, // Emphasized body
      lg: 20, // Subheadings
      xl: 24, // Section headers
      xxl: 26, // Extra large
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
    "3xl": 64, // Extra large spacing
  },

  // ============================================================================
  // BORDER RADIUS
  // ============================================================================
  borderRadius: {
    sm: 8, // Buttons, inputs
    md: 12, // Cards
    lg: 16, // Large cards
    xl: 20, // Hero elements
    "2xl": 22, // Extra large
    "3xl": 24, // Extra large elements
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
  // ANIMATION TOKENS
  // ============================================================================
  animation: {
    // Scale animations for press interactions
    scale: {
      pressed: 0.96, // Subtle scale down on press
      hover: 1.02, // Slight scale up on hover (web)
    },

    // Spring animation configs
    spring: {
      bouncy: {
        damping: 15,
        stiffness: 150,
      },
      smooth: {
        damping: 20,
        stiffness: 200,
      },
      snappy: {
        damping: 25,
        stiffness: 300,
      },
    },

    // Duration values (in ms)
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
  },

  // ============================================================================
  // HAPTIC FEEDBACK TOKENS
  // ============================================================================
  haptics: {
    light: 'light' as const,
    medium: 'medium' as const,
    heavy: 'heavy' as const,
    success: 'success' as const,
    error: 'error' as const,
    warning: 'warning' as const,
    selection: 'selection' as const,
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
