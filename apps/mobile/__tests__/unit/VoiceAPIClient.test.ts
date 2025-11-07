/**
 * Unit Tests for Voice API Client
 *
 * Tests for the VoiceAPIClient service covering:
 * - Successful requests
 * - Error handling
 * - Retry logic
 * - Timeout handling
 */

import { VoiceAPIClient, VoiceAPIError } from '../../src/services/api/VoiceAPIClient';
import type { VoiceParseResponse } from '../../src/services/api/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('VoiceAPIClient', () => {
  let client: VoiceAPIClient;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create client instance with short timeouts for testing
    client = new VoiceAPIClient({
      baseUrl: 'http://localhost:8000',
      timeout: 500, // Short timeout for tests (500ms)
      maxRetries: 2,
      retryDelay: 50, // Short delay for tests (50ms)
    });
  });

  describe('parseVoiceCommand', () => {
    it('should successfully parse a voice command', async () => {
      const mockResponse: VoiceParseResponse = {
        exercise_id: '123',
        exercise_name: 'Bench Press',
        weight: 225,
        weight_unit: 'lbs',
        reps: 10,
        rpe: 8,
        confidence: 0.95,
        requires_confirmation: false,
        model_used: 'ft:gpt-4o-mini',
        latency_ms: 85,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.parseVoiceCommand({
        transcript: 'bench press 225 for 10',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/voice/parse',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcript: 'bench press 225 for 10' }),
        })
      );
    });

    it('should handle 4xx client errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid request' }),
      });

      await expect(
        client.parseVoiceCommand({ transcript: '' })
      ).rejects.toThrow(VoiceAPIError);

      await expect(
        client.parseVoiceCommand({ transcript: '' })
      ).rejects.toThrow('Invalid request');
    });

    it('should retry on 5xx server errors', async () => {
      // First call fails with 500, second succeeds
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ detail: 'Internal server error' }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            exercise_id: '123',
            exercise_name: 'Squat',
            confidence: 0.9,
            requires_confirmation: false,
            model_used: 'ft:gpt-4o-mini',
            latency_ms: 100,
          }),
        };
      });

      const result = await client.parseVoiceCommand({
        transcript: 'squat 315 for 5',
      });

      expect(result.exercise_name).toBe('Squat');
      expect(callCount).toBe(2); // Initial + 1 retry
    });

    it('should fail after max retries on 5xx errors', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 500,
          json: async () => ({ detail: 'Internal server error' }),
        };
      });

      await expect(
        client.parseVoiceCommand({ transcript: 'deadlift 405 for 3' })
      ).rejects.toThrow(VoiceAPIError);

      // Should try at least 2 times (initial + at least 1 retry before timeout)
      expect(callCount).toBeGreaterThanOrEqual(2);
    });

    it('should handle network errors', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('fetch failed'));
      });

      await expect(
        client.parseVoiceCommand({ transcript: 'bench press 225 for 10' })
      ).rejects.toThrow(VoiceAPIError);

      await expect(
        client.parseVoiceCommand({ transcript: 'bench press 225 for 10' })
      ).rejects.toThrow('Network error');

      // Should retry on network errors (at least 2 attempts per call = 4 total minimum)
      expect(callCount).toBeGreaterThanOrEqual(4);
    });

    it('should handle timeout', async () => {
      // Mock a slow response that never resolves (simulates timeout)
      (global.fetch as jest.Mock).mockImplementation(
        (url, options) =>
          new Promise((resolve, reject) => {
            // Listen for abort signal
            const signal = options?.signal;
            if (signal) {
              signal.addEventListener('abort', () => {
                const error = new Error('The operation was aborted.');
                error.name = 'AbortError';
                reject(error);
              });
            }
            // Never resolve - will be aborted by timeout (500ms in test config)
          })
      );

      const error = await client.parseVoiceCommand({
        transcript: 'bench press 225 for 10'
      }).catch(e => e);

      expect(error).toBeInstanceOf(VoiceAPIError);
      expect(error.message).toBe('Request timeout');
    }, 5000); // 5 second test timeout
  });

  describe('healthCheck', () => {
    it('should successfully check health', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2025-11-05T00:00:00.000Z',
        model: 'ft:gpt-4o-mini',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.healthCheck();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle health check failure', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => ({
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service unavailable' }),
      }));

      await expect(client.healthCheck()).rejects.toThrow(VoiceAPIError);
    });
  });

  describe('VoiceAPIError', () => {
    it('should create error with status code', () => {
      const error = new VoiceAPIError('Test error', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('VoiceAPIError');
    });

    it('should create error with response', () => {
      const response = { detail: 'Invalid input' };
      const error = new VoiceAPIError('Test error', 400, response);
      
      expect(error.response).toEqual(response);
    });
  });
});

