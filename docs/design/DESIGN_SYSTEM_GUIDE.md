# VoiceFit Design System Guide
## Developer Quick-Start for UI Implementation

**Last Updated:** January 6, 2025  
**Design System Compliance:** 95%  
**Target:** React Native + NativeWind v4 + Tailwind CSS

---

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Authoritative Documents](#authoritative-documents)
3. [Design Tokens](#design-tokens)
4. [Component Patterns](#component-patterns)
5. [Theme System](#theme-system)
6. [Accessibility](#accessibility)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### **30-Second Setup**

```tsx
// 1. Import theme hook
import { useTheme } from '../theme/ThemeContext';

// 2. Get dark mode state
const { isDark } = useTheme();

// 3. Use design system classes
<View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
  <Text className={`text-lg font-body-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
    Hello VoiceFit!
  </Text>
</View>
```

### **Key Principles**

1. ✅ **Always use Tailwind classes** from `tailwind.config.js`
2. ✅ **Always support dark mode** using `isDark` conditional
3. ✅ **Always use design tokens** (no hardcoded values)
4. ✅ **Always test accessibility** (touch targets, contrast)

---

## Authoritative Documents

### **📖 Required Reading**

1. **[FIGMA_EXTRACTED_DESIGN_SYSTEM.md](FIGMA_EXTRACTED_DESIGN_SYSTEM.md)**
   - **What:** Complete design specification from Figma
   - **When to use:** When you need exact color values, spacing, or component specs
   - **Key sections:** Design variables, color tokens, typography, spacing

2. **[COMPREHENSIVE_UI_AUDIT.md](COMPREHENSIVE_UI_AUDIT.md)**
   - **What:** Current implementation status and compliance scores
   - **When to use:** To check if a component is already implemented correctly
   - **Key sections:** File-by-file compliance, component analysis

3. **[COMPREHENSIVE_UI_AUDIT_ACTION_PLAN.md](COMPREHENSIVE_UI_AUDIT_ACTION_PLAN.md)**
   - **What:** Implementation guide with code examples
   - **When to use:** When implementing new components or fixing compliance issues
   - **Key sections:** Phase 1-4 implementation patterns, code examples

---

## Design Tokens

### **Colors**

All colors are defined in `apps/mobile/tailwind.config.js` and support light/dark modes.

#### **Brand Colors**
```tsx
// Primary (Forest Green)
className="bg-primary-500"        // Light mode: #2C5F3D
className="bg-primaryDark"        // Dark mode: #4A9B6F

// Secondary (Terracotta)
className="bg-secondary-500"      // Light mode: #DD7B57
className="bg-secondaryDark"      // Dark mode: #F9AC60

// Accent (Deep Teal)
className="bg-accent-500"         // Light mode: #36625E
className="bg-accentDark"         // Dark mode: #86F4EE
```

#### **Semantic Colors**
```tsx
// Success (Green)
className="bg-success-light"      // Light mode: #4A9B6F
className="bg-success-dark"       // Dark mode: #5DB88A

// Warning (Orange)
className="bg-warning-light"      // Light mode: #F9AC60
className="bg-warning-dark"       // Dark mode: #FFB84D

// Error (Red)
className="bg-error-light"        // Light mode: #E74C3C
className="bg-error-dark"         // Dark mode: #FF6B6B

// Info (Blue)
className="bg-info-light"         // Light mode: #3498DB
className="bg-info-dark"          // Dark mode: #5DADE2
```

#### **Grays (Standardized)**
```tsx
// Use these exact gray values for consistency
className="text-gray-900"         // Darkest text: #111827
className="text-gray-800"         // Dark text: #1F2937
className="text-gray-700"         // Medium-dark: #374151
className="text-gray-600"         // Medium: #4B5563
className="text-gray-500"         // Medium-light: #6B7280
className="text-gray-400"         // Light: #9CA3AF
className="text-gray-300"         // Lighter: #D1D5DB
className="text-gray-200"         // Very light: #E5E7EB
className="text-gray-100"         // Lightest: #F3F4F6
className="text-gray-50"          // Almost white: #F9FAFB
```

#### **Icon Colors (Hex Values Required)**
```tsx
// Lucide icons and placeholderTextColor require hex values
<Dumbbell color={isDark ? '#4A9B6F' : '#2C5F3D'} size={24} />
<TextInput placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'} />
```

### **Typography**

```tsx
// Font Families
className="font-heading"          // Inter-Bold (700)
className="font-body"             // Inter-Regular (400)
className="font-body-medium"      // Inter-Medium (500)
className="font-body-semibold"    // Inter-SemiBold (600)

// Font Sizes
className="text-xs"               // 12px
className="text-sm"               // 14px
className="text-base"             // 16px
className="text-lg"               // 18px
className="text-xl"               // 20px
className="text-2xl"              // 24px
className="text-3xl"              // 30px
className="text-4xl"              // 36px

// Usage Guidelines
// - Headings: font-heading or font-bold
// - Button labels: font-body-semibold
// - Emphasized text: font-body-medium
// - Body text: font-body (default)
```

### **Spacing**

```tsx
// Standard Tailwind Scale (Recommended)
className="p-1"                   // 4px
className="p-2"                   // 8px
className="p-3"                   // 12px
className="p-4"                   // 16px
className="p-6"                   // 24px
className="p-8"                   // 32px

// Custom Tokens (Alternative)
className="p-xs"                  // 4px
className="p-sm"                  // 8px
className="p-md"                  // 16px
className="p-lg"                  // 24px
className="p-xl"                  // 32px
```

### **Shadows**

```tsx
// Elevation Tokens
className="shadow-sm"             // Subtle elevation
className="shadow-md"             // Cards, charts
className="shadow-lg"             // Elevated cards
className="shadow-xl"             // Modals, dialogs
className="shadow-2xl"            // Maximum elevation
```

### **Border Radius**

```tsx
// Standard: 16px (rounded-xl) - Use consistently
className="rounded-xl"            // 16px - STANDARD for all components

// Other options (use sparingly)
className="rounded-lg"            // 12px
className="rounded-full"          // Circular (avatars, badges)
```

---

## Component Patterns

### **Card Component**

```tsx
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function Card({ title, children }) {
  const { isDark } = useTheme();
  
  return (
    <View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <Text className={`text-lg font-body-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        {title}
      </Text>
      {children}
    </View>
  );
}
```

### **Button Component**

```tsx
import { Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function Button({ label, onPress, variant = 'primary' }) {
  const { isDark } = useTheme();
  
  const bgClass = variant === 'primary' 
    ? (isDark ? 'bg-primaryDark' : 'bg-primary-500')
    : (isDark ? 'bg-gray-600' : 'bg-gray-700');
  
  return (
    <Pressable
      onPress={onPress}
      className={`p-4 rounded-xl min-h-[60px] items-center justify-center active:opacity-80 ${bgClass}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text className="text-base font-body-semibold text-white">
        {label}
      </Text>
    </Pressable>
  );
}
```

### **Modal Component**

```tsx
import { View, Text, Pressable, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { X } from 'lucide-react-native';

export default function CustomModal({ visible, onClose, title, children }) {
  const { isDark } = useTheme();
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className={`w-full max-w-md rounded-xl shadow-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-xl font-heading ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {title}
            </Text>
            <Pressable 
              onPress={onClose}
              className="p-2 min-w-[44px] min-h-[44px] items-center justify-center"
              accessibilityLabel="Close modal"
            >
              <X color={isDark ? '#9CA3AF' : '#6B7280'} size={24} />
            </Pressable>
          </View>
          
          {/* Content */}
          {children}
        </View>
      </View>
    </Modal>
  );
}
```

---

## Theme System

### **Using the Theme Hook**

```tsx
import { useTheme } from '../theme/ThemeContext';

function MyComponent() {
  const { isDark, theme, toggleTheme } = useTheme();
  
  // isDark: boolean - true if dark mode is active
  // theme: 'light' | 'dark' | 'auto'
  // toggleTheme: () => void - switch between light/dark/auto
  
  return (
    <View className={isDark ? 'bg-gray-800' : 'bg-white'}>
      {/* Your component */}
    </View>
  );
}
```

### **Theme-Aware Patterns**

```tsx
// Pattern 1: Conditional className
<View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`} />

// Pattern 2: Conditional text color
<Text className={isDark ? 'text-gray-200' : 'text-gray-800'}>Hello</Text>

// Pattern 3: Conditional icon color (hex required)
<Icon color={isDark ? '#4A9B6F' : '#2C5F3D'} size={24} />

// Pattern 4: Semantic colors (auto theme-aware)
<View className="bg-success-light dark:bg-success-dark" />
```

---

## Accessibility

### **Touch Targets**

```tsx
// Minimum: 44×44pt (WCAG AA)
// Recommended: 48×48pt (WCAG AAA)
// VoiceFit Standard: 60pt for primary actions

<Pressable className="p-4 min-h-[60px] min-w-[60px]">
  {/* Primary action button */}
</Pressable>

<Pressable className="p-2 min-h-[44px] min-w-[44px]">
  {/* Secondary action (close, etc.) */}
</Pressable>
```

### **Accessibility Props**

```tsx
<Pressable
  accessibilityLabel="Start Workout"
  accessibilityHint="Begins a new workout session"
  accessibilityRole="button"
  onPress={handlePress}
>
  <Text>Start</Text>
</Pressable>
```

### **Color Contrast**

All design system colors meet WCAG AA standards:
- Primary on white: 7.8:1 (AAA) ✅
- Primary Dark on dark: 4.9:1 (AA) ✅
- Gray text on white: 4.6:1 (AA) ✅
- Gray text on dark: 4.2:1 (AA) ✅

---

## Common Patterns

### **Loading State**

```tsx
<View className={`p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
  <ActivityIndicator size="small" color={isDark ? '#4A9B6F' : '#2C5F3D'} />
</View>
```

### **Empty State**

```tsx
<View className="flex-1 items-center justify-center p-8">
  <Dumbbell color={isDark ? '#4B5563' : '#D1D5DB'} size={48} />
  <Text className={`text-base mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
    No workouts yet. Start logging!
  </Text>
</View>
```

---

## Troubleshooting

### **Common Issues**

**Issue:** Colors don't change in dark mode  
**Solution:** Make sure you're using `isDark` conditional and theme-aware classes

**Issue:** Touch targets too small  
**Solution:** Add `min-h-[44px] min-w-[44px]` or higher

**Issue:** Icons not showing correct color  
**Solution:** Use hex values for icon colors, not Tailwind classes

**Issue:** Shadows not visible  
**Solution:** Ensure parent View has proper background color

---

## Resources

- **Tailwind Config:** `apps/mobile/tailwind.config.js`
- **Theme Context:** `apps/mobile/src/theme/ThemeContext.tsx`
- **Design System Docs:** `docs/design/FIGMA_EXTRACTED_DESIGN_SYSTEM.md`
- **Compliance Status:** `docs/design/COMPREHENSIVE_UI_AUDIT.md`
- **Implementation Guide:** `docs/design/COMPREHENSIVE_UI_AUDIT_ACTION_PLAN.md`

---

**Questions?** Check the authoritative design system documents or review implemented components in the codebase for examples.

