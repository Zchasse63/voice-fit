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
    
    // Create client instance
    client = new VoiceAPIClient({
      baseUrl: 'http://localhost:8000',
      timeout: 5000,
      maxRetries: 2,
      retryDelay: 100, // Short delay for tests
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
      (global.fetch as jest.Mock).mockResolvedValueOnce({
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
      // First two calls fail with 500, third succeeds
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ detail: 'Internal server error' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ detail: 'Internal server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            exercise_id: '123',
            exercise_name: 'Squat',
            confidence: 0.9,
            requires_confirmation: false,
            model_used: 'ft:gpt-4o-mini',
            latency_ms: 100,
          }),
        });

      const result = await client.parseVoiceCommand({
        transcript: 'squat 315 for 5',
      });

      expect(result.exercise_name).toBe('Squat');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries on 5xx errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      });

      await expect(
        client.parseVoiceCommand({ transcript: 'deadlift 405 for 3' })
      ).rejects.toThrow(VoiceAPIError);

      // Should try 3 times (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('fetch failed')
      );

      await expect(
        client.parseVoiceCommand({ transcript: 'bench press 225 for 10' })
      ).rejects.toThrow(VoiceAPIError);

      await expect(
        client.parseVoiceCommand({ transcript: 'bench press 225 for 10' })
      ).rejects.toThrow('Network error');

      // Should retry on network errors
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout', async () => {
      // Mock a slow response that exceeds timeout
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({}),
              });
            }, 10000); // 10 seconds, exceeds 5 second timeout
          })
      );

      await expect(
        client.parseVoiceCommand({ transcript: 'bench press 225 for 10' })
      ).rejects.toThrow(VoiceAPIError);

      await expect(
        client.parseVoiceCommand({ transcript: 'bench press 225 for 10' })
      ).rejects.toThrow('Request timeout');
    });
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
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service unavailable' }),
      });

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

