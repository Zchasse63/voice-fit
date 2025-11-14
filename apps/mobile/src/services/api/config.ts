/**
 * API Configuration
 *
 * HTTP client for communicating with the FastAPI backend.
 * Handles authentication, error handling, and request/response transformation.
 */

import { useAuthStore } from '../../store/auth.store';

// Get API URL from environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Custom API Error class for structured error handling
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Voice Parse Response type (used by voice components)
 */
export interface VoiceParseResponse {
  success: boolean;
  data?: {
    exercise_name: string;
    weight?: number;
    reps?: number;
    sets?: number;
    rpe?: number;
    notes?: string;
  };
  error?: string;
  message?: string;
}

/**
 * Generic API Response type
 */
interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

/**
 * HTTP Client for API requests
 */
class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get authentication token from auth store
   */
  private getAuthToken(): string | null {
    const state = useAuthStore.getState();
    return state.session?.access_token || null;
  }

  /**
   * Build headers for requests
   */
  private getHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any;
    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || data || 'Request failed';
      throw new APIError(
        errorMessage,
        response.status,
        data
      );
    }

    return data as T;
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    options?: {
      params?: Record<string, any>;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    let url = `${this.baseURL}${endpoint}`;

    // Add query parameters
    if (options?.params) {
      const queryString = new URLSearchParams(
        Object.entries(options.params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      ).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(options?.headers),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: {
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: {
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: {
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options?: {
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(options?.headers),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload file with multipart/form-data
   */
  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    options?: {
      headers?: Record<string, string>;
      onProgress?: (progress: number) => void;
    }
  ): Promise<T> {
    const headers: HeadersInit = {
      ...options?.headers,
    };

    // Don't set Content-Type for FormData - browser will set it with boundary
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

/**
 * Singleton API client instance
 */
export const apiClient = new APIClient(API_URL);

/**
 * Helper function to check if backend is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health');
    return response.status === 'ok' || response.status === 'healthy';
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
}

/**
 * Helper to safely handle API errors
 */
export function handleAPIError(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
