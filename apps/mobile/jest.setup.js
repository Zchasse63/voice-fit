/**
 * Jest Setup File
 *
 * Global test configuration and mocks
 */

// Suppress console warnings in tests (but keep log for debugging)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

