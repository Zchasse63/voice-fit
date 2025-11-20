import type { Config } from "tailwindcss";

/**
 * Tailwind Configuration for VoiceFit Web Dashboard
 * 
 * CRITICAL: This configuration MUST match the iOS app design system exactly.
 * All tokens are extracted from apps/mobile/src/theme/tokens.ts
 * 
 * See: Zed/IOS_DESIGN_SYSTEM_EXTRACTION.md for complete design system documentation
 */

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // Enable dark mode via class strategy
  theme: {
    extend: {
      // ============================================================================
      // COLORS - Exact match to iOS app
      // ============================================================================
      colors: {
        // Light mode colors
        background: {
          light: {
            primary: "#FFFFFF",
            secondary: "#F8F9FA",
            tertiary: "#E9ECEF",
          },
          dark: {
            primary: "#000000",
            secondary: "#1C1C1E",
            tertiary: "#2C2C2E",
          },
        },
        text: {
          light: {
            primary: "#000000",
            secondary: "#495057",
            tertiary: "#6C757D",
            disabled: "#ADB5BD",
          },
          dark: {
            primary: "#FFFFFF",
            secondary: "#E5E5E7",
            tertiary: "#98989D",
            disabled: "#48484A",
          },
        },
        accent: {
          light: {
            blue: "#007AFF",
            coral: "#FF6B6B",
            orange: "#FF9500",
            green: "#34C759",
            purple: "#AF52DE",
            teal: "#5AC8FA",
            yellow: "#FFCC00",
            red: "#FF3B30",
          },
          dark: {
            blue: "#0A84FF",
            coral: "#FF6B6B",
            orange: "#FF9F0A",
            green: "#30D158",
            purple: "#BF5AF2",
            teal: "#64D2FF",
            yellow: "#FFD60A",
            red: "#FF453A",
          },
        },
        chat: {
          light: {
            userBubble: "#007AFF",
            aiBubble: "#F8F9FA",
            userText: "#FFFFFF",
            aiText: "#000000",
          },
          dark: {
            userBubble: "#0A84FF",
            aiBubble: "#2C2C2E",
            userText: "#FFFFFF",
            aiText: "#FFFFFF",
          },
        },
        border: {
          light: {
            subtle: "#E9ECEF",
            light: "#E9ECEF",
            medium: "#6C757D",
          },
          dark: {
            subtle: "#2C2C2E",
            light: "#2C2C2E",
            medium: "#48484A",
          },
        },
      },

      // ============================================================================
      // TYPOGRAPHY - SF Pro equivalent for web
      // ============================================================================
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Fira Sans",
          "Droid Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: ["11px", { lineHeight: "1.2" }],
        sm: ["13px", { lineHeight: "1.4" }],
        base: ["15px", { lineHeight: "1.4" }],
        md: ["17px", { lineHeight: "1.4" }],
        lg: ["20px", { lineHeight: "1.2" }],
        xl: ["24px", { lineHeight: "1.2" }],
        "2xl": ["28px", { lineHeight: "1.2" }],
        "3xl": ["34px", { lineHeight: "1.2" }],
      },
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },

      // ============================================================================
      // SPACING - 8pt grid system
      // ============================================================================
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },

      // ============================================================================
      // BORDER RADIUS
      // ============================================================================
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        full: "9999px",
      },

      // ============================================================================
      // SHADOWS - iOS-style
      // ============================================================================
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 2px 4px rgba(0, 0, 0, 0.08)",
        md: "0 2px 4px rgba(0, 0, 0, 0.08)",
        lg: "0 4px 8px rgba(0, 0, 0, 0.12)",
        xl: "0 8px 16px rgba(0, 0, 0, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;

