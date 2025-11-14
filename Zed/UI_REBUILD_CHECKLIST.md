# VoiceFit UI Rebuild - Complete Implementation Checklist

**Created**: November 14, 2025  
**Status**: READY TO EXECUTE  
**Source**: VoiceFit UI Redesign Specification + ProfileScreen code + SSO Guide  
**Estimated Time**: 10-14 hours (5-7 sessions)

---

## 🎯 Design Direction (CONFIRMED FROM SPEC)

### MacroFactor-Inspired Color Palette

**Light Mode**:
```javascript
colors: {
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
    coral: '#FF6B6B',        // Data emphasis (MacroFactor style)
    orange: '#FF9500',       // Warnings, streaks
    green: '#34C759',        // Success, PRs, run start
    purple: '#AF52DE',       // Data viz alternate
    teal: '#5AC8FA',         // Data viz
    yellow: '#FFCC00',       // Data viz
  },
  
  chat: {
    userBubble: '#007AFF',   // Blue (iOS Messages)
    aiBubble: '#F8F9FA',     // Light gray
    userText: '#FFFFFF',     // White
    aiText: '#000000',       // Black
  },
}
```

**Dark Mode**:
```javascript
darkMode: {
  background: {
    primary: '#000000',      // True black
    secondary: '#1C1C1E',    // Cards
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
  regular: '400',   // Body
  medium: '500',    // Emphasized
  semibold: '600',  // Subheadings
  bold: '700',      // Headlines
}

lineHeight: {
  tight: 1.2,    // Headlines
  normal: 1.4,   // Body text
  relaxed: 1.6,  // Long-form content
}
```

### Spacing (8pt Grid System)

```javascript
spacing: {
  xs: 4,      // Tight spacing
  sm: 8,      // Small gaps
  md: 16,     // Standard padding
  lg: 24,     // Section spacing
  xl: 32,     // Screen padding
  '2xl': 48,  // Large spacing
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
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
}
```

---

## 📂 PRE-WORK: Clean Slate (15 mins)

### Archive Old Files

```bash
# Create archive directory
mkdir -p apps/mobile/src/screens/archive

# Archive old redesign files (not aligned with new direction)
mv apps/mobile/src/screens/HomeScreenRedesign.tsx apps/mobile/src/screens/archive/
mv apps/mobile/src/screens/LogScreenRedesign.tsx apps/mobile/src/screens/archive/
mv apps/mobile/src/screens/RunScreenRedesign.tsx apps/mobile/src/screens/archive/

# Archive old screens we'll replace
mv apps/mobile/src/screens/LoginScreen.tsx apps/mobile/src/screens/archive/
mv apps/mobile/src/screens/ChatScreen.tsx apps/mobile/src/screens/archive/
mv apps/mobile/src/screens/SettingsScreen.tsx apps/mobile/src/screens/archive/
```

**Checklist**:
- [ ] Create archive directory
- [ ] Move HomeScreenRedesign.tsx
- [ ] Move LogScreenRedesign.tsx  
- [ ] Move RunScreenRedesign.tsx
- [ ] Move LoginScreen.tsx
- [ ] Move ChatScreen.tsx
- [ ] Move SettingsScreen.tsx
- [ ] Verify no import errors

---

## 🎨 SESSION 1: Design System Foundation (2-3 hours)

### Task 1.1: Update Design Tokens (45 mins)

**File**: `apps/mobile/src/theme/tokens.js`

**Replace entire file with MacroFactor palette**:

```javascript
export const tokens = {
  colors: {
    light: {
      background: {
        primary: '#FFFFFF',
        secondary: '#F8F9FA',
        tertiary: '#E9ECEF',
      },
      text: {
        primary: '#000000',
        secondary: '#495057',
        tertiary: '#6C757D',
        disabled: '#ADB5BD',
      },
      accent: {
        blue: '#007AFF',
        coral: '#FF6B6B',
        orange: '#FF9500',
        green: '#34C759',
        purple: '#AF52DE',
        teal: '#5AC8FA',
        yellow: '#FFCC00',
      },
      chat: {
        userBubble: '#007AFF',
        aiBubble: '#F8F9FA',
        userText: '#FFFFFF',
        aiText: '#000000',
      },
      border: {
        light: '#E9ECEF',
        medium: '#6C757D',
      },
      state: {
        hover: '#F8F9FA',
        pressed: '#E9ECEF',
      },
    },
    dark: {
      background: {
        primary: '#000000',
        secondary: '#1C1C1E',
        tertiary: '#2C2C2E',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#E5E5E7',
        tertiary: '#98989D',
        disabled: '#48484A',
      },
      accent: {
        blue: '#0A84FF',
        coral: '#FF6B6B',
        orange: '#FF9F0A',
        green: '#30D158',
        purple: '#BF5AF2',
        teal: '#64D2FF',
        yellow: '#FFD60A',
      },
      chat: {
        userBubble: '#0A84FF',
        aiBubble: '#2C2C2E',
        userText: '#FFFFFF',
        aiText: '#FFFFFF',
      },
      border: {
        light: '#2C2C2E',
        medium: '#48484A',
      },
      state: {
        hover: '#2C2C2E',
        pressed: '#3C3C3E',
      },
    },
  },
  
  typography: {
    fontFamily: {
      system: 'System', // SF Pro on iOS, Roboto on Android
    },
    fontSize: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 17,
      lg: 20,
      xl: 24,
      '2xl': 28,
      '3xl': 34,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  components: {
    button: {
      height: {
        sm: 36,
        md: 44,
        lg: 52,
      },
      borderRadius: 12,
    },
    input: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
    },
    card: {
      padding: 16,
      borderRadius: 12,
    },
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
  },
};

export default tokens;
```

