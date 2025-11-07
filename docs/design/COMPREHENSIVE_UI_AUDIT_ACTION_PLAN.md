# VoiceFit Mobile App - UI Audit Action Plan
## Detailed Implementation Steps with File Paths and Line Numbers

**Created:** 2025-11-06  
**Reference:** `docs/design/COMPREHENSIVE_UI_AUDIT.md`  
**Overall Compliance:** 72% → Target: 95%+

---

## Phase 1: Critical Fixes (Must Complete First)

### 1.1 Update Tailwind Config - Add Missing Tokens

**File:** `apps/mobile/tailwind.config.js`  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 15 minutes

**Changes Required:**
```javascript
// ADD to theme.extend.colors:
colors: {
  background: {
    light: '#FBF7F5',
    dark: '#1A1A1A',  // ADD THIS
  },
  primary: {
    500: '#2C5F3D',
    600: '#234A31',
  },
  primaryDark: '#4A9B6F',
  secondary: {
    500: '#DD7B57',
    600: '#C76B47',  // ADD THIS
  },
  secondaryDark: '#F9AC60',
  accent: {
    500: '#36625E',
    600: '#2D504C',  // ADD THIS
  },
  accentDark: '#86F4EE',
  
  // ADD SEMANTIC COLORS:
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
  
  // ADD STANDARDIZED GRAYS:
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

// ADD FONT WEIGHTS:
fontFamily: {
  heading: ['Inter-Bold'],
  body: ['Inter-Regular'],
  'body-medium': ['Inter-Medium'],     // ADD THIS
  'body-semibold': ['Inter-SemiBold'], // ADD THIS
},

// ADD SHADOWS:
boxShadow: {
  'sm': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  'DEFAULT': '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
  'md': '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
  'lg': '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
  'xl': '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
  '2xl': '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
},
```

---

### 1.2 Fix ReadinessTrendChart Colors (CRITICAL)

**File:** `apps/mobile/src/components/readiness/ReadinessTrendChart.tsx`  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 5 minutes

**Current Code (Lines ~85-90):**
```typescript
const getScoreColor = (score: number) => {
  if (score >= 70) return isDark ? '#4A9B6F' : '#2C5F3D';  // ❌ WRONG
  if (score >= 50) return isDark ? '#F9AC60' : '#DD7B57';  // ❌ WRONG
  return isDark ? '#FF6B6B' : '#DD7B57';                   // ❌ WRONG
};
```

**Fixed Code:**
```typescript
const getScoreColor = (score: number) => {
  // Readiness colors are score-based, not theme-based
  if (score >= 70) return '#4A9B6F';  // ✅ Green (both modes)
  if (score >= 50) return '#F9AC60';  // ✅ Orange (both modes)
  return '#FF6B6B';                   // ✅ Red (both modes)
};
```

---

### 1.3 Remove Non-Design System Colors from HomeScreen

**File:** `apps/mobile/src/screens/HomeScreen.tsx`  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 10 minutes

**Lines to Fix:**
- Line ~105: `bg-[#E67E22]` → `bg-warning-light`
- Line ~115: `bg-[#3498DB]` → `bg-info-light`
- Line ~125: `bg-[#E67E22]` → `bg-warning-light`
- Line ~135: `bg-[#9B59B6]` → `bg-accent-500`
- Line ~145: `bg-[#34495E]` → `bg-gray-700`

**Example Fix:**
```typescript
// BEFORE:
className="flex-row items-center p-4 bg-[#3498DB] rounded-2xl mb-3"

// AFTER:
className={`flex-row items-center p-4 rounded-xl mb-3 ${
  isDark ? 'bg-info-dark' : 'bg-info-light'
}`}
```

---

### 1.4 Fix StartScreen - Add Dark Mode Support

**File:** `apps/mobile/src/screens/StartScreen.tsx`  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 15 minutes

**Changes Required:**
1. Import `useTheme` hook (Line ~1)
2. Get `isDark` from hook (Line ~20)
3. Replace all hardcoded colors with theme-aware classes

