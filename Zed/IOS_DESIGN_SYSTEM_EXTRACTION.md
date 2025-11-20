# iOS Design System Extraction

Complete design system tokens extracted from VoiceFit iOS app for web dashboard implementation.

## Color Palette

### Light Mode
**Background Colors:**
- Primary: `#FFFFFF` (Main background)
- Secondary: `#F8F9FA` (Cards, sections)
- Tertiary: `#E9ECEF` (Subtle dividers)

**Text Colors:**
- Primary: `#000000` (Headlines)
- Secondary: `#495057` (Body text)
- Tertiary: `#6C757D` (Labels, captions)
- Disabled: `#ADB5BD` (Disabled states)

**Accent Colors:**
- Blue: `#007AFF` (Primary actions - iOS blue)
- Coral: `#FF6B6B` (Data emphasis)
- Orange: `#FF9500` (Warnings, streaks)
- Green: `#34C759` (Success, PRs)
- Purple: `#AF52DE` (Data viz alternate)
- Teal: `#5AC8FA` (Data viz)
- Yellow: `#FFCC00` (Data viz)
- Red: `#FF3B30` (Errors, destructive)

**Chat Bubbles:**
- User Bubble: `#007AFF` (Blue)
- AI Bubble: `#F8F9FA` (Light gray)
- User Text: `#FFFFFF` (White on blue)
- AI Text: `#000000` (Black on gray)

**Border Colors:**
- Subtle: `#E9ECEF`
- Light: `#E9ECEF`
- Medium: `#6C757D`

**Overlay Colors:**
- Scrim: `rgba(0, 0, 0, 0.5)` (Modal backdrop)
- Scrim Strong: `rgba(0, 0, 0, 0.8)` (Full-screen overlays)
- Shimmer: `rgba(255, 255, 255, 0.3)` (Skeleton shimmer)

**Soft Background Tints:**
- Info: `#DBEAFE` (Soft blue)
- Success: `#DCFCE7` (Soft green)
- Warning: `#FEF3C7` (Soft yellow/orange)
- Warning Alt: `#FFEFD5` (Alternate warm)
- Danger: `#FEE2E2` (Soft red)
- Accent: `rgba(96, 165, 250, 0.15)` (Accent blue selection)
- Accent Subtle: `rgba(37, 99, 235, 0.08)` (Subtle accent)

**State Colors:**
- Hover: `#F8F9FA`
- Pressed: `#E9ECEF`

### Dark Mode
**Background Colors:**
- Primary: `#000000` (True black)
- Secondary: `#1C1C1E` (Dark gray cards)
- Tertiary: `#2C2C2E` (Medium gray dividers)

**Text Colors:**
- Primary: `#FFFFFF` (White headlines)
- Secondary: `#E5E5E7` (Light gray body)
- Tertiary: `#98989D` (Medium gray labels)
- Disabled: `#48484A` (Dark gray disabled)

**Accent Colors:**
- Blue: `#0A84FF` (Brighter blue)
- Coral: `#FF6B6B` (Same coral)
- Orange: `#FF9F0A` (Brighter orange)
- Green: `#30D158` (Brighter green)
- Purple: `#BF5AF2` (Brighter purple)
- Teal: `#64D2FF` (Brighter teal)
- Yellow: `#FFD60A` (Brighter yellow)
- Red: `#FF453A` (Brighter red)

**Chat Bubbles:**
- User Bubble: `#0A84FF` (Brighter blue)
- AI Bubble: `#2C2C2E` (Dark gray)
- User Text: `#FFFFFF` (White)
- AI Text: `#FFFFFF` (White)

**Border Colors:**
- Subtle: `#2C2C2E`
- Light: `#2C2C2E`
- Medium: `#48484A`

**Overlay Colors:**
- Scrim: `rgba(0, 0, 0, 0.5)`
- Scrim Strong: `rgba(0, 0, 0, 0.8)`
- Shimmer: `rgba(255, 255, 255, 0.15)`

**Soft Background Tints:**
- Info: `rgba(59, 130, 246, 0.18)`
- Success: `rgba(34, 197, 94, 0.18)`
- Warning: `rgba(250, 204, 21, 0.18)`
- Warning Alt: `rgba(249, 172, 96, 0.18)`
- Danger: `rgba(248, 113, 113, 0.18)`
- Accent: `rgba(96, 165, 250, 0.15)`
- Accent Subtle: `rgba(37, 99, 235, 0.08)`

**State Colors:**
- Hover: `#2C2C2E`
- Pressed: `#3C3C3E`

## Typography

