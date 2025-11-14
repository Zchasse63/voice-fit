# VoiceFit UI Redesign - Master Implementation Plan

**Created**: November 14, 2025  
**Status**: ACTIVE - Ready to Execute  
**Priority**: HIGHEST - Core UI Rebuild  
**Timeline**: 4-6 sessions (8-12 hours)

---

## 🎯 Executive Summary

**Mission**: Rebuild VoiceFit UI from scratch with MacroFactor-inspired design system, creating a premium, Apple-native fitness app.

**What Was Lost**: All Phase 1-3 implementations (Auth, Profile, Chat screens)  
**What Survived**: Design specifications, ProfileScreen code, SSO guide, design tokens  
**What We're Building**: Clean, data-driven UI inspired by MacroFactor, ChatGPT, and Runna

---

## 📐 Design Vision (From Screenshots)

### MacroFactor Analysis

**Food Logging Screen** → **Our Workout Logging**:
- Top: Time badge (3 PM) + calorie count in pill (2488 / 2468)
- Favorites section with quick-add items (icons + names + macros)
- Time-based picks section
- Latest section
- Search bar at bottom
- Black "Log Foods" button

**Adaptation for VoiceFit**:
- Top: Time badge + workout count/volume
- Favorites: Quick-add exercises
- Recent exercises section
- Search exercises
- "Log Workout" button

**Dashboard Screen** → **Our Home Screen**:
- Header: "THURSDAY NOVEMBER 13" + "DASHBOARD"
- Daily Nutrition: Circular progress (Remaining/Consumed/Target)
- Macros breakdown: Protein 0/219g, Fat 0/54g, Carbs 0/273g
- "Consumed" / "Remaining" toggle pills
- Insights & Analytics section with 2x2 grid:
  - Expenditure (Last 7 Days) with sparkline
  - Weight Trend (Last 7 Days) with sparkline
  - Each card shows metric + small chart + chevron

**Adaptation for VoiceFit**:
- Header: Date + "DASHBOARD"
- Weekly stats: Circular progress (workouts completed)
- Key metrics: Volume, RPE, Frequency
- Insights grid: Volume Trend, Weight Trend, PRs, Streak

**Chart Detail Screens**:
- Full-screen chart with title header
- Average + Difference at top
- Time range selector (1W, 1M, 3M, 6M, 1Y, All)
- Toggle pills (Scale Weight, Trend Weight)
- Insights & Data section below chart
- Clean, spacious layout

**Adaptation for VoiceFit**:
- Same structure for Volume, Weight, PRs
- Time range selector
- Detailed metrics below charts

### ChatGPT/Manus Analysis

**Clean Chat Interface**:
- Simple header (back arrow + title + menu)
- Conversational bubbles with spacing
- Bottom input bar with attachments + voice
- Minimal UI chrome
- Focus on conversation

**Adaptation for VoiceFit**:
- Back arrow + "Iron Intelligence" + profile avatar
- User messages (blue bubbles, right-aligned)
- AI messages (gray bubbles, left-aligned)
- Bottom: text input + send button
- Optional: workout log quick access

### Runna Analysis

**Run Screen**:
- Full-screen map background
- Top overlay: "CURRENT" + "FREE RUN"
- Stats bar: 0.00mi DISTANCE | 0:00 TIME | -:--/MI AVG PACE
- "Add Target / Workout" button
- Bottom overlay: Wearable status (WHOOP SAM0265436_🔴 GPS 📶)
- Large coral "Start" button at bottom

**Adaptation for VoiceFit**:
- Full-screen map
- Stats overlay at top
- Wearable indicators
- Big "Start" button (coral/orange)
- Clean, minimal UI

---

## 🎨 Design System Specifications

### Color Palette (MacroFactor-Inspired)

