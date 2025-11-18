jest.mock("expo-analytics-amplitude", () => ({
  initializeAsync: jest.fn(),
  setUserIdAsync: jest.fn(),
  logEventAsync: jest.fn(),
}));

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
import { apiClient, APIError, type VoiceParseResponse } from '../../src/services/api/config';

// Mock fetch globally
global.fetch = jest.fn();

describe('VoiceAPIClient', () => {
  let client: VoiceAPIClient;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Use default client (config is handled by apiClient)
    client = new VoiceAPIClient();
  });

  describe('parseVoiceInput', () => {
    it('should successfully parse voice input via apiClient', async () => {
      const mockResponse: VoiceParseResponse = {
        success: true,
        data: {
          exercise_name: 'Bench Press',
          weight: 225,
          reps: 10,
        },
      };

      const postSpy = jest
        .spyOn(apiClient, 'post')
        .mockResolvedValueOnce(mockResponse);

      const result = await client.parseVoiceInput('bench press 225 for 10', {
        userId: 'user-1',
        context: { current_exercise: 'Bench Press' },
      });

      expect(postSpy).toHaveBeenCalledWith('/api/voice/parse', {
        text: 'bench press 225 for 10',
        user_id: 'user-1',
        context: { current_exercise: 'Bench Press' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should wrap APIError into VoiceAPIError', async () => {
      const apiError = new APIError('Invalid request', 400, {
        error: 'Invalid request',
      });
      jest.spyOn(apiClient, 'post').mockRejectedValueOnce(apiError);

      await expect(
        client.parseVoiceInput('bad input', { userId: 'user-1' })
      ).rejects.toEqual(
        expect.objectContaining({
          name: 'VoiceAPIError',
          message: 'Invalid request',
          statusCode: 400,
          details: { error: 'Invalid request' },
        })
      );
    });

    it('should wrap unknown errors into generic VoiceAPIError', async () => {
      jest
        .spyOn(apiClient, 'post')
        .mockRejectedValueOnce(new Error('fetch failed'));

      await expect(
        client.parseVoiceInput('bench press 225 for 10')
      ).rejects.toEqual(
        expect.objectContaining({
          name: 'VoiceAPIError',
          message: 'Failed to parse voice input',
          statusCode: 500,
        })
      );
    });
  });

  describe('getVoiceHistory', () => {
    it('should fetch voice history via apiClient', async () => {
      const mockResponse = {
        history: [
          {
            id: '1',
            voice_input: 'bench press 225 for 10',
            parsed_data: {
              exercise_name: 'Bench Press',
              weight: 225,
              reps: 10,
            },
            timestamp: '2025-11-05T00:00:00.000Z',
            success: true,
          },
        ],
        total: 1,
      };

      const getSpy = jest
        .spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockResponse);

      const result = await client.getVoiceHistory('user-1', { limit: 10 });

      expect(getSpy).toHaveBeenCalledWith('/api/voice/history/user-1', {
        params: { limit: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should wrap APIError into VoiceAPIError for history', async () => {
      const apiError = new APIError('Failed', 500);
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(apiError);

      await expect(client.getVoiceHistory('user-1')).rejects.toEqual(
        expect.objectContaining({
          name: 'VoiceAPIError',
          message: 'Failed',
          statusCode: 500,
        })
      );
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

      expect(error.details).toEqual(response);
    });
  });
});

