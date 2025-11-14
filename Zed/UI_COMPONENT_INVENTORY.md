# VoiceFit UI Component Inventory

**Document Created**: November 14, 2025  
**Purpose**: Comprehensive inventory of UI components, their status, and rebuild requirements  
**Related**: UI_UX_RECOVERY_STATUS.md

---

## 📦 Component Library Status

### Design System Foundation
✅ **Design Tokens** (`apps/mobile/src/theme/tokens.js`)
- Colors: background, chat, accent, text, border, notebook, badge, run
- Typography: system fonts, sizes, weights, line heights
- Spacing: xs (4px) to 3xl (64px)
- Border radius: none to full
- Shadows: iOS-style (sm, md, lg, xl)
- Animation: durations and easing
- Layout: dimensions for containers, headers, inputs
- Component-specific tokens: button, input, card, badge

---

## 🎨 Existing Components (Verified)

### Common Components
Based on imports found in existing screens:

✅ **SkeletonLoader** (`components/common/SkeletonLoader.tsx`)
- Used in: HomeScreenRedesign, LogScreenRedesign
- Purpose: Loading states
- Status: EXISTS

✅ **AnimatedListItem** (`components/common/AnimatedListItem.tsx`)
- Used in: HomeScreenRedesign, LogScreenRedesign
- Purpose: Animated list transitions
- Status: EXISTS

✅ **WorkoutTypeBadge** (`components/common/WorkoutTypeBadge.tsx`)
- Used in: HomeScreenRedesign, LogScreenRedesign
- Purpose: Display workout type (Strength, Run, etc.)
- Status: EXISTS

✅ **ReadinessScoreBadge** (`components/common/ReadinessScoreIcon.tsx`)
- Used in: HomeScreenRedesign
- Purpose: Display readiness score with visual indicator
- Status: EXISTS

### Icon Library
✅ **Lucide React Native**
- Icons found in use: Activity, TrendingUp, Calendar, Trophy, FileText, ChevronRight, ChevronLeft, Search, Filter, Play, Pause, Square, MapPin, Target
- Status: INSTALLED AND ACTIVE

---

## 🚨 Lost Components (Need Rebuild)

### Phase 1: Authentication Components
❌ **SSO Button Component**
- Purpose: Apple/Google sign-in buttons
- Design: Platform-native styling, proper branding
- Status: LOST - needs rebuild
- Priority: HIGH

❌ **Auth Form Container**
- Purpose: Wrapper for auth screens with consistent styling
- Design: Premium feel, responsive layout
- Status: LOST - needs rebuild
- Priority: HIGH

❌ **Auth Error Display**
- Purpose: Friendly error messages for auth failures
- Status: LOST - needs rebuild
- Priority: MEDIUM

### Phase 2: Profile/Settings Components
❌ **Avatar Component**
- Purpose: User profile picture with edit capability
- Features: Upload, crop, default avatars
- Status: LOST - needs rebuild
- Priority: HIGH

❌ **Settings Section**
- Purpose: Grouped settings with headers
- Design: iOS Settings-style
- Status: LOST - needs rebuild
- Priority: HIGH

❌ **Toggle Switch**
- Purpose: Dark mode, preferences toggles
- Design: iOS-native feel
- Status: LOST - needs rebuild
- Priority: MEDIUM

❌ **Confirmation Modal**
- Purpose: Sign-out, delete confirmations
- Design: Bottom sheet or center modal
- Status: LOST - needs rebuild
- Priority: MEDIUM

### Phase 3: Chat Components
❌ **Chat Bubble**
- Purpose: Message display (user vs AI)
- Design: iOS Messages-style, blue for user, gray for AI
- Status: LOST - needs rebuild
- Priority: HIGH

❌ **Chat Input Bar**
- Purpose: Message composition
- Design: Minimal, with send button
- Status: LOST - needs rebuild
- Priority: HIGH

❌ **Chat Header**
- Purpose: Profile + workout log actions
- Design: Clean, single-line, avatar + icons
- Status: LOST - needs rebuild
- Priority: HIGH

❌ **Workout Log Modal**
- Purpose: Quick view of recent workouts from chat
- Design: Bottom sheet with workout cards
- Status: LOST - needs rebuild
- Priority: MEDIUM

---

## 🔮 Planned Components (Phase 4-7)

### Phase 4: Home/Dashboard Components
🔄 **Metric Card**
- Purpose: Display key metrics (workouts, volume, RPE)
- Design: Swipeable cards with charts
- Status: PLANNED
- Priority: HIGH
- Reference: MacroFactor dashboard cards

🔄 **Timeline Item**
- Purpose: Workout history timeline entries
- Design: Left-aligned date, card with workout summary
- Status: PLANNED
- Priority: HIGH
- Reference: MacroFactor history view

