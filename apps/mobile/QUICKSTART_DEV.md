# VoiceFit Mobile App - Quick Start Guide

**Last Updated:** January 2025  
**Framework:** React Native + Expo  
**Platforms:** iOS, Android, Web

---

## 🚀 Quick Start (30 seconds)

```bash
# Navigate to mobile app
cd apps/mobile

# Install dependencies (if needed)
npm install

# Start development server
npm start

# Then press:
# - 'i' for iOS Simulator
# - 'a' for Android Emulator
# - 'w' for Web Browser
```

---

## 📋 Prerequisites

- **Node.js** 18+ (with npm)
- **iOS Development:** Xcode 15+ and iOS Simulator (Mac only)
- **Android Development:** Android Studio and emulator
- **Expo CLI** (auto-installed with npm start)

---

## 🔧 Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure `.env` variables:**
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_API_URL=https://voicefit.railway.app
   EXPO_PUBLIC_ENV=development
   EXPO_PUBLIC_DEBUG=true
   ```

3. **Production Backend:**  
   The app is pre-configured to use Railway production backend.  
   No need to run backend locally unless testing backend changes.

---

## 📱 Running on iOS Simulator

### Option 1: Quick Launch (Recommended)
```bash
npm start
# Press 'i' when Expo DevTools appear
```

### Option 2: Direct Build
```bash
npm run ios
# Builds native app and launches simulator
```

### Option 3: Specific Simulator
```bash
npx expo run:ios --device "iPhone 17 Pro"
```

**Troubleshooting iOS:**
- If pods fail: `cd ios && pod install && cd ..`
- Clear build: `rm -rf ios/build && npm run ios`
- Check simulator: `xcrun simctl list devices`

---

## 🤖 Running on Android Emulator

```bash
# Start Android emulator first (via Android Studio)
# Then:
npm run android
```

---

## 🌐 Running on Web

```bash
npm run web
# Opens browser at http://localhost:8081
```

---

## 📂 Project Structure

```
apps/mobile/
├── App.tsx                 # Main app entry point
├── src/
│   ├── screens/           # All app screens
│   │   ├── HomeScreen.tsx
│   │   ├── ChatScreen.tsx       # Coach chat experience
│   │   ├── RunScreen.tsx        # Running tracking
│   │   ├── ProgramLogScreen.tsx # Program + history view
│   │   ├── AnalyticsScreen.tsx  # Workout analytics
│   │   ├── PRsScreen.tsx        # Personal records
│   │   └── ProfileScreen.tsx
│   ├── components/        # Reusable UI components
│   ├── services/          # API & business logic
│   ├── store/            # Zustand state management
│   ├── navigation/       # React Navigation setup
│   ├── hooks/            # Custom React hooks
│   ├── theme/            # Theme & styling
│   └── database/         # WatermelonDB (offline sync)
├── ios/                  # Native iOS project
├── android/              # Native Android project
└── .env                  # Environment variables
```

---

## 🎨 Key Features & Screens

| Screen | Purpose | Key Features |
|--------|---------|-------------|
| **Home** | Dashboard | Today's program, quick actions, recent workouts, badges |
| **Coach** | AI Chat & Logging | Conversational coaching, voice logging, exercise swaps |
| **Run** | Running Tracker | GPS tracking, pace analysis, GAP |
| **Program & Log** | Training Plan & History | Weekly schedule, past workouts, volume overview |
| **Analytics** | Progress Tracking | Charts, volume trends, muscle group balance |
| **PRs** | Personal Records | Track 1RM improvements |
| **Profile** | User Settings | Edit profile, view badges, streaks |

---

## 🧪 Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (Web)
npm run test:e2e:web

# E2E tests (iOS)
npm run test:e2e:ios
```

---

## 🔥 Hot Tips

### Development Shortcuts
- **Shake device/simulator** → Dev menu
- **`r`** → Reload app
- **`m`** → Toggle dev menu
- **`j`** → Open Chrome debugger
- **`Cmd + D`** (iOS) → Dev menu
- **`Cmd + M`** (Android) → Dev menu

