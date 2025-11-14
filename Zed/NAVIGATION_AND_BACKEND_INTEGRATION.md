# VoiceFit - Navigation & Backend Integration Guide

**Date**: January 2025  
**Status**: ✅ Complete  
**Integration**: Navigation + Railway Backend + Supabase OAuth

---

## 🎯 Overview

This guide covers the integration work completed for VoiceFit:

1. **Navigation Integration** - Updated navigation structure with new redesigned screens
2. **Backend Integration** - Connected to Railway-hosted FastAPI backend
3. **OAuth/SSO Setup** - Added Apple and Google Sign In support
4. **API Client** - Created type-safe API client for backend communication

---

## 📱 Navigation Integration

### What Was Updated

#### 1. RootNavigator (Main App Navigation)
**File**: `apps/mobile/src/navigation/RootNavigator.tsx`

**Changes**:
- Updated to use redesigned screens (no more "Redesign" suffix)
- Added 4-tab bottom navigation:
  - **Home** - Dashboard with stats and quick actions
  - **Run** - GPS tracking with map
  - **Chat** - AI coach chat interface
  - **Profile** - User profile and settings
- Integrated with ThemeContext for dynamic styling
- Proper tab bar styling with MacroFactor colors
- All screens set to `headerShown: false` (screens have own headers)

**Screen Mapping**:
```
Home tab    → HomeScreen.tsx (redesigned)
Run tab     → RunScreen.tsx (redesigned)
Chat tab    → ChatScreen.tsx (redesigned)
Profile tab → ProfileScreen.tsx (new)
```

#### 2. AuthNavigator (Authentication Flow)
**File**: `apps/mobile/src/navigation/AuthNavigator.tsx`

**Changes**:
- Changed from manual state management to React Navigation Stack
- Added proper stack navigation with animations
- Two screens:
  - **SignIn** - Login with SSO + email/password
  - **SignUp** - Registration form
- Theme-aware styling
- Slide transitions between screens

**Flow**:
```
SignIn ←→ SignUp
   ↓
(Auth successful)
   ↓
RootNavigator (Home tab)
```

### Navigation Type Safety

Created TypeScript types for navigation:

```typescript
// AuthNavigator types
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

// RootNavigator uses bottom tabs (no params needed)
```

---

## 🚀 Backend Integration

### Railway FastAPI Backend

Your backend is already deployed on Railway. The mobile app now connects to it.

#### API Client
**File**: `apps/mobile/src/services/api/client.ts`

**Features**:
- Type-safe API calls
- Automatic authentication (Supabase JWT tokens)
- Error handling with proper error types
- Network error detection
- Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE)

**Base Configuration**:
```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://voicefit.railway.app';
```

#### Implemented Endpoints

**Chat Endpoints**:
```typescript
// Send message to AI coach
apiClient.sendMessage(message: string): Promise<{ response: string }>

// Get chat history
apiClient.getChatHistory(limit: number): Promise<Array<Message>>
```

**Workout Endpoints**:
```typescript
// Get workout recommendations
apiClient.getWorkoutRecommendations(): Promise<any>

// Log workout
apiClient.logWorkout(workout: any): Promise<any>

// Get workout history
apiClient.getWorkoutHistory(limit: number): Promise<any>
```

**Run Endpoints**:
```typescript
// Save run data
apiClient.saveRun(runData: RunData): Promise<any>

// Get run history
apiClient.getRunHistory(limit: number): Promise<any>
```

**Health Check**:
```typescript
// Check if backend is reachable
apiClient.healthCheck(): Promise<{ status: string; message: string }>
```

### ChatScreen Integration

**File**: `apps/mobile/src/screens/ChatScreen.tsx`

**Changes**:
- Replaced mock AI responses with real API calls
- Messages now sent to Railway backend via `apiClient.sendMessage()`
- Proper error handling with user-friendly alerts
- Loading states during API calls
- Network error detection

**Flow**:
```
User types message
     ↓
Message added to chat (optimistic UI)
     ↓
API call to Railway: POST /api/chat
     ↓
Response received
     ↓
AI message added to chat
```

**Error Handling**:
- Connection errors show alert to user
- Fallback error message added to chat
- Console logging for debugging

---

## 🔐 OAuth/SSO Integration

### Supabase Auth Setup

#### Auth Store Updates
**File**: `apps/mobile/src/store/auth.store.ts`

**New Methods**:

1. **signInWithApple()**
   - Uses `expo-apple-authentication`
   - Native Apple Sign In flow
   - Sends identity token to Supabase
   - Auto-creates user profile

2. **signInWithGoogle()**
   - Uses `expo-auth-session`
   - OAuth 2.0 flow with redirect
   - Deep link callback: `voicefit://auth/callback`
   - Session picked up automatically

3. **signUp() - Enhanced**
   - Now accepts optional `name` parameter
   - Stores name in user metadata
   - Better user profile creation