```javascript
// Light Mode (Primary)
colors: {
  background: {
    primary: '#FFFFFF',      // Main background (MacroFactor white)
    secondary: '#F8F9FA',    // Cards, sections (light gray)
    tertiary: '#E9ECEF',     // Subtle dividers
  },
  
  text: {
    primary: '#000000',      // Headlines (MacroFactor black)
    secondary: '#495057',    // Body text (dark gray)
    tertiary: '#6C757D',     // Labels, captions (medium gray)
    disabled: '#ADB5BD',     // Disabled states
  },
  
  accent: {
    blue: '#007AFF',         // Primary actions (iOS blue)
    coral: '#FF6B6B',        // Data emphasis (MacroFactor style)
    orange: '#FF9500',       // Warnings, streaks
    green: '#34C759',        // Success, PRs
    purple: '#AF52DE',       // Data viz alternate
  },
  
  chat: {
    userBubble: '#007AFF',   // Blue (iOS Messages)
    aiBubble: '#F8F9FA',     // Light gray
    userText: '#FFFFFF',     // White
    aiText: '#000000',       // Black
  },
}

// Dark Mode
darkMode: {
  background: {
    primary: '#000000',      // True black
    secondary: '#1C1C1E',    // Cards (dark gray)
    tertiary: '#2C2C2E',     // Dividers
  },
  
  text: {
    primary: '#FFFFFF',      // Headlines
    secondary: '#E5E5E7',    // Body
    tertiary: '#98989D',     // Labels
    disabled: '#48484A',     // Disabled
  },
  
  // Accents slightly brighter for dark mode
  accent: {
    blue: '#0A84FF',
    coral: '#FF6B6B',
    orange: '#FF9F0A',
    green: '#30D158',
    purple: '#BF5AF2',
  },
}
```

