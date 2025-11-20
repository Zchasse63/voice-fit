/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // Enable dark mode via class strategy
  theme: {
    extend: {
      // ============================================================================
      // COLORS - Exact match to iOS app (apps/mobile/tailwind.config.js)
      // ============================================================================
      colors: {
        // Background colors
        background: {
          light: {
            primary: "#FBF7F5",
            secondary: "#F8F9FA",
            tertiary: "#E9ECEF",
          },
          dark: {
            primary: "#1A1A1A",
            secondary: "#1C1C1E",
            tertiary: "#2C2C2E",
          },
        },
        // Text colors
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
        // Primary brand colors
        primary: {
          500: "#2C5F3D",
          600: "#234A31",
          dark: "#4A9B6F",
        },
        // Secondary brand colors
        secondary: {
          500: "#DD7B57",
          600: "#C76B47",
          dark: "#F9AC60",
        },
        // Accent colors
        accent: {
          500: "#36625E",
          600: "#2D504C",
          dark: "#86F4EE",
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
        // Semantic colors
        success: {
          light: "#4A9B6F",
          dark: "#5DB88A",
        },
        warning: {
          light: "#F9AC60",
          dark: "#FFB84D",
        },
        error: {
          light: "#E74C3C",
          dark: "#FF6B6B",
        },
        info: {
          light: "#3498DB",
          dark: "#5DADE2",
        },
        // Chat bubble colors
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
        // Border colors
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
        // Standardized grays (Tailwind defaults)
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },

      // ============================================================================
      // TYPOGRAPHY - System fonts (iOS equivalent for web)
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
        sm: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
        DEFAULT: "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
        md: "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
        lg: "0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)",
        xl: "0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)",
        "2xl": "0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)",
      },
    },
  },
  plugins: [],
};


