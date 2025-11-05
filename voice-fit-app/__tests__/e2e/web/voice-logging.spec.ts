/**
 * E2E Tests for Voice Logging (Web)
 * 
 * Tests the complete voice logging flow on web:
 * - Opening voice input modal
 * - Entering voice commands
 * - Parsing via FastAPI backend
 * - Confirming and logging sets
 */

import { test, expect } from '@playwright/test';

test.describe('Voice Logging Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:8081');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should display voice FAB on START screen', async ({ page }) => {
    // Navigate to START tab
    await page.click('text=START');
    
    // Wait for screen to load
    await page.waitForTimeout(500);
    
    // Check if voice FAB is visible
    const voiceFAB = page.getByTestId('voice-fab');
    await expect(voiceFAB).toBeVisible();
  });

  test('should open voice input modal when FAB is clicked', async ({ page }) => {
    // Navigate to START tab
    await page.click('text=START');
    
    // Click voice FAB
    await page.getByTestId('voice-fab').click();
    
    // Check if modal is visible
    await expect(page.getByText('Voice Input')).toBeVisible();
    await expect(page.getByTestId('voice-input')).toBeVisible();
    await expect(page.getByTestId('log-set-button')).toBeVisible();
  });

  test('should close modal when X button is clicked', async ({ page }) => {
    // Navigate to START tab
    await page.click('text=START');
    
    // Open modal
    await page.getByTestId('voice-fab').click();
    await expect(page.getByText('Voice Input')).toBeVisible();
    
    // Close modal
    await page.getByTestId('close-button').click();
    
    // Modal should be hidden
    await expect(page.getByText('Voice Input')).not.toBeVisible();
  });

  test('should show error for empty input', async ({ page }) => {
    // Navigate to START tab
    await page.click('text=START');
    
    // Open modal
    await page.getByTestId('voice-fab').click();
    
    // Try to submit empty input
    await page.getByTestId('log-set-button').click();
    
    // Should show error
    await expect(page.getByText('Please enter a command')).toBeVisible();
  });

  test('should parse voice command via API', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/voice/parse', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        }),
      });
    });

    // Navigate to START tab
    await page.click('text=START');
    
    // Open modal
    await page.getByTestId('voice-fab').click();
    
    // Enter command
    await page.getByTestId('voice-input').fill('bench press 225 for 10');
    
    // Submit
    await page.getByTestId('log-set-button').click();
    
    // Should show parsed data
    await expect(page.getByText('Parsed Command:')).toBeVisible();
    await expect(page.getByText('Bench Press')).toBeVisible();
    await expect(page.getByText(/225 lbs × 10 reps/)).toBeVisible();
    await expect(page.getByText(/Confidence: 95%/)).toBeVisible();
  });

  test('should auto-accept high confidence commands', async ({ page }) => {
    // Mock high confidence response
    await page.route('**/api/voice/parse', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exercise_id: '123',
          exercise_name: 'Squat',
          weight: 315,
          weight_unit: 'lbs',
          reps: 5,
          confidence: 0.95,
          requires_confirmation: false,
          model_used: 'ft:gpt-4o-mini',
          latency_ms: 90,
        }),
      });
    });

    // Navigate to START tab
    await page.click('text=START');
    
    // Open modal
    await page.getByTestId('voice-fab').click();
    
    // Enter command
    await page.getByTestId('voice-input').fill('squat 315 for 5');
    
    // Submit
    await page.getByTestId('log-set-button').click();
    
    // Should show parsed data
    await expect(page.getByText('Squat')).toBeVisible();
    
    // Should show accept/reject buttons
    await expect(page.getByTestId('accept-button')).toBeVisible();
    await expect(page.getByTestId('reject-button')).toBeVisible();
  });

  test('should require confirmation for medium confidence commands', async ({ page }) => {
    // Mock medium confidence response
    await page.route('**/api/voice/parse', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exercise_id: '456',
          exercise_name: 'Deadlift',
          weight: 405,
          weight_unit: 'lbs',
          reps: 3,
          confidence: 0.75,
          requires_confirmation: true,
          model_used: 'ft:gpt-4o-mini',
          latency_ms: 95,
        }),
      });
    });

    // Navigate to START tab
    await page.click('text=START');
    
    // Open modal
    await page.getByTestId('voice-fab').click();
    
    // Enter command
    await page.getByTestId('voice-input').fill('deadlift 405 for 3');
    
    // Submit
    await page.getByTestId('log-set-button').click();
    
    // Should show confirmation UI
    await expect(page.getByText('Deadlift')).toBeVisible();
    await expect(page.getByText(/Confidence: 75%/)).toBeVisible();
    await expect(page.getByTestId('accept-button')).toBeVisible();
    await expect(page.getByTestId('reject-button')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/voice/parse', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Internal server error',
        }),
      });
    });

    // Navigate to START tab
    await page.click('text=START');
    
    // Open modal
    await page.getByTestId('voice-fab').click();
    
    // Enter command
    await page.getByTestId('voice-input').fill('bench press 225 for 10');
    
    // Submit
    await page.getByTestId('log-set-button').click();
    
    // Should show error message
    await expect(page.getByText(/Internal server error/)).toBeVisible();
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/voice/parse', async (route) => {
      await route.abort('failed');
    });

    // Navigate to START tab
    await page.click('text=START');
    
    // Open modal
    await page.getByTestId('voice-fab').click();
    
    // Enter command
    await page.getByTestId('voice-input').fill('bench press 225 for 10');
    
    // Submit
    await page.getByTestId('log-set-button').click();
    
    // Should show network error
    await expect(page.getByText(/Cannot connect to voice API/)).toBeVisible();
  });

  test('should allow rejecting parsed commands', async ({ page }) => {
    // Mock API response
    await page.route('**/api/voice/parse', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exercise_id: '123',
          exercise_name: 'Bench Press',
          weight: 225,
          weight_unit: 'lbs',
          reps: 10,
          confidence: 0.80,
          requires_confirmation: true,
          model_used: 'ft:gpt-4o-mini',
          latency_ms: 85,
        }),
      });
    });

    // Navigate to START tab
    await page.click('text=START');
    
    // Open modal
    await page.getByTestId('voice-fab').click();
    
    // Enter command
    await page.getByTestId('voice-input').fill('bench press 225 for 10');
    
    // Submit
    await page.getByTestId('log-set-button').click();
    
    // Wait for parsed data
    await expect(page.getByText('Bench Press')).toBeVisible();
    
    // Reject
    await page.getByTestId('reject-button').click();
    
    // Should clear parsed data and show input again
    await expect(page.getByTestId('log-set-button')).toBeVisible();
    await expect(page.getByTestId('accept-button')).not.toBeVisible();
  });
});