### Typography (SF Pro)

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
  regular: '400',   // Body
  medium: '500',    // Emphasized
  semibold: '600',  // Subheadings
  bold: '700',      // Headlines
}
```

### Spacing (8pt grid)

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

### Components

```javascript
components: {
  card: {
    padding: 16,
    borderRadius: 12,
    shadow: 'sm',
  },
  
  button: {
    height: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    borderRadius: 12,
  },
  
  pill: {
    // Like MacroFactor's "2488 / 2468" badge
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  metricCard: {
    // Like MacroFactor's "Expenditure" cards
    padding: 16,
    borderRadius: 12,
    minHeight: 120,
  },
}
```

---

## 📂 File Naming Convention

### ✅ NEW FILES (No "Redesign" suffix)

**Authentication**:
- `SignInScreen.tsx` (NOT SignInScreenRedesign)
- `SignUpScreen.tsx` (NOT SignUpScreenRedesign)

**Main App**:
- `HomeScreen.tsx` (replace old, clean start)
- `ChatScreen.tsx` (replace old)
- `WorkoutLogScreen.tsx` (NEW - like MacroFactor food log)
- `RunScreen.tsx` (replace old)
- `AnalyticsScreen.tsx` (replace old)
- `ProfileScreen.tsx` (NEW)

**Navigation**:
- Keep existing `RootNavigator.tsx` but update routes

### ❌ OLD FILES TO HANDLE

**Archive Immediately**:
- Move `HomeScreenRedesign.tsx` → `archive/HomeScreenRedesign.old.tsx`
- Move `LogScreenRedesign.tsx` → `archive/LogScreenRedesign.old.tsx`
- Move `RunScreenRedesign.tsx` → `archive/RunScreenRedesign.old.tsx`

**Rationale**: These are "second iteration" files that don't match new design direction. Archive for reference but don't use.

---

## 🏗️ Component Library (Build Order)

### Sprint 1: Foundation Components (Session 1)

**Priority: HIGHEST - Everything depends on these**

1. **Button Component** (`components/ui/Button.tsx`)
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'outline';
  size: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress: () => void;
  children: string;
}
```

**Styles**:
- Primary: Blue fill, white text
- Secondary: Gray fill, black text
- Ghost: No fill, blue text
- Outline: Blue border, blue text

2. **Input Component** (`components/ui/Input.tsx`)
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'search';
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
}
```

3. **Card Component** (`components/ui/Card.tsx`)
```typescript
interface CardProps {
  variant: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  children: React.ReactNode;
}
```

4. **Pill Badge** (`components/ui/PillBadge.tsx`)
```typescript
interface PillBadgeProps {
  text: string;
  variant: 'primary' | 'secondary' | 'outlined';
  size?: 'sm' | 'md';
}
```
Like MacroFactor's "2488 / 2468" badge

---

### Sprint 2: Auth Components (Session 2)

**Priority: HIGH - Needed for login/signup**

5. **SSO Button** (`components/auth/SSOButton.tsx`)
```typescript
interface SSOButtonProps {
  provider: 'apple' | 'google';
  onPress: () => void;
  loading?: boolean;
}
```

**Design**:
- Apple: Black background, white Apple logo, "Sign in with Apple"
- Google: White background, Google logo, "Sign in with Google"
- Full width, 52px height
- Proper branding per guidelines

6. **Auth Container** (`components/auth/AuthContainer.tsx`)
```typescript
interface AuthContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}
```

**Design**:
- Center content vertically
- Logo at top
- Title + subtitle
- Form content
- Footer links

7. **Auth Error Display** (`components/auth/ErrorMessage.tsx`)
```typescript
interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
}
```

---

### Sprint 3: Profile Components (Session 2-3)

8. **Avatar Component** (`components/profile/Avatar.tsx`)
```typescript
interface AvatarProps {
  size: 'sm' | 'md' | 'lg';
  imageUrl?: string;
  name?: string;
  editable?: boolean;
  onPress?: () => void;
}
```

**Sizes**: sm (32), md (48), lg (80)

9. **Settings Section** (`components/profile/SettingsSection.tsx`)
```typescript
interface SettingsSectionProps {
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action?: () => void;
  hasToggle?: boolean;
  toggleValue?: boolean;
  badge?: string;
}
```

10. **Bottom Sheet Modal** (`components/ui/BottomSheet.tsx`)
```typescript
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  height?: number | 'auto';
  children: React.ReactNode;
}
```

---

### Sprint 4: Chat Components (Session 3)

11. **Chat Bubble** (`components/chat/ChatBubble.tsx`)
```typescript
interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'error';
}
```

**Design** (iOS Messages style):
- User: Blue bubble (#007AFF), white text, right-aligned
- AI: Light gray bubble (#F8F9FA), black text, left-aligned
- Max width: 75%
- Border radius: 18px (iOS style)
- Padding: 12px horizontal, 8px vertical

12. **Chat Input Bar** (`components/chat/ChatInput.tsx`)
```typescript
interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}
```

**Design**:
- Bottom fixed bar
- Text input with grow
- Send button (blue circle with arrow)
- Height: 60px

13. **Chat Header** (`components/chat/ChatHeader.tsx`)
```typescript
interface ChatHeaderProps {
  title: string;
  onBack: () => void;
  onAvatarPress?: () => void;
  onWorkoutLogPress?: () => void;
}
```

**Design**:
- Back arrow (left)
- Title (center): "Iron Intelligence"
- Avatar (right)
- Optional: Workout log icon

---

### Sprint 5: Dashboard Components (Session 4)

14. **Metric Card** (`components/dashboard/MetricCard.tsx`)
```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  sparkline?: number[];
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
}
```

**Design** (MacroFactor style):
- Title at top
- Large value in center
- Small sparkline chart
- Trend indicator
- Chevron if tappable
- Card: white bg, shadow, 12px radius

15. **Timeline Item** (`components/dashboard/TimelineItem.tsx`)
```typescript
interface TimelineItemProps {
  time: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  metrics?: Array<{label: string; value: string}>;
  onPress?: () => void;
}
```

**Design** (MacroFactor food log style):
- Time badge on left
- Icon + title
- Metrics below
- Edit icon on right

16. **Stats Overview** (`components/dashboard/StatsOverview.tsx`)
```typescript
interface StatsOverviewProps {
  stats: Array<{
    label: string;
    value: string;
    color: string;
  }>;
  progress?: number;
}
```

**Design**:
- Circular progress (like MacroFactor nutrition)
- Stats breakdown below
- Clean, spacious

---

### Sprint 6: Advanced Components (Session 5-6)

17. **Chart Component** (`components/charts/LineChart.tsx`)
```typescript
interface LineChartProps {
  data: Array<{x: number | Date; y: number}>;
  color: string;
  showGrid?: boolean;
  showLabels?: boolean;
  height?: number;
}
```

**Library**: Victory Native or react-native-chart-kit

18. **Time Range Selector** (`components/analytics/TimeRangeSelector.tsx`)
```typescript
interface TimeRangeSelectorProps {
  options: Array<{label: string; value: string}>;
  selected: string;
  onSelect: (value: string) => void;
}
```

**Design** (MacroFactor style):
- Pill-shaped buttons in row
- Selected: black fill, white text
- Unselected: transparent, black text

19. **Empty State** (`components/ui/EmptyState.tsx`)
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}
```

