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
        secondary: {
          500: '#DD7B57',
        },
        accent: {
          500: '#36625E',
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
      },
    },
  },
  plugins: [],
}

