/**
 * Voice API Client
 *
 * Client for voice-related endpoints:
 * - Voice parsing (speech-to-workout data)
 * - Voice-based workout logging
 * - Voice command processing
 */

import { apiClient, APIError, VoiceParseResponse } from './config';

// ============================================================================
// Type Definitions
// ============================================================================

export interface VoiceParseRequest {
  text: string;
  user_id?: string;
  context?: {
    current_exercise?: string;
    previous_sets?: any[];
  };
}

export interface ParsedWorkoutData {
  exercise_name: string;
  exercise_id?: string;
  weight?: number;
  reps?: number;
  sets?: number;
  rpe?: number;
  notes?: string;
  confidence?: number;
}

export interface VoiceLogRequest {
  voice_input: string;
  user_id: string;
  workout_id?: string;
  timestamp?: string;
}

export interface VoiceLogResponse {
  success: boolean;
  workout_log_id?: string;
  set_ids?: string[];
  parsed_data?: ParsedWorkoutData;
  message?: string;
  error?: string;
}

/**
 * Custom Voice API Error class
 */
export class VoiceAPIError extends APIError {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message, statusCode, details);
    this.name = 'VoiceAPIError';
  }
}

// ============================================================================
// Voice API Client Class
// ============================================================================

class VoiceAPIClient {
  /**
   * Parse voice input into structured workout data
   */
  async parseVoiceInput(
    text: string,
    options?: {
      userId?: string;
      context?: VoiceParseRequest['context'];
    }
  ): Promise<VoiceParseResponse> {
    try {
      const response = await apiClient.post<VoiceParseResponse>(
        '/api/voice/parse',
        {
          text,
          user_id: options?.userId,
          context: options?.context,
        }
      );

      return response;
    } catch (error) {
      if (error instanceof APIError) {
        throw new VoiceAPIError(error.message, error.statusCode, error.details);
      }
      throw new VoiceAPIError('Failed to parse voice input', 500, error);
    }
  }

  /**
   * Log a workout set via voice
   */
  async logWorkoutVoice(request: VoiceLogRequest): Promise<VoiceLogResponse> {
    try {
      const response = await apiClient.post<VoiceLogResponse>(
        '/api/voice/log',
        request
      );

      return response;
    } catch (error) {
      if (error instanceof APIError) {
        throw new VoiceAPIError(error.message, error.statusCode, error.details);
      }
      throw new VoiceAPIError('Failed to log workout via voice', 500, error);
    }
  }

  /**
   * Parse and log workout in one call
   */
  async parseAndLog(
    voiceInput: string,
    userId: string,
    workoutId?: string
  ): Promise<VoiceLogResponse> {
    try {
      // First parse the input
      const parseResult = await this.parseVoiceInput(voiceInput, { userId });

      if (!parseResult.success || !parseResult.data) {
        return {
          success: false,
          error: parseResult.error || 'Failed to parse voice input',
        };
      }

      // Then log it
      const logResult = await this.logWorkoutVoice({
        voice_input: voiceInput,
        user_id: userId,
        workout_id: workoutId,
        timestamp: new Date().toISOString(),
      });

      return logResult;
    } catch (error) {
      if (error instanceof VoiceAPIError) {
        throw error;
      }
      if (error instanceof APIError) {
        throw new VoiceAPIError(error.message, error.statusCode, error.details);
      }
      throw new VoiceAPIError('Failed to parse and log workout', 500, error);
    }
  }

  /**
   * Get voice command suggestions based on context
   */
  async getVoiceCommandSuggestions(
    userId: string,
    context?: {
      recentExercises?: string[];
      currentWorkout?: string;
    }
  ): Promise<string[]> {
    try {
      const response = await apiClient.post<{ suggestions: string[] }>(
        '/api/voice/suggestions',
        {
          user_id: userId,
          context,
        }
      );

      return response.suggestions || [];
    } catch (error) {
      // Suggestions are non-critical, return empty array on error
      console.warn('Failed to fetch voice command suggestions:', error);
      return [];
    }
  }

  /**
   * Validate voice input format
   */
  async validateVoiceInput(text: string): Promise<{
    valid: boolean;
    issues?: string[];
    suggestions?: string[];
  }> {
    try {
      return await apiClient.post('/api/voice/validate', { text });
    } catch (error) {
      // Return validation failed
      return {
        valid: false,
        issues: ['Unable to validate input'],
      };
    }
  }

  /**
   * Get voice logging history
   */
  async getVoiceHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    history: Array<{
      id: string;
      voice_input: string;
      parsed_data: ParsedWorkoutData;
      timestamp: string;
      success: boolean;
    }>;
    total: number;
  }> {
    try {
      return await apiClient.get(`/api/voice/history/${userId}`, {
        params: options,
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw new VoiceAPIError(error.message, error.statusCode, error.details);
      }
      throw new VoiceAPIError('Failed to fetch voice history', 500, error);
    }
  }

  /**
   * Retry failed voice parse with additional context
   */
  async retryParse(
    text: string,
    userId: string,
    additionalContext?: string
  ): Promise<VoiceParseResponse> {
    try {
      return await apiClient.post<VoiceParseResponse>('/api/voice/retry', {
        text,
        user_id: userId,
        additional_context: additionalContext,
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw new VoiceAPIError(error.message, error.statusCode, error.details);
      }
      throw new VoiceAPIError('Failed to retry voice parse', 500, error);
    }
  }
}

// Export singleton instance
export const voiceAPIClient = new VoiceAPIClient();
