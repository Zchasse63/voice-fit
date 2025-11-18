/**
 * Canonical analytics event names for Amplitude.
 *
 * Naming conventions:
 * - snake_case
 * - past-tense for actions (e.g., set_logged, workout_completed)
 * - avoid PII in event names and properties; use stable IDs instead of emails/names.
 */
export const AnalyticsEvents = {
  USER_SIGNED_UP: "user_signed_up",
  USER_LOGGED_IN: "user_logged_in",

  SCREEN_VIEW: "screen_view",

  WORKOUT_STARTED: "workout_started",
  WORKOUT_COMPLETED: "workout_completed",
  WORKOUT_CANCELLED: "workout_cancelled",

  SET_LOGGED: "set_logged",

  QUICK_LOG_BAR_OPENED: "quick_log_bar_opened",
  QUICK_LOG_ACCEPT_CLICKED: "quick_log_accept_clicked",

  VOICE_COMMAND_RECEIVED: "voice_command_received",
  VOICE_COMMAND_PARSED: "voice_command_parsed",
  VOICE_COMMAND_CORRECTED: "voice_command_corrected",

  FEATURE_USED: "feature_used",

  ERROR_OCCURRED: "error_occurred",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