🔄 **Analytics Card**
- Purpose: Interactive chart previews
- Design: Tappable cards leading to detail screens
- Status: PLANNED
- Priority: MEDIUM

🔄 **Wearables Status Widget**
- Purpose: Show connected devices and sync status
- Design: Compact widget with device icons
- Status: PLANNED
- Priority: MEDIUM

### Phase 5: Run Screen Components
🔄 **Map Overlay UI**
- Purpose: Stats overlay on full-screen map
- Design: Floating cards with distance, time, pace
- Status: PARTIALLY EXISTS (RunScreenRedesign.tsx has map)
- Priority: MEDIUM
- Reference: Runna app

🔄 **Pill Button (Start/Stop)**
- Purpose: Large, prominent run control
- Design: Pill-shaped, animated states
- Status: PLANNED
- Priority: MEDIUM

🔄 **Wearable Connection Indicator**
- Purpose: Show active wearable during run
- Design: Small badge or icon
- Status: PLANNED
- Priority: LOW

### Phase 6: Chart Components
🔄 **Volume Trend Chart**
- Purpose: Weekly/monthly volume visualization
- Status: PLANNED
- Priority: HIGH
- Library: TBD (react-native-chart-kit? victory-native?)

🔄 **Weight Trend Chart**
- Purpose: Body weight progress over time
- Status: PLANNED
- Priority: MEDIUM

🔄 **PR Visualization**
- Purpose: Display personal records timeline
- Status: PLANNED
- Priority: MEDIUM

🔄 **Streak Chart**
- Purpose: Workout consistency streaks
- Status: PLANNED
- Priority: LOW

🔄 **Sparkline Preview**
- Purpose: Mini charts for dashboard cards
- Status: PLANNED
- Priority: LOW

### Phase 7+: Core Reusable Components
🔄 **Button Component**
- Variants: primary, secondary, ghost, outline, danger
- Sizes: sm, md, lg
- States: default, pressed, disabled, loading
- Status: PLANNED
- Priority: HIGH

🔄 **Input Component**
- Types: text, number, email, password, search
- Features: label, error, helper text, icons
- Status: PLANNED
- Priority: HIGH

🔄 **Card Component**
- Variants: default, elevated, outlined
- Features: header, footer, padding options
- Status: PLANNED
- Priority: HIGH

🔄 **Bottom Sheet Modal**
- Purpose: iOS-style bottom sheets
- Features: swipe to dismiss, multiple snap points
- Status: PLANNED
- Priority: HIGH
- Library: @gorhom/bottom-sheet?

🔄 **Badge Component**
- Purpose: Status indicators, counts
- Variants: primary, success, warning, error, info
- Status: PLANNED
- Priority: MEDIUM

🔄 **Empty State Component**
- Purpose: No data states with illustrations/messages
- Status: PLANNED
- Priority: MEDIUM

🔄 **Loading States**
- Spinner, skeleton loaders, progress bars
- Status: PARTIAL (SkeletonLoader exists)
- Priority: MEDIUM

---

## 🗂️ Screen-to-Component Mapping

### Existing Screens (with Redesign suffix)

#### HomeScreenRedesign.tsx
**Components Used:**
- SkeletonGroup ✅
- AnimatedListItem ✅
- WorkoutTypeBadge ✅
- ReadinessScoreBadge ✅
- Lucide icons ✅

**Components Needed:**
- Metric Card 🔄
- Timeline Item 🔄
- Analytics Card 🔄
- Wearables Widget 🔄

#### LogScreenRedesign.tsx
**Components Used:**
- SkeletonGroup ✅
- AnimatedListItem ✅
- WorkoutTypeBadge ✅
- Lucide icons ✅

**Components Needed:**
- Date Navigator 🔄
- Search/Filter Bar 🔄
- Workout Day Card 🔄

#### RunScreenRedesign.tsx
**Components Used:**
- MapView ✅
- Lucide icons ✅

**Components Needed:**
- Map Overlay Stats 🔄
- Pill Button (Start/Stop) 🔄
- Goal Selection Cards 🔄
- Wearable Indicator 🔄

---

### Lost Screens (Need Rebuild)

#### SignInScreenRedesign.tsx (LOST)
**Components Needed:**
- SSO Button (Apple) ❌
- SSO Button (Google) ❌
- Auth Form Container ❌
- Input Component (email/password) 🔄
- Button Component (primary) 🔄
- Error Display ❌

#### SignUpScreenRedesign.tsx (LOST)
**Components Needed:**
- SSO Button (Apple) ❌
- SSO Button (Google) ❌
- Auth Form Container ❌
- Input Component (email/password/name) 🔄
- Button Component (primary) 🔄
- Error Display ❌
- Terms & Privacy Links 🔄

