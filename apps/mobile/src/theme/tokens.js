/**
 * Design Tokens
 * 
 * Central design system tokens for VoiceFit UI redesign.
 * Inspired by iOS Messages and Duolingo's friendly, approachable design.
 */

export const tokens = {
  // ============================================================================
  // COLORS
  // ============================================================================
  colors: {
    // Background colors
    background: {
      primary: '#F2F2F7',      // Light gray (iOS Messages background)
      secondary: '#FFFFFF',     // White cards
      tertiary: '#E5E5EA',      // Light gray bubbles
      notebook: '#F5F1E8',      // Cream (notebook log)
    },
    
    // Chat bubble colors
    chat: {
      userBubble: '#0B84FE',    // Blue (iMessage user bubble)
      aiBubble: '#E5E5EA',      // Gray (AI bubble)
      userText: '#FFFFFF',      // White text on blue
      aiText: '#000000',        // Black text on gray
    },
    
    // Accent colors
    accent: {
      primary: '#FF9500',       // Orange (fitness vibe, CTAs)
      success: '#34C759',       // Green (PRs, success states)
      warning: '#FF9500',       // Orange (warnings)
      error: '#FF3B30',         // Red (errors)
      info: '#007AFF',          // Blue (info)
    },
    
    // Text colors
    text: {
      primary: '#000000',       // Black (primary text)
      secondary: '#3C3C43',     // Dark gray (secondary text)
      tertiary: '#8E8E93',      // Medium gray (tertiary text)
      disabled: '#C7C7CC',      // Light gray (disabled text)
      inverse: '#FFFFFF',       // White (on dark backgrounds)
    },
    
    // Border colors
    border: {
      light: '#E5E5EA',         // Light gray borders
      medium: '#C7C7CC',        // Medium gray borders
      dark: '#8E8E93',          // Dark gray borders
    },
    
    // Notebook log colors
    notebook: {
      background: '#F5F1E8',    // Cream background
      redLine: '#E74C3C',       // Red margin line
      ruledLine: '#D4C5A9',     // Faint ruled lines
      holePunch: '#8E8E93',     // Hole punch decorations
    },
    
    // Badge colors
    badge: {
      gold: '#FFD700',          // Gold badges
      silver: '#C0C0C0',        // Silver badges
      bronze: '#CD7F32',        // Bronze badges
      streak: '#FF9500',        // Streak badges (orange)
      pr: '#34C759',            // PR badges (green)
    },
    
    // Run screen colors
    run: {
      active: '#34C759',        // Active run (green)
      paused: '#FF9500',        // Paused run (orange)
      route: '#007AFF',         // Route line (blue)
    },
  },
  
  // ============================================================================
  // TYPOGRAPHY
  // ============================================================================
  typography: {
    // Font families
    fontFamily: {
      system: 'System',         // SF Pro (iOS), Roboto (Android)
      notebook: 'Georgia',      // Serif font for notebook log
    },
    
    // Font sizes
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    
    // Font weights
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // ============================================================================
  // SPACING
  // ============================================================================
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  // ============================================================================
  // BORDER RADIUS
  // ============================================================================
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
  
  // ============================================================================
  // SHADOWS
  // ============================================================================
  shadows: {
    // iOS-style shadows
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
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // ============================================================================
  // ANIMATION
  // ============================================================================
  animation: {
    // Duration (ms)
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    
    // Easing
    easing: {
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
  
  // ============================================================================
  // LAYOUT
  // ============================================================================
  layout: {
    // Container widths
    containerPadding: 16,
    maxWidth: 600,
    
    // Tab bar
    tabBarHeight: 80,
    
    // Header
    headerHeight: 60,
    
    // Chat
    chatInputHeight: 60,
    chatBubbleMaxWidth: '75%',
  },
  
  // ============================================================================
  // COMPONENT-SPECIFIC TOKENS
  // ============================================================================
  components: {
    // Button
    button: {
      height: {
        sm: 36,
        md: 44,
        lg: 52,
      },
      paddingHorizontal: {
        sm: 12,
        md: 16,
        lg: 24,
      },
    },
    
    // Input
    input: {
      height: 44,
      paddingHorizontal: 16,
      borderWidth: 1,
    },
    
    // Card
    card: {
      padding: 16,
      borderRadius: 12,
    },
    
    // Badge (UI badge, not achievement badge)
    badge: {
      height: 24,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
  },
};

export default tokens;

