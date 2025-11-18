/**
 * RecoveryTracking Component Tests
 *
 * Focuses on high-level behaviors:
 * - Sign-in prompt when no user
 * - Loading active injuries from InjuryLoggingService
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import RecoveryTracking from '../../../../src/components/injury/RecoveryTracking';

// Mock theme context (matches other injury component tests)
jest.mock('../../../../src/theme/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

// Shared mutable auth state used by the mocked store
const mockAuthState: { user: { id: string; email: string } | null } = {
  user: null,
};

// Mock auth store to control the current user
jest.mock('../../../../src/store/auth.store', () => ({
  useAuthStore: (selector: (state: any) => any) => selector(mockAuthState),
}));

// Mocks for InjuryLoggingService
const mockGetActiveInjuries = jest.fn();
const mockResolveInjury = jest.fn();

jest.mock('../../../../src/services/injury/InjuryLoggingService', () => ({
  InjuryLoggingService: {
    getActiveInjuries: (...args: any[]) => mockGetActiveInjuries(...args),
    resolveInjury: (...args: any[]) => mockResolveInjury(...args),
  },
}));

// Mock RecoveryCheckInService (we only need processCheckIn to exist for the component to compile)
const mockProcessCheckIn = jest.fn();

jest.mock('../../../../src/services/injury/RecoveryCheckInService', () => ({
  RecoveryCheckInService: {
    processCheckIn: (...args: any[]) => mockProcessCheckIn(...args),
  },
}));

describe('RecoveryTracking', () => {
  beforeEach(() => {
    mockAuthState.user = null;
    mockGetActiveInjuries.mockReset();
    mockResolveInjury.mockReset();
    mockProcessCheckIn.mockReset();
  });

  it('shows sign-in prompt when there is no user', () => {
    mockAuthState.user = null;

    const { getByText } = render(<RecoveryTracking />);

    expect(getByText(/Sign in to track injuries/i)).toBeTruthy();
  });

  it('loads and displays active injuries for the current user', async () => {
    mockAuthState.user = { id: 'user-123', email: 'test@example.com' };

    const mockInjuries = [
      {
        id: 'injury-1',
        bodyPart: 'shoulder',
        severity: 'moderate',
        description: 'Shoulder pain during presses',
        status: 'active',
        reportedAt: new Date('2025-01-01'),
        lastCheckInAt: undefined,
      },
    ];

    mockGetActiveInjuries.mockResolvedValue(mockInjuries);

    const { getByText } = render(<RecoveryTracking />);

    await waitFor(() => {
      expect(mockGetActiveInjuries).toHaveBeenCalledWith('user-123');
      expect(getByText(/Shoulder pain during presses/i)).toBeTruthy();
    });
  });
});