### Debugging
```bash
# React Native Debugger
npm run debug

# Clear cache and restart
npx expo start -c

# Check Metro bundler logs
# (automatically shown in terminal)
```

### Fast Refresh
- Saves automatically reload the app
- Component state is preserved
- If broken, shake device → "Reload"

---

## 🗃️ Database (WatermelonDB)

The app uses **WatermelonDB** for offline-first data storage:

- Auto-syncs with Supabase when online
- Works offline with local SQLite
- Reactive queries with RxJS observables

**Schema location:** `src/database/schema/`  
**Models location:** `src/database/models/`

---

## 🔐 Authentication Flow

1. **Onboarding Screen** → First-time user setup
2. **Auth Navigator** → Sign In / Sign Up
3. **Root Navigator** → Main app tabs

**Test Credentials:**  
Check `.env` for `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`

---

## 🎤 Voice Features

The app includes voice recognition for hands-free workout logging:

**Permissions Required:**
- Microphone access
- Speech recognition

**Testing Voice:**
1. Navigate to Log screen
2. Tap microphone icon
3. Say: "Bench press 225 pounds 5 reps"
4. Watch it parse and log automatically

---

## 🏃 Running Features

**GPS Tracking:**
- Real-time pace and distance
- Elevation gain/loss
- Grade-Adjusted Pace (GAP) calculation
- Weather integration

**Testing Runs:**
- Use simulator location: Features → Location → Custom
- Or use pre-recorded GPX files

---

## 📦 Building for Production

### iOS
```bash
# EAS Build (recommended)
eas build --platform ios

# Local build
npx expo run:ios --configuration Release
```

### Android
```bash
# EAS Build (recommended)
eas build --platform android

# Local build
npx expo run:android --variant release
```

---

## 🐛 Common Issues & Fixes

### "Port 8081 already in use"
```bash
# Kill existing Metro bundler
pkill -f "expo start"
# Or find and kill process:
lsof -ti:8081 | xargs kill -9
```

### "Expo Go is outdated"
```bash
# Use development build instead
npx expo run:ios
```

### "Module not found"
```bash
# Clear cache
npx expo start -c
# Reinstall deps
rm -rf node_modules && npm install
```

### "iOS build failed"
```bash
# Reinstall pods
cd ios && pod install && cd ..
# Clean build
rm -rf ios/build
# Try again
npm run ios
```

### "Android build failed"
```bash
# Clean gradle
cd android && ./gradlew clean && cd ..
# Try again
npm run android
```

### Voice not working
- Check microphone permissions in Settings
- iOS: Settings → Privacy → Microphone → Voice Fit
- Simulator: Voice won't work, use physical device

---

## 📖 Additional Resources

- **Expo Docs:** https://docs.expo.dev/
- **React Navigation:** https://reactnavigation.org/
- **WatermelonDB:** https://watermelondb.dev/
- **Backend API:** `apps/backend/main.py`
- **Supabase Dashboard:** https://supabase.com/dashboard

---

## 🆘 Need Help?

1. Check the **Expo DevTools** console for errors
2. Review **Metro bundler** logs in terminal
3. Use **React Native Debugger** for step-through debugging
4. Check **backend logs** on Railway if API issues

---

## 🎯 Quick Architecture Overview

```
User Action (UI)
    ↓
React Component
    ↓
Zustand Store (State Management)
    ↓
Service Layer (API calls)
    ↓
Backend API (Railway)
    ↓
Supabase Database
    ↓
← Response flows back ←
    ↓
WatermelonDB (Local Cache)
    ↓
UI Updates (Reactive)
```

---

## ✨ Next Steps

1. ✅ Start the app
2. 🔐 Sign in or create account
3. 🏋️ Try voice logging a workout
4. 🤖 Chat with AI Coach
5. 📊 View analytics
6. 🏃 Track a run
7. 🏆 Earn some badges!

**Happy Coding! 🚀**