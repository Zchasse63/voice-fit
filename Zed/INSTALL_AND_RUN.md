# VoiceFit - Quick Start Installation & Run Guide

**Status**: Ready to Run  
**Time to First Run**: ~5-10 minutes

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Install dependencies
cd apps/mobile
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Start the app
npm start

# 4. Press 'i' for iOS or 'a' for Android
```

---

## 📋 Prerequisites

### Required
- [x] Node.js 18+ installed
- [x] npm or yarn installed
- [x] Expo CLI (comes with npm start)
- [x] iOS Simulator (Mac only) or Android Emulator

### Optional
- [ ] Physical iOS device (for Apple Sign In testing)
- [ ] Physical Android device (for testing)
- [ ] Xcode (Mac only, for iOS)
- [ ] Android Studio (for Android)

---

## 🔧 Installation Steps

### Step 1: Install Dependencies

```bash
# Navigate to mobile app
cd VoiceFit/apps/mobile

# Install all packages
npm install

# This installs:
# - React Navigation packages
# - Supabase client
# - OAuth packages (Apple, Google)
# - All other dependencies
```

**Expected output**:
```
✓ Dependencies installed successfully
✓ expo-apple-authentication installed
✓ expo-auth-session installed
✓ expo-web-browser installed
```

---

### Step 2: Configure Environment Variables

#### 2.1 Copy Environment Template

```bash
cd VoiceFit/apps/mobile
cp .env.example .env
```

#### 2.2 Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your VoiceFit project
3. Go to **Settings → API**
4. Copy these values:
   - `URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### 2.3 Edit .env File

Open `VoiceFit/apps/mobile/.env` and update:

```bash
# Supabase (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Railway Backend (REQUIRED)
EXPO_PUBLIC_API_URL=https://voicefit.railway.app

# Google OAuth (OPTIONAL - for Google Sign In)
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=xxx.apps.googleusercontent.com

# App Config
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_DEBUG=true
```

**Minimum Required**: Supabase URL and Anon Key

---

### Step 3: Verify Railway Backend

Your backend is already deployed on Railway. Verify it's running:

```bash
# Test backend health
curl https://voicefit.railway.app/health

# Expected response:
# {"status":"ok","message":"VoiceFit API is running"}
```

If backend is down or URL changed:
1. Check Railway dashboard
2. Update `EXPO_PUBLIC_API_URL` in `.env`

---

### Step 4: Start the Development Server

```bash
cd VoiceFit/apps/mobile
npm start
```

**What happens**:
- Expo dev server starts
- QR code displayed in terminal
- Metro bundler starts
- Dev tools open in browser (optional)

**Expected output**:
```
› Metro waiting on exp://192.168.1.X:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

---

### Step 5: Run on Device/Simulator

#### Option A: iOS Simulator (Mac only)

```bash
# From Expo dev server prompt:
Press 'i'

# Or run directly:
npm run ios
```

**First time**: Xcode may prompt to install iOS simulator

#### Option B: Android Emulator

```bash
# Make sure Android Studio is installed and emulator is running

# From Expo dev server prompt:
Press 'a'

# Or run directly:
npm run android
```

#### Option C: Physical Device (Recommended)

**iOS**:
1. Install **Expo Go** from App Store
2. Open Camera app
3. Scan QR code from terminal
4. Tap notification to open in Expo Go

**Android**:
1. Install **Expo Go** from Play Store
2. Open Expo Go app
3. Scan QR code from terminal
4. App opens automatically

---

## ✅ Verify Installation

### Test Checklist

Once app is running:

- [ ] **App Opens**: No crash on launch
- [ ] **SignIn Screen**: Shows Apple, Google, and email/password options
- [ ] **Navigation**: Can tap "Sign Up" link
- [ ] **Theming**: Toggle dark mode in simulator/emulator
- [ ] **Backend Connection**: Try signing in (should show error if no account)

### Test Email Sign In

1. Open app
2. Tap "Sign Up" link
3. Enter email and password
4. Tap "Sign Up" button
5. Should navigate to Home screen (4-tab navigation)

### Test Navigation

After signing in:
- [ ] Home tab shows dashboard
- [ ] Run tab shows map
- [ ] Chat tab shows AI coach
- [ ] Profile tab shows user info
- [ ] Bottom tabs are styled correctly
- [ ] Dark mode works across all screens

### Test Chat (Backend Integration)

1. Go to Chat tab
2. Type a message
3. Tap send button
4. Should see loading indicator
5. AI response appears (from Railway backend)
6. If backend is down, shows error alert

---

## 🐛 Troubleshooting

### Issue: "Cannot start Metro bundler"

**Solution**:
```bash
# Clear Metro cache
npm start --reset-cache

# Or
npx expo start -c
```

### Issue: "Module not found"

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: "Missing Supabase environment variables"

**Solution**:
1. Check `.env` file exists in `apps/mobile/`
2. Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
3. Restart dev server: `npm start`

### Issue: "Network request failed" in Chat

**Cause**: Backend not reachable

**Solution**:
1. Test backend: `curl https://voicefit.railway.app/health`
2. Check `EXPO_PUBLIC_API_URL` in `.env`
3. Verify Railway deployment is active
4. Check internet connection

### Issue: iOS Simulator not opening