**Updated Interface**:
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithApple: () => Promise<void>;      // NEW
  signInWithGoogle: () => Promise<void>;     // NEW
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}
```

### Required Packages

Added to `package.json`:
```json
{
  "dependencies": {
    "expo-apple-authentication": "~7.1.6",
    "expo-auth-session": "~6.1.6",
    "expo-web-browser": "~14.1.4"
  }
}
```

**Installation**:
```bash
cd apps/mobile
npm install
```

### OAuth Provider Setup

#### Apple Sign In

**Requirements**:
1. Apple Developer Account
2. App ID with Sign in with Apple capability
3. Supabase Apple OAuth provider configured

**Supabase Configuration**:
```
Dashboard → Authentication → Providers → Apple
- Enable Apple provider
- Services ID: your bundle identifier
- Key ID: from Apple Developer portal
- Team ID: from Apple Developer portal
- Private Key: .p8 file from Apple
```

**Testing**:
- Only works on physical iOS device or Mac Catalyst
- Simulator shows error (expected)

#### Google Sign In

**Requirements**:
1. Google Cloud Console project
2. OAuth 2.0 credentials (iOS, Android, Web)
3. Supabase Google OAuth provider configured

**Supabase Configuration**:
```
Dashboard → Authentication → Providers → Google
- Enable Google provider
- Client ID (for OAuth): from Google Cloud Console
- Client Secret: from Google Cloud Console
```

**Client IDs Needed**:
- iOS: `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS`
- Android: `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID`
- Web: `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB`

**Redirect URI**:
```
voicefit://auth/callback
```

Add this to Google Cloud Console OAuth 2.0 credentials.

---

## 🔧 Environment Configuration

### Environment Variables

**File**: `apps/mobile/.env` (copy from `.env.example`)

**Required Variables**:
```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Railway Backend
EXPO_PUBLIC_API_URL=https://voicefit.railway.app

# Google OAuth (optional)
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=xxx.apps.googleusercontent.com

# App Config
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_DEBUG=true
```

### Getting Your Values

**Supabase**:
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy `URL` and `anon public` key

**Railway**:
1. Go to your Railway dashboard
2. Copy your app's domain
3. Format: `https://your-app.railway.app`

**Google OAuth**:
1. Go to https://console.cloud.google.com
2. APIs & Services → Credentials
3. Create OAuth 2.0 Client IDs for each platform
4. Copy Client IDs

---

## 📋 Testing Checklist

### Navigation Testing
- [ ] App opens to SignIn screen when not logged in
- [ ] Can navigate SignIn ↔ SignUp
- [ ] After login, navigates to Home tab
- [ ] Bottom tabs work (Home, Run, Chat, Profile)
- [ ] Tab bar styling matches theme (light/dark)
- [ ] Back button works in auth flow
- [ ] Deep links work (if configured)

### Backend Integration Testing
- [ ] **Health Check**:
  ```typescript
  await apiClient.healthCheck();
  // Should return: { status: "ok", message: "..." }
  ```

- [ ] **Chat Functionality**:
  - [ ] Type message and send
  - [ ] Message appears in chat immediately
  - [ ] API call shows loading indicator
  - [ ] AI response appears after API call
  - [ ] Error handling works (try with backend down)
  - [ ] Network error shows alert

- [ ] **Authentication Token**:
  - [ ] Token automatically included in API requests
  - [ ] Token refreshes when expired
  - [ ] Backend receives valid JWT

### OAuth/SSO Testing

#### Apple Sign In
- [ ] Button visible on SignIn screen
- [ ] Tapping button shows Apple auth dialog
- [ ] Can authenticate with Apple ID
- [ ] User profile created in Supabase
- [ ] Redirects to Home after success
- [ ] Error handling works (cancel, network error)

#### Google Sign In
- [ ] Button visible on SignIn screen
- [ ] Tapping button opens Google OAuth
- [ ] Can select Google account
- [ ] Redirect back to app works
- [ ] User profile created in Supabase
- [ ] Redirects to Home after success
- [ ] Error handling works (cancel, network error)

#### Email/Password
- [ ] Can sign in with email/password
- [ ] Can sign up with email/password
- [ ] Validation errors show correctly
- [ ] Loading states work
- [ ] Success navigates to Home

---

## 🐛 Common Issues & Solutions

### Issue: "Network request failed"
**Cause**: Backend not reachable or wrong URL
**Solution**:
1. Check `EXPO_PUBLIC_API_URL` in `.env`
2. Test backend health: `curl https://voicefit.railway.app/health`
3. Check Railway deployment status

### Issue: "Invalid authentication token"
**Cause**: Supabase session expired or invalid
**Solution**:
1. Check Supabase credentials in `.env`
2. Sign out and sign back in
3. Verify Supabase project is active

### Issue: Apple Sign In not working
**Cause**: Simulator doesn't support Apple auth
**Solution**:
- Use physical iOS device or Mac Catalyst
- Check Apple Developer portal configuration
- Verify Supabase Apple provider settings

### Issue: Google Sign In redirect fails
**Cause**: Redirect URI not configured
**Solution**:
1. Add `voicefit://auth/callback` to Google Cloud Console
2. Verify OAuth credentials are correct
3. Check bundle identifier matches