**Checklist**:
- [ ] Update color palette (light + dark)
- [ ] Update typography values
- [ ] Update spacing (8pt grid)
- [ ] Update border radius
- [ ] Update shadows
- [ ] Add component-specific tokens
- [ ] Test import in existing files

---

### Task 1.2: Create Theme Context (45 mins)

**File**: `apps/mobile/src/theme/ThemeContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('auto');
  const [isDark, setIsDark] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved) setThemeState(saved as ThemeMode);
    });
  }, []);

  // Calculate isDark based on theme and system preference
  useEffect(() => {
    if (theme === 'auto') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme, systemColorScheme]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

**Checklist**:
- [ ] Create ThemeContext
- [ ] Implement theme state management
- [ ] Add system preference detection
- [ ] Persist theme preference
- [ ] Export useTheme hook
- [ ] Wrap App with ThemeProvider

---

### Task 1.3: Core UI Components (90 mins)

**Directory**: `apps/mobile/src/components/ui/`

#### Component 1: Button.tsx (25 mins)

```typescript
import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import tokens from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress: () => void;
  children: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onPress,
  children,
}: ButtonProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? 'dark' : 'light'];
  
  const height = tokens.components.button.height[size];
  
  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.accent.blue,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          backgroundColor: colors.background.secondary,
          color: colors.text.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: colors.accent.blue,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.accent.blue,
          color: colors.accent.blue,
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        height,
        paddingHorizontal: tokens.spacing.lg,
        borderRadius: tokens.components.button.borderRadius,
        backgroundColor: variantStyles.backgroundColor,
        borderWidth: variantStyles.borderWidth,
        borderColor: variantStyles.borderColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        width: fullWidth ? '100%' : 'auto',
      })}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.color} />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: tokens.spacing.sm }}>{leftIcon}</View>}
          <Text
            style={{
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: variantStyles.color,
            }}
          >
            {children}
          </Text>
          {rightIcon && <View style={{ marginLeft: tokens.spacing.sm }}>{rightIcon}</View>}
        </>
      )}
    </Pressable>
  );
}
```

**Checklist**:
- [ ] Create Button component
- [ ] Add variants (primary, secondary, ghost, outline)
- [ ] Add sizes (sm, md, lg)
- [ ] Add loading state
- [ ] Add icon support
- [ ] Test all variants and states

---

#### Component 2: Input.tsx (25 mins)

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import tokens from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
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

export default function Input({
  type = 'text',
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  disabled = false,
}: InputProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? 'dark' : 'light'];
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = type === 'password';
  
  return (
    <View style={{ marginBottom: tokens.spacing.md }}>
      {label && (
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            color: colors.text.secondary,
            marginBottom: tokens.spacing.sm,
          }}
        >
          {label}
        </Text>
      )}
      
      <View
        style={{
          height: tokens.components.input.height,
          borderRadius: tokens.components.input.borderRadius,
          borderWidth: tokens.components.input.borderWidth,
          borderColor: error
            ? colors.accent.coral
            : isFocused
            ? colors.accent.blue
            : colors.border.light,
          backgroundColor: colors.background.primary,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: tokens.spacing.md,
        }}
      >
        {leftIcon && (
          <View style={{ marginRight: tokens.spacing.sm }}>{leftIcon}</View>
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={
            type === 'email'
              ? 'email-address'
              : type === 'number'
              ? 'number-pad'
              : 'default'
          }
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          style={{
            flex: 1,
            fontSize: tokens.typography.fontSize.base,
            color: colors.text.primary,
          }}
        />
        
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={20} color={colors.text.tertiary} />
            ) : (
              <Eye size={20} color={colors.text.tertiary} />
            )}
          </Pressable>
        )}
        
        {rightIcon && !isPassword && (
          <View style={{ marginLeft: tokens.spacing.sm }}>{rightIcon}</View>
        )}
      </View>
      
      {(error || helperText) && (
        <Text
          style={{
            fontSize: tokens.typography.fontSize.xs,
            color: error ? colors.accent.coral : colors.text.tertiary,
            marginTop: tokens.spacing.xs,
          }}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}
```

**Checklist**:
- [ ] Create Input component
- [ ] Add types (text, email, password, number)
- [ ] Add show/hide password toggle
- [ ] Add focus states
- [ ] Add error states
- [ ] Add icon support
- [ ] Test all variants

---

#### Component 3: Card.tsx (15 mins)

