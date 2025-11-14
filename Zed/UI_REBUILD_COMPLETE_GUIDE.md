# VoiceFit UI Rebuild - Complete Implementation Guide

**Created**: November 14, 2025  
**Status**: READY TO EXECUTE  
**Source**: Official UI Redesign Specification + ProfileScreen Code + SSO Guide  
**Timeline**: 5-7 sessions (10-14 hours)

---

## 📋 Table of Contents

1. [Design System](#design-system)
2. [File Structure](#file-structure)
3. [Component Library](#component-library)
4. [Screen Specifications](#screen-specifications)
5. [Session Plan](#session-plan)
6. [Testing Checklist](#testing-checklist)

---

## 🎨 Design System

### Color Palette (MacroFactor-Inspired)

#### Light Mode
```javascript
colors: {
  light: {
    background: {
      primary: '#FFFFFF',      // Main background
      secondary: '#F8F9FA',    // Cards, sections
      tertiary: '#E9ECEF',     // Dividers
    },
    text: {
      primary: '#000000',      // Headlines
      secondary: '#495057',    // Body text
      tertiary: '#6C757D',     // Labels, captions
      disabled: '#ADB5BD',     // Disabled states
    },
    accent: {
      blue: '#007AFF',         // Primary actions (iOS blue)
      coral: '#FF6B6B',        // Data emphasis (MacroFactor)
      orange: '#FF9500',       // Warnings, streaks
      green: '#34C759',        // Success, PRs
      purple: '#AF52DE',       // Data viz
      teal: '#5AC8FA',         // Data viz
      yellow: '#FFCC00',       // Data viz
    },
    chat: {
      userBubble: '#007AFF',   // Blue (iOS Messages)
      aiBubble: '#F8F9FA',     // Light gray
      userText: '#FFFFFF',
      aiText: '#000000',
    },
  },
}
```

#### Dark Mode
```javascript
dark: {
  background: {
    primary: '#000000',      // True black
    secondary: '#1C1C1E',    // Cards
    tertiary: '#2C2C2E',     // Dividers
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E7',
    tertiary: '#98989D',
    disabled: '#48484A',
  },
  accent: {
    blue: '#0A84FF',         // Brighter for dark mode
    coral: '#FF6B6B',
    orange: '#FF9F0A',
    green: '#30D158',
    purple: '#BF5AF2',
  },
}
```

### Typography (SF Pro - iOS System Font)

```javascript
fontSize: {
  xs: 11,      // Timestamps, captions
  sm: 13,      // Labels, secondary text
  base: 15,    // Body (iOS standard)
  md: 17,      // Emphasized body
  lg: 20,      // Subheadings
  xl: 24,      // Section headers
  '2xl': 28,   // Screen titles
  '3xl': 34,   // Large titles (MacroFactor "DASHBOARD")
}

fontWeight: {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}

lineHeight: {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
}
```

### Spacing (8pt Grid)

```javascript
spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
}
```

### Border Radius

```javascript
borderRadius: {
  sm: 8,      // Buttons, inputs
  md: 12,     // Cards
  lg: 16,     // Large cards
  xl: 20,     // Hero elements
  full: 9999, // Circular (avatars, pills)
}
```

### Shadows (iOS-style)

```javascript
shadows: {
  sm: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  md: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
  lg: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
  xl: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 16 },
}
```

---

## 📂 File Structure

### Archive Old Files First

```bash
mkdir -p apps/mobile/src/screens/archive
mv apps/mobile/src/screens/HomeScreenRedesign.tsx apps/mobile/src/screens/archive/
mv apps/mobile/src/screens/LogScreenRedesign.tsx apps/mobile/src/screens/archive/
mv apps/mobile/src/screens/RunScreenRedesign.tsx apps/mobile/src/screens/archive/
mv apps/mobile/src/screens/LoginScreen.tsx apps/mobile/src/screens/archive/
mv apps/mobile/src/screens/ChatScreen.tsx apps/mobile/src/screens/archive/
mv apps/mobile/src/screens/SettingsScreen.tsx apps/mobile/src/screens/archive/
```

### New File Structure

```
apps/mobile/src/
├── theme/
│   ├── tokens.js (UPDATE with MacroFactor colors)
│   └── ThemeContext.tsx (NEW)
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx (NEW)
│   │   ├── Input.tsx (NEW)
│   │   ├── Card.tsx (NEW)
│   │   └── PillBadge.tsx (NEW)
│   │
│   ├── auth/
│   │   ├── SSOButton.tsx (NEW)
│   │   ├── AuthContainer.tsx (NEW)
│   │   └── ErrorMessage.tsx (NEW)
│   │
│   ├── profile/
│   │   ├── Avatar.tsx (NEW)
│   │   └── SettingsSection.tsx (NEW)
│   │
│   ├── chat/
│   │   ├── ChatBubble.tsx (NEW)
│   │   ├── ChatInput.tsx (NEW)
│   │   └── ChatHeader.tsx (NEW)
│   │
│   └── dashboard/
│       ├── MetricCard.tsx (NEW)
│       ├── TimelineItem.tsx (NEW)
│       └── StatsOverview.tsx (NEW)
│
└── screens/
    ├── SignInScreen.tsx (NEW - NO "Redesign" suffix)
    ├── SignUpScreen.tsx (NEW)
    ├── ProfileScreen.tsx (NEW - use code from Zed/Profile Screen.txt)
    ├── ChatScreen.tsx (NEW)
    ├── HomeScreen.tsx (NEW)
    └── RunScreen.tsx (NEW)
```

---

## 🧩 Component Library

### Core UI Components

#### 1. Button Component
**File**: `components/ui/Button.tsx`

**Props**:
- variant: 'primary' | 'secondary' | 'ghost' | 'outline'
- size: 'sm' | 'md' | 'lg'
- fullWidth, loading, disabled
- leftIcon, rightIcon
- onPress, children

**Styles**:
- Primary: Blue fill (#007AFF), white text
- Secondary: Gray fill (#F8F9FA), black text
- Ghost: Transparent, blue text
- Outline: Blue border, blue text
- Heights: sm (36), md (44), lg (52)

#### 2. Input Component
**File**: `components/ui/Input.tsx`

**Props**:
- type: 'text' | 'email' | 'password' | 'number'
- label, placeholder, value, onChangeText
- error, helperText
- leftIcon, rightIcon, disabled

**Features**:
- Show/hide password toggle (Eye icon)
- Focus state (border becomes blue)
- Error state (border becomes red)
- Height: 52pt, Border radius: 12pt

#### 3. Card Component
**File**: `components/ui/Card.tsx`

**Props**:
- variant: 'default' | 'elevated' | 'outlined'
- padding: 'none' | 'sm' | 'md' | 'lg'
- onPress (optional)

#### 4. PillBadge Component
**File**: `components/ui/PillBadge.tsx`

**Props**:
- text: string
- variant: 'primary' | 'secondary' | 'outlined'
- size: 'sm' | 'md'

**Style**: Like MacroFactor's "2488 / 2468" badge

### Auth Components

#### 5. SSOButton
**File**: `components/auth/SSOButton.tsx`

**Props**:
- provider: 'apple' | 'google'
- onPress, loading

**Specs** (per SSO Setup Guide):
- Apple: Black bg (#000000), white text, Apple logo
- Google: White bg, black text, Google logo
- Height: 52pt, Border radius: 12pt
- Full width, proper brand guidelines

#### 6. AuthContainer
**File**: `components/auth/AuthContainer.tsx`

**Props**:
- title, subtitle, children

**Layout**:
- Logo at top (120x120pt, centered)
- Title (3xl, bold)
- Subtitle (md, secondary)
- Content area
- Keyboard-aware scrolling

#### 7. ErrorMessage
**File**: `components/auth/ErrorMessage.tsx`

**Props**:
- message: string
- type: 'error' | 'warning' | 'info'

### Profile Components

#### 8. Avatar
**File**: `components/profile/Avatar.tsx`

**Props**:
- size: 'sm' (32) | 'md' (48) | 'lg' (80)
- imageUrl, name
- editable (shows camera icon overlay)
- onPress

#### 9. SettingsSection
**File**: `components/profile/SettingsSection.tsx`

**Props**:
- title: string
- items: Array<SettingItem>

**SettingItem**:
- id, label, description
- icon, action
- hasToggle, toggleValue, badge

### Chat Components

#### 10. ChatBubble
**File**: `components/chat/ChatBubble.tsx`

**Props**:
- message: string
- isUser: boolean
- timestamp, status

**Styles** (iOS Messages):
- User: Blue bubble (#007AFF), white text, right-aligned
- AI: Gray bubble (#F8F9FA), black text, left-aligned
- Max width: 75%
- Border radius: 18pt (iOS style, one sharp corner)
- Padding: 12pt vertical, 16pt horizontal

#### 11. ChatInput
**File**: `components/chat/ChatInput.tsx`

**Props**:
- value, onChangeText, onSend
- placeholder, disabled, loading

**Layout**:
- Height: 52pt
- Text input (flexible width)
- Send button (blue circle with arrow)
- Fixed at bottom

#### 12. ChatHeader
**File**: `components/chat/ChatHeader.tsx`

**Props**:
- title, onBack
- onAvatarPress, onWorkoutLogPress

**Layout**:
- Height: 56pt
- Back arrow (left)
- Title (center): "VoiceFit Coach"
- Avatar (right) or Workout log icon

### Dashboard Components

#### 13. MetricCard
**File**: `components/dashboard/MetricCard.tsx`

**Props**:
- title, value, unit
- subtitle, sparkline
- trend ('up' | 'down' | 'neutral'), trendValue
- onPress

**Style** (MacroFactor):
- Card: white bg, shadow, 12pt radius
- Title at top
- Large value center
- Sparkline chart (optional)
- Chevron if tappable

#### 14. TimelineItem
**File**: `components/dashboard/TimelineItem.tsx`

**Props**:
- time, title, subtitle
- icon, metrics
- onPress

**Style** (MacroFactor food log):
- Time badge left
- Icon + title
- Metrics below
- Edit icon right

#### 15. StatsOverview
**File**: `components/dashboard/StatsOverview.tsx`

**Props**:
- stats: Array<{label, value, color}>
- progress (0-100)

**Style** (MacroFactor nutrition circle):
- Circular progress
- Stats breakdown below

---

## 📱 Screen Specifications

### 1. Sign-In Screen

**File**: `screens/SignInScreen.tsx`

**Layout**:
```
┌─────────────────────────┐
│                         │
│    [VoiceFit Logo]      │  120x120pt, centered, 80pt from top
│                         │
│   Welcome Back          │  3xl, bold
│   Sign in to continue   │  md, secondary
│                         │
│  [Sign in with Apple]   │  Black, 52pt height
│  [Sign in with Google]  │  White, 52pt height
│                         │
│  ─────── or ───────     │  Divider
│                         │
│  Email                  │  sm label
│  [email input]          │  52pt height
│                         │
│  Password               │  sm label
│  [password input]       │  52pt height, show/hide
│                         │
│  [Forgot Password?]     │  sm link, right-aligned
│                         │
│  [Sign In Button]       │  Primary, full width, 52pt
│                         │
│  Don't have account?    │
│  [Sign Up]              │  Link
│                         │
└─────────────────────────┘
```

**Requirements**:
- SSO buttons (Apple, Google)
- Email/password fallback
- Forgot password link
- Sign up link
- Loading states
- Error handling
- Keyboard-aware

### 2. Sign-Up Screen

**File**: `screens/SignUpScreen.tsx`

**Similar to Sign-In but with**:
- Full Name field
- Confirm Password field
- Terms & Privacy checkbox (required)
- "Create Account" button
- "Already have account? Sign In" link

### 3. Profile Screen

**File**: `screens/ProfileScreen.tsx`

**Use complete code from**: `Zed/Profile Screen.txt` (589 lines)

**Layout**:
```
┌─────────────────────────┐
│  Profile         [X]    │  Header with close
├─────────────────────────┤
│      ┌─────────┐       │
│      │  [👤]  │       │  Avatar 80pt
│      │ [📷]   │       │  Camera icon overlay
│      └─────────┘       │
│      John Doe          │  Name
│   john@email.com       │  Email
│  [Signed in with Apple]│  Auth provider badge
├─────────────────────────┤
│      ACCOUNT           │  Section header
│  [👤] Personal Info  > │
│  [⌚] Wearables      ⊙>│  Badge if connected
├─────────────────────────┤
│    PREFERENCES         │
│  [🌙] Appearance   [⚫]│  Dark mode toggle
│  [🔔] Notifications  > │
├─────────────────────────┤
│      SUPPORT           │
│  [🛡️] Privacy Policy > │
│  [❓] Help & Support > │
├─────────────────────────┤
│  ┌───────────────────┐ │
│  │   Sign Out   [→]  │ │  Red text
│  └───────────────────┘ │
│  VoiceFit v1.0.0       │  Version
└─────────────────────────┘
```

**Features**:
- Avatar with camera edit
- Settings sections (Account, Preferences, Support)
- Dark mode toggle (wired to ThemeContext)
- Sign out with confirmation modal
- Navigation to sub-screens

### 4. Chat Screen

**File**: `screens/ChatScreen.tsx`

**Layout** (ChatGPT-inspired):
```
┌─────────────────────────┐
│ [≡] VoiceFit Coach [📋] │  Single header, 56pt
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │  AI bubble (left)
│  │ Hey! Ready for... │  │  Gray #F8F9FA
│  │ today's workout?  │  │  18pt radius
│  └───────────────────┘  │
│  9:30 AM                │  Timestamp xs
│                         │
│      ┌───────────────┐  │  User bubble (right)
│      │ Yes! Let's go │  │  Blue #007AFF
│      └───────────────┘  │
│          9:31 AM        │
│                         │
│  ┌───────────────────┐  │
│  │ Great! Starting   │  │
│  │ with warmup...    │  │
│  └───────────────────┘  │
│                         │
├─────────────────────────┤
│ [+] Type message... 🎤 │  Input bar 52pt
└─────────────────────────┘
```

**Specs**:
- Single header (no double header)
- Left: Menu icon (≡) → opens profile
- Right: Workout log icon (📋) → opens workout log modal
- Message bubbles: 75% max width, 18pt radius
- Spacing: 8pt same sender, 16pt different sender
- Input bar: 52pt height, + button, mic button
- Auto-scroll to bottom on new message

**Workout Log Modal**:
```
┌─────────────────────────┐
│ Today's Workout    [×]  │  Modal header
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 🏋️ Bench Press      │ │
│ │ 3 × 8 @ 185 lbs    │ │
│ │ RPE: 8              │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 🏋️ Squats          │ │
│ │ 4 × 10 @ 225 lbs   │ │
│ │ RPE: 7              │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 5. Home Screen

**File**: `screens/HomeScreen.tsx`

**Layout** (MacroFactor-inspired):
```
┌─────────────────────────┐
│ [👤] Thursday, Jan 15    │  Avatar + date
│      Welcome back!       │  Greeting
├─────────────────────────┤
│ ◀ Swipeable Cards ▶    │  Horizontal scroll
│ ┌─────┬─────┬─────┐    │
│ │  0  │  0  │  -  │    │  Shows 2.5 cards
│ │Work │ lbs │ RPE │    │  Width: screen/2.5
│ │outs │ Vol │     │    │  Height: 120pt
│ │[━━━]│[━━━]│[━━━]│    │  Progress bar
│ └─────┴─────┴─────┘    │
│ ⚫⚪⚪                  │  Dots indicator
│                         │
│ Daily Readiness  [Check]│  Gradient card
│ ┌─────────────────────┐ │  100pt height
│ │ 😊 Feeling Good     │ │  Color: green/yellow/red
│ │ Tap to check-in     │ │
│ └─────────────────────┘ │
│                         │
│ Today's Workout         │  Section header lg
│ ┌─────────────────────┐ │
│ │ 🏋️ Chest & Triceps  │ │  120pt height
│ │ 6 exercises         │ │  Card elevated
│ │ [Start Workout]     │ │  Blue button
│ └─────────────────────┘ │
│                         │
│ Workout History    [All]│  Timeline
│ ┌─────────────────────┐ │
│ │ 9:30 AM             │ │  Timeline item
│ │ 🏋️ Bench Press      │ │  Vertical line left
│ │ 185×8, 185×8, 185×8 │ │  Dot + card
│ └─────────────────────┘ │
│                         │
│ Insights & Analytics    │  Section header
│ ┌───────┬───────┐      │  2x2 grid
│ │ 📊    │ 📈    │      │  140pt height each
│ │Volume │Weight │      │  Sparkline preview
│ │Trend  │Trend  │      │  Chevron (›)
│ │+2,890 │-12.3  │      │  Tappable
│ └───────┴───────┘      │
│ ┌───────┬───────┐      │
│ │ 🏆    │ 🔥    │      │
│ │PRs    │Streak │      │
│ │12     │45 days│      │
│ └───────┴───────┘      │
└─────────────────────────┘
```

**Specs**:
- Avatar: 40pt, top-left, tappable → Profile
- Date: sm, top-right
- Greeting: 2xl, bold
- Metric cards: Swipeable, shows 2.5 at once
- Readiness: Gradient based on score
- Today's Workout: 120pt card, blue Start button
- Timeline: Vertical line + dots + cards
- Analytics: 2x2 grid, 12pt gap, tappable

### 6. Run Screen

**File**: `screens/RunScreen.tsx`

**States**: idle (goal selection) | active (tracking)

**Idle Layout** (Runna-inspired):
```
┌─────────────────────────┐
│ [←]            [?][⚙️]  │  Transparent header blur
│                         │
│    Full Screen Map      │  Apple/Google Maps
│    (User Location)      │  Blue dot centered
│                         │
│ Today's Workout         │  Floating card
│ ┌─────────────────────┐ │  90% opacity
│ │ 🏃 Easy Run 3 Miles │ │  Above Start button
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │  Start button
│ │      START RUN      │ │  Green #34C759
│ └─────────────────────┘ │  Pill shape, 60pt
│ ⊙ Whoop Connected       │  Wearable status
└─────────────────────────┘
```

**Active Layout**:
```
┌─────────────────────────┐
│ [Pause]        [Stop]   │  Actions in header
│                         │
│    Map with Route       │  Blue polyline 4pt
│    (polyline showing    │  Route drawn
│     completed path)     │
│                         │
│ ┌─────────────────────┐ │  Stats overlay top
│ │ 2.34MI 18:42 7:58   │ │  80% opacity, blur
│ │ Distance Time Pace   │ │  80pt height
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │  Secondary stats
│ │ ❤️ 145 BPM          │ │  Heart rate
│ │ ⛰️ +24 ft           │ │  Elevation
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │  Pause button
│ │    [⏸️  PAUSE]      │ │  Orange #FF9500
│ └─────────────────────┘ │  60pt height
└─────────────────────────┘
```

**Specs**:
- Map: Full-screen background
- Header: Transparent with blur (iOS style)
- Stats overlay: 80pt height, 80% opacity, blur, shadow lg
- Stats: 3 columns (Distance, Time, Pace), 2xl numbers
- Start button: 60pt height, 30pt radius (pill), green
- Active: Orange pause button, live stats updating
- Wearable: xs text, green if connected

---

## 🗓️ Session Plan

### Session 1: Foundation (2-3 hours)

**Tasks**:
1. Archive old files (15 mins)
2. Update `theme/tokens.js` with MacroFactor colors (45 mins)
3. Create `theme/ThemeContext.tsx` (45 mins)
4. Create core UI components (90 mins):
   - Button.tsx
   - Input.tsx
   - Card.tsx
   - PillBadge.tsx

**Deliverables**:
- ✅ Tokens updated
- ✅ Theme context working
- ✅ 4 core components built
- ✅ Test page showing all components

### Session 2: Authentication (2-3 hours)

**Tasks**:
1. Create auth components (60 mins):
   - SSOButton.tsx
   - AuthContainer.tsx
   - ErrorMessage.tsx
2. Create SignInScreen.tsx (60 mins)
3. Create SignUpScreen.tsx (30 mins)
4. Update auth.store.ts for SSO (30 mins)

**Deliverables**:
- ✅ Auth screens functional
- ✅ SSO buttons styled correctly
- ✅ Email/password fallback works
- ✅ Navigation to sign up/forgot password

### Session 3: Profile & Settings (2 hours)

**Tasks**:
1. Create profile components (30 mins):
   - Avatar.tsx
   - SettingsSection.tsx
2. Create ProfileScreen.tsx using code from `Zed/Profile Screen.txt` (90 mins)
   - Copy complete implementation
   - Test dark mode toggle
   - Test sign out flow

**Deliverables**:
- ✅ Profile screen matches spec
- ✅ Dark mode toggle works
- ✅ Sign out confirmation modal
- ✅ Settings sections organized

### Session 4: Chat Screen (2 hours)

**Tasks**:
1. Create chat components (60 mins):
   - ChatBubble.tsx (iOS Messages style)
   - ChatInput.tsx
   - ChatHeader.tsx
2. Create ChatScreen.tsx (60 mins)
   - Message list
   - Auto-scroll
   - Send function
   - Workout log modal

**Deliverables**:
- ✅ Chat UI matches ChatGPT/Manus style
- ✅ Bubbles styled correctly
- ✅ Input bar functional
- ✅ Single header (no double header)

### Session 5: Home Dashboard (2-3 hours)

**Tasks**:
1. Create dashboard components (60 mins):
   - MetricCard.tsx
   - TimelineItem.tsx
   - StatsOverview.tsx
2. Create HomeScreen.tsx (120 mins)
   - Header with avatar
   - Swipeable metric cards
   - Today's workout card
   - Timeline history
   - Analytics grid 2x2

**Deliverables**:
- ✅ Home screen matches MacroFactor layout
- ✅ Swipeable cards work
- ✅ Timeline displays workouts
- ✅ Analytics cards tappable

### Session 6: Run Screen (1-2 hours)

**Tasks**:
1. Create RunScreen.tsx (120 mins)
   - Full-screen map
   - Stats overlay (floating)
   - Start/Pause button (pill shape)
   - Wearable status
   - GPS tracking integration

**Deliverables**:
- ✅ Run screen matches Runna layout
- ✅ Map full-screen with overlay
- ✅ Stats update in real-time
- ✅ Start button prominent

### Session 7: Integration & Testing (1-2 hours)

**Tasks**:
1. Update RootNavigator.tsx (30 mins)
2. Wire all navigation flows (30 mins)
3. Test dark mode everywhere (30 mins)
4. Test SSO flows (if backend ready) (30 mins)

**Deliverables**:
- ✅ All screens navigate correctly
- ✅ Dark mode works everywhere
- ✅ No console errors
- ✅ Ready for production

---

## ✅ Testing Checklist

### Design System
- [ ] All colors use tokens (no hardcoded)
- [ ] All spacing uses 8pt grid
- [ ] All typography uses SF Pro sizes
- [ ] Dark mode works on all screens

### Components
- [ ] Button: all variants, sizes, states
- [ ] Input: text, email, password, number, error states
- [ ] Card: default, elevated, outlined
- [ ] PillBadge: all variants
- [ ] SSOButton: Apple (black), Google (white)
- [ ] Avatar: sm, md, lg sizes with edit overlay
- [ ] ChatBubble: user (blue, right), AI (gray, left)

### Screens
- [ ] SignIn: SSO buttons, email/password, forgot link
- [ ] SignUp: name, email, password, confirm, terms checkbox
- [ ] Profile: avatar, sections, dark mode toggle, sign out
- [ ] Chat: single header, bubbles correct, input bar, workout log modal
- [ ] Home: swipeable cards, timeline, analytics grid
- [ ] Run: full-screen map, stats overlay, start button

### Functionality
- [ ] Navigation flows work end-to-end
- [ ] Auth flow: sign in → home
- [ ] Sign out: confirmation → sign in
- [ ] Dark mode: toggle persists, colors update
- [ ] Profile avatar: tap opens picker (if implemented)
- [ ] Chat: send message works
- [ ] Home: cards swipe, analytics tap
- [ ] Run: GPS tracks, stats update

### Accessibility
- [ ] Touch targets ≥44pt
- [ ] Labels for screen readers
- [ ] Contrast ratios pass WCAG

### Performance
- [ ] No jank when scrolling
- [ ] Images load efficiently
- [ ] Maps render smoothly
- [ ] Dark mode toggle instant

---

## 📚 Reference Documents

- **Full Specification**: `Zed/# VoiceFit UI Redesign Specification