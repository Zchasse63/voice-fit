/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#FBF7F5',
          dark: '#1A1A1A',
        },
        primary: {
          500: '#2C5F3D',
          600: '#234A31',
        },
        primaryDark: '#4A9B6F',
        secondary: {
          500: '#DD7B57',
          600: '#C76B47',
        },
        secondaryDark: '#F9AC60',
        accent: {
          500: '#36625E',
          600: '#2D504C',
        },
        accentDark: '#86F4EE',
        // Semantic colors
        success: {
          light: '#4A9B6F',
          dark: '#5DB88A',
        },
        warning: {
          light: '#F9AC60',
          dark: '#FFB84D',
        },
        error: {
          light: '#E74C3C',
          dark: '#FF6B6B',
        },
        info: {
          light: '#3498DB',
          dark: '#5DADE2',
        },
        // Standardized grays (Tailwind defaults)
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      fontFamily: {
        heading: ['Inter-Bold'],
        body: ['Inter-Regular'],
        'body-medium': ['Inter-Medium'],
        'body-semibold': ['Inter-SemiBold'],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'DEFAULT': '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
        'md': '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
        'lg': '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
        'xl': '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
        '2xl': '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
      },
    },
  },
  plugins: [],
}

