/**
 * Haptics Service - Web Implementation
 * 
 * No-op implementation for web platform (haptics not supported in browsers).
 * All methods are silent no-ops to maintain API compatibility.
 */

export class HapticsServiceWeb {
  light(): void {
    // No-op on web
  }

  medium(): void {
    // No-op on web
  }

  heavy(): void {
    // No-op on web
  }

  success(): void {
    // No-op on web
  }

  warning(): void {
    // No-op on web
  }

  error(): void {
    // No-op on web
  }

  selection(): void {
    // No-op on web
  }
}

// Export singleton instance
export const hapticsService = new HapticsServiceWeb();