**Lines to Fix:**
- Line ~54: `bg-[#FBF7F5]` → `${isDark ? 'bg-background-dark' : 'bg-background-light'}`
- Line ~57: `text-[#2C5F3D]` → `${isDark ? 'text-primaryDark' : 'text-primary-500'}`
- Line ~75: `bg-[#2C5F3D]` → `${isDark ? 'bg-primaryDark' : 'bg-primary-500'}`
- Line ~85: `bg-[#3498DB]` → `${isDark ? 'bg-info-dark' : 'bg-info-light'}`
- Line ~131: `bg-[#2C5F3D]` → `${isDark ? 'bg-primaryDark' : 'bg-primary-500'}`
- Line ~165: `color="#2C5F3D"` → `color={isDark ? '#4A9B6F' : '#2C5F3D'}`

---

### 1.5 Fix RootNavigator - Use Theme-Aware Colors

**File:** `apps/mobile/src/navigation/RootNavigator.tsx`  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 20 minutes

**Current Code (Lines ~35-52):**
```typescript
export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2C5F3D',      // ❌ Hardcoded
          tabBarInactiveTintColor: '#9CA3AF',    // ❌ Hardcoded
          tabBarStyle: {
            backgroundColor: '#FBF7F5',          // ❌ Hardcoded
          },
          headerStyle: {
            backgroundColor: '#FBF7F5',          // ❌ Hardcoded
          },
          headerTintColor: '#2C5F3D',            // ❌ Hardcoded
        }}
      >
```

**Fixed Code:**
```typescript
import { useTheme } from '../theme/ThemeContext';

export default function RootNavigator() {
  const { isDark } = useTheme();
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: isDark ? '#4A9B6F' : '#2C5F3D',
          tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
          tabBarStyle: {
            backgroundColor: isDark ? '#1A1A1A' : '#FBF7F5',
            borderTopColor: isDark ? '#333333' : '#E0E0E0',
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: isDark ? '#1A1A1A' : '#FBF7F5',
          },
          headerTintColor: isDark ? '#4A9B6F' : '#2C5F3D',
        }}
      >
```

---

## Phase 2: High Priority Fixes

### 2.1 Update Border Radius - Global Find & Replace

**Priority:** 🟡 HIGH  
**Estimated Time:** 30 minutes  
**Files Affected:** 20+ files

**Strategy:** Use VS Code Find & Replace

**Find:** `rounded-2xl`  
**Replace:** `rounded-xl`  
**Scope:** `apps/mobile/src/**/*.tsx`

**Exceptions (Keep as rounded-2xl):**
- Modal dialogs (intentionally larger radius)
- Full-screen overlays

**Files to Update:**
1. `apps/mobile/src/screens/HomeScreen.tsx` (8 instances)
2. `apps/mobile/src/screens/LogScreen.tsx` (6 instances)
3. `apps/mobile/src/screens/StartScreen.tsx` (5 instances)
4. `apps/mobile/src/screens/PRsScreen.tsx` (4 instances)
5. `apps/mobile/src/screens/CoachScreen.tsx` (3 instances)
6. `apps/mobile/src/components/charts/VolumeTrendsChart.tsx` (1 instance)
7. `apps/mobile/src/components/charts/MuscleBalanceChart.tsx` (1 instance)
8. `apps/mobile/src/components/charts/PRHistoryChart.tsx` (1 instance)
9. `apps/mobile/src/components/charts/ReadinessTrendChart.tsx` (1 instance)
10. `apps/mobile/src/components/readiness/ReadinessCheckCard.tsx` (2 instances)
11. `apps/mobile/src/components/calendar/CalendarView.tsx` (3 instances)
12. `apps/mobile/src/components/voice/VoiceFAB.tsx` (2 instances)
13. All modal components (8 instances - review individually)

---

### 2.2 Standardize Gray Colors

**Priority:** 🟡 HIGH  
**Estimated Time:** 20 minutes

**Find & Replace Operations:**

1. **Replace `#9CA3AF` with `gray-400`:**
   - Files: 12 files
   - Instances: ~15

2. **Replace `#6B7280` with `gray-500`:**
   - Files: 10 files
   - Instances: ~12

3. **Replace `#4B5563` with `gray-600`:**
   - Files: 1 file
   - Instances: 1

4. **Replace `#D1D5DB` with `gray-300`:**
   - Files: 3 files
   - Instances: 3

**Example:**
```typescript
// BEFORE:
placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}

// AFTER:
placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}  // Keep hex for now
// OR use Tailwind classes where possible
```

---

### 2.3 Fix CoachScreen Avatar Color