---

## 📱 Screen Implementation Plan

### Phase 1: Authentication (Session 2)

#### Screen 1: SignInScreen.tsx

**Layout**:
```
┌─────────────────────────┐
│                         │
│    [VoiceFit Logo]     │
│                         │
│   Sign In to VoiceFit  │
│   Continue your journey │
│                         │
│  ┌───────────────────┐ │
│  │ [🍎] Sign in with │ │ Apple button
│  │      Apple        │ │
│  └───────────────────┘ │
│                         │
│  ┌───────────────────┐ │
│  │ [G] Sign in with  │ │ Google button
│  │      Google       │ │
│  └───────────────────┘ │
│                         │
│  ────── OR ──────      │
│                         │
│  [Email input]         │
│  [Password input]      │
│                         │
│  ┌───────────────────┐ │
│  │     Sign In       │ │ Primary button
│  └───────────────────┘ │
│                         │
│  Forgot password?      │
│                         │
│  Don't have an account?│
│       Sign Up          │
│                         │
└─────────────────────────┘
```

**Implementation**:
```typescript
import { SSOButton } from '../components/auth/SSOButton';
import { AuthContainer } from '../components/auth/AuthContainer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithSSO = useAuthStore((state) => state.signInWithSSO);

  const handleEmailSignIn = async () => {
    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation handled by auth state
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithSSO('apple');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithSSO('google');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <AuthContainer
      title="Sign In to VoiceFit"
      subtitle="Continue your fitness journey"
    >
      <SSOButton
        provider="apple"
        onPress={handleAppleSignIn}
      />
      
      <SSOButton
        provider="google"
        onPress={handleGoogleSignIn}
      />

      <View style={{ /* OR divider */ }} />

      <Input
        type="email"
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
      />

      <Input
        type="password"
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        onPress={handleEmailSignIn}
      >
        Sign In
      </Button>

      <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
        <Text>Forgot password?</Text>
      </Pressable>

      <View style={{ /* Footer */ }}>
        <Text>Don't have an account? </Text>
        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text style={{ color: colors.accent.blue }}>Sign Up</Text>
        </Pressable>
      </View>
    </AuthContainer>
  );
}
```

**Requirements**:
- SSO buttons for Apple and Google
- Email/password fallback
- Forgot password link
- Sign up link
- Loading states
- Error handling
- Keyboard handling (dismiss on tap outside)

---

#### Screen 2: SignUpScreen.tsx

**Layout**:
```
┌─────────────────────────┐
│                         │
│   Create Your Account  │
│   Start your journey   │
│                         │
│  ┌───────────────────┐ │
│  │ [🍎] Sign up with │ │
│  │      Apple        │ │
│  └───────────────────┘ │
│                         │
│  ┌───────────────────┐ │
│  │ [G] Sign up with  │ │
│  │      Google       │ │
│  └───────────────────┘ │
│                         │
│  ────── OR ──────      │
│                         │
│  [Name input]          │
│  [Email input]         │
│  [Password input]      │
│  [Confirm password]    │
│                         │
│  ┌───────────────────┐ │
│  │    Get Started    │ │
│  └───────────────────┘ │
│                         │
│  By signing up, you    │
│  agree to our Terms    │
│  and Privacy Policy    │
│                         │
│  Already have account? │
│       Sign In          │
│                         │
└─────────────────────────┘
```

**Similar to SignIn but with**:
- Name field
- Confirm password field
- Terms & privacy links
- "Get Started" CTA

---

### Phase 2: Profile & Settings (Session 3)