**Solution**:
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Open Xcode once to accept license
open -a Xcode
```

### Issue: Android Emulator not found

**Solution**:
1. Open Android Studio
2. Tools → AVD Manager
3. Create a virtual device
4. Start emulator
5. Run `npm start` and press 'a'

---

## 🎨 Development Tips

### Hot Reload

File changes auto-reload:
- Save any file
- App reloads automatically
- Metro rebundles changed files

### Manual Reload

In Expo Go or simulator:
- **iOS**: Cmd + R
- **Android**: Double tap R key
- **Or**: Shake device → Tap "Reload"

### Debug Menu

In Expo Go or simulator:
- **iOS**: Cmd + D
- **Android**: Cmd + M (Mac) or Ctrl + M (Windows/Linux)
- **Physical device**: Shake device

Options:
- Reload
- Debug Remote JS (Chrome DevTools)
- Show Performance Monitor
- Toggle Element Inspector

### View Logs

**Terminal**:
```bash
# All logs show in terminal running npm start
# Look for console.log, errors, warnings
```

**Chrome DevTools** (for Remote JS Debugging):
1. Open debug menu
2. Tap "Debug Remote JS"
3. Opens Chrome tab
4. Press F12 for DevTools
5. Console tab shows all logs

---

## 📱 Testing Features

### Test Authentication

**Email/Password**:
1. SignUp screen
2. Enter email/password
3. Tap "Sign Up"
4. Check Supabase Dashboard → Authentication → Users
5. New user should appear

**Apple Sign In** (Physical iOS device only):
1. SignIn screen
2. Tap "Sign in with Apple"
3. Native Apple dialog appears
4. Authenticate
5. Returns to app → navigates to Home

**Google Sign In** (Requires OAuth setup):
1. SignIn screen
2. Tap "Sign in with Google"
3. Browser opens with Google OAuth
4. Select account
5. Redirects back to app
6. Navigates to Home

### Test Navigation

1. **Bottom Tabs**: Tap each tab (Home, Run, Chat, Profile)
2. **Theme Toggle**: Profile → Toggle dark mode switch
3. **Sign Out**: Profile → Sign out → Returns to SignIn

### Test Backend Integration

1. **Chat**:
   - Go to Chat tab
   - Send message: "Hello"
   - Wait for AI response
   - Should receive reply from Railway backend

2. **Health Check** (optional):
   ```javascript
   // In app, open debug menu
   // Run in console:
   import { apiClient } from './src/services/api/client';
   apiClient.healthCheck().then(console.log);
   // Should log: { status: "ok", message: "..." }
   ```

---

## 🚀 Next Steps

### After Installation

1. **Test Core Features**: Auth, navigation, chat
2. **Configure OAuth** (if needed): See `NAVIGATION_AND_BACKEND_INTEGRATION.md`
3. **Test on Physical Devices**: iOS and Android
4. **Review Documentation**: Check `Zed/README_START_HERE.md`

### Before Production

1. **Environment Variables**: Set production values
2. **OAuth Providers**: Configure Apple/Google for production
3. **Backend**: Verify Railway production deployment
4. **Testing**: Run through `UI_TESTING_CHECKLIST.md`
5. **Build**: Create production builds for app stores

---

## 📚 Documentation Index

**Quick Start**:
- `INSTALL_AND_RUN.md` (this file)
- `README_START_HERE.md` - Project overview

**Implementation**:
- `SESSION_1-4_COMPLETE.md` - UI sessions 1-4
- `SESSION_5-7_COMPLETE.md` - UI sessions 5-7
- `IMPLEMENTATION_SUMMARY.md` - Complete summary

**Integration**:
- `NAVIGATION_AND_BACKEND_INTEGRATION.md` - Navigation & backend setup
- `UI_TESTING_CHECKLIST.md` - Testing guide

**Reference**:
- `UI_REDESIGN_MASTER_PLAN.md` - Design specs
- `UI_COMPONENT_INVENTORY.md` - Component list

---

## ✅ Success Criteria

You're ready to develop when:

- [x] App runs without crashes
- [x] SignIn screen displays correctly
- [x] Can navigate to SignUp screen
- [x] Can create account (with Supabase)
- [x] After login, see 4-tab navigation
- [x] All tabs are accessible
- [x] Dark mode toggle works
- [x] Chat sends messages (even if backend is down, shows error)

---

## 💡 Quick Commands Reference

```bash
# Start dev server
npm start

# Start with cache clear
npm start --reset-cache

# Run iOS (Mac only)
npm run ios

# Run Android
npm run android

# Install dependencies
npm install

# Check for issues
npm run test

# View logs
# (automatic in terminal running npm start)
```

---

## 🎉 You're Ready!

Your VoiceFit app is now set up and ready for development!

**Current Status**:
- ✅ UI completely redesigned (Sessions 1-7)
- ✅ Navigation wired up
- ✅ Backend integrated (Railway)
- ✅ OAuth ready (needs provider config)
- ✅ Dark mode working
- ✅ Real data integration

**What Works**:
- Complete UI (21 components, 7 screens)
- Authentication (email/password, SSO ready)
- Navigation (4-tab bottom tabs)
- Chat (connected to Railway backend)
- Theme toggle (light/dark mode)
- GPS tracking (maps)

**What's Next**:
- Configure OAuth providers (optional)
- Test all features thoroughly
- Deploy to app stores

---

**Happy coding! 🚀**

**Need help?** Check the documentation in `VoiceFit/Zed/` folder.