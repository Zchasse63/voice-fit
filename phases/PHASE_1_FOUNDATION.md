# Phase 1: Foundation & Setup

**Duration:** Week 1 (5-7 days)  
**Team Size:** 1-2 developers  
**Prerequisites:** None (fresh start)  
**Deliverable:** Running Expo app with 5-tab navigation and Figma-themed components

---

## 📋 Overview

Phase 1 establishes the project foundation:
- Initialize Expo project with SDK 53
- Configure Gluestack UI v3 + NativeWind (Tailwind)
- Extract Figma design tokens → Tailwind config
- Create 5-tab bottom navigation
- Set up TypeScript, ESLint, and project structure
- Verify web and iOS builds work

**Success Criteria:**
- ✅ App runs on web (`npx expo start --web`)
- ✅ App runs on iOS simulator
- ✅ 5 tabs navigate correctly
- ✅ Figma colors/fonts applied via Tailwind
- ✅ No TypeScript errors
- ✅ Project structure matches master plan

---

## 🎯 Tasks

### **Task 1.1: Initialize Expo Project**

**Location:** `/Users/zach/Desktop/Voice Fit/voice-fit-app/`

```bash
cd "/Users/zach/Desktop/Voice Fit"

# Create Expo app with TypeScript
npx create-expo-app@latest voice-fit-app --template blank-typescript

cd voice-fit-app

# Verify it works
npx expo start
```

**Expected Output:**
- New `voice-fit-app/` directory created
- `package.json` with Expo SDK 53
- `App.tsx` with "Hello World"
- Metro bundler starts successfully

---

### **Task 1.2: Install Dependencies**

```bash
# Core dependencies
npm install expo@~53.0.0 \
  react@18.3.1 \
  react-native@0.79.0 \
  react-native-web@~0.19.12

# UI & Styling
npm install @gluestack-ui/themed@^3.0.0 \
  nativewind@^4.1.0 \
  tailwindcss@^3.4.0

# Navigation
npm install @react-navigation/native@^6.1.9 \
  @react-navigation/bottom-tabs@^6.6.1 \
  react-native-screens \
  react-native-safe-area-context

# State Management
npm install zustand@^4.5.0

# Animations
npm install react-native-reanimated@~3.15.0 \
  react-native-gesture-handler@~2.18.0

# Icons
npm install lucide-react-native

# Dev Dependencies
npm install --save-dev \
  @types/react@~18.3.0 \
  @types/react-native@~0.79.0 \
  typescript@^5.3.0 \
  eslint@^8.57.0 \
  prettier@^3.2.0
```

**Verify:**
```bash
npm list expo react react-native
# Should show SDK 53, React 18.3.1, RN 0.79.0
```

---

### **Task 1.3: Configure Tailwind + NativeWind**

**Create `tailwind.config.js`:**
```javascript
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
        // Figma Design Tokens
        background: {
          light: '#FBF7F5',
          dark: '#1A1A1A',
        },
        primary: {
          500: '#2C5F3D',  // Forest Green
          600: '#234A31',
        },
        secondary: {
          500: '#DD7B57',  // Terracotta
        },
        accent: {
          500: '#36625E',  // Deep Teal
        },
        primaryDark: '#4A9B6F',
        secondaryDark: '#F9AC60',
        accentDark: '#86F4EE',
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
};
```

**Update `babel.config.js`:**
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
```

**Create `global.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### **Task 1.4: Create Project Structure**

```bash
cd voice-fit-app

mkdir -p src/{components,screens,navigation,services,store,theme,types,utils}
mkdir -p __tests__/{unit,integration,e2e}
```

**Expected structure:**
```
voice-fit-app/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── navigation/      # React Navigation setup
│   ├── services/        # Business logic
│   ├── store/           # Zustand stores
│   ├── theme/           # Design system
│   ├── types/           # TypeScript types
│   └── utils/           # Helper functions
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── App.tsx
├── app.json
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

### **Task 1.5: Create 5-Tab Navigation**

**Create `src/navigation/RootNavigator.tsx`:**
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart3, PlusCircle, Trophy, MessageCircle } from 'lucide-react-native';

// Import screens (we'll create these next)
import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import StartScreen from '../screens/StartScreen';
import PRsScreen from '../screens/PRsScreen';
import CoachScreen from '../screens/CoachScreen';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2C5F3D', // primary-500
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            height: 60,
            paddingBottom: 8,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Log"
          component={LogScreen}
          options={{
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="START"
          component={StartScreen}
          options={{
            tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size * 1.5} />,
            tabBarIconStyle: { marginTop: -10 },
          }}
        />
        <Tab.Screen
          name="PRs"
          component={PRsScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Coach"
          component={CoachScreen}
          options={{
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

---

### **Task 1.6: Create Placeholder Screens**

**Create `src/screens/HomeScreen.tsx`:**
```typescript
import React from 'react';
import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background-light">
      <Text className="text-2xl font-heading text-primary-500">
        Home Screen
      </Text>
      <Text className="text-base font-body text-gray-600 mt-2">
        Daily overview + readiness check
      </Text>
    </View>
  );
}
```

**Repeat for other screens:**
- `LogScreen.tsx` - "Log Screen" / "Workout history + analytics"
- `StartScreen.tsx` - "START Screen" / "New workout/run"
- `PRsScreen.tsx` - "PRs Screen" / "Personal records"
- `CoachScreen.tsx` - "Coach Screen" / "AI chat + settings"

---

### **Task 1.7: Update App.tsx**

```typescript
import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import RootNavigator from './src/navigation/RootNavigator';
import './global.css';

export default function App() {
  return (
    <GluestackUIProvider config={config}>
      <RootNavigator />
    </GluestackUIProvider>
  );
}
```

---

### **Task 1.8: Configure TypeScript**

**Update `tsconfig.json`:**
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

---

### **Task 1.9: Test Web Build**

```bash
npx expo start --web
```

**Expected:**
- Browser opens to `http://localhost:19006`
- 5 tabs visible at bottom
- Clicking tabs navigates between screens
- Figma colors applied (Forest Green active tab)

---

### **Task 1.10: Test iOS Build**

```bash
npx expo start
# Press 'i' for iOS simulator
```

**Expected:**
- iOS simulator opens
- App loads successfully
- 5 tabs work
- No errors in Metro bundler

---

## ✅ Acceptance Criteria

- [ ] Expo SDK 53 installed and verified
- [ ] Gluestack UI v3 + NativeWind configured
- [ ] Tailwind config has Figma design tokens
- [ ] 5-tab navigation works (Home, Log, START, PRs, Coach)
- [ ] All screens render with placeholder content
- [ ] Web build runs (`npx expo start --web`)
- [ ] iOS build runs (`npx expo start` → press 'i')
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Project structure matches master plan
- [ ] Git repo initialized (optional but recommended)

---

## 🚀 Next Phase

**Phase 2: Web Development & Testing Infrastructure**
- Build actual screen content
- Implement Zustand stores
- Set up Supabase client
- Configure Playwright

See `phases/PHASE_2_WEB_DEVELOPMENT.md`

---

## 📚 Resources

- [Expo SDK 53 Docs](https://docs.expo.dev/)
- [Gluestack UI v3 Docs](https://gluestack.io/ui/docs)
- [NativeWind Docs](https://www.nativewind.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