**Font Family:**
- System: SF Pro (iOS), Roboto (Android)
- Web equivalent: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`

**Font Sizes:**
- XS: `11px` (Timestamps, captions)
- SM: `13px` (Labels, secondary text)
- Base: `15px` (Body text - iOS standard)
- MD: `17px` (Emphasized body)
- LG: `20px` (Subheadings)
- XL: `24px` (Section headers)
- 2XL: `28px` (Screen titles)
- 3XL: `34px` (Large titles)

**Font Weights:**
- Regular: `400` (Body text)
- Medium: `500` (Emphasized text)
- Semibold: `600` (Subheadings)
- Bold: `700` (Headlines)

**Line Heights:**
- Tight: `1.2` (Headlines)
- Normal: `1.4` (Body text)
- Relaxed: `1.6` (Long-form content)

## Spacing (8pt Grid System)

- XS: `4px` (Tight spacing)
- SM: `8px` (Small gaps)
- MD: `16px` (Standard padding)
- LG: `24px` (Section spacing)
- XL: `32px` (Screen padding)
- 2XL: `48px` (Large spacing)

## Border Radius

- SM: `8px` (Buttons, inputs)
- MD: `12px` (Cards)
- LG: `16px` (Large cards)
- XL: `20px` (Hero elements)
- Full: `9999px` (Circular - avatars, pills)

## Shadows (iOS-style)

**Small:**
- Offset: `0px 1px`
- Opacity: `0.05`
- Radius: `2px`

**Medium:**
- Offset: `0px 2px`
- Opacity: `0.08`
- Radius: `4px`

**Large:**
- Offset: `0px 4px`
- Opacity: `0.12`
- Radius: `8px`

**Extra Large:**
- Offset: `0px 8px`
- Opacity: `0.16`
- Radius: `16px`

## Component-Specific Tokens

### Buttons
- Height SM: `36px`
- Height MD: `44px`
- Height LG: `52px`
- Border Radius: `12px`

### Inputs
- Height: `52px`
- Border Radius: `12px`
- Border Width: `1px`

### Cards
- Padding: `16px`
- Border Radius: `12px`

### Pill Badges
- Padding Horizontal: `16px`
- Padding Vertical: `8px`
- Border Radius: `20px`

### Chat Bubbles
- Max Width: `75%`
- Border Radius: `18px` (iOS Messages style)
- Padding Horizontal: `16px`
- Padding Vertical: `12px`
- Input Height: `52px`

### Avatars
- SM: `32px`
- MD: `48px`
- LG: `80px`

## Animation System

### Durations
- Instant: `0ms`
- Fastest: `100ms`
- Fast: `150ms`
- Normal: `300ms`
- Slow: `500ms`
- Slower: `700ms`
- Slowest: `1000ms`

### Easing Functions
- Linear: `linear`
- Ease In: `cubic-bezier(0.42, 0, 1, 1)`
- Ease Out: `cubic-bezier(0, 0, 0.58, 1)`
- Ease In Out: `cubic-bezier(0.42, 0, 0.58, 1)`
- Cubic In: `cubic-bezier(0.32, 0, 0.67, 0)`
- Cubic Out: `cubic-bezier(0.33, 1, 0.68, 1)`
- Cubic In Out: `cubic-bezier(0.65, 0, 0.35, 1)`
- Bezier (Material): `cubic-bezier(0.25, 0.1, 0.25, 1)`

### Spring Configurations
**Gentle Spring:**
- Damping: `20`
- Stiffness: `90`
- Mass: `1`
- Use for: Subtle UI feedback, gentle transitions

**Default Spring:**
- Damping: `15`
- Stiffness: `150`
- Mass: `1`
- Use for: Most UI animations, button presses

**Bouncy Spring:**
- Damping: `10`
- Stiffness: `100`
- Mass: `1`
- Use for: Success animations, celebrations

**Snappy Spring:**
- Damping: `18`
- Stiffness: `250`
- Mass: `0.8`
- Use for: Modal appearances, quick transitions

### Animation Presets

**Button Press:**
- Scale Down: `0.95`
- Spring: Default

**Modal:**
- Slide Distance: `500px`
- Slide In: `300ms cubic-bezier(0.33, 1, 0.68, 1)`
- Slide Out: `150ms cubic-bezier(0.32, 0, 0.67, 0)`
- Fade In: `300ms ease-out`
- Fade Out: `150ms ease-in`

**Shimmer (Loading):**
- Duration: `1500ms`
- Easing: `linear`

**List Stagger:**
- Item Delay: `50ms`
- Fade In: `300ms ease-out`
- Slide Distance: `20px`

## Implementation Notes for Web

1. **Font Stack**: Use system font stack for web to match iOS feel
2. **Dark Mode**: Implement using CSS custom properties or Tailwind dark mode
3. **Shadows**: Use CSS box-shadow with exact iOS values
4. **Animations**: Use CSS transitions/animations or Framer Motion for React
5. **Responsive**: Mobile-first approach, scale up for desktop
6. **Accessibility**: Maintain WCAG AA contrast ratios (already met in iOS design)
7. **Touch Targets**: Minimum 44px for interactive elements (iOS standard)

## Tailwind Configuration Mapping

All tokens should be mapped to Tailwind config:
- Colors → `theme.extend.colors`
- Typography → `theme.extend.fontSize`, `theme.extend.fontWeight`
- Spacing → `theme.extend.spacing`
- Border Radius → `theme.extend.borderRadius`
- Shadows → `theme.extend.boxShadow`
- Animations → `theme.extend.transitionDuration`, `theme.extend.transitionTimingFunction`