#### Screen 3: ProfileScreen.tsx

**We have the complete code!** (Profile Screen.txt)

**Layout**:
```
┌─────────────────────────┐
│  Profile         [X]    │ Header
├─────────────────────────┤
│                         │
│      ┌─────────┐       │
│      │  [👤]  │       │ Avatar (80px)
│      │ [📷]   │       │ Camera icon overlay
│      └─────────┘       │
│                         │
│      John Doe          │ Name
│   john@email.com       │ Email
│                         │
├─────────────────────────┤
│      ACCOUNT           │ Section header
├─────────────────────────┤
│  [👤] Personal Info  > │
│       Name, email...   │
├─────────────────────────┤
│  [⌚] Wearables      ⊙>│
│       Connected devices │
├─────────────────────────┤
│    PREFERENCES         │
├─────────────────────────┤
│  [🌙] Appearance   [⚫]│ Toggle
│       Light/Dark       │
├─────────────────────────┤
│  [🔔] Notifications  > │
│       Manage alerts    │
├─────────────────────────┤
│      SUPPORT           │
├─────────────────────────┤
│  [🛡️] Privacy Policy > │
├─────────────────────────┤
│  [❓] Help & Support > │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐ │
│  │   Sign Out   [→]  │ │ Red text
│  └───────────────────┘ │
│                         │
└─────────────────────────┘
```

**Implementation**: Use code from Profile Screen.txt

**Key Features**:
- Avatar with camera icon (edit photo)
- Settings sections (Account, Preferences, Support)
- Dark mode toggle
- Sign out with confirmation modal
- Navigation to wearables, notifications, etc.

---

### Phase 3: Chat Screen (Session 3-4)

#### Screen 4: ChatScreen.tsx

**Layout**:
```
┌─────────────────────────┐
│ [<] Iron Intelligence[👤]│ Header
├─────────────────────────┤
│                         │
│  ┌────────────────┐    │
│  │ Hey! Ready to  │    │ AI bubble (left)
│  │ crush today's  │    │
│  │ workout?       │    │
│  └────────────────┘    │
│  3:45 PM               │
│                         │
│             ┌──────────┐│
│             │ Yes! Let's│ User bubble (right)
│             │ do chest │
│             │ today    │
│             └──────────┘│
│                  3:46 PM │
│                         │
│  ┌────────────────┐    │
│  │ Great! I see   │    │
│  │ you hit 250lbs │    │
│  │ bench last week│    │
│  │ Let's aim for  │    │
│  │ 255 today...   │    │
│  └────────────────┘    │
│                         │
│          [Typing...]    │
│                         │
├─────────────────────────┤
│ [Type message...]  [→] │ Input bar
└─────────────────────────┘
```

**Implementation**:
```typescript
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatHeader } from '../components/chat/ChatHeader';

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Call AI endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: inputText }),
      });
      
      const aiMessage = {
        id: Date.now().toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ChatHeader
        title="Iron Intelligence"
        onBack={() => navigation.goBack()}
        onAvatarPress={() => navigation.navigate('Profile')}
      />

      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <ChatBubble
            message={item.text}
            isUser={item.isUser}
            timestamp={item.timestamp}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
      />

      {loading && <Text>AI is typing...</Text>}

      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={sendMessage}
        loading={loading}
      />
    </View>
  );
}
```

---

### Phase 4: Home Dashboard (Session 4-5)

#### Screen 5: HomeScreen.tsx

**Layout** (MacroFactor-inspired):
```
┌─────────────────────────┐
│  THURSDAY NOVEMBER 14   │
│      DASHBOARD          │
│                         │
│  ┌───────────────────┐ │
│  │ 📊 Weekly Stats   │ │ Swipeable cards
│  │                   │ │
│  │    12 workouts    │ │
│  │   ████████░░ 80%  │ │
│  └───────────────────┘ │
│  ⚫⚪⚪                │ Dots
│                         │
│  Today's Workout       │
│  ┌───────────────────┐ │
│  │ 💪 Push Day       │ │
│  │ Chest, Shoulders  │ │
│  │ Estimated: 1h 15m │ │
│  └───────────────────┘ │