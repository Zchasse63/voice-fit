export type LocalMessageType =
  | "workout_log"
  | "run_log"
  | "exercise_swap"
  | "question"
  | "onboarding"
  | "general";

export type LocalSuggestedAction =
  | "parse_with_kimi"
  | "log_run"
  | "show_exercise_swaps"
  | "call_ai_coach"
  | "continue_onboarding"
  | "acknowledge";

export interface LocalChatClassification {
  message_type: LocalMessageType;
  confidence: number;
  reasoning: string;
  suggested_action: LocalSuggestedAction;
  extracted_data?: {
    exercise_name?: string | null;
    reason?: string | null;
    weight?: number | null;
    reps?: number | null;
    rpe?: number | null;
  } | null;
}

const swapKeywords = [
  "swap",
  "replace",
  "substitute",
  "alternative",
  "instead of",
  "can't do",
  "cant do",
  "change",
];

const workoutKeywords = [
  "reps",
  "pounds",
  "lbs",
  "kg",
  "kilos",
  "for",
  "x",
  "sets",
];

const runKeywords = [
  "ran",
  "run",
  "jog",
  "jogged",
  "mile",
  "miles",
  "km",
  "5k",
  "10k",
  "half marathon",
  "marathon",
  "pace",
  "distance",
];

const questionWords = [
  "how",
  "what",
  "why",
  "when",
  "where",
  "should",
  "can",
  "is",
  "are",
  "?",
];

const containsAny = (text: string, keywords: string[]): boolean => {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
};

const hasNumbers = (text: string): boolean => /\d/.test(text);

/**
 * Lightweight local classifier that mirrors the backend chat classifier's
 * fallback logic. Used for free-tier routing on-device to avoid LLM calls.
 */
export function classifyChatMessageLocal(message: string): LocalChatClassification {
  const messageLower = message.toLowerCase();

  // 1) Run logging patterns (run keywords + numbers/distance)
  const hasRunKeyword = containsAny(messageLower, runKeywords);
  const numberPresent = hasNumbers(message);
  if (hasRunKeyword && numberPresent) {
    return {
      message_type: "run_log",
      confidence: 0.8,
      reasoning: "Contains run-related keywords and numbers (distance/time)",
      suggested_action: "log_run",
      extracted_data: null,
    };
  }

  // 2) Exercise swap intent
  const hasSwapKeyword = containsAny(messageLower, swapKeywords);
  if (hasSwapKeyword) {
    return {
      message_type: "exercise_swap",
      confidence: 0.7,
      reasoning: "Contains exercise swap keywords",
      suggested_action: "show_exercise_swaps",
      extracted_data: {
        exercise_name: null,
        reason: null,
      },
    };
  }

  // 3) Workout logging patterns (numbers + workout keywords)
  const hasWorkoutKeyword = containsAny(messageLower, workoutKeywords);
  if (numberPresent && hasWorkoutKeyword) {
    return {
      message_type: "workout_log",
      confidence: 0.7,
      reasoning: "Contains numbers and workout-related keywords",
      suggested_action: "parse_with_kimi",
      extracted_data: null,
    };
  }

  // 4) Questions
  const looksLikeQuestion = containsAny(messageLower, questionWords);
  if (looksLikeQuestion) {
    return {
      message_type: "question",
      confidence: 0.6,
      reasoning: "Contains common question words or a question mark",
      suggested_action: "call_ai_coach",
      extracted_data: null,
    };
  }

  // 5) Default fallback
  return {
    message_type: "general",
    confidence: 0.3,
    reasoning: "Default classification when no strong intent is detected",
    suggested_action: "acknowledge",
    extracted_data: null,
  };
}

