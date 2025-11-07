import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the home screen by default', async ({ page }) => {
    await page.goto('/');
    
    // Check that the home screen is visible
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should navigate between all tabs', async ({ page }) => {
    await page.goto('/');

    // Verify Home tab is active
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();

    // Navigate to Log tab
    const logTab = page.getByRole('button', { name: /log/i });
    await logTab.click();
    await expect(page.getByText('Workout Log')).toBeVisible();
    await expect(page.getByText('Recent Workouts')).toBeVisible();

    // Navigate to START tab
    const startTab = page.getByRole('button', { name: /start/i });
    await startTab.click();
    await expect(page.getByText('Choose Activity Type')).toBeVisible();

    // Navigate to PRs tab
    const prsTab = page.getByRole('button', { name: /prs/i });
    await prsTab.click();
    await expect(page.getByText('Personal Records')).toBeVisible();
    await expect(page.getByText('Recent PRs')).toBeVisible();

    // Navigate to Coach tab
    const coachTab = page.getByRole('button', { name: /coach/i });
    await coachTab.click();
    await expect(page.getByText('Your AI training assistant')).toBeVisible();
  });

  test('should display correct content on each screen', async ({ page }) => {
    await page.goto('/');

    // Home screen content
    await expect(page.getByText('This Week')).toBeVisible();
    await expect(page.getByText('Workouts')).toBeVisible();

    // Log screen content
    await page.getByRole('button', { name: /log/i }).click();
    await expect(page.getByText('November 2025')).toBeVisible();

    // START screen content
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page.getByText('Workout')).toBeVisible();
    await expect(page.getByText('Run')).toBeVisible();

    // PRs screen content
    await page.getByRole('button', { name: /prs/i }).click();
    await expect(page.getByText('Total PRs')).toBeVisible();

    // Coach screen content
    await page.getByRole('button', { name: /coach/i }).click();
    await expect(page.getByPlaceholder('Ask your coach...')).toBeVisible();
  });
});