**File:** `apps/mobile/src/screens/CoachScreen.tsx`  
**Priority:** 🟡 HIGH  
**Estimated Time:** 2 minutes

**Line ~85:**
```typescript
// BEFORE:
<View className="w-8 h-8 rounded-full bg-[#3498DB] items-center justify-center ml-2">

// AFTER:
<View className={`w-8 h-8 rounded-full items-center justify-center ml-2 ${
  isDark ? 'bg-info-dark' : 'bg-info-light'
}`}>
```

---

## Phase 3: Medium Priority Improvements

### 3.1 Add Shadow/Elevation to Cards

**Priority:** 🟢 MEDIUM  
**Estimated Time:** 30 minutes

**Files to Update:**
- All chart components (add `shadow-md`)
- All card components (add `shadow-sm`)
- Modal components (add `shadow-xl`)

**Example:**
```typescript
// BEFORE:
<View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>

// AFTER:
<View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
```

---

### 3.2 Update Touch Targets

**Priority:** 🟢 MEDIUM  
**Estimated Time:** 20 minutes

**Files to Check:**
- Icon-only buttons (should be 60×60pt minimum)
- Calendar day cells
- Small interactive elements

**Example Fix:**
```typescript
// BEFORE:
<Pressable className="p-2">
  <Icon size={24} />
</Pressable>

// AFTER:
<Pressable className="p-4 min-w-[60px] min-h-[60px] items-center justify-center">
  <Icon size={24} />
</Pressable>
```

---

### 3.3 Use Accent Dark Color

**Priority:** 🟢 MEDIUM  
**Estimated Time:** 15 minutes

**Current:** `accentDark` (#86F4EE) is defined but never used  
**Action:** Find opportunities to use bright teal in dark mode

**Suggested Usage:**
- Info badges in dark mode
- Highlight colors for important metrics
- Active state indicators

---

## Phase 4: Low Priority Polish

### 4.1 Add Font Weight Variants

**Priority:** 🟢 LOW  
**Estimated Time:** 10 minutes

**After updating Tailwind config, use:**
- `font-body-medium` for emphasized body text
- `font-body-semibold` for subheadings

---

### 4.2 Standardize Spacing Tokens

**Priority:** 🟢 LOW  
**Estimated Time:** 15 minutes

**Replace custom padding with design tokens:**
- `p-3` → `p-sm` or `p-md`
- `p-2` → `p-sm`

---

## Implementation Checklist

### Phase 1: Critical (Complete First)
- [ ] 1.1 Update Tailwind Config
- [ ] 1.2 Fix ReadinessTrendChart Colors
- [ ] 1.3 Remove Non-Design System Colors from HomeScreen
- [ ] 1.4 Fix StartScreen Dark Mode
- [ ] 1.5 Fix RootNavigator Theme Colors

### Phase 2: High Priority
- [ ] 2.1 Update Border Radius (62 instances)
- [ ] 2.2 Standardize Gray Colors
- [ ] 2.3 Fix CoachScreen Avatar Color

### Phase 3: Medium Priority
- [ ] 3.1 Add Shadow/Elevation to Cards
- [ ] 3.2 Update Touch Targets
- [ ] 3.3 Use Accent Dark Color

### Phase 4: Low Priority
- [ ] 4.1 Add Font Weight Variants
- [ ] 4.2 Standardize Spacing Tokens

---

## Testing Plan

### After Each Phase:
1. **Visual Regression Test:**
   - Compare before/after screenshots
   - Test in light and dark modes
   - Verify on iOS simulator

2. **Accessibility Test:**
   - Check color contrast ratios
   - Verify touch target sizes
   - Test with VoiceOver

3. **TypeScript Compilation:**
   ```bash
   cd apps/mobile && npx tsc --noEmit
   ```

4. **Run App:**
   ```bash
   cd apps/mobile && npm start
   ```

---

## Expected Outcomes

### Compliance Improvement:
- **Current:** 72%
- **After Phase 1:** 85%
- **After Phase 2:** 92%
- **After Phase 3:** 95%
- **After Phase 4:** 98%

### Visual Consistency:
- ✅ All colors from design system
- ✅ Consistent border radius (16px for cards)
- ✅ Proper dark mode support everywhere
- ✅ Standardized spacing and typography
- ✅ Accessible touch targets (60×60pt)

---

**Next Steps:** Begin Phase 1 implementation, starting with Tailwind config updates.