```typescript
import React from 'react';
import { View, Pressable } from 'react-native';
import tokens from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  children: React.ReactNode;
}

export default function Card({
  variant = 'default',
  padding = 'md',
  onPress,
  children,
}: CardProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? 'dark' : 'light'];
  
  const paddingValue = {
    none: 0,
    sm: tokens.spacing.sm,
    md: tokens.spacing.md,
    lg: tokens.spacing.lg,
  }[padding];
  
  const variantStyles = {
    default: {
      backgroundColor: colors.background.secondary,
    },
    elevated: {
      backgroundColor: colors.background.secondary,
      ...tokens.shadows.md,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border.light,
    },
  }[variant];
  
  const Wrapper = onPress ? Pressable : View;
  
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: any) => ({
        borderRadius: tokens.components.card.borderRadius,
        padding: paddingValue,
        opacity: onPress && pressed ? 0.8 : 1,
        ...variantStyles,
      })}
    >
      {children}
    </Wrapper>
  );
}
```

**Checklist**:
- [ ] Create Card component
- [ ] Add variants (default, elevated, outlined)
- [ ] Add padding options
- [ ] Add pressable variant
- [ ] Test all variants

---

#### Component 4: PillBadge.tsx (15 mins)

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import tokens from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface PillBadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'outlined';
  size?: 'sm' | 'md';
}

export default function PillBadge({
  text,
  variant = 'primary',
  size = 'md',
}: PillBadgeProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? 'dark' : 'light'];
  
  const variantStyles = {
    primary: {
      backgroundColor: colors.accent.blue,
      color: '#FFFFFF',
    },
    secondary: {
      backgroundColor: colors.background.secondary,
      color: colors.text.primary,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border.medium,
      color: colors.text.primary,
    },
  }[variant];
  
  const sizeStyles = {
    sm: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      fontSize: tokens.typography.fontSize.xs,
    },
    md: {
      paddingHorizontal: tokens.components.pill.paddingHorizontal,
      paddingVertical: tokens.components.pill.paddingVertical,
      fontSize: tokens.typography.fontSize.sm,
    },
  }[size];
  
  return (
    <View
      style={{
        ...sizeStyles,
        backgroundColor: variantStyles.backgroundColor,
        borderWidth: variantStyles.borderWidth,
        borderColor: variantStyles.borderColor,
        borderRadius: tokens.components.pill.borderRadius,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: sizeStyles.fontSize,
          fontWeight: tokens.typography.fontWeight.semibold,
          color: variantStyles.color,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
```

**Checklist**:
- [ ] Create PillBadge component
- [ ] Add variants (primary, secondary, outlined)
- [ ] Add sizes (sm, md)
- [ ] Style like MacroFactor "2488 / 2468"
- [ ] Test all variants

---

## 🔐 SESSION 2: Authentication Screens (2-3 hours)

### Task 2.1: Auth Components (60 mins)

**Directory**: `apps/mobile/src/components/auth/`

#### Component 1: SSOButton.tsx (20 mins)

**Per SSO Setup Guide - exact branding requirements**:

```typescript
import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { Apple } from 'lucide-react-native'; // Apple icon
import tokens from '../../theme/tokens';

interface SSOButtonProps {
  provider: 'apple' | 'google';
  onPress: () => void;
  loading?: boolean;
}

export default function SSOButton({ provider, onPress, loading }: SSOButtonProps) {
  const isApple = provider === 'apple';
  
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 12,
        backgroundColor: isApple ? '#000000' : '#FFFFFF',
        borderWidth: isApple ? 0 : 1,
        borderColor: '#E9ECEF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: tokens.spacing.lg,
        opacity: loading ? 0.6 : pressed ? 0.8 : 1,
        ...tokens.shadows.sm,
      })}
    >
      {loading ? (
        <ActivityIndicator color={isApple ? '#FFFFFF' : '#000000'} />
      ) : (
        <>
          <View style={{ marginRight: tokens.spacing.md }}>
            {isApple ? (
              <Apple size={20} color="#FFFFFF" />
            ) : (
              // Google logo SVG here (colored G icon)
              <Text style={{ fontSize: 20 }}>G</Text>
            )}
          </View>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: isApple ? '#FFFFFF' : '#000000',
            }}
          >
            Sign in with {isApple ? 'Apple' : 'Google'}
          </Text>
        </>
      )}
    </Pressable>
  );
}
```

**Checklist**:
- [ ] Create SSOButton component
- [ ] Apple: Black bg, white text, Apple logo
- [ ] Google: White bg, black text, Google logo
- [ ] Loading states
- [ ] Proper branding per guidelines

---

#### Component 2: AuthContainer.tsx (20 mins)

```typescript
import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tokens from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface AuthContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthContainer({ title, subtitle, children }: AuthContainerProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? 'dark' : 'light'];
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: tokens.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: tokens.spacing['2xl'] }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.accent.blue,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 48, color: '#FFFFFF' }}>VF</Text>
            </View>
          </View>
          
          {/* Title */}
          <Text
            style={{
              fontSize: tokens.typography.fontSize['3xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              color: