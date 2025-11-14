 VoiceFit SSO Setup Guide

**Version**: 1.0  
**Date**: January 15, 2025  
**Status**: Implementation Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Apple Sign-In Setup](#apple-sign-in-setup)
3. [Google Sign-In Setup](#google-sign-in-setup)
4. [Supabase Configuration](#supabase-configuration)
5. [Backend Integration](#backend-integration)
6. [Mobile Implementation](#mobile-implementation)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

VoiceFit supports Single Sign-On (SSO) through:
- **Apple Sign-In** - For iOS users
- **Google Sign-In** - For iOS and Android users

This guide covers setup for both platforms.

### Benefits of SSO

✅ Faster signup/signin  
✅ No password to remember  
✅ One-tap authentication  
✅ Secure OAuth 2.0 protocol  
✅ User data stored securely in Supabase Auth

---

## Apple Sign-In Setup

### Prerequisites

- Apple Developer Account ($99/year)
- Xcode project with iOS target
- Bundle identifier for VoiceFit app

### Step 1: Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Sign in with your Apple ID
3. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
4. Click the **+** button
5. Select **App IDs**, click **Continue**
6. Select **App**, click **Continue**
7. Fill in details:
   - **Description**: VoiceFit
   - **Bundle ID**: `com.voicefit.app` (or your actual bundle ID)
8. Scroll down and check **Sign in with Apple**
9. Click **Continue**, then **Register**

### Step 2: Create Service ID

1. Go back to **Identifiers** in Apple Developer Portal
2. Click the **+** button
3. Select **Services IDs**, click **Continue**
4. Fill in:
   - **Description**: VoiceFit Service
   - **Identifier**: `com.voicefit.app.service`
5. Check **Sign in with Apple**
6. Click **Configure**
7. Choose your primary App ID (VoiceFit)
8. Under **Web Authentication Configuration**:
   - **Primary Domain**: Your backend domain (e.g., `api.voicefit.app`)
   - **Return URLs**: Add your Supabase redirect URL
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
9. Save and Continue

### Step 3: Create Sign in with Apple Private Email Relay

This allows users to keep their email private when signing in with Apple.

1. In the Service ID configuration, note the **Team ID** (10-character code)
2. Keep the Service ID handy for Supabase configuration

### Step 4: Create Private Key

1. Go to **Keys** in Apple Developer Portal
2. Click the **+** button
3. Select **App Signing Key**
4. Choose **Sign in with Apple**, click **Continue**
5. Give it a name: `VoiceFit SignIn Key`
6. Click **Configure**, select your Service ID
7. Click **Save**, then **Register**
8. Download the private key (`.p8` file)
   - ⚠️ This is the ONLY download - save it securely
   - Store in 1Password or secure vault

### Step 5: Supabase Configuration

In Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. Find **Apple** and click **Enable**
3. Fill in:
   - **Team ID**: Your 10-character Apple Team ID
   - **Service ID**: `com.voicefit.app.service`
   - **Key ID**: From the private key file name
   - **Apple private key**: Paste entire contents of `.p8` file
4. Click **Save**

---

## Google Sign-In Setup

### Prerequisites

- Google Cloud Account
- Google Cloud Project
- OAuth 2.0 credentials

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at top
3. Click **NEW PROJECT**
4. Name: `VoiceFit`
5. Click **CREATE**

### Step 2: Enable OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** for user type
3. Click **CREATE**
4. Fill in:
   - **App name**: VoiceFit
   - **User support email**: your-email@example.com
   - **Developer contact**: your-email@example.com
5. Click **SAVE AND CONTINUE** through all sections
6. Click **BACK TO DASHBOARD**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Choose **iOS** as application type
4. Fill in:
   - **Name**: VoiceFit iOS
   - **Bundle ID**: `com.voicefit.app`
   - **Team ID**: Your Apple Team ID (from Apple Developer Portal)
5. Click **CREATE**
6. Copy the **Client ID** (looks like `xxx.apps.googleusercontent.com`)

### Step 4: Create Web Client

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. Choose **Web application**
3. Name: `VoiceFit Web`
4. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
5. Click **CREATE**
6. Copy the **Client ID** and **Client Secret**

### Step 5: Supabase Configuration

In Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Fill in:
   - **Client ID**: From web client credentials
   - **Client Secret**: From web client credentials
4. Click **Save**

---

## Supabase Configuration

### Database Schema Updates

Add SSO-related fields to users table:

```sql
-- Add auth provider column (if not exists)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email' CHECK (auth_provider IN ('email', 'apple', 'google'));

-- Add last sign in timestamp
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider 
ON public.profiles(auth_provider);
```

### User Metadata Setup

When users sign in with SSO, store provider info in user metadata:

```sql
-- Trigger to automatically set auth_provider from Supabase identities
CREATE OR REPLACE FUNCTION public.handle_auth_provider()
RETURNS TRIGGER AS $$
DECLARE
  provider TEXT;
BEGIN
  -- Get provider from the first identity (most recent)
  SELECT provider INTO provider
  FROM auth.identities
  WHERE user_id = NEW.id
  LIMIT 1;
  
  IF provider IS NOT NULL THEN
    UPDATE public.profiles
    SET auth_provider = provider,
        last_sign_in_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_auth_provider();
```

### Redirect URLs

Add these to Supabase → **Authentication** → **URL Configuration**:

**Redirect URLs**:
```
com.voicefit.app://auth/callback
http://localhost:3000/auth/callback
```

**Site URL**:
```
com.voicefit.app://
```

---

## Backend Integration

### Node.js/Express Backend

```javascript
// routes/auth.js
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /auth/callback
router.post('/callback', async (req, res) => {
  const { user } = req.body;

  try {
    // User data is already stored in Supabase Auth
    // Just need to create profile if it doesn't exist
    
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile && !fetchError) {
      // Create new profile
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.user_metadata?.full_name,
          email: user.email,
          auth_provider: user.identities?.[0]?.provider || 'email',
        });

      if (createError) throw createError;
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Auth callback error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /auth/user/:id
router.get('/user/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    return res.json(user);
  } catch (error) {
    console.error('Fetch user error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
```

### FastAPI Backend (Python)

```python
# app/routers/auth.py
from fastapi import APIRouter, HTTPException, status
from supabase import create_client, Client
import os

router = APIRouter(prefix="/auth", tags=["auth"])

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

@router.post("/callback")
async def auth_callback(user_data: dict):
    """Handle OAuth callback"""
    try:
        user_id = user_data.get("id")
        
        # Check if profile exists
        response = supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        if not response.data:
            # Create new profile
            name = (
                user_data.get("user_metadata", {}).get("name") or
                user_data.get("user_metadata", {}).get("full_name") or
                user_data.get("email", "").split("@")[0]
            )
            
            provider = "email"
            if user_data.get("identities"):
                provider = user_data["identities"][0].get("provider", "email")
            
            supabase.table("profiles").insert({
                "id": user_id,
                "name": name,
                "email": user_data.get("email"),
                "auth_provider": provider,
            }).execute()
        
        return {"success": True, "user_id": user_id}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user/{user_id}")
async def get_user(user_id: str):
    """Get user profile"""
    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return response.data[0]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
```

---

## Mobile Implementation

### React Native Setup

#### Install Dependencies

```bash
cd apps/mobile
npm install --legacy-peer-deps \
  @supabase/supabase-js \
  @react-native-async-storage/async-storage \
  @react-native-google-signin/google-signin \
  react-native-url-polyfill
```

#### Configure Apple Sign-In (Xcode)

1. Open `ios/VoiceFit.xcworkspace` in Xcode
2. Select **VoiceFit** project → **VoiceFit** target
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **Sign in with Apple**
6. Select your team and signing certificate

#### Configure Google Sign-In (Native)

In `ios/Podfile`:

```ruby
pod 'GoogleSignIn', '~> 7.0'
```

Then run:

```bash
cd ios && pod install && cd ..
```

#### Environment Variables

Add to `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_GOOGLE_IOS_CLIENT_ID
```

#### App.tsx Integration

```typescript
import { useEffect } from 'react';
import { supabase } from './services/database/supabase.client';
import { useAuthStore } from './store/auth.store';

export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    // Check session on app start
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          // User signed in
          useAuthStore.setState({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name,
              authProvider: session.user.identities?.[0]?.provider as any || 'email',
            },
            session,
          });
        } else {
          // User signed out
          useAuthStore.setState({ user: null, session: null });
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [checkSession]);

  // Rest of app...
}
```

---

## Testing

### Test Scenarios

#### Test 1: Apple Sign-In

1. Run app on iOS device or simulator
2. Navigate to sign-in screen
3. Tap "Sign in with Apple"
4. Authenticate with Apple ID
5. Verify user created in Supabase Auth
6. Verify profile created in database

**Expected Result**: User logged in, redirected to home screen

#### Test 2: Google Sign-In

1. Run app on iOS device
2. Navigate to sign-in screen
3. Tap "Sign in with Google"
4. Authenticate with Google account
5. Verify user created in Supabase Auth
6. Verify profile created in database

**Expected Result**: User logged in, redirected to home screen

#### Test 3: Email Sign-In (Fallback)

1. Navigate to sign-in screen
2. Enter email and password
3. Tap "Sign In"
4. Verify user authenticated
5. Verify profile loaded

**Expected Result**: User logged in

#### Test 4: SSO User Switching

1. Sign in with Apple
2. Sign out
3. Sign in with Google (same email)
4. Verify linked to same profile

**Expected Result**: User has access to same account

#### Test 5: Offline Login (Cached)

1. Sign in successfully
2. Close app
3. Turn off network
4. Reopen app
5. Verify user still logged in (from cache)

**Expected Result**: User session persists offline

### Manual Testing Checklist

- [ ] Apple Sign-In works on iOS
- [ ] Google Sign-In works on iOS
- [ ] Email/password fallback works
- [ ] User data saved correctly
- [ ] Dark mode works on auth screens
- [ ] Error messages display correctly
- [ ] Loading states show properly
- [ ] Password show/hide toggles
- [ ] Terms checkbox required for signup
- [ ] Password strength indicator works
- [ ] Navigation between screens works
- [ ] Forgot password flow works

---

## Troubleshooting

### Common Issues

#### Issue: "Invalid Service ID"

**Cause**: Service ID doesn't match Supabase configuration

**Solution**:
1. Verify Service ID in Apple Developer Portal
2. Ensure it matches exactly in Supabase
3. Regenerate Supabase configuration

#### Issue: "Redirect URL mismatch"

**Cause**: Supabase redirect URL doesn't match app configuration

**Solution**:
1. In Supabase, check **Authentication** → **URL Configuration**
2. Add correct redirect URLs:
   - `com.voicefit.app://auth/callback`
   - Backend API callback URL

#### Issue: "Google Sign-In fails with network error"

**Cause**: Google Cloud credentials invalid or expired

**Solution**:
1. Regenerate Google OAuth credentials
2. Update Supabase with new Client ID and Secret
3. Clear app cache and retry

#### Issue: "Identities not showing in Supabase"

**Cause**: Auth provider not properly linked

**Solution**:
1. Check user's linked providers in Supabase Dashboard
2. Ensure OAuth flow completed successfully
3. Check browser console for errors

#### Issue: "Profile not created on SSO signin"

**Cause**: Trigger didn't fire or database error

**Solution**:
1. Check database logs for errors
2. Manually create profile:
   ```sql
   INSERT INTO public.profiles (id, email, auth_provider)
   VALUES ('USER_ID', 'user@example.com', 'apple')
   ```
3. Verify trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

#### Issue: "Apple private key rejected"

**Cause**: Key format incorrect or expired

**Solution**:
1. Regenerate key in Apple Developer Portal
2. Download new `.p8` file
3. Paste entire contents (including header/footer) into Supabase
4. Verify Key ID matches

### Debug Mode

Enable detailed logging:

```typescript
// In auth.store.ts, add:
const signInWithSSO = async (provider) => {
  console.log('[SSO] Starting sign in with', provider);
  try {
    // ... auth code
    console.log('[SSO] Success:', data);
  } catch (error) {
    console.error('[SSO] Error:', error);
    throw error;
  }
};
```

---

## Security Best Practices

### Do's ✅

- ✅ Store secrets in environment variables
- ✅ Use HTTPS for all callbacks
- ✅ Validate OAuth tokens on backend
- ✅ Never expose private keys in code
- ✅ Rotate secrets regularly
- ✅ Use secure storage for user tokens
- ✅ Implement rate limiting on auth endpoints

### Don'ts ❌

- ❌ Don't hardcode API keys
- ❌ Don't expose private keys in git
- ❌ Don't skip email verification
- ❌ Don't store plain passwords
- ❌ Don't bypass CSRF protection
- ❌ Don't trust client-side validation alone
- ❌ Don't expose user IDs in public APIs

---

## Next Steps

1. **Complete Apple setup** using steps 1-5 above
2. **Complete Google setup** using steps 1-5 above
3. **Configure Supabase** with both providers
4. **Update backend** with user creation logic
5. **Test all flows** using test scenarios above
6. **Deploy to production** with monitoring

---

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Apple Sign-In Guide](https://developer.apple.com/sign-in-with-apple/)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [React Native Auth Best Practices](https://reactnative.dev)

---

**Document Version**: 1.0  
**Last Updated**: January 15, 2025  
**Status**: Ready for Implementation  
**Maintained by**: VoiceFit Development Team