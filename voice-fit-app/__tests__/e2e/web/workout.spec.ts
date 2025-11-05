import { test, expect } from '@playwright/test';

test.describe('Workout Flow', () => {
  test('should start a workout from home screen', async ({ page }) => {
    await page.goto('/');

    // Click "Start Workout" button
    const startButton = page.getByText('Start Workout');
    await startButton.click();

    // Verify active workout card appears
    await expect(page.getByText('Active Workout')).toBeVisible();
    await expect(page.getByText('Quick Workout')).toBeVisible();
  });

  test('should select workout type on START screen', async ({ page }) => {
    await page.goto('/');

    // Navigate to START screen
    await page.getByRole('button', { name: /start/i }).click();

    // Select workout type
    const workoutButton = page.getByText('Workout').first();
    await workoutButton.click();

    // Verify quick start option appears
    await expect(page.getByText('Start Workout Now')).toBeVisible();
  });

  test('should select run type on START screen', async ({ page }) => {
    await page.goto('/');

    // Navigate to START screen
    await page.getByRole('button', { name: /start/i }).click();

    // Select run type
    const runButton = page.getByText('Run').first();
    await runButton.click();

    // Verify quick start option appears
    await expect(page.getByText('Start Run Now')).toBeVisible();
  });
});