#### ProfileScreenRedesign.tsx (LOST)
**Components Needed:**
- Avatar Component ❌
- Settings Section ❌
- Toggle Switch (dark mode) ❌
- List Item (pressable) 🔄
- Confirmation Modal (sign out) ❌
- Wearables Status Cards 🔄

#### ChatScreenRedesign.tsx (LOST)
**Components Needed:**
- Chat Header ❌
- Chat Bubble (user) ❌
- Chat Bubble (AI) ❌
- Chat Input Bar ❌
- Workout Log Modal ❌
- Empty State 🔄

---

## 🏗️ Component Build Order (Recommended)

### Sprint 1: Core Reusables (Foundation)
Priority: Build these first as they're used everywhere

1. **Button Component** - used in all screens
2. **Input Component** - used in auth, forms
3. **Card Component** - used in dashboards, lists
4. **Badge Component** - used for statuses, counts

### Sprint 2: Auth Components (Phase 1 Recovery)
Priority: Restore login/signup functionality

5. **SSO Button** - Apple/Google sign-in
6. **Auth Form Container** - wrapper for auth screens
7. **Auth Error Display** - friendly error messages

### Sprint 3: Profile Components (Phase 2 Recovery)
Priority: Restore profile/settings functionality

8. **Avatar Component** - user profile picture
9. **Settings Section** - grouped settings
10. **Toggle Switch** - preferences
11. **Confirmation Modal** - confirmations
12. **List Item** - pressable settings items

### Sprint 4: Chat Components (Phase 3 Recovery)
Priority: Restore chat functionality

13. **Chat Bubble** - message display
14. **Chat Input Bar** - message composition
15. **Chat Header** - navigation and actions
16. **Workout Log Modal** - quick workout view

### Sprint 5: Dashboard Components (Phase 4)
Priority: Build home screen

17. **Metric Card** - key metrics display
18. **Timeline Item** - history entries
19. **Analytics Card** - chart previews
20. **Wearables Widget** - device status

### Sprint 6: Advanced Components (Phase 5-6)
Priority: Charts and specialized features

21. **Bottom Sheet Modal** - modals throughout app
22. **Chart Components** - volume, weight, PRs, streaks
23. **Map Overlay UI** - run screen stats
24. **Pill Button** - run controls
25. **Empty State** - no data states

---

## 📐 Component Design Specifications

### Button Component
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress: () => void;
  children: string;
}
```

**Design Tokens:**
- Heights: sm (36), md (44), lg (52)
- Padding: sm (12), md (16), lg (24)
- Border radius: 12px (from tokens.borderRadius.lg)
- Colors: from tokens.colors.accent
- States: pressed, disabled, loading

---

### Chat Bubble Component
```typescript
interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'error';
}
```

**Design Tokens:**
- User bubble: tokens.colors.chat.userBubble (#0B84FE)
- AI bubble: tokens.colors.chat.aiBubble (#E5E5EA)
- Max width: 75% (from tokens.layout.chatBubbleMaxWidth)
- Border radius: 18px (iOS Messages style)
- Padding: 12px horizontal, 8px vertical

---

### Metric Card Component
```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  chart?: React.ReactNode;
  onPress?: () => void;
}
```

**Design Tokens:**
- Background: tokens.colors.background.secondary (#FFFFFF)
- Border radius: tokens.borderRadius.xl (16)
- Shadow: tokens.shadows.md
- Padding: tokens.spacing.md (16)

---

## 🎨 Theme Integration

### Light Mode (Current Default)
All components should use tokens from `tokens.colors.*` with light mode values.

### Dark Mode (Needs Implementation)
⚠️ **Status**: Dark mode toggle planned but theme switching not fully implemented

**Required:**
- ThemeProvider context
- Dark mode token variants
- Toggle component in settings
- Persistent preference storage

**Components Affected:**
- ALL components need dark mode variants
- Background colors invert
- Text colors adjust for contrast
- Shadows lighten or remove
- Border colors adjust

---

## 📋 Component Checklist Template

For each component being built, verify:

- [ ] Design tokens used (no hardcoded values)
- [ ] TypeScript interfaces defined
- [ ] Props documented with JSDoc
- [ ] Light mode tested
- [ ] Dark mode tested (when implemented)
- [ ] Responsive sizing tested
- [ ] Accessibility: touch targets ≥44px
- [ ] Accessibility: labels for screen readers
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Animation: respects reduced motion
- [ ] Works offline (if applicable)
- [ ] Documented in Storybook/docs (if applicable)

---

## 🔗 Related Documentation

- [UI/UX Recovery Status](./UI_UX_RECOVERY_STATUS.md) - Overall status and lost work
- [Design Tokens](../apps/mobile/src/theme/tokens.js) - Central design system
- [Original Audit](./Original%20Audit.md) - Initial project assessment

---

**Last Updated**: November 14, 2025  
**Next Review**: After component build sprint planning  
**Maintainer**: Engineering team