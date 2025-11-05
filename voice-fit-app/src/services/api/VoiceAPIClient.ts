/**
 * Voice API Client
 * 
 * TypeScript client for communicating with the FastAPI voice parsing backend.
 * Handles requests to /api/voice/parse endpoint with error handling and retry logic.
 */

import {
  VoiceParseRequest,
  VoiceParseResponse,
  HealthCheckResponse,
  ErrorResponse,
} from './types';

/**
 * Configuration for the Voice API Client
 */
export interface VoiceAPIClientConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Voice API Client Error
 */
export class VoiceAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: ErrorResponse
  ) {
    super(message);
    this.name = 'VoiceAPIError';
  }
}

/**
 * Voice API Client
 */
export class VoiceAPIClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: VoiceAPIClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 10000; // 10 seconds default
    this.maxRetries = config.maxRetries || 2;
    this.retryDelay = config.retryDelay || 1000; // 1 second default
  }

  /**
   * Parse a voice command
   */
  async parseVoiceCommand(
    request: VoiceParseRequest
  ): Promise<VoiceParseResponse> {
    return this.fetchWithRetry<VoiceParseResponse>(
      '/api/voice/parse',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    return this.fetchWithRetry<HealthCheckResponse>('/health', {
      method: 'GET',
    });
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    attempt = 1
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          detail: `HTTP ${response.status}: ${response.statusText}`,
        }));

        throw new VoiceAPIError(
          errorData.detail || 'API request failed',
          response.status,
          errorData
        );
      }

      // Parse and return response
      const data: T = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < this.maxRetries) {
          console.warn(
            `[VoiceAPIClient] Request timeout, retrying (${attempt}/${this.maxRetries})...`
          );
          await this.delay(this.retryDelay);
          return this.fetchWithRetry<T>(endpoint, options, attempt + 1);
        }
        throw new VoiceAPIError('Request timeout', 408);
      }

      // Handle network errors
      if (error instanceof Error && error.message.includes('fetch')) {
        if (attempt < this.maxRetries) {
          console.warn(
            `[VoiceAPIClient] Network error, retrying (${attempt}/${this.maxRetries})...`
          );
          await this.delay(this.retryDelay);
          return this.fetchWithRetry<T>(endpoint, options, attempt + 1);
        }
        throw new VoiceAPIError('Network error: Unable to reach API server', 0);
      }

      // Handle VoiceAPIError (already formatted)
      if (error instanceof VoiceAPIError) {
        // Retry on 5xx errors
        if (
          error.statusCode &&
          error.statusCode >= 500 &&
          attempt < this.maxRetries
        ) {
          console.warn(
            `[VoiceAPIClient] Server error, retrying (${attempt}/${this.maxRetries})...`
          );
          await this.delay(this.retryDelay);
          return this.fetchWithRetry<T>(endpoint, options, attempt + 1);
        }
        throw error;
      }

      // Handle unknown errors
      throw new VoiceAPIError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Default Voice API Client instance
 * Uses environment variable for base URL or defaults to localhost
 */
export const voiceAPIClient = new VoiceAPIClient({
  baseUrl: process.env.EXPO_PUBLIC_VOICE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  maxRetries: 2,
  retryDelay: 1000,
});

