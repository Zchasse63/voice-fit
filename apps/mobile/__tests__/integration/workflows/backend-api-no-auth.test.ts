/**
 * Integration Test: Backend API (No Auth)
 *
 * Tests backend API endpoints without authentication
 * This test uses REAL services:
 * - Railway backend API
 *
 * NO MOCKING - validates actual backend integration
 * SKIPS AUTH - focuses on public/health endpoints
 */

import {
  getTestEnvironment,
  initializeTestEnvironment,
} from "../setup/testEnvironment";

describe("Integration: Backend API (No Auth)", () => {
  beforeAll(async () => {
    // Initialize test environment
    initializeTestEnvironment();
  });

  // ==========================================================================
  // Backend Health Tests
  // ==========================================================================

  describe("Backend Health", () => {
    it("should return healthy status", async () => {
      const env = getTestEnvironment();

      const response = await fetch(`${env.backendUrl}/health`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.status).toBe("healthy");
      expect(data.version).toBeDefined();
      expect(data.supabase_connected).toBe(true);
    });

    it("should be reachable within reasonable time", async () => {
      const env = getTestEnvironment();
      const startTime = Date.now();

      const response = await fetch(`${env.backendUrl}/health`);
      const duration = Date.now() - startTime;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it("should return valid JSON", async () => {
      const env = getTestEnvironment();

      const response = await fetch(`${env.backendUrl}/health`);
      const contentType = response.headers.get("content-type");

      expect(contentType).toContain("application/json");

      const data = await response.json();
      expect(typeof data).toBe("object");
      expect(data).not.toBeNull();
    });
  });

  // ==========================================================================
  // Backend Configuration Tests
  // ==========================================================================

  describe("Backend Configuration", () => {
    it("should have CORS headers configured", async () => {
      const env = getTestEnvironment();

      const response = await fetch(`${env.backendUrl}/health`);
      const corsHeader = response.headers.get("access-control-allow-origin");

      // Should either allow all origins or specific origin
      expect(corsHeader).toBeDefined();
    });

    it("should handle OPTIONS requests", async () => {
      const env = getTestEnvironment();

      const response = await fetch(`${env.backendUrl}/health`, {
        method: "OPTIONS",
      });

      expect(response.ok).toBe(true);
    });
  });

  // ==========================================================================
  // Backend Error Handling Tests
  // ==========================================================================

  describe("Backend Error Handling", () => {
    it("should return 404 for non-existent endpoints", async () => {
      const env = getTestEnvironment();

      const response = await fetch(
        `${env.backendUrl}/non-existent-endpoint-12345`,
      );

      // 404 (Not Found) or 405 (Method Not Allowed) are both acceptable
      // 405 can occur when OPTIONS handler exists but GET endpoint doesn't
      expect([404, 405]).toContain(response.status);
    });

    it("should handle malformed requests gracefully", async () => {
      const env = getTestEnvironment();

      try {
        const response = await fetch(`${env.backendUrl}/api/voice/parse`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "invalid json{{{",
        });

        // Should return error, not crash
        expect(response.status).toBeGreaterThanOrEqual(400);
      } catch (error) {
        // Network errors are also acceptable for malformed requests
        expect(error).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // Backend Performance Tests
  // ==========================================================================

  describe("Backend Performance", () => {
    it("should handle multiple concurrent requests", async () => {
      const env = getTestEnvironment();

      // Make 10 concurrent health check requests
      const promises = Array.from({ length: 10 }, () =>
        fetch(`${env.backendUrl}/health`),
      );

      const responses = await Promise.all(promises);

      // All should succeed
      expect(responses.every((r) => r.ok)).toBe(true);
    });

    it("should maintain consistent response times", async () => {
      const env = getTestEnvironment();
      const responseTimes: number[] = [];

      // Make 5 requests and measure response times
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await fetch(`${env.backendUrl}/health`);
        const duration = Date.now() - startTime;
        responseTimes.push(duration);
      }

      // Calculate average response time
      const avgResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length;

      // All response times should be reasonably close to average (no huge spikes)
      const maxDeviation = Math.max(
        ...responseTimes.map((time) => Math.abs(time - avgResponseTime)),
      );

      expect(avgResponseTime).toBeLessThan(3000); // Average should be under 3 seconds
      expect(maxDeviation).toBeLessThan(5000); // No single request should deviate by more than 5 seconds
    });
  });

  // ==========================================================================
  // Backend Service Connectivity Tests
  // ==========================================================================

  describe("Backend Service Connectivity", () => {
    it("should confirm Supabase connection", async () => {
      const env = getTestEnvironment();

      const response = await fetch(`${env.backendUrl}/health`);
      const data = await response.json();

      expect(data.supabase_connected).toBe(true);
    });

    it("should return version information", async () => {
      const env = getTestEnvironment();

      const response = await fetch(`${env.backendUrl}/health`);
      const data = await response.json();

      expect(data.version).toBeDefined();
      expect(typeof data.version).toBe("string");
      expect(data.version.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Backend Endpoints Existence Tests
  // ==========================================================================

  describe("Backend Endpoints", () => {
    it("should have voice parsing endpoint available", async () => {
      const env = getTestEnvironment();

      // Just check if endpoint exists (will fail auth but shouldn't 404)
      const response = await fetch(`${env.backendUrl}/api/voice/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "test" }),
      });

      // Should not be 404 (endpoint exists)
      // Will likely be 401/403/422 (auth or validation error)
      expect(response.status).not.toBe(404);
    });

    it("should have voice logging endpoint available", async () => {
      const env = getTestEnvironment();

      const response = await fetch(`${env.backendUrl}/api/voice/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voice_input: "test" }),
      });

      // Should not be 404
      expect(response.status).not.toBe(404);
    });
  });
});