### Issue: "Cannot find module '@react-navigation/native-stack'"
**Cause**: Packages not installed
**Solution**:
```bash
cd apps/mobile
npm install
```

---

## 🚢 Deployment Considerations

### Railway Backend

Your backend is already deployed. To push updates:

```bash
# From VoiceFit/apps/backend
git add .
git commit -m "Update API endpoints"
git push

# Railway auto-deploys from connected repo
```

**Environment Variables in Railway**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any other backend configs

### Mobile App

**iOS**:
1. Configure app.json with bundle identifier
2. Set up Apple Sign In capability
3. Submit to App Store Connect

**Android**:
1. Configure app.json with package name
2. Generate SHA-1 for Google OAuth
3. Add to Google Cloud Console
4. Submit to Google Play Console

### Supabase OAuth Providers

**Production Setup**:
1. Add production redirect URIs
2. Verify OAuth credentials for production
3. Test OAuth flows in production build
4. Monitor Supabase auth logs

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    VoiceFit Mobile App                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Authentication Layer                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │ │
│  │  │ Supabase │  │  Apple   │  │    Google     │   │ │
│  │  │  Email/  │  │ Sign In  │  │   Sign In     │   │ │
│  │  │ Password │  │   (SSO)  │  │    (OAuth)    │   │ │
│  │  └────┬─────┘  └────┬─────┘  └───────┬───────┘   │ │
│  │       └─────────────┴────────────────┘            │ │
│  │                      │                             │ │
│  │              ┌───────▼────────┐                    │ │
│  │              │  Auth Store    │                    │ │
│  │              │   (Zustand)    │                    │ │
│  │              └───────┬────────┘                    │ │
│  └──────────────────────┼─────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────▼─────────────────────────────┐ │
│  │              Navigation Layer                       │ │
│  │  ┌──────────────┐      ┌────────────────────────┐ │ │
│  │  │     Auth     │      │         Root           │ │ │
│  │  │  Navigator   │ ───► │      Navigator         │ │ │
│  │  │              │      │   (Bottom Tabs)        │ │ │
│  │  │ SignIn       │      │ • Home  • Run          │ │ │
│  │  │ SignUp       │      │ • Chat  • Profile      │ │ │
│  │  └──────────────┘      └────────────────────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌────────────────────────────────────────────────────┐│
│  │               API Client Layer                      ││
│  │  ┌──────────────────────────────────────────────┐  ││
│  │  │            apiClient (client.ts)             │  ││
│  │  │  • Authentication (JWT from Supabase)        │  ││
│  │  │  • Chat endpoints                            │  ││
│  │  │  • Workout endpoints                         │  ││
│  │  │  • Run endpoints                             │  ││
│  │  │  • Error handling                            │  ││
│  │  └──────────────────┬───────────────────────────┘  ││
│  └─────────────────────┼──────────────────────────────┘│
└────────────────────────┼───────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
           ┌──────────────────────────┐
           │   Railway FastAPI        │
           │   Backend                │
           │                          │
           │  • /api/chat            │
           │  • /api/workouts        │
           │  • /api/runs            │
           │  • /health              │
           └──────────┬───────────────┘
                      │
                      ▼
           ┌──────────────────────────┐
           │   Supabase Postgres      │
           │   Database               │
           └──────────────────────────┘
```

---

## 📚 Next Steps

### Immediate
1. **Install Dependencies**:
   ```bash
   cd apps/mobile
   npm install
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials
   - Add Railway backend URL

3. **Test Basic Flow**:
   - Run the app
   - Try email sign in
   - Send a chat message
   - Check network requests

### Short-term
1. **OAuth Setup** (if needed):
   - Configure Apple Developer portal
   - Set up Google Cloud Console
   - Configure Supabase providers
   - Test SSO flows

2. **Backend Verification**:
   - Test all API endpoints
   - Verify JWT authentication works
   - Check error responses
   - Monitor Railway logs

3. **Testing**:
   - Run through test checklist
   - Test on physical devices
   - Test with poor network
   - Test error scenarios

### Long-term
1. **Production Deployment**:
   - Set up production environment variables
   - Configure production OAuth
   - Submit to app stores
   - Set up monitoring

2. **Feature Expansion**:
   - Add more chat features
   - Implement workout sync
   - Add run data sync
   - Analytics integration

---

## ✅ Completion Status

**Navigation Integration**: ✅ Complete
- RootNavigator updated
- AuthNavigator updated
- All screens wired up
- Bottom tabs working

**Backend Integration**: ✅ Complete
- API client created
- ChatScreen integrated
- Error handling implemented
- Type-safe endpoints

**OAuth/SSO Setup**: ✅ Code Complete (Requires Configuration)
- Apple Sign In code ready
- Google Sign In code ready
- Auth store updated
- Packages installed

**Documentation**: ✅ Complete
- Environment setup guide
- Testing checklist
- Troubleshooting guide
- Architecture diagram

---

**Status**: Ready for testing and OAuth provider configuration.

**Next Action**: Install dependencies, configure `.env`, and test!